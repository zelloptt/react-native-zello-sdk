import ZelloSDK

@objc(ZelloIOSSdkModule) class ZelloIOSSdkModule: RCTEventEmitter {

  private let bridgeEventName = "zellosdk"
  private let eventName = "eventName"

  let zello = Zello.shared

  override init() {
    super.init()
    zello.delegate = self
  }

  @objc func configure(_ isDebugBuild: Bool, appGroup: String) {
    var group: String? = appGroup
    if appGroup.isEmpty {
      group = nil
    }
    var configuration = ZelloConfiguration(appGroup: group)
    configuration.pushNotificationEnvironment = isDebugBuild ? .development : .production
  }

  @objc func connect(_ network: String, username: String, password: String) {
    zello.connect(credentials: ZelloCredentials(username: username, network: network, password: password))
  }

  @objc func disconnect() {
    zello.disconnect()
  }

  @objc func setAccountStatus(_ status: String) {
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

  @objc func selectContact(_ name: String, isChannel: Bool) {
    guard let contact = isChannel ? zello.channel(named: name).map(ZelloContact.channel) : zello.user(named: name).map(ZelloContact.user) else {
      return
    }
    zello.setSelectedContact(contact: contact)
  }

  @objc func startVoiceMessage(_ name: String, isChannel: Bool) {
    guard let contact = isChannel ? zello.channel(named: name).map(ZelloContact.channel) : zello.user(named: name).map(ZelloContact.user) else {
      return
    }
    zello.startVoiceMessage(contact: contact)
  }

  @objc func stopVoiceMessage() {
    zello.stopVoiceMessage()
  }

  @objc func sendImage(_ name: String, isChannel: Bool, data: [Int]) {
    guard let contact = isChannel ? zello.channel(named: name).map(ZelloContact.channel) : zello.user(named: name).map(ZelloContact.user) else {
      return
    }
    let byteArray = data.map { UInt8($0) }
    let imageData = Data(byteArray)
    guard let image = UIImage(data: imageData) else {
      return
    }
    zello.send(image, to: contact)
  }

  @objc func sendLocation(_ name: String, isChannel: Bool) {
    guard let contact = isChannel ? zello.channel(named: name).map(ZelloContact.channel) : zello.user(named: name).map(ZelloContact.user) else {
      return
    }
    zello.sendLocation(to: contact)
  }

  @objc func sendText(_ name: String, isChannel: Bool, text: String) {
    guard let contact = isChannel ? zello.channel(named: name).map(ZelloContact.channel) : zello.user(named: name).map(ZelloContact.user) else {
      return
    }
    zello.send(textMessage: text, to: contact)
  }

  @objc func sendAlert(_ name: String, isChannel: Bool, text: String, level: String?) {
    guard let contact = isChannel ? zello.channel(named: name).map(ZelloContact.channel) : zello.user(named: name).map(ZelloContact.user) else {
      return
    }
    var alertLevel: ZelloAlertMessage.ChannelLevel? = nil
    if isChannel {
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

  @objc func connectChannel(_ name: String) {
    guard let channel = zello.channel(named: name) else {
      return
    }
    zello.connect(to: channel)
  }

  @objc func disconnectChannel(_ name: String) {
    guard let channel = zello.channel(named: name) else {
      return
    }
    zello.disconnect(from: channel)
  }

  @objc func connectGroupConversation(_ name: String) {
    guard let conversation = zello.conversation(named: name) else {
      return
    }
    zello.connect(to: conversation)
  }

  @objc func disconnectGroupConversation(_ name: String) {
    guard let conversation = zello.conversation(named: name) else {
      return
    }
    zello.disconnect(from: conversation)
  }

  @objc func submitProblemReport() {
    zello.submitReport()
  }

  @objc func muteContact(_ name: String, isChannel: Bool) {
    guard let contact = isChannel ? zello.channel(named: name).map(ZelloContact.channel) : zello.user(named: name).map(ZelloContact.user) else {
      return
    }
    zello.muteContact(contact: contact)
  }

  @objc func unmuteContact(_ name: String, isChannel: Bool) {
    guard let contact = isChannel ? zello.channel(named: name).map(ZelloContact.channel) : zello.user(named: name).map(ZelloContact.user) else {
      return
    }
    zello.unmuteContact(contact: contact)
  }

  @objc func startEmergency() {
    zello.startEmergency()
  }

  @objc func stopEmergency() {
    DispatchQueue.main.async { [weak self] in
      self?.zello.stopEmergency()
    }
  }

  @objc func getHistory(_ name: String, isChannel: Bool, maxMessages: Int, callback: RCTResponseSenderBlock) {
    guard let contact = isChannel ? zello.channel(named: name).map(ZelloContact.channel) : zello.user(named: name).map(ZelloContact.user) else {
      callback(nil)
      return
    }
    let messages = zello.getHistory(contact: contact, maxMessages: maxMessages)
    callback([messages.compactMap { message in
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
    }])
  }

  @objc func playHistoryMessage(_ historyId: String, contactName: String, isChannel: Bool) {
    guard
      let contact = isChannel ? zello.channel(named: contactName).map(ZelloContact.channel) : zello.user(named: contactName).map(ZelloContact.user),
      let message = zello.getHistoryMessage(historyId, contact: contact) as? ZelloHistoryVoiceMessage
    else {
      return
    }
    zello.playHistoryMessage(message)
  }

  @objc func stopHistoryMessagePlayback() {
    zello.stopHistoryMessagePlayback()
  }

  @objc func getHistoryImageData(_ historyId: String, contactName: String, isChannel: Bool, callback: RCTResponseSenderBlock) {
    guard
      let contact = isChannel ? zello.channel(named: contactName).map(ZelloContact.channel) : zello.user(named: contactName).map(ZelloContact.user),
      let message = zello.getHistoryMessage(historyId, contact: contact) as? ZelloHistoryImageMessage,
      let image = zello.loadHistoryImage(for: message),
      let base64String = image.base64String
    else {
      callback(nil)
      return
    }
    callback([base64String])
  }

  @objc func endDispatchCall(_ channelName: String) {
    guard
      let dispatchChannel = zello.channel(named: channelName),
      let call = dispatchChannel.dispatchInfo?.currentCall
    else {
      return
    }
    zello.end(call, on: dispatchChannel)
  }

  @objc func createGroupConversation(_ usernames: [Any], displayName: String?) {
    let users = usernames.compactMap { username in zello.user(named: username as? String ?? "") }
    zello.createGroupConversation(users: users, displayName: displayName)
  }

  @objc func addUsersToGroupConversation(_ conversationName: String, usernames: [Any]) {
    guard let conversation = zello.conversation(named: conversationName) else {
      return
    }
    let users = usernames.compactMap { username in zello.user(named: username as? String ?? "") }
    zello.add(users, to: conversation)
  }

  @objc func leaveGroupConversation(_ conversationName: String) {
    guard let conversation = zello.conversation(named: conversationName) else {
      return
    }
    zello.leave(conversation)
  }

  @objc func renameGroupConversation(_ conversationName: String, newName: String) {
    guard let conversation = zello.conversation(named: conversationName) else {
      return
    }
    zello.rename(conversation, to: newName)
  }
}

extension ZelloIOSSdkModule {
  func sendSdkEvent(withName name: String, body: [AnyHashable: Any]?) {
    var eventBody = body ?? [:]
    eventBody[eventName] = name
    sendEvent(withName: bridgeEventName, body: eventBody)
  }

  override func supportedEvents() -> [String]! {
    return [bridgeEventName]
  }

  override class func requiresMainQueueSetup() -> Bool {
    return true
  }
}

