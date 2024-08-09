import ZelloSDK

extension ZelloOutgoingEmergency {
  var jsonDictionary: [AnyHashable: Any] {
    var body: [AnyHashable: Any] = [
      "channel": channel.jsonDictionary,
      "startTimestamp": startTimestamp.bridgeTimestamp
    ]
    if let endTimestamp {
      body["endTimestamp"] = endTimestamp.bridgeTimestamp
    }
    return body
  }
}
