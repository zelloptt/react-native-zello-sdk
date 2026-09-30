require "json"
require_relative "scripts/zello_sdk_requirement"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-zello-sdk"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => ZELLO_MIN_IOS_VERSION }
  s.source       = { :git => "https://github.com/zelloptt/react-native-zello-sdk/react-native-zello-sdk.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  # `ios/generated` is local codegen output (from `bob build --target codegen`);
  # the real codegen runs during the host app build, so never compile it here.
  s.exclude_files = "ios/generated/**/*"

  # ZelloSDK native dependency: Swift Package Manager only (product `ZelloSDKUmbrella` from
  # github.com/zelloptt/ios-mobile-sdk). The app project is wired up by `zello_post_install`
  # (scripts/zello_pods.rb); this declaration only lets the bridge pod compile against ZelloSDK.
  unless respond_to?(:spm_dependency, true)
    raise "[react-native-zello-sdk] `spm_dependency` is not available. React Native 0.86+ is required."
  end
  spm_dependency(s,
    url: ZELLO_SDK_URL,
    requirement: ZELLO_SDK_REQUIREMENT,
    products: [ZELLO_SDK_PRODUCT]
  )

  # SwiftPM places binaryTarget frameworks in the products root, which pod targets (own
  # CONFIGURATION_BUILD_DIR) do not search. Must be set before `install_modules_dependencies`, which merges.
  s.pod_target_xcconfig = {
    'FRAMEWORK_SEARCH_PATHS' => '$(inherited) "${SYMROOT}/${CONFIGURATION}${EFFECTIVE_PLATFORM_NAME}"'
  }

  # React Native's helper for the codegen/TurboModule dependencies.
  install_modules_dependencies(s)
end
