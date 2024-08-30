import ZelloSDK

extension ZelloIOSSdkModule: Zello.Delegate {
  func zelloDidStartConnecting(_ zello: Zello) {
    sendSdkEvent(withName: "onConnectStarted", body: nil)
  }

  func zelloDidFinishConnecting(_ zello: Zello) {
    sendSdkEvent(withName: "onConnectSucceeded", body: nil)
  }

  func zelloDidDisconnect(_ zello: Zello) {
    sendSdkEvent(withName: "onDisconnected", body: nil)
  }

  func zelloWillReconnect(_ zello: Zello) {
    sendSdkEvent(withName: "onWillReconnect", body: nil)
  }

  func zelloDidUpdateContactList(_ zello: Zello) {
    let users = zello.users.map { ZelloContact.user($0).jsonDictionary }
    let channels = zello.channels.map { ZelloContact.channel($0).jsonDictionary }
    let groupConversations = zello.groupConversations.map { ZelloContact.conversation($0).jsonDictionary }
    var body: [AnyHashable: Any] = [
      "users": users,
      "channels": channels,
      "groupConversations": groupConversations
    ]
    if let emergencyChannel = zello.emergencyChannel {
      body["emergencyChannel"] = emergencyChannel.jsonDictionary
    }
    sendSdkEvent(withName: "onContactListUpdated", body: body)
  }

  func zello(_ zello: Zello, accountStatusChangedTo newStatus: ZelloAccountStatus?) {
    if let newStatus = newStatus?.rawValue.lowercased() {
      sendSdkEvent(withName: "onAccountStatusChanged", body: ["status": newStatus])
    }
  }

  func zello(_ zello: Zello, didFailToConnect error: Zello.ConnectionError) {
    sendSdkEvent(withName: "onConnectFailed", body: ["error": error.rawValue])
  }

  func zello(_ zello: Zello, didUpdateSelectedContact contact: ZelloContact) {
    sendSdkEvent(withName: "onSelectedContactChanged", body: ["contact": contact.jsonDictionary])
  }

  func zello(_ zello: Zello, didStartConnecting outgoingVoiceMessage: ZelloOutgoingVoiceMessage) {
    sendSdkEvent(withName: "onOutgoingVoiceMessageConnecting",
                 body: [
                  "contact": outgoingVoiceMessage.contact.jsonDictionary,
                  "state": outgoingVoiceMessage.state,
                  "timestamp": outgoingVoiceMessage.timestamp.bridgeTimestamp
                 ])
  }

  func zello(_ zello: Zello, didStartSending outgoingVoiceMessage: ZelloOutgoingVoiceMessage) {
    sendSdkEvent(withName: "onOutgoingVoiceMessageStarted",
                 body: [
                  "contact": outgoingVoiceMessage.contact.jsonDictionary,
                  "state": outgoingVoiceMessage.state,
                  "timestamp": outgoingVoiceMessage.timestamp.bridgeTimestamp
                 ])
  }

  func zello(_ zello: Zello, didFinishSending outgoingVoiceMessage: ZelloOutgoingVoiceMessage, error: ZelloOutgoingVoiceMessage.Error?) {
    var body: [AnyHashable: Any] = [
      "contact": outgoingVoiceMessage.contact.jsonDictionary,
      "state": outgoingVoiceMessage.state,
      "timestamp": outgoingVoiceMessage.timestamp.bridgeTimestamp
     ]
    if let error {
      body["error"] = error.rawValue
    }
    sendSdkEvent(withName: "onOutgoingVoiceMessageStopped", body: body)
  }

  func zello(_ zello: Zello, didStartReceiving incomingVoiceMessage: ZelloIncomingVoiceMessage) {
    var body: [AnyHashable: Any] = [
      "contact": incomingVoiceMessage.contact.jsonDictionary,
      "timestamp": incomingVoiceMessage.timestamp.bridgeTimestamp
    ]
    if let channelUser = incomingVoiceMessage.channelUser {
      body["channelUser"] = channelUser.jsonDictionary
    }
    sendSdkEvent(withName: "onIncomingVoiceMessageStarted", body: body)
  }

