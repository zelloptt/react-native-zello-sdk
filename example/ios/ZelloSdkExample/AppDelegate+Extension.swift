import UIKit
import ZelloSDK

@objc extension AppDelegate {
  func registerForRemoteNotifications(deviceToken: Data) {
    Zello.shared.registerForRemoteNotifications(deviceToken: deviceToken)
  }
}
