require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'

# CocoaPods support is deprecated. CocoaPods still works and remains supported,
# but Swift Package Manager is the recommended installation path going forward.
if defined?(Pod::UI)
  Pod::UI.warn "[react-native-zello-sdk] CocoaPods support is deprecated. It still works, but Swift Package Manager is the recommended installation path going forward. See https://github.com/zelloptt/react-native-zello-sdk#installation"
end

Pod::Spec.new do |s|
  s.name         = "react-native-zello-sdk"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/zelloptt/react-native-zello-sdk/react-native-zello-sdk.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  # `ios/generated` is local codegen output (from `bob build --target codegen`);
  # the real codegen runs during the host app build, so never compile it here.
  s.exclude_files = "ios/generated/**/*"

  # ZelloSDK native dependency.
  # Default: CocoaPods (`pod 'ZelloSDK'`). Set ZELLO_USE_SPM=1 before `pod install`
  # to consume ZelloSDK via Swift Package Manager instead — prebuilt xcframeworks
  # from github.com/zelloptt/ios-mobile-sdk (product `ZelloSDKUmbrella`). SPM is
  # Zello's recommended path and avoids the CocoaPods resilient-symbol workaround.
  # This mirrors sentry-react-native's `SENTRY_USE_SPM=1` opt-in pattern.
  if ENV['ZELLO_USE_SPM'] == '1' && respond_to?(:spm_dependency, true)
    spm_dependency(s,
      url: 'https://github.com/zelloptt/ios-mobile-sdk',
      requirement: { kind: 'upToNextMajorVersion', minimumVersion: '2.0.0' },
      products: ['ZelloSDKUmbrella']
    )
  else
    # Channel type and emergency end-others require the first ZelloSDK release after 3.0.2;
    # transcriptions and translation flags are available as of 3.0.2.
    s.dependency 'ZelloSDK', '~> 3.0'
  end

  # Use install_modules_dependencies helper to install the dependencies if React Native version >=0.71.0.
  # See https://github.com/facebook/react-native/blob/febf6b7f33fdb4904669f99d795eba4c0f95d7bf/scripts/cocoapods/new_architecture.rb#L79.
  if respond_to?(:install_modules_dependencies, true)
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"

    # Don't install the dependencies when we run `pod install` in the old architecture.
    if ENV['RCT_NEW_ARCH_ENABLED'] == '1' then
      s.compiler_flags = folly_compiler_flags + " -DRCT_NEW_ARCH_ENABLED=1"
      s.pod_target_xcconfig    = {
          "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
          "OTHER_CPLUSPLUSFLAGS" => "-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1",
          "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
      }
      s.dependency "React-Codegen"
      s.dependency "RCT-Folly"
      s.dependency "RCTRequired"
      s.dependency "RCTTypeSafety"
      s.dependency "ReactCommon/turbomodule/core"
    end
  end
end
