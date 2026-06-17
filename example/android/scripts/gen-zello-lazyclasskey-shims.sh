#!/usr/bin/env bash
#
# Generates Dagger @LazyClassKey "keeper" classes that the prebuilt Zello
# Android SDK AAR is missing.
#
# Why this exists
# ---------------
# The com.zello:sdk / :zello / :core AARs are compiled with Dagger 2.52, whose
# @LazyClassKey implementation does NOT emit the per-binding
#   <ViewModel>_HiltModules_(BindsModule_Binds|KeyModule_Provide)_LazyMapKey
# proxy classes. Dagger >= 2.53 (which the example app must use, because
# RN 0.86 forces Kotlin 2.1.20 and Dagger 2.52 crashes kapt under it) *consumes*
# the SDK's @LazyClassKey ViewModel bindings by referencing exactly those proxy
# classes from the generated DaggerMainApplication_HiltComponents_SingletonC.
# They don't exist in the AAR, so :app:hiltJavaCompileDebug fails with dozens of
# "cannot find symbol ... _LazyMapKey" errors.
#
# Each keeper is a trivial holder (matching Dagger's LazyMapKeyProxyGenerator):
# a public static String with the key class's reflection name, plus an
# uninitialized field of the key type for ProGuard retention.
#
# This is a workaround for a stale prebuilt SDK. Remove it once the Zello
# Android SDK ships an AAR built with Dagger >= 2.53 (which will include these
# classes itself -- at which point they'd become duplicates).
#
# Usage: example/android/scripts/gen-zello-lazyclasskey-shims.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$SCRIPT_DIR/../app/src/main/java"
MAVEN="https://zello-sdk.s3.amazonaws.com/android/latest/com/zello"
# Matches `zelloSdkVersion = "1.0.+"` in android/build.gradle: highest 1.0.x.
SDK_LINE="1.0"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

resolve_version() {
  curl -fsSL "$MAVEN/sdk/maven-metadata.xml" \
    | grep -oE "<version>${SDK_LINE}\.[0-9]+</version>" \
    | sed -E 's/<\/?version>//g' | sort -t. -k3 -n | tail -1
}

VER="$(resolve_version)"
echo "Resolved com.zello SDK version: $VER"

# Collect every ViewModel that has a generated *_HiltModules class across the
# three artifacts that carry @HiltViewModel bindings.
: > "$tmp/vms.txt"
for art in zello core sdk; do
  aar="$tmp/$art.aar"
  curl -fsSL "$MAVEN/$art/$VER/$art-$VER.aar" -o "$aar"
  unzip -p "$aar" classes.jar > "$tmp/$art-classes.jar"
  unzip -l "$tmp/$art-classes.jar" \
    | { grep -oE "[A-Za-z0-9/]+_HiltModules\.class" || true; } \
    | sed -E 's#_HiltModules\.class##; s#/#.#g' >> "$tmp/vms.txt"
done
sort -u "$tmp/vms.txt" -o "$tmp/vms.txt"
echo "Found $(wc -l < "$tmp/vms.txt" | tr -d ' ') ViewModels with Hilt modules"

count=0
while IFS= read -r fqn; do
  [ -z "$fqn" ] && continue
  pkg="${fqn%.*}"
  simple="${fqn##*.}"
  dir="$OUT_DIR/${pkg//.//}"
  mkdir -p "$dir"
  for variant in BindsModule_Binds KeyModule_Provide; do
    cls="${simple}_HiltModules_${variant}_LazyMapKey"
    cat > "$dir/$cls.java" <<EOF
package $pkg;

// AUTO-GENERATED -- do not edit. See example/android/scripts/gen-zello-lazyclasskey-shims.sh
// Compatibility shim for the prebuilt Zello SDK (Dagger 2.52, pre-LazyMapKey).
public final class $cls {
  public static String lazyClassKeyName = "$fqn";
  @SuppressWarnings("unused")
  static $simple keepFieldType;
}
EOF
    count=$((count + 1))
  done
done < "$tmp/vms.txt"

echo "Generated $count keeper classes under $OUT_DIR"
