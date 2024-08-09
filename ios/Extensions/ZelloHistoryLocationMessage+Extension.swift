import ZelloSDK

extension ZelloHistoryLocationMessage {
  var jsonDictionary: [AnyHashable: Any] {
    var body: [AnyHashable: Any] = [
      "contact": contact.jsonDictionary,
      "type": "location",
      "historyId": historyId,
      "timestamp": timestamp.bridgeTimestamp,
      "incoming": incoming,
      "latitude": location.coordinate.latitude,
      "longitude": location.coordinate.longitude,
      "accuracy": location.horizontalAccuracy
    ]
    if let address = address {
      body["address"] = address
    }
    if let channelUserName = channelUser?.name {
      body["channelUserName"] = channelUserName
    }
    return body
  }
}
