#!/usr/bin/env bash
#
# run-ios-spm.sh — CocoaPods-free `yarn ios` for the SPM build.
#
# The React Native community CLI (`react-native run-ios`) locates the Xcode
# project by globbing for a `Podfile`, so it cannot run a Podfile-less SPM app
# (it walks into the SwiftPM checkouts and picks a dependency's workspace). This
# script builds and launches the app directly with xcodebuild + simctl — no
# CocoaPods, no Podfile — while SwiftPM resolves every native dependency.
#
# Usage:  yarn ios [--simulator "iPhone 17 Pro"]
set -euo pipefail

IOS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../ios" && pwd)"
SCHEME="ZelloSdkExample"
PROJECT="$IOS_DIR/ZelloSdkExample.xcodeproj"
BUNDLE_ID="com.companyname.ZelloSDKReactNativeSampleApp"
DD="$IOS_DIR/build/dd-spm"
SIM="iPhone 17"

# --- parse --simulator ("=name" or "name" form) ---
args=("$@")
for ((i=0; i<${#args[@]}; i++)); do
  case "${args[$i]}" in
    --simulator=*) SIM="${args[$i]#*=}" ;;
    --simulator)   SIM="${args[$((i+1))]:-$SIM}" ;;
  esac
done

# Keg-only node@22 (RN 0.87 needs >=22.11); the SPM sync build phase shells out to node.
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
export RCT_NEW_ARCH_ENABLED=1 LANG=en_US.UTF-8

echo "▸ target simulator: $SIM"

# --- boot the simulator if needed ---
UDID="$(xcrun simctl list devices available | awk -v n="$SIM" -F'[()]' '$0 ~ n" \\(" {print $2; exit}')"
[ -n "$UDID" ] || { echo "✖ simulator '$SIM' not found (xcrun simctl list devices)"; exit 1; }
if ! xcrun simctl list devices booted | grep -q "$UDID"; then
  echo "▸ booting $SIM ($UDID)"; xcrun simctl boot "$UDID" || true
fi
open -a Simulator || true

# --- ensure Metro is running ---
if ! curl -s http://localhost:8081/status 2>/dev/null | grep -q packager-status; then
  echo "▸ starting Metro"
  ( cd "$IOS_DIR/.." && npm_execpath="" node "$(command -v react-native || echo ./node_modules/.bin/react-native)" start >/dev/null 2>&1 & )
else
  echo "▸ Metro already running"
fi

# --- build (SPM; no CocoaPods) ---
echo "▸ building $SCHEME (SPM, no CocoaPods)…"
xcodebuild build \
  -project "$PROJECT" -scheme "$SCHEME" -configuration Debug \
  -sdk iphonesimulator -destination "id=$UDID" \
  -derivedDataPath "$DD" CODE_SIGNING_ALLOWED=NO

APP="$DD/Build/Products/Debug-iphonesimulator/$SCHEME.app"
[ -d "$APP" ] || { echo "✖ built app not found at $APP"; exit 1; }

echo "▸ installing + launching"
xcrun simctl install "$UDID" "$APP"
xcrun simctl launch "$UDID" "$BUNDLE_ID"
echo "✓ $SCHEME running on $SIM"
