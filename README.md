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

#### Native ZelloSDK: CocoaPods (default) or Swift Package Manager

The native ZelloSDK can be consumed two ways. **Full CocoaPods removal is not yet possible** because React Native itself still requires CocoaPods for its core (Swift-Package-Manager-only React Native is an [in-progress RN proposal](https://github.com/react-native-community/discussions-and-proposals/pull/994)). So, like [`sentry-react-native`](https://github.com/getsentry/sentry-react-native/issues/5780), the React Native layer stays on CocoaPods while the native ZelloSDK can opt into SPM.

> [!NOTE]
> CocoaPods support for the native ZelloSDK is **deprecated** (still supported); Swift Package Manager is the recommended path going forward.

- **CocoaPods (default):** just `bundle exec pod install` — the `ZelloSDK` pod is pulled automatically.
- **Swift Package Manager (recommended):** set `ZELLO_USE_SPM=1` before installing pods:
  ```sh
  ZELLO_USE_SPM=1 bundle exec pod install
  ```
  This pulls ZelloSDK from [`github.com/zelloptt/ios-mobile-sdk`](https://github.com/zelloptt/ios-mobile-sdk) (product `ZelloSDKUmbrella`, up to the next major from `2.0.0`) as prebuilt XCFrameworks. Also add the `ZelloSDKUmbrella` package product to your **Notification Service Extension** target.

#### CocoaPods: required build setting (Xcode 16/26+)

When using the **CocoaPods** path, ZelloSDK's prebuilt binary links library-evolution ("resilient") symbols from its Swift dependencies. You must build those pods for distribution in your `Podfile` `post_install`, or the app will crash at launch with `dyld: Symbol not found`:

```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    if %w[PhoneNumberKit SnowplowTracker CocoaLumberjack PromisesSwift].include?(target.name)
      target.build_configurations.each do |config|
        config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
      end
    end
  end
  # ...your existing react_native_post_install(...) call...
end
```

The **SPM** path does not need this — its XCFrameworks are already built resiliently.

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
