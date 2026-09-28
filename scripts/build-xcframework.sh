#!/usr/bin/env bash
#
# build-xcframework.sh — PROTOTYPE
#
# Builds the React Native Zello SDK iOS module into a prebuilt
# `react_native_zello_sdk.xcframework` (device + simulator) and packages it as a
# zip + checksum for SPM `.binaryTarget` distribution.
#
# This mirrors how the native Zello iOS SDK ships (see
# zello-ios-client/scripts/release_sdk.sh + Dependencies/Package.swift): build
# once into an xcframework, distribute the binary over SPM. Shipping a *binary*
# sidesteps SwiftPM's "no mixed Swift + Obj-C/C++ in one target" rule entirely —
# the mixing already happened here, where xcodebuild compiles it fine.
#
# The framework is produced by archiving the CocoaPods pod target from the
# example workspace (that's where React headers + codegen are already wired), so
# a working `pod install` is required. Uses rbenv Ruby 3.3.0 because this
# machine's default Ruby 4.0 breaks CocoaPods.
#
# Usage:
#   scripts/build-xcframework.sh                # library-evolution OFF (RN-version-pinned binary)
#   DISTRIBUTION=YES scripts/build-xcframework.sh   # BUILD_LIBRARY_FOR_DISTRIBUTION=YES
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EX_IOS="$ROOT/example/ios"
WORKSPACE="$EX_IOS/ZelloSdkExample.xcworkspace"
DIST="$ROOT/build/xcframework"
SCHEME="react-native-zello-sdk"     # the pod target
FRAMEWORK="react_native_zello_sdk"  # module name (dashes -> underscores)
DISTRIBUTION="${DISTRIBUTION:-YES}" # BUILD_LIBRARY_FOR_DISTRIBUTION (YES: create-xcframework needs the .swiftinterface)

# Toolchain: rbenv 3.3.0 pod (Ruby 4.0 breaks it), keg-only node@22, New Arch.
export LANG=en_US.UTF-8
export RBENV_VERSION=3.3.0
export PATH="$HOME/.rbenv/shims:/opt/homebrew/opt/node@22/bin:$PATH"
export RCT_NEW_ARCH_ENABLED=1
# Build-time ZelloSDK comes from CocoaPods (a normal framework module our pod
# target can import). NOTE: not ZELLO_USE_SPM here — archiving the pod scheme in
# isolation doesn't put the SPM package's ZelloSDK module on our target's search
# path ("no such module 'ZelloSDK'"). The produced binary references ZelloSDK
# either way; the app satisfies it via the SPM ZelloSDKUmbrella at link time.
# Build React-Core / ReactNativeDependencies from SOURCE, not RN 0.87's prebuilt
# xcframeworks: the prebuilt "Replace React Native Core" swap doesn't place its
# module.modulemap where ReactCodegen's ScanDependencies looks during `archive`.
export RCT_USE_PREBUILT_RNCORE=0
export RCT_USE_RN_DEP=0

log() { printf '\033[0;32m[build-xcframework]\033[0m %s\n' "$*"; }

rm -rf "$DIST"
mkdir -p "$DIST"

log "pod install + update ZelloSDK to latest 3.x (RN 0.87, Ruby $(ruby -v | awk '{print $2}'))..."
( cd "$EX_IOS" && pod install && pod update ZelloSDK )

archive() { # <platform> <suffix>
  local platform="$1" suffix="$2"
  log "Archiving for $platform (BUILD_LIBRARY_FOR_DISTRIBUTION=$DISTRIBUTION)..."
  xcodebuild archive \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration Release \
    -destination "generic/platform=$platform" \
    -archivePath "$DIST/$FRAMEWORK-$suffix.xcarchive" \
    -derivedDataPath "$DIST/dd-$suffix" \
    SKIP_INSTALL=NO \
    BUILD_LIBRARY_FOR_DISTRIBUTION="$DISTRIBUTION" \
    CODE_SIGNING_ALLOWED=NO \
    SWIFT_ENABLE_EXPLICIT_MODULES=NO \
    CLANG_ENABLE_EXPLICIT_MODULES=NO
}
# Note: explicitly-built modules are disabled — during `xcodebuild archive` of a
# CocoaPods pod scheme, the explicit-modules ScanDependencies step fails to
# resolve SPM/system modules (ZelloSDK, Foundation, ...). Implicit modules build
# fine.

find_framework() { # <suffix> — echoes the built .framework path (pipefail-safe: -quit, no head)
  local suffix="$1"
  find "$DIST/$FRAMEWORK-$suffix.xcarchive" \
    -path "*/Products/Library/Frameworks/$FRAMEWORK.framework" -type d -print -quit 2>/dev/null
}

archive "iOS" "iOS"
archive "iOS Simulator" "iOS_Simulator"

DEV_FW="$(find_framework iOS)"
SIM_FW="$(find_framework iOS_Simulator)"
[ -n "$DEV_FW" ] && [ -n "$SIM_FW" ] || { echo "ERROR: framework not found in archives"; exit 1; }
log "device:    $DEV_FW"
log "simulator: $SIM_FW"

log "Creating xcframework..."
xcodebuild -create-xcframework \
  -framework "$DEV_FW" \
  -framework "$SIM_FW" \
  -output "$DIST/$FRAMEWORK.xcframework"

log "Zipping (framework at zip root, per binaryTarget rules)..."
( cd "$DIST" && ditto -c -k --sequesterRsrc --keepParent "$FRAMEWORK.xcframework" "$FRAMEWORK.xcframework.zip" )

CHECKSUM="$(cd "$DIST" && swift package compute-checksum "$FRAMEWORK.xcframework.zip" 2>/dev/null \
  || shasum -a 256 "$FRAMEWORK.xcframework.zip" | awk '{print $1}')"

log "DONE"
echo "  xcframework: $DIST/$FRAMEWORK.xcframework"
echo "  zip:         $DIST/$FRAMEWORK.xcframework.zip"
echo "  checksum:    $CHECKSUM"
echo
echo "Next: host the zip and patch url+checksum into Package.swift (see release_sdk.sh)."
