import ZelloSDK

extension ZelloHistoryImageMessage {
  var jsonDictionary: [AnyHashable: Any] {
    var body: [AnyHashable: Any] = [
      "contact": contact.jsonDictionary,
      "type": "image",
      "historyId": historyId,
      "timestamp": timestamp.bridgeTimestamp,
      "incoming": incoming
    ]
    if let channelUserName = channelUser?.name {
      body["channelUserName"] = channelUserName
    }
    return body
  }
}
