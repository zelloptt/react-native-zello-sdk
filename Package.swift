// swift-tools-version: 5.9
import PackageDescription

// PROTOTYPE — SPM distribution for the React Native Zello SDK iOS module.
//
// Modeled on the native iOS SDK's distribution manifest
// (zello-ios-client/Dependencies/Package.swift): ship the module as a PREBUILT
// xcframework (`.binaryTarget`) plus a thin umbrella target that links the
// native ZelloSDK and forces the binary into the app image. Shipping a binary
// is what lets an inherently mixed Swift + Obj-C++ TurboModule ship over SPM at
// all — SwiftPM never compiles our mixed sources; xcodebuild already did, in
// scripts/build-xcframework.sh.
//
// The `url`/`checksum` below are placeholders patched per release by the build
// pipeline (see scripts/build-xcframework.sh, mirroring release_sdk.sh).

let version = "3.0.0"
// Patched by scripts/build-xcframework.sh from `swift package compute-checksum`.
let binaryChecksum = "0000000000000000000000000000000000000000000000000000000000000000"

let package = Package(
  name: "ReactNativeZelloSdk",
  platforms: [.iOS("17.0")],
  products: [
    .library(name: "ReactNativeZelloSdk", targets: ["ReactNativeZelloSdk"])
  ],
  dependencies: [
    // Native Zello iOS SDK — itself a prebuilt-xcframework SPM package.
    .package(url: "https://github.com/zelloptt/ios-mobile-sdk", from: "3.0.0"),
    // React Native 0.87 publishes its headers/prebuilt frameworks as SPM
    // packages inside the consuming app; RN's `react-native spm` autolinking
    // resolves this relative path in the app context (same shape Sentry uses).
    .package(name: "ReactNative", path: "../../../../xcframeworks"),
  ],
  targets: [
    // The prebuilt module. Produced by scripts/build-xcframework.sh, hosted per
    // release; url + checksum patched by the pipeline.
    .binaryTarget(
      name: "ReactNativeZelloSdkBinary",
      url: "https://zello.com/sdk/dist/ios/react-native/spm/\(version)/react_native_zello_sdk.xcframework.zip",
      checksum: binaryChecksum
    ),

    // Thin umbrella: links the native SDK + RN headers and keeps the binary in
    // the app image so RN autolinking can register the TurboModule at launch.
    .target(
      name: "ReactNativeZelloSdk",
      dependencies: [
        "ReactNativeZelloSdkBinary",
        .product(name: "ZelloSDKUmbrella", package: "ios-mobile-sdk"),
        .product(name: "ReactHeaders", package: "ReactNative"),
        .product(name: "ReactNativeHeaders", package: "ReactNative"),
        .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
      ],
      path: "Sources/Umbrella"
    ),
  ]
)
