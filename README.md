# react-native-zello-sdk

Zello SDK for React Native.

Our React Native SDK offers itself as a thin wrapper around our native iOS and Android SDK’s. It is built with TypeScript, and communicates with the native SDK’s via React Native’s native module support.

## Prerequisites
A [React Native application and environment](https://reactnative.dev/docs/environment-setup).


## Installation

Install the package via NPM:
```sh
npm install @zelloptt/react-native-zello-sdk
```

### iOS

Please reference the iOS Installation Guide.

### Android

Before getting started, please reference the Android Installation Guide.

#### Dependencies

Add the repositories to your app's `build.gradle`:

```
repositories {
  google()
  mavenCentral()
  maven {
    url = uri("https://zello-sdk.s3.amazonaws.com/android/latest")
  }
}
```

Then, add the following dependencies to your app's `build.gradle`:

```
// Required Dependencies to use the Zello SDK
implementation("com.zello:sdk:0.3.1")
implementation("com.zello:zello:0.3.1")
implementation("com.zello:core:0.3.1") {
  exclude module: "unspecified"
}
implementation(platform("com.google.firebase:firebase-bom:33.1.2"))
implementation("com.google.firebase:firebase-messaging")
implementation("com.google.dagger:hilt-android:2.51")
kapt("com.google.dagger:hilt-android-compiler:2.51")
```

#### Linking

Since the Zello Android SDK requires Hilt, and we must inject the `Zello` instance into the `ReactPackage`, the project does not work with autolinking.

As such, you will need to create a `ReactPackage` wrapper like this:
```kotlin
/// ZelloAndroidSdkPackage.kt

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.zello.sdk.Zello
import com.zellosdk.ZelloAndroidSdkModule
import javax.inject.Inject

class ZelloAndroidSdkPackage @Inject constructor(private val zello: Zello) : ReactPackage {

  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf(ZelloAndroidSdkModule(reactContext, zello))
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
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
