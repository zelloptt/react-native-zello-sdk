# Changelog

# 3.0.0

### BREAKING CHANGES

* **Requires React Native 0.86+ with the New Architecture enabled.** The SDK is now a Turbo Native Module and no longer supports the legacy bridge architecture.
* Minimum Node version raised to 20 (22+ recommended, matching the React Native 0.86 toolchain).

### Features

* Converted the native module to the New Architecture (Turbo Native Module) behind a single shared codegen spec, replacing the legacy bridge modules.
* **iOS:** the native ZelloSDK can be installed via Swift Package Manager — opt in with `ZELLO_USE_SPM=1` (see the README). CocoaPods remains the default.

### Notes

* CocoaPods is deprecated in favor of Swift Package Manager but cannot be fully removed yet, because React Native itself still requires CocoaPods. The README documents a required CocoaPods `post_install` build setting for Xcode 16/26+.

# 2.0.1

* Increase Android SDK to 1.0.+ (1.0.4)

# 2.0.0

### BREAKING CHANGES

* Dropped support for iOS 14 — minimum supported version is now iOS 15.
* Updating to SDK 2.0.0 or higher will be **required** to continue communication with Zello servers starting Aug 12 2025.

# 1.0.3

### Bug Fixes

* Fix History message playback [#12](https://github.com/zelloptt/react-native-zello-sdk/pull/12)

# 1.0.2

### Bug Fixes

* Increase Android SDK to 1.0.1 [b36b8b2ddbc57c57f0a7097f643ea6d47be08293](https://github.com/zelloptt/react-native-zello-sdk/commit/b36b8b2ddbc57c57f0a7097f643ea6d47be08293)

# 1.0.1

### Bug Fixes

* Fix adhoc group conversation bugs [#9](https://github.com/zelloptt/react-native-zello-sdk/pull/9)

# 1.0.0

### Features

* Added adhoc group conversations support [#3](https://github.com/zelloptt/react-native-zello-sdk/pull/3)
* Add console settings for allowing different message types [#4](https://github.com/zelloptt/react-native-zello-sdk/pull/4)

### Bug Fixes

* Performance improvements for the example app [#6](https://github.com/zelloptt/react-native-zello-sdk/pull/6/files)

# 0.4.0

### Features

* Added Dispatch Calls Support [#1](https://github.com/zelloptt/react-native-zello-sdk/pull/1)
* iOS: Added Notification Service Extension [#2](https://github.com/zelloptt/react-native-zello-sdk/pull/2)
