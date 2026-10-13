#!/bin/bash
# Launch smoke of the example app on a simulator. Usage: ios-launch-smoke.sh <path/to/App.app>
#
# A successful build does not prove the app works: with static/none linkage and a missing
# app-level link of the dynamic ZelloSDKUmbrella, the app builds but crashes on the first SDK
# call (`configure()` runs on mount). So this starts Metro, launches the app, waits for the
# `[zello-smoke] configured` line the example logs right after calling `configure()`, and then
# requires the process to still be alive with no dyld / duplicate-class / fatal errors and no new
# crash report. The native `configure` is a void TurboModule call (dispatched asynchronously),
# hence the settle time after the sentinel.
#
# Env: SIMULATOR_UDID (optional; a throwaway device is created and deleted otherwise),
#      SIMULATOR_RUNTIME (optional runtime identifier for that throwaway device),
#      SMOKE_OUT (optional output dir for logs, default ./ios-smoke-out).
set -uo pipefail

APP="${1:?usage: $0 <App.app>}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="${SMOKE_OUT:-$ROOT/ios-smoke-out}"; mkdir -p "$OUT"
BID=$(/usr/libexec/PlistBuddy -c 'Print CFBundleIdentifier' "$APP/Info.plist")
EXE=$(/usr/libexec/PlistBuddy -c 'Print CFBundleExecutable' "$APP/Info.plist")
SENTINEL='[zello-smoke] configured'
SENTINEL_TIMEOUT=90
ERRORS='dyld\[|symbol not found|implemented in both|library not loaded|fatal error'

UDID="${SIMULATOR_UDID:-}"
created=0
cleanup() {
  [ -n "${LOG_PID:-}" ] && kill "$LOG_PID" 2>/dev/null
  [ -n "${METRO_PID:-}" ] && kill "$METRO_PID" 2>/dev/null
  [ -n "$UDID" ] && xcrun simctl terminate "$UDID" "$BID" >/dev/null 2>&1
  if [ $created -eq 1 ]; then xcrun simctl shutdown "$UDID" >/dev/null 2>&1; xcrun simctl delete "$UDID" >/dev/null 2>&1; fi
}
trap cleanup EXIT

die() {
  echo "SMOKE FAIL: $*"
  echo "--- metro (tail):"; tail -n 20 "$OUT/metro.log" 2>/dev/null
  echo "--- log hits:"; grep -iE "$ERRORS" "$OUT/device.log" 2>/dev/null | grep -v '^Filtering' | head -20
  exit 1
}

if [ -z "$UDID" ]; then
  # Newest available iOS runtime not newer than the SDK the app was built with (a newer runtime can
  # enforce more for that SDK), and the first iPhone device type that runtime supports.
  sdk=$(/usr/libexec/PlistBuddy -c 'Print DTPlatformVersion' "$APP/Info.plist")
  read -r runtime device < <(xcrun simctl list -j runtimes available | python3 -c '
import json, sys
version = lambda v: [int(p) for p in v.split(".")]
runtimes = [r for r in json.load(sys.stdin)["runtimes"]
            if r.get("platform") == "iOS" and r.get("isAvailable") and version(r["version"]) <= version(sys.argv[1])
            and sys.argv[2] in ("", r["identifier"])]
for r in sorted(runtimes, key=lambda r: version(r["version"]), reverse=True):
    phones = [t["identifier"] for t in r.get("supportedDeviceTypes", []) if t.get("productFamily") == "iPhone"]
    if phones:
        print(r["identifier"], phones[0])
        break
' "$sdk" "${SIMULATOR_RUNTIME:-}")
  [ -n "${device:-}" ] || die "no available iOS runtime <= $sdk ${SIMULATOR_RUNTIME:-} with an iPhone device type"
  UDID=$(xcrun simctl create zello-smoke "$device" "$runtime") || die "simctl create $device $runtime failed"
  created=1
  echo "created simulator $UDID ($device, $runtime)"
fi

# Metro: serve the bundle and wait until it is built (first bundle can take minutes).
(cd "$ROOT/example" && exec yarn start --no-interactive --port 8081) > "$OUT/metro.log" 2>&1 &
METRO_PID=$!
for _ in $(seq 1 60); do curl -sf http://localhost:8081/status 2>/dev/null | grep -q running && break; sleep 2; done
curl -sf http://localhost:8081/status 2>/dev/null | grep -q running || die "Metro did not start"
curl -sf --max-time 600 -o /dev/null "http://localhost:8081/index.bundle?platform=ios&dev=true&minify=false" || die "Metro could not build the JS bundle"

xcrun simctl boot "$UDID" 2>/dev/null
xcrun simctl bootstatus "$UDID" -b >/dev/null 2>&1
xcrun simctl terminate "$UDID" "$BID" >/dev/null 2>&1
xcrun simctl uninstall "$UDID" "$BID" >/dev/null 2>&1
xcrun simctl install "$UDID" "$APP" || die "install failed"
xcrun simctl privacy "$UDID" grant all "$BID" >/dev/null 2>&1

# JS console output reaches the unified log of the app process at info level (RCTLog, category javascript).
xcrun simctl spawn "$UDID" log stream --level info --style compact \
  --predicate "process == \"$EXE\" OR eventMessage CONTAINS[c] \"dyld\"" > "$OUT/device.log" 2>&1 &
LOG_PID=$!
sleep 2
START=$(date +%s)
xcrun simctl launch "$UDID" "$BID" > "$OUT/launch.txt" 2>&1 || die "launch failed: $(cat "$OUT/launch.txt")"

configured=0
for _ in $(seq 1 $SENTINEL_TIMEOUT); do
  if grep -qF "$SENTINEL" "$OUT/device.log"; then configured=1; break; fi
  sleep 1
done
[ $configured -eq 1 ] || die "'$SENTINEL' not logged within ${SENTINEL_TIMEOUT}s (app crashed or hung before configure())"
sleep 10

# The app's launchd label is `UIKitApplication:<bundle id>[...]`; the extension's is not matched.
pid=$(xcrun simctl spawn "$UDID" launchctl list | awk -v l="UIKitApplication:$BID[" 'index($3, l) == 1 {print $1}')
case "$pid" in ''|-) die "app is not running after configure() (crashed)";; esac
crash=$(find ~/Library/Logs/DiagnosticReports -name "$EXE*.ips" -newermt "@$START" 2>/dev/null)
[ -z "$crash" ] || die "crash report: $crash"
if grep -iE "$ERRORS" "$OUT/device.log" | grep -v '^Filtering' | grep -q .; then die "dyld/duplicate-class/fatal errors in device log"; fi

echo "launch smoke: PASS ($BID pid $pid, configure() ran, no crash)"
