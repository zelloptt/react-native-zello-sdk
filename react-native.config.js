// Tells React Native's `spm` autolinking to use THIS package's own Package.swift
// (a prebuilt xcframework binaryTarget) rather than scaffolding one from the
// podspec — our sources are mixed Swift + Obj-C++, which SwiftPM can't compile
// from source in one target, so we ship a binary instead.
module.exports = {
  spm: { name: 'ReactNativeZelloSdk' },
  dependency: { platforms: { ios: {} } },
};
