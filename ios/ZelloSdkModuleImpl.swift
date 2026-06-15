import Foundation
import React
import ZelloSDK

/**
 * Swift implementation backing the `NativeZelloSdk` TurboModule.
 *
 * The TurboModule itself is the Objective-C++ class `ZelloSdkModule` (see
 * `ZelloSdkModule.mm`), which forwards each method here. All calls operate on
 * the `Zello.shared` singleton, which is the same instance the event-emitter
 * module (`ZelloIOSSdkModule`) observes as its delegate.
 */
@objc(ZelloSdkModuleImpl)
public class ZelloSdkModuleImpl: NSObject {

  private let zello = Zello.shared

  @objc public func configure(_ config: NSDictionary) {
    let ios = config["ios"] as? NSDictionary
    let isDebugBuild = (ios?["isDebugBuild"] as? Bool) ?? false
    let appGroupRaw = (ios?["appGroup"] as? String) ?? ""
    let group: String? = appGroupRaw.isEmpty ? nil : appGroupRaw
    var configuration = ZelloConfiguration(appGroup: group)
    configuration.pushNotificationEnvironment = isDebugBuild ? .development : .production
  }

  @objc public func connect(_ network: String, username: String, password: String) {
    zello.connect(credentials: ZelloCredentials(username: username, network: network, password: password))
  }

  @objc public func disconnect() {
    zello.disconnect()
  }

  @objc public func setAccountStatus(_ status: String) {
    let accountStatus: ZelloAccountStatus
    switch status {
    case "available":
      accountStatus = .available
    case "busy":
      accountStatus = .busy
    default:
      return
    }
    zello.setAccountStatus(status: accountStatus)
  }

  @objc public func selectContact(_ name: String, contactType: String) {
    guard let contact = contactFromType(contactType, name: name) else { return }
    zello.setSelectedContact(contact: contact)
  }

  @objc public func startVoiceMessage(_ name: String, contactType: String) {
    guard let contact = contactFromType(contactType, name: name) else { return }
    zello.startVoiceMessage(contact: contact)
  }

  @objc public func stopVoiceMessage() {
    zello.stopVoiceMessage()
  }

  @objc public func sendImage(_ name: String, contactType: String, data: [Int]) {
    guard let contact = contactFromType(contactType, name: name) else { return }
    let byteArray = data.map { UInt8($0) }
    let imageData = Data(byteArray)
    guard let image = UIImage(data: imageData) else { return }
    zello.send(image, to: contact)
  }

  @objc public func sendLocation(_ name: String, contactType: String) {
    guard let contact = contactFromType(contactType, name: name) else { return }
    zello.sendLocation(to: contact)
  }

  @objc public func sendText(_ name: String, contactType: String, text: String) {
    guard let contact = contactFromType(contactType, name: name) else { return }
    zello.send(textMessage: text, to: contact)
  }

  @objc public func sendAlert(_ name: String, contactType: String, text: String, level: String?) {
    guard let contact = contactFromType(contactType, name: name) else { return }
    var alertLevel: ZelloAlertMessage.ChannelLevel? = nil
    if contact.isZelloChannel || contact.isZelloGroupConversation {
      switch level {
      case "all":
        alertLevel = .all
      case "connected":
        alertLevel = .connected
      default:
        return
      }
    }
    zello.send(alertMessage: text, to: contact, using: alertLevel)
  }

  @objc public func connectChannel(_ name: String) {
    guard let channel = zello.channel(named: name) else { return }
    zello.connect(to: channel)
  }

  @objc public func disconnectChannel(_ name: String) {
    guard let channel = zello.channel(named: name) else { return }
    zello.disconnect(from: channel)
  }

  @objc public func connectGroupConversation(_ name: String) {
    guard let conversation = zello.conversation(named: name) else { return }
    zello.connect(to: conversation)
  }

  @objc public func disconnectGroupConversation(_ name: String) {
    guard let conversation = zello.conversation(named: name) else { return }
    zello.disconnect(from: conversation)
  }

  @objc public func submitProblemReport() {
    zello.submitReport()
  }

