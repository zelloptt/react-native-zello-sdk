#!/bin/bash
# Prints the path of the example's Debug simulator .app. Usage: ios-app-path.sh [--no-debug-dylib]
#
# Builds with the same xcodebuild parameters as the example's `build:ios` script.
#  - default: builds only when the app is not there (the turbo build was a cache hit, which
#    restores no build output); this is the app the launch smoke runs.
#  - --no-debug-dylib: always (re)builds with ENABLE_DEBUG_DYLIB=NO, which the bundle check needs
#    (an incremental relink of the app when the default build is there).
# Env: DERIVED_DATA (optional -derivedDataPath; default DerivedData otherwise, as `build:ios`).
set -euo pipefail
cd "$(dirname "$0")/../../example/ios"
read -r -a EXTRA < <(node -p "require('../package.json').scripts['build:ios'].match(/--extra-params \"([^\"]*)\"/)[1]")
ARGS=(-workspace ZelloSdkExample.xcworkspace -scheme ZelloSdkExample -configuration Debug "${EXTRA[@]}")
if [ -n "${DERIVED_DATA:-}" ]; then ARGS+=(-derivedDataPath "$DERIVED_DATA"); fi
if [ "${1:-}" = "--no-debug-dylib" ]; then ARGS+=(ENABLE_DEBUG_DYLIB=NO); fi
products=$(xcodebuild "${ARGS[@]}" -showBuildSettings 2>/dev/null | awk -F' = ' '/^ *BUILD_DIR =/{print $2; exit}')
app="$products/Debug-iphonesimulator/ZelloSdkExample.app"
if [ "${1:-}" = "--no-debug-dylib" ] || [ ! -d "$app" ]; then
  xcodebuild "${ARGS[@]}" build >&2
fi
echo "$app"
