package zellosdk.example

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
