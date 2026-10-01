#!/usr/bin/env bash
#
# build-spm-xcframework.sh — CocoaPods-free producer for the RN Zello SDK's
# SPM binary artifact (react_native_zello_sdk.xcframework).
#
# Why a prebuilt binary: the module is mixed Swift + Obj-C++ (TurboModule JSI
# binding + Swift impl calling the ZelloSDK Swift API). SwiftPM cannot compile a
# single mixed-language target, so we ship a binary — the mixing happens here in
# xcodebuild, not in SwiftPM. Unlike a CocoaPods `archive`, this links NOTHING
# from React: `-undefined dynamic_lookup` lets every React/jsi/ReactCommon symbol
# resolve at runtime from the host app's React.framework. The resulting binary's
# only load commands are ZelloSDK/ZelloSDKUmbrella, so it is NOT pinned to one RN
# React ABI. Codegen for our spec is BAKED IN (RNZelloSdkSpec-generated.mm), so
# there is no dependency on the app's static ReactCodegen.
#
# Inputs (headers + link context) come from RN 0.87's SPM artifacts, which today
# live under example/ios/build/xcframeworks after an example build. TODO(release):
# source React.xcframework / ReactNativeDependencies.xcframework and the header
# packages from RN's own SPM artifact cache so this producer needs no prior
# example build.
#
# Output: build/xcframework/react_native_zello_sdk.xcframework (the path the root
# Package.swift `.binaryTarget` references for local validation; for release the
# zip is hosted and Package.swift is patched with url + checksum).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DIST="$ROOT/distribution"
IOS="$ROOT/ios"
XCF_PKG="$ROOT/example/ios/build/xcframeworks"        # RN SPM header package (ReactHeaders/...)
XCF_DIR="$XCF_PKG/debug"                              # merged React.xcframework / ReactNativeDependencies.xcframework
PROJ="$DIST/ReactNativeZelloSdkDist.xcodeproj"
DD="$DIST/build/dd"
OUT="$ROOT/build/xcframework/react_native_zello_sdk.xcframework"

export LANG=en_US.UTF-8 RCT_NEW_ARCH_ENABLED=1
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"

log() { printf '\033[0;32m[build-spm-xcframework]\033[0m %s\n' "$*"; }

[ -d "$XCF_DIR/React.xcframework" ] || {
  echo "ERROR: $XCF_DIR/React.xcframework not found."
  echo "Run an example build first (cd example && yarn ios) so RN publishes its SPM xcframeworks."; exit 1
}

# Regenerate the codegen spec that gets baked into the binary.
log "codegen (bob) ..."
( cd "$ROOT" && corepack yarn bob build --target codegen >/dev/null 2>&1 ) || \
  log "warn: codegen step skipped/failed — using existing ios/generated"

log "generating distribution project ..."
rm -rf "$PROJ"
ruby "$DIST/scripts/make-dist-project.rb" "$PROJ" "$IOS" "$XCF_PKG" "$XCF_DIR"
ruby -e 'require "xcodeproj";pp=ARGV[0];p=Xcodeproj::Project.open(pp);t=p.targets.first;s=Xcodeproj::XCScheme.new;s.add_build_target(t);s.save_as(pp,"react_native_zello_sdk",true)' "$PROJ"

build_slice() { # <sdk> <destination>
  log "building $1 slice ..."
  xcodebuild build -project "$PROJ" -scheme react_native_zello_sdk -configuration Debug \
    -sdk "$1" -destination "$2" -derivedDataPath "$DD" CODE_SIGNING_ALLOWED=NO >/dev/null
}
rm -rf "$DD"
build_slice iphonesimulator "generic/platform=iOS Simulator"
build_slice iphoneos        "generic/platform=iOS"

SIM="$DD/Build/Products/Debug-iphonesimulator/react_native_zello_sdk.framework"
DEV="$DD/Build/Products/Debug-iphoneos/react_native_zello_sdk.framework"
[ -f "$SIM/Info.plist" ] && [ -f "$DEV/Info.plist" ] || { echo "ERROR: framework/Info.plist missing"; exit 1; }

log "assembling xcframework ..."
rm -rf "$OUT"; mkdir -p "$(dirname "$OUT")"
xcodebuild -create-xcframework -framework "$SIM" -framework "$DEV" -output "$OUT"

log "DONE -> $OUT"
otool -L "$OUT/ios-arm64_x86_64-simulator/react_native_zello_sdk.framework/react_native_zello_sdk" \
  | grep "@rpath" | awk '{print "  linked:",$1}'
