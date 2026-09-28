// PROTOTYPE umbrella source for the SPM distribution (see Package.swift).
//
// The real module lives in the prebuilt `ReactNativeZelloSdkBinary` xcframework;
// this file exists only to give SwiftPM a source target that (a) declares the
// dependency edges to the native ZelloSDK and React Native header products, and
// (b) can force-link the binary's Obj-C `+load` / RCT_EXPORT_MODULE registration
// into the app image (mirroring the native SDK's ZelloSDKUmbrella retainer).
//
// It is intentionally not imported by app code — RN autolinking discovers the
// TurboModule from the binary at launch.

@_exported import ZelloSDKUmbrella

/// Dead-strip root that pulls the prebuilt module's object files into the link
/// so RCT_EXPORT_MODULE(NativeZelloSdk) is registered. Not meant to be called.
@_cdecl("ReactNativeZelloSdkRetain")
public func reactNativeZelloSdkRetain() {}
