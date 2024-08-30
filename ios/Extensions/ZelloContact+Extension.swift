import ZelloSDK

extension ZelloContact {
  var jsonDictionary: [AnyHashable: Any] {
    if let user = self.asZelloUser() {
      return user.jsonDictionary
    } else if let channel = self.asZelloChannel() {
      return channel.jsonDictionary
    }
    return [:]
  }
}

extension ZelloChannel {
  var jsonDictionary: [AnyHashable: Any] {
    var body: [AnyHashable: Any] = [
      "name": name,
      "isChannel": true,
      "isMuted": isMuted,
      "isConnected": status == .connected,
      "isConnecting": status == .connecting,
      "usersOnline": usersOnline,
      "options": [
        "noDisconnect": channelOptions.noDisconnect,
        "hidePowerButton": channelOptions.hidePowerButton,
        "listenOnly": channelOptions.listenOnly,
        "allowAlerts": channelOptions.allowAlerts,
        "allowTextMessages": channelOptions.allowTextMessages,
        "allowLocations": channelOptions.allowLocations
      ],
      "isDispatchChannel": dispatchInfo != nil
    ]
    if let currentCall = dispatchInfo?.currentCall {
      body["currentCall"] = currentCall.jsonDictionary
    }
    return body
  }
}

extension ZelloUser {
  var jsonDictionary: [AnyHashable: Any] {
    var body: [AnyHashable: Any] = [
      "name": name,
      "isChannel": false,
      "isMuted": isMuted,
      "displayName": displayName,
      "status": status.rawValue.lowercased()
    ]
    if let url = profilePictureURL?.absoluteString {
      body["profilePictureUrl"] = url
    }
    if let url = profilePictureThumbnailURL?.absoluteString {
      body["profilePictureThumbnailUrl"] = url
    }
    body["supportedFeatures"] = [
      "groupConversations": supportedFeatures.groupConversations
    ]
    return body
  }
}

extension ZelloGroupConversation {
  var jsonDictionary: [AnyHashable: Any] {
    var body: [AnyHashable: Any] = [
      "name": name,
      "isChannel": true,
      "isMuted": isMuted,
      "isConnected": status == .connected,
      "isConnecting": status == .connecting,
      "usersOnline": onlineUsers.count,
      "options": [
        "noDisconnect": false,
        "hidePowerButton": false,
        "listenOnly": false,
        "allowAlerts": true,
        "allowTextMessages": true,
        "allowLocations": true
      ],
      "isGroupConversation": true,
      "displayName": displayName,
      "users": users.map { user in user.jsonDictionary },
      "onlineUsers": onlineUsers.map { user in user.jsonDictionary }
    ]
    return body
  }
}

extension ZelloGroupConversationUser {
  var jsonDictionary: [AnyHashable: Any] {
    var body: [AnyHashable: Any] = [
      "name": name,
      "displayName": displayName
    ]
    return body
  }
}

extension ZelloChannel.User {
  var jsonDictionary: [AnyHashable: Any] {
    var body: [AnyHashable: Any] = [
      "name": name,
      "displayName": displayName
    ]
    return body
  }
}
