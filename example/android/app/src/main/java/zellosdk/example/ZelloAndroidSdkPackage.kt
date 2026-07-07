package zellosdk.example

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