  func zello(_ zello: Zello, didFinishReceiving incomingVoiceMessage: ZelloIncomingVoiceMessage) {
    var body: [AnyHashable: Any] = [
      "contact": incomingVoiceMessage.contact.jsonDictionary,
      "timestamp": incomingVoiceMessage.timestamp.bridgeTimestamp
    ]
    if let channelUser = incomingVoiceMessage.channelUser {
      body["channelUser"] = channelUser.jsonDictionary
    }
    sendSdkEvent(withName: "onIncomingVoiceMessageStopped", body: body)
  }

  func zello(_ zello: Zello, didReceive textMessage: ZelloTextMessage) {
    var body: [AnyHashable: Any] = [
      "contact": textMessage.contact.jsonDictionary,
      "text": textMessage.text,
      "timestamp": textMessage.timestamp.bridgeTimestamp
    ]
    if let channelUser = textMessage.channelUser {
      body["channelUser"] = channelUser.jsonDictionary
    }
    sendSdkEvent(withName: "onIncomingTextMessage", body: body)
  }

  func zello(_ zello: Zello, didSend textMessage: ZelloTextMessage) {
    let body: [AnyHashable: Any] = [
      "contact": textMessage.contact.jsonDictionary,
      "text": textMessage.text,
      "timestamp": textMessage.timestamp.bridgeTimestamp
    ]
    sendSdkEvent(withName: "onOutgoingTextMessageSent", body: body)
  }

  func zello(_ zello: Zello, didFailToSend textMessage: ZelloTextMessage) {
    let body: [AnyHashable: Any] = [
      "contact": textMessage.contact.jsonDictionary,
      "text": textMessage.text,
      "timestamp": textMessage.timestamp.bridgeTimestamp
    ]
    sendSdkEvent(withName: "onOutgoingTextMessageSendFailed", body: body)
  }

  func zello(_ zello: Zello, didReceive imageMessage: ZelloImageMessage) {
    var body: [AnyHashable: Any] = [
      "contact": imageMessage.contact.jsonDictionary,
      "timestamp": imageMessage.timestamp.bridgeTimestamp
    ]

    if let channelUser = imageMessage.channelUser {
      body["channelUser"] = channelUser.jsonDictionary
    }

    body["image"] = imageMessage.image.base64String
    body["thumbnail"] = imageMessage.thumbnail.base64String

    sendSdkEvent(withName: "onIncomingImageMessage", body: body)
  }

  func zello(_ zello: Zello, didSend imageMessage: ZelloImageMessage) {
    var body: [AnyHashable: Any] = [
      "contact": imageMessage.contact.jsonDictionary,
      "timestamp": imageMessage.timestamp.bridgeTimestamp
    ]

    body["image"] = imageMessage.image.base64String
    body["thumbnail"] = imageMessage.thumbnail.base64String

    sendSdkEvent(withName: "onOutgoingImageMessageSent", body: body)
  }

  func zello(_ zello: Zello, didFailToSend imageMessage: ZelloImageMessage) {
    let body: [AnyHashable: Any] = [
      "contact": imageMessage.contact.jsonDictionary,
      "timestamp": imageMessage.timestamp.bridgeTimestamp
    ]
    sendSdkEvent(withName: "onOutgoingImageMessageSendFailed", body: body)
  }

  func zello(_ zello: Zello, didReceive locationMessage: ZelloLocationMessage) {
    var body: [AnyHashable: Any] = [
      "contact": locationMessage.contact.jsonDictionary,
      "timestamp": locationMessage.timestamp.bridgeTimestamp,
      "latitude": locationMessage.location.coordinate.latitude,
      "longitude": locationMessage.location.coordinate.longitude,
      "accuracy": locationMessage.location.horizontalAccuracy,
    ]
    if let channelUser = locationMessage.channelUser {
      body["channelUser"] = channelUser.jsonDictionary
    }
    if let address = locationMessage.address {
      body["address"] = address
    }
    sendSdkEvent(withName: "onIncomingLocationMessage", body: body)
  }

