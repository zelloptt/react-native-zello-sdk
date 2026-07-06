# Changelog

# Unreleased

### Features

* Expose channel type via `ZelloChannel.channelType` (`ZelloChannelType`: dynamic, dispatch, team, groupConversation)
* Add translation flags: `ZelloChannel.translationsEnabled` and `ZelloIncomingVoiceMessage.isTranslation`
* Expose voice message transcriptions via `ZelloHistoryVoiceMessage.transcription` (`ZelloTranscription`, `ZelloTranslation`) and the new `ZelloEvent.HISTORY_VOICE_MESSAGE_TRANSCRIPTION_AVAILABLE` event
* Add `Zello.stopIncomingEmergency()` to end another user's incoming emergency, plus `allowEmergencyEndOwn` / `allowEmergencyEndOthers` on `ZelloChannelOptions`

### Dependencies

* Android: `com.zello:sdk` bumped to `2.+` (requires the first release after 2.0.2, which includes ANDROID-3816, ANDROID-3706, ANDROID-3685, and ANDROID-3683)
* iOS: `ZelloSDK` bumped to `~> 3.0` (transcriptions and translation flags require 3.0.2; channel type and emergency end-others require the first release after 3.0.2, which includes IOS-4385 and IOS-4251)

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
