import ZelloSDK

extension ZelloHistoryAlertMessage {
  var jsonDictionary: [AnyHashable: Any] {
    var body: [AnyHashable: Any] = [
      "contact": contact.jsonDictionary,
      "type": "alert",
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
