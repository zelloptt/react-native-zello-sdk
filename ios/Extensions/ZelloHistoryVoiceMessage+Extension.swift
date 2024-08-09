import ZelloSDK

extension ZelloHistoryVoiceMessage {
  var jsonDictionary: [AnyHashable: Any] {
    var body: [AnyHashable: Any] = [
      "contact": contact.jsonDictionary,
      "type": "voice",
      "historyId": historyId,
      "timestamp": timestamp.bridgeTimestamp,
      "incoming": incoming,
      "durationMs": duration * 1000
    ]
    if let channelUserName = channelUser?.name {
      body["channelUserName"] = channelUserName
    }
    return body
  }
}
