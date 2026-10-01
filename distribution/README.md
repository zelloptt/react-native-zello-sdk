# SPM distribution (CocoaPods-free)

Produces `react_native_zello_sdk.xcframework`, the prebuilt binary the root
`Package.swift` ships as a `.binaryTarget`. This is how the RN Zello SDK is
consumed over Swift Package Manager with **no CocoaPods**.

## Why a prebuilt binary

The iOS module is mixed Swift + Objective-C++ (a TurboModule JSI binding plus a
Swift implementation that calls the ZelloSDK Swift API). SwiftPM cannot compile a
single target containing both languages, so we ship a binary — the mixing happens
in `xcodebuild`, not SwiftPM.

The binary links **nothing** from React. `-undefined dynamic_lookup` lets every
React / jsi / ReactCommon symbol resolve at runtime from the host app's already
loaded `React.framework`. Its only load commands are `ZelloSDK` /
`ZelloSDKUmbrella`, so it is **not pinned to a specific React ABI**. The
TurboModule codegen spec is baked in (`RNZelloSdkSpec-generated.mm`), so there is
no dependency on the app's (statically linked) `ReactCodegen`.

This is deliberately different from a CocoaPods `xcodebuild archive`, which always
links React as ~18 separate frameworks (`DoubleConversion`, `React_Fabric`,
`jsi`, …) and hard-links `ReactCodegen` — a layout incompatible with RN 0.87's
**merged** `React.framework` + `ReactNativeDependencies.framework`, which crashes
at launch with `dyld: Library not loaded: @rpath/DoubleConversion.framework`.

## Build it

```bash
# 1) Publish RN's SPM xcframeworks (one example build does this):
cd example && yarn ios
# 2) Produce the xcframework:
cd .. && bash distribution/scripts/build-spm-xcframework.sh
```

Output: `build/xcframework/react_native_zello_sdk.xcframework` (git-ignored).

## Scripts

- `scripts/make-dist-project.rb` — generates `ReactNativeZelloSdkDist.xcodeproj`
  (a framework target over the module sources + baked codegen, compiled against
  RN's SPM header products + `ZelloSDKUmbrella`). The generated project contains
  absolute paths and is git-ignored; regenerate it with the producer.
- `scripts/build-spm-xcframework.sh` — the producer (codegen → generate project →
  build both slices → `create-xcframework`).
- `scripts/wire-example-extension.rb` — one-off that wires the example app's
  `NotificationServiceExtension` target to the `ios-mobile-sdk` → `ZelloSDKUmbrella`
  SPM product (the RN CLI's `spm` command only wires the app target, not
  extensions).

## Release TODO

- Source `React.xcframework` / `ReactNativeDependencies.xcframework` + the header
  packages from RN's own SPM artifact cache so the producer needs no prior example
  build.
- Host the xcframework zip and patch `url` + `checksum` into the root
  `Package.swift` (mirror the native SDK's `release_sdk.sh`).
- SPM-only CI.
