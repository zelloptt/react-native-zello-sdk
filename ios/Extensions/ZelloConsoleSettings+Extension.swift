import ZelloSDK

extension ZelloConsoleSettings {
  var jsonDictionary: [AnyHashable: Any] {
    return [
      "allowNonDispatchersToEndCalls": allowsNonDispatchersToEndCalls,
      "allowGroupConversations": allowGroupConversations
    ]
  }
}