  func zello(_ zello: Zello, didReceive alertMessage: ZelloAlertMessage) {
    var body: [AnyHashable: Any] = [
      "contact": alertMessage.contact.jsonDictionary,
      "text": alertMessage.text,
      "timestamp": alertMessage.timestamp.bridgeTimestamp
    ]
    if let channelUser = alertMessage.channelUser {
      body["channelUser"] = channelUser.jsonDictionary
    }
    sendSdkEvent(withName: "onIncomingAlertMessage", body: body)
  }

  func zello(_ zello: Zello, didSend locationMessage: ZelloLocationMessage) {
    var body: [AnyHashable: Any] = [
      "contact": locationMessage.contact.jsonDictionary,
      "timestamp": locationMessage.timestamp.bridgeTimestamp,
      "latitude": locationMessage.location.coordinate.latitude,
      "longitude": locationMessage.location.coordinate.longitude,
      "accuracy": locationMessage.location.horizontalAccuracy,
    ]
    if let address = locationMessage.address {
      body["address"] = address
    }
    sendSdkEvent(withName: "onOutgoingLocationMessageSent", body: body)
  }

  func zello(_ zello: Zello, didFailToSend locationMessage: ZelloLocationMessage) {
    let body: [AnyHashable: Any] = [
      "contact": locationMessage.contact.jsonDictionary,
      "timestamp": locationMessage.timestamp.bridgeTimestamp,
      "latitude": locationMessage.location.coordinate.latitude,
      "longitude": locationMessage.location.coordinate.longitude,
      "accuracy": locationMessage.location.horizontalAccuracy,
    ]
    sendSdkEvent(withName: "onOutgoingLocationMessageSendFailed", body: body)
  }

  func zello(_ zello: Zello, didSend alertMessage: ZelloAlertMessage) {
    let body: [AnyHashable: Any] = [
      "contact": alertMessage.contact.jsonDictionary,
      "text": alertMessage.text,
      "timestamp": alertMessage.timestamp.bridgeTimestamp
    ]
    sendSdkEvent(withName: "onOutgoingAlertMessageSent", body: body)
  }

  func zello(_ zello: Zello, didFailToSend alertMessage: ZelloAlertMessage) {
    let body: [AnyHashable: Any] = [
      "contact": alertMessage.contact.jsonDictionary,
      "text": alertMessage.text,
      "timestamp": alertMessage.timestamp.bridgeTimestamp
    ]
    sendSdkEvent(withName: "onOutgoingAlertMessageSendFailed", body: body)
  }

  func zello(_ zello: Zello, didStart outgoingEmergency: ZelloOutgoingEmergency) {
    sendSdkEvent(withName: "onOutgoingEmergencyStarted", body: outgoingEmergency.jsonDictionary)
  }

  func zello(_ zello: Zello, didStop outgoingEmergency: ZelloOutgoingEmergency) {
    sendSdkEvent(withName: "onOutgoingEmergencyStopped", body: outgoingEmergency.jsonDictionary)
  }

  func zello(_ zello: Zello, didStart incomingEmergency: ZelloIncomingEmergency) {
    let body: [AnyHashable: Any] = [
      "emergency": incomingEmergency.jsonDictionary,
      "emergencies": zello.incomingEmergencies.map { emergency in
        emergency.jsonDictionary
      }
    ]
    sendSdkEvent(withName: "onIncomingEmergencyStarted", body: body)
  }

  func zello(_ zello: Zello, didStop incomingEmergency: ZelloIncomingEmergency) {
    let body: [AnyHashable: Any] = [
      "emergency": incomingEmergency.jsonDictionary,
      "emergencies": zello.incomingEmergencies.map { emergency in
        emergency.jsonDictionary
      }
    ]
    sendSdkEvent(withName: "onIncomingEmergencyStopped", body: body)
  }

