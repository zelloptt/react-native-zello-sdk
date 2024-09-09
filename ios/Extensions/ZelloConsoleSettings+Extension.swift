import ZelloSDK

extension ZelloConsoleSettings {
  var jsonDictionary: [AnyHashable: Any] {
    return [
      "allowNonDispatchersToEndCalls": allowsNonDispatchersToEndCalls,
      "allowImageMessages": allowsImageMessages,
      "allowLocationMessages": allowsLocationMessages,
      "allowTextMessages": allowsTextMessages,
      "allowAlertMessages": allowsAlertMessages,
    ]
  }
}
