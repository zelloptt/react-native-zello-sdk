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
    return [
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
      ]
    ]
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
    return body
  }
}