  func zello(_ zello: Zello, didUpdate recentEntries: [ZelloRecentEntry]) {
    let body: [AnyHashable: Any] = [
      "recents": recentEntries.map { recent in
        recent.jsonDictionary
      }
    ]
    sendSdkEvent(withName: "onRecentsUpdated", body: body)
  }

  func zelloDidUpdateHistory(_ zello: Zello) {
    sendSdkEvent(withName: "onHistoryUpdated", body: nil)
  }

  func zello(_ zello: Zello, didStartHistoryPlayback message: ZelloHistoryVoiceMessage) {
    sendSdkEvent(withName: "onHistoryPlaybackStarted", body: message.jsonDictionary)
  }

  func zello(_ zello: Zello, didFinishHistoryPlayback message: ZelloHistoryVoiceMessage) {
    sendSdkEvent(withName: "onHistoryPlaybackStopped", body: message.jsonDictionary)
  }

  func zello(_ zello: Zello, callDidBecomePending call: ZelloDispatchCall, on channel: ZelloChannel) {
    let body: [AnyHashable: Any] = [
      "call": call.jsonDictionary,
      "channel": channel.jsonDictionary
    ]
    sendSdkEvent(withName: "onDispatchCallPending", body: body)
  }

  func zello(_ zello: Zello, callDidEnd call: ZelloDispatchCall, on channel: ZelloChannel) {
    let body: [AnyHashable: Any] = [
      "call": call.jsonDictionary,
      "channel": channel.jsonDictionary
    ]
    sendSdkEvent(withName: "onDispatchCallEnded", body: body)
  }

  func zello(_ zello: Zello, callDidBecomeActive call: ZelloDispatchCall, on channel: ZelloChannel) {
    let body: [AnyHashable: Any] = [
      "call": call.jsonDictionary,
      "channel": channel.jsonDictionary
    ]
    sendSdkEvent(withName: "onDispatchCallActive", body: body)
  }

  func zello(_ zello: Zello, callDidTransfer call: ZelloDispatchCall, on channel: ZelloChannel, toDispatcherNamed dispatcher: String) {
    let body: [AnyHashable: Any] = [
      "call": call.jsonDictionary,
      "channel": channel.jsonDictionary
    ]
    sendSdkEvent(withName: "onDispatchCallTransferred", body: body)
  }

  func zello(_ zello: Zello, didUpdate consoleSettings: ZelloConsoleSettings) {
    sendSdkEvent(withName: "onConsoleSettingsChanged", body: consoleSettings.jsonDictionary)
  }

  func zello(_ zello: Zello, didJoin conversation: ZelloGroupConversation) {
    sendSdkEvent(withName: "onGroupConversationInvite", body: ["conversation": conversation.jsonDictionary])
  }

  func zello(_ zello: Zello, didLeave conversation: ZelloGroupConversation) {
    sendSdkEvent(withName: "onGroupConversationLeft", body: ["conversation": conversation.jsonDictionary])
  }

  func zello(_ zello: Zello, didCreate conversation: ZelloGroupConversation) {
    sendSdkEvent(withName: "onGroupConversationCreated", body: ["conversation": conversation.jsonDictionary])
  }

  func zello(_ zello: Zello, didRename conversation: ZelloGroupConversation) {
    sendSdkEvent(withName: "onGroupConversationRenamed", body: ["conversation": conversation.jsonDictionary])
  }

  func zello(_ zello: Zello, didAdd users: [ZelloGroupConversationUser], to conversation: ZelloGroupConversation) {
    let body: [AnyHashable: Any] = [
      "conversation": conversation.jsonDictionary,
      "users": users.map { user in user.jsonDictionary }
    ]
    sendSdkEvent(withName: "onGroupConversationUsersAdded", body: body)
  }

  func zello(_ zello: Zello, didRemove users: [ZelloGroupConversationUser], from conversation: ZelloGroupConversation) {
    let body: [AnyHashable: Any] = [
      "conversation": conversation.jsonDictionary,
      "users": users.map { user in user.jsonDictionary }
    ]
    sendSdkEvent(withName: "onGroupConversationUsersLeft", body: body)
  }

}
