# react-native-zello-sdk

Zello SDK for React Native.

Our React Native SDK offers itself as a thin wrapper around our native iOS and Android SDK’s. It is built with TypeScript, and communicates with the native SDK’s via a [Turbo Native Module](https://reactnative.dev/docs/turbo-native-modules-introduction) on React Native’s New Architecture.

This repository contains both the React Native Bridge, as well as an example app to demonstrate usage.

To see an example of the React Native SDK, check out [the example folder](https://github.com/zelloptt/react-native-zello-sdk/tree/master/example).

The following instructions are for the installation of the SDK into your application - **not** for the example app.

## Prerequisites
A React Native application and environment.

- **React Native 0.86+** with the **New Architecture enabled** (the default since 0.76). This SDK is a Turbo Native Module and does not support the legacy architecture.
- **Node 20+** (Node 22+ recommended, matching the React Native 0.86 toolchain).

A thorough understanding of Zello. The best place to get started is our [documentation](https://sdk.zello.com/).


## Installation

Install the package via NPM:
```sh
npm install @zelloptt/react-native-zello-sdk
```

### iOS

Before getting started, please reference the [iOS Installation Guide](https://developers.zello.com/sdk/latest/ios/documentation/zellosdk/getting-started). There is no need to add the native `ZelloSDK` to your project directly — this library declares it for you.

The native ZelloSDK is consumed through **Swift Package Manager only** (product `ZelloSDKUmbrella` from [`github.com/zelloptt/ios-mobile-sdk`](https://github.com/zelloptt/ios-mobile-sdk)); it is no longer available through CocoaPods. React Native itself still requires CocoaPods, so the React Native layer of this library stays a CocoaPod and a small Podfile helper wires the Swift package into your app.

Requirements:

- **React Native 0.86 or later**: the podspec uses React Native's `spm_dependency` and raises during `pod install` on older versions.
- **iOS 17.0 or later**, in **both** places: `platform :ios, '17.0'` in your `Podfile`, and the `IPHONEOS_DEPLOYMENT_TARGET` of your app target and of any app extension (for example the Notification Service Extension).
- Native ZelloSDK `3.3.2` or later, below `4.0.0`. The requirement is `upToNextMajorVersion` from `3.3.2`; a fresh resolve picks the newest `3.x`, while a committed `Package.resolved` keeps its pin until you use *File > Packages > Update to Latest Package Versions*.

#### Setup

```sh
npm install @zelloptt/react-native-zello-sdk@4
npx @zelloptt/react-native-zello-sdk setup-ios
cd ios && bundle exec pod install
```

`setup-ios` edits only your `Podfile` (it never touches the `.xcodeproj`): it prints a diff and asks for confirmation. Options: `--dry-run` (print the diff only), `--yes` (non-interactive), `--project-root <dir>` / `--podfile <path>` (monorepos), `--app-target <name>` and `--extension-target <name>` (repeatable) when the targets cannot be detected. Only top-level `Podfile` targets whose name contains `Extension`, `NSE` or `Widget` are detected as extensions; list any other extension with `--extension-target`. It exits with code `2` and changes nothing when it needs a manual step.

Or make the changes yourself:

```ruby
# Podfile — before `prepare_react_native_project!`
require Pod::Executable.execute_command('node', ['-p',
  "require.resolve('@zelloptt/react-native-zello-sdk/scripts/zello_pods.rb', {paths: [process.argv[1]]})",
  __dir__]).strip

platform :ios, '17.0'

target 'MyApp' do
  # ...
  post_install do |installer|
    zello_post_install(installer, app_target: 'MyApp', extension_targets: ['NotificationServiceExtension'])
    react_native_post_install(installer, config[:reactNativePath])
  end
end
```

`zello_post_install` adds the package to your Xcode project, links `ZelloSDKUmbrella` into the app and embeds it, and links it (without embedding) into the listed extension targets. It is idempotent, and raises with an explanation if the deployment target is below 17.0 or a `ZelloSDK` pod is still present. Open the `.xcworkspace` afterwards; Xcode resolves the package on first build.

If your app project already references `github.com/zelloptt/ios-mobile-sdk`, `zello_post_install` keeps your version requirement unless it is an *Up to Next Major Version* rule with a lower minimum than `3.3.2`; then it raises the minimum to `3.3.2`. The bridge pod always requires `3.3.2` up to the next major, and Xcode resolves one version that satisfies both.

Static and dynamic `use_frameworks!` as well as no `use_frameworks!` are all supported. With static or no `use_frameworks!`, `pod install` prints `[SPM] WARNING!!! Pod react-native-zello-sdk is using swift package(s) ZelloSDKUmbrella with static linking, this might cause linker errors`; this is expected, because `zello_post_install` links the dynamic `ZelloSDKUmbrella` into the app.

#### Upgrading from 3.x

1. Run the three commands above. `setup-ios` removes `pod 'ZelloSDK'`, the CocoaPods resilient-pods `post_install` workaround (`BUILD_LIBRARY_FOR_DISTRIBUTION` for `PhoneNumberKit`, `SnowplowTracker`, `CocoaLumberjack`, `PromisesSwift`) and raises `platform :ios` to `17.0`. If you did it by hand, remove those as well as any `ZELLO_USE_SPM` setting and any manually added `ZelloSDKUmbrella` package reference in your extension targets.
2. Raise the app and extension deployment targets to 17.0 if they are lower.
3. Do a **Clean Build Folder** in Xcode (or `rm -rf ios/build`) once: frameworks previously embedded by CocoaPods can linger in an incremental build and clash with the new ones.

#### Troubleshooting (Swift Package Manager)

- `[CP] Copy Pods Resources ... Operation not permitted` with static or no `use_frameworks!`: set `ENABLE_USER_SCRIPT_SANDBOXING = NO` on the app and extension targets.
- `Multiple commands produce '*.ttf'` with static or no `use_frameworks!`: remove the duplicated font files from the app target's *Copy Bundle Resources* phase (keep them in `UIAppFonts`); CocoaPods already copies them.
- **PhoneNumberKit:** ZelloSDK pulls PhoneNumberKit via Swift Package Manager — the `marmelroy/PhoneNumberKit` 3.x on native `3.3.2`, the 5.x from the PhoneNumberKit organization's repository on `3.3.3` and later. These are two different repositories sharing one package identity, so:
  - an app that depends on `marmelroy/PhoneNumberKit` itself gets *package 'phonenumberkit' is required using two different URLs* once `3.3.3` resolves — switch your dependency to the PhoneNumberKit organization repository, or drop it;
  - builds that disable automatic resolution (`-onlyUsePackageVersionsFromResolvedFile`) fail until their `Package.resolved` is updated;
  - a PhoneNumberKit **pod** next to the Swift package duplicates classes — remove the pod.

#### Expo

Add the config plugin, plus `expo-build-properties` to raise the app's deployment target, to `app.json`:

```json
{
  "expo": {
    "plugins": [
      ["expo-build-properties", { "ios": { "deploymentTarget": "17.0" } }],
      ["@zelloptt/react-native-zello-sdk", { "extensionTargets": ["NotificationServiceExtension"] }]
    ]
  }
}
```

The plugin applies the same Podfile changes as `setup-ios` on `expo prebuild`, and sets the deployment target of the listed `extensionTargets` to 17.0. Expo applies plugin mods in reverse order, so list it **before** any plugin that creates the extension target; prebuild fails if a listed extension target is not in the Xcode project. Expo apps use no `use_frameworks!` unless `ios.useFrameworks` is set.

#### Troubleshooting

While setting up your Notification Service Extension, you may receive an error:

```
Cycle inside YourApp; building could produce unreliable results.
Cycle details:
→ Target ‘YourApp’
○ That command depends on command in Target ‘YourApp’: script phase “[CP-User] [RNFB] Core Configuration”
```

If you receive the above error, you should move the `Build Phases` phase named `Embed Foundation Extensions` to higher up in the order.

### Android

Before getting started, please reference the [Android Installation Guide](https://sdk.zello.com/installation-guides/android-installation-guide).

#### Dependencies

You may or may not need to add the repositories to your app's `build.gradle`:

```
repositories {
  google()
  mavenCentral()
  maven {
    url = uri("https://zello-sdk.s3.amazonaws.com/android/latest")
  }
}
```

#### Linking

Since the Zello Android SDK requires Hilt, and we must inject the `Zello` instance into the package, the project does not work with autolinking.

Because the module is now a Turbo Native Module (New Architecture), the package must be a `BaseReactPackage` that exposes the module through a `ReactModuleInfoProvider` with `isTurboModule = true`:

```kotlin
/// ZelloAndroidSdkPackage.kt

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.zello.sdk.Zello
import com.zellosdk.ZelloAndroidSdkModule
import javax.inject.Inject

class ZelloAndroidSdkPackage @Inject constructor(private val zello: Zello) : BaseReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == "NativeZelloSdk") ZelloAndroidSdkModule(reactContext, zello) else null

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      "NativeZelloSdk" to ReactModuleInfo(
        "NativeZelloSdk", // name
        "NativeZelloSdk", // className
        false, // canOverrideExistingModule
        false, // needsEagerInit
        false, // isCxxModule
        true   // isTurboModule
      )
    )
  }
}
```

Then, add it to the packages list:

```kotlin
/// MainApplication.kt

@HiltAndroidApp
class MainApplication : Application(), ReactApplication {

    @Inject lateinit var zello: Zello

    override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              add(ZelloAndroidSdkPackage(zello))
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

      override fun onCreate() {
        super.onCreate()
        // Don't forget to start the SDK!
        zello.start()
      }
}
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