  @objc public func muteContact(_ name: String, contactType: String) {
    guard let contact = contactFromType(contactType, name: name) else { return }
    zello.muteContact(contact: contact)
  }

  @objc public func unmuteContact(_ name: String, contactType: String) {
    guard let contact = contactFromType(contactType, name: name) else { return }
    zello.unmuteContact(contact: contact)
  }

  @objc public func startEmergency() {
    zello.startEmergency()
  }

  @objc public func stopEmergency() {
    DispatchQueue.main.async { [weak self] in
      self?.zello.stopEmergency()
    }
  }

  @objc public func getHistory(
    _ name: String,
    contactType: String,
    maxMessages: Int,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let contact = contactFromType(contactType, name: name) else {
      resolve([])
      return
    }
    let messages = zello.getHistory(contact: contact, maxMessages: maxMessages)
    resolve(messages.compactMap { message in
      if let message = message as? ZelloHistoryVoiceMessage {
        return message.jsonDictionary
      } else if let message = message as? ZelloHistoryImageMessage {
        return message.jsonDictionary
      } else if let message = message as? ZelloHistoryTextMessage {
        return message.jsonDictionary
      } else if let message = message as? ZelloHistoryAlertMessage {
        return message.jsonDictionary
      } else if let message = message as? ZelloHistoryLocationMessage {
        return message.jsonDictionary
      }
      return nil
    })
  }

  @objc public func playHistoryMessage(_ historyId: String, contactName: String, contactType: String) {
    guard
      let contact = contactFromType(contactType, name: contactName),
      let message = zello.getHistoryMessage(historyId, contact: contact) as? ZelloHistoryVoiceMessage
    else {
      return
    }
    zello.playHistoryMessage(message)
  }

  @objc public func stopHistoryMessagePlayback() {
    zello.stopHistoryMessagePlayback()
  }

  @objc public func getHistoryImageData(
    _ historyId: String,
    contactName: String,
    contactType: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard
      let contact = contactFromType(contactType, name: contactName),
      let message = zello.getHistoryMessage(historyId, contact: contact) as? ZelloHistoryImageMessage,
      let image = zello.loadHistoryImage(for: message),
      let base64String = image.base64String
    else {
      resolve(nil)
      return
    }
    resolve(base64String)
  }

  @objc public func endDispatchCall(_ channelName: String) {
    guard
      let dispatchChannel = zello.channel(named: channelName),
      let call = dispatchChannel.dispatchInfo?.currentCall
    else {
      return
    }
    zello.end(call, on: dispatchChannel)
  }

  @objc public func createGroupConversation(_ usernames: [Any], displayName: String?) {
    let users = usernames.compactMap { username in zello.user(named: username as? String ?? "") }
    zello.createGroupConversation(users: users, displayName: displayName)
  }

  @objc public func addUsersToGroupConversation(_ conversationName: String, usernames: [Any]) {
    guard let conversation = zello.conversation(named: conversationName) else { return }
    let users = usernames.compactMap { username in zello.user(named: username as? String ?? "") }
    zello.add(users, to: conversation)
  }

  @objc public func leaveGroupConversation(_ conversationName: String) {
    guard let conversation = zello.conversation(named: conversationName) else { return }
    zello.leave(conversation)
  }

  @objc public func renameGroupConversation(_ conversationName: String, newName: String) {
    guard let conversation = zello.conversation(named: conversationName) else { return }
    zello.rename(conversation, to: newName)
  }

  // MARK: - Helpers

  private func contactFromType(_ type: String, name: String) -> ZelloContact? {
    if type == "user" {
      guard let user = zello.user(named: name) else { return nil }
      return ZelloContact.user(user)
    } else if type == "channel" || type == "dispatchChannel" {
      guard let channel = zello.channel(named: name) else { return nil }
      return ZelloContact.channel(channel)
    } else if type == "groupConversation" {
      guard let conversation = zello.conversation(named: name) else { return nil }
      return ZelloContact.conversation(conversation)
    }
    return nil
  }
}
