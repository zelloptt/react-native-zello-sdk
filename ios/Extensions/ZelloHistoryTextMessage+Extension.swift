import ZelloSDK

extension ZelloHistoryTextMessage {
  var jsonDictionary: [AnyHashable: Any] {
    var body: [AnyHashable: Any] = [
      "contact": contact.jsonDictionary,
      "type": "text",
      "historyId": historyId,
      "timestamp": timestamp.bridgeTimestamp,
      "incoming": incoming,
      "text": text
    ]
    if let channelUserName = channelUser?.name {
      body["channelUserName"] = channelUserName
    }
    return body
  }
}
