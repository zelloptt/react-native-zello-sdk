#!/bin/bash
# Static bundle check of the example .app (simulator build). Usage: ios-bundle-check.sh <path/to/App.app>
#
# The app must be built with ENABLE_DEBUG_DYLIB=NO: Xcode's Debug `*.debug.dylib` stubs hide the
# real link commands from `otool`.
#
# Verifies:
#  - every `@rpath` image reachable from the app/appex binaries exists in <app>/Frameworks
#  - no framework is embedded twice, and app extensions embed none (they load from the host app)
#  - the app and every extension link ZelloSDKUmbrella (its +load glue installs the third-party loggers)
#  - extensions carry an LC_RPATH that reaches <app>/Frameworks
set -uo pipefail

APP="${1:?usage: $0 <App.app>}"
[ -d "$APP" ] || { echo "no such app: $APP"; exit 1; }
APP_BIN="$APP/$(/usr/libexec/PlistBuddy -c 'Print CFBundleExecutable' "$APP/Info.plist")"
UMBRELLA='@rpath/ZelloSDKUmbrella.framework/ZelloSDKUmbrella'
fail=0
err() { echo "FAIL: $*"; fail=1; }

if find "$APP" -name '*.debug.dylib' | grep -q .; then
  echo "App was built with Debug dylib stubs; rebuild with ENABLE_DEBUG_DYLIB=NO."
  exit 1
fi

APPEX_BINS=()
for appex in "$APP"/PlugIns/*.appex; do
  [ -d "$appex" ] || continue
  APPEX_BINS+=("$appex/$(/usr/libexec/PlistBuddy -c 'Print CFBundleExecutable' "$appex/Info.plist")")
  if ls -d "$appex"/Frameworks/*.framework >/dev/null 2>&1; then
    err "$(basename "$appex") embeds frameworks: $(ls "$appex/Frameworks" | tr '\n' ' ')"
  fi
done

# Each framework name exactly once in the whole bundle.
dupes=$(find "$APP" -type d -name '*.framework' -exec basename {} \; | sort | uniq -d)
[ -z "$dupes" ] || err "frameworks embedded more than once: $(echo "$dupes" | tr '\n' ' ')"

roots=("$APP_BIN")
if [ ${#APPEX_BINS[@]} -gt 0 ]; then roots+=("${APPEX_BINS[@]}"); fi
for bin in "${roots[@]}"; do
  otool -L "$bin" | grep -qF "$UMBRELLA" || err "$(basename "$bin") does not link $UMBRELLA"
done
if [ ${#APPEX_BINS[@]} -gt 0 ]; then
  for bin in "${APPEX_BINS[@]}"; do
    otool -l "$bin" | grep -A2 LC_RPATH | grep -qF '@executable_path/../../Frameworks' \
      || err "$(basename "$bin") has no LC_RPATH @executable_path/../../Frameworks"
  done
fi

# Transitive @rpath walk; every reference must resolve in <app>/Frameworks.
seen=$(mktemp); queue=$(mktemp)
trap 'rm -f "$seen" "$queue"' EXIT
printf '%s\n' "${roots[@]}" > "$queue"
while [ -s "$queue" ]; do
  file=$(head -n1 "$queue"); tail -n +2 "$queue" > "$queue.next"; mv "$queue.next" "$queue"
  for ref in $(otool -L "$file" | awk '/@rpath\//{print $1}'); do
    grep -qxF "$ref" "$seen" && continue
    echo "$ref" >> "$seen"
    target="$APP/Frameworks/${ref#@rpath/}"
    if [ -e "$target" ]; then echo "$target" >> "$queue"; else err "missing $ref (not in $APP/Frameworks)"; fi
  done
done
echo "bundle check: $(wc -l < "$seen" | tr -d ' ') distinct @rpath references, ${#APPEX_BINS[@]} extension(s)"
[ $fail -eq 0 ] && echo "bundle check: PASS"
exit $fail
