import ZelloSDK

extension ZelloIncomingEmergency {
  var jsonDictionary: [AnyHashable: Any] {
    var body: [AnyHashable: Any] = [
      "channel": channel.jsonDictionary,
      "channelUserName": channelUser.name,
      "emergencyId": id,
      "startTimestamp": startTimestamp.bridgeTimestamp
    ]
    if let endTimestamp {
      body["endTimestamp"] = endTimestamp.bridgeTimestamp
    }
    return body
  }
}
