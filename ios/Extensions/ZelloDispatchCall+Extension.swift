import ZelloSDK

extension ZelloDispatchCall {
  var jsonDictionary: [AnyHashable: Any] {
    var body: [AnyHashable: Any] = [
      "status": status.rawValue,
    ]
    if let dispatcher = dispatcher {
      body["dispatcher"] = dispatcher
    }
    return body
  }
}
