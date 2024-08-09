import ZelloSDK

extension ZelloRecentEntry {
  var jsonDictionary: [AnyHashable: Any] {
    var body: [AnyHashable: Any] = [
      "contact": contact.jsonDictionary,
      "type": type.rawValue,
      "timestamp": timestamp.bridgeTimestamp,
      "incoming": incoming
    ]
    if let channelUserName = channelUser?.name {
      body["channelUserName"] = channelUserName
    }
    return body
  }
}
