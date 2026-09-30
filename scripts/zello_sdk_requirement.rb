# Single source of truth for the native ZelloSDK Swift package requirement.
# Loaded by both the podspec (Pods.xcodeproj) and scripts/zello_pods.rb (app
# project); the URL must be byte-identical in both projects, otherwise Xcode
# reports "package is required using two different URLs".
#
# The podspec is evaluated more than once per process, hence the guards.
ZELLO_SDK_URL = 'https://github.com/zelloptt/ios-mobile-sdk' unless defined?(ZELLO_SDK_URL)
ZELLO_SDK_PRODUCT = 'ZelloSDKUmbrella' unless defined?(ZELLO_SDK_PRODUCT)
unless defined?(ZELLO_SDK_REQUIREMENT)
  ZELLO_SDK_REQUIREMENT = { 'kind' => 'upToNextMajorVersion', 'minimumVersion' => '3.3.2' }.freeze
end
ZELLO_MIN_IOS_VERSION = '17.0' unless defined?(ZELLO_MIN_IOS_VERSION)
