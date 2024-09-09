export enum ZelloEvent {
  /**
   * The connection to the Zello Work network has failed.
   * {@link sdk.Zello.state | Zello.state} will be {@link types.ZelloConnectionState.Disconnected | ZelloConnectionState.Disconnected}.
   * @param {@link types.ZelloConnectionState | ZelloConnectionState} state The current state of the connection.
   * @param {@link types.ZelloConnectionError | ZelloConnectionError} error The error that caused the connection to fail.
   */
  CONNECT_FAILED = 'onConnectFailed',
  /**
   * The connection to the Zello Work network has started.
   * {@link sdk.Zello.state | Zello.state} will be {@link types.ZelloConnectionState.Connecting | ZelloConnectionState.Connecting}.
   * @param {@link types.ZelloConnectionState | ZelloConnectionState} state The current state of the connection.
   * */
  CONNECT_STARTED = 'onConnectStarted',
  /**
   * The connection to the Zello Work network has succeeded.
   * {@link sdk.Zello.state | Zello.state} will be {@link types.ZelloConnectionState.Connected | ZelloConnectionState.Connected}.
   * @param {@link types.ZelloConnectionState | ZelloConnectionState} state The current state of the connection.
   * */
  CONNECT_SUCCEEDED = 'onConnectSucceeded',
  /**
   * The connection to the Zello Work network has been disconnected.
   * {@link sdk.Zello.state | Zello.state} will be {@link types.ZelloConnectionState.Disconnected | ZelloConnectionState.Disconnected}.
   * @param {@link types.ZelloConnectionState | ZelloConnectionState} state The current state of the connection.
   */
  DISCONNECTED = 'onDisconnected',
  /**
   * The connection to the Zello Work network is attempting to reconnect.
   * {@link sdk.Zello.state | Zello.state} will be {@link types.ZelloConnectionState.Reconnecting | ZelloConnectionState.Reconnecting}.
   * @param {@link types.ZelloConnectionState | ZelloConnectionState} state The current state of the connection.
   */
  RECONNECTING = 'onWillReconnect',
  /**
   * The contact list has been updated.
   * {@link sdk.Zello.users | Zello.users} and {@link sdk.Zello.channels | Zello.channels} will be updated.
   * @param {@link types.ZelloUser | ZelloUser[]} users The list of users.
   * @param {@link types.ZelloChannel | ZelloChannel[]} channels The list of channels.
   */
  CONTACT_LIST_UPDATED = 'onContactListUpdated',
  /**
   * The selected contact has changed.
   * {@link sdk.Zello.selectedContact | Zello.selectedContact} will be updated.
   * @param {@link types.ZelloContact | ZelloContact} contact The selected contact.
   */
  SELECTED_CONTACT_CHANGED = 'onSelectedContactChanged',
  /**
   * The account status has changed.
   * {@link sdk.Zello.accountStatus | Zello.accountStatus} will be updated.
   * @param {@link types.ZelloAccountStatus | ZelloAccountStatus} status The current account status.
   */
  ACCOUNT_STATUS_CHANGED = 'onAccountStatusChanged',
  /**
   * An incoming voice message has started.
   * {@link sdk.Zello.incomingVoiceMessage | Zello.incomingVoiceMessage} will be updated.
   * @param {@link types.ZelloIncomingVoiceMessage | ZelloIncomingVoiceMessage} voiceMessage The incoming voice message.
   */
  INCOMING_VOICE_MESSAGE_STARTED = 'onIncomingVoiceMessageStarted',
  /**
   * An incoming voice message has stopped.
   * {@link sdk.Zello.incomingVoiceMessage | Zello.incomingVoiceMessage} will be set to undefined.
   * @param {@link types.ZelloIncomingVoiceMessage | ZelloIncomingVoiceMessage} voiceMessage The incoming voice message.
   */
  INCOMING_VOICE_MESSAGE_STOPPED = 'onIncomingVoiceMessageStopped',
  /**
   * An outgoing voice message is connecting.
   * {@link sdk.Zello.outgoingVoiceMessage | Zello.outgoingVoiceMessage} will be updated.
   * @param {@link types.ZelloOutgoingVoiceMessage | ZelloOutgoingVoiceMessage} voiceMessage The outgoing voice message.
   */
  OUTGOING_VOICE_MESSAGE_CONNECTING = 'onOutgoingVoiceMessageConnecting',
  /**
   * An outgoing voice message has started.
   * {@link sdk.Zello.outgoingVoiceMessage | Zello.outgoingVoiceMessage} will be updated.
   * @param {@link types.ZelloOutgoingVoiceMessage | ZelloOutgoingVoiceMessage} voiceMessage The outgoing voice message.
   */
  OUTGOING_VOICE_MESSAGE_STARTED = 'onOutgoingVoiceMessageStarted',
  /**
   * An outgoing voice message has stopped.
   * {@link sdk.Zello.outgoingVoiceMessage | Zello.outgoingVoiceMessage} will be set to undefined.
   * @param {@link types.ZelloOutgoingVoiceMessage | ZelloOutgoingVoiceMessage} voiceMessage The outgoing voice message.
   * @param {@link types.ZelloOutgoingVoiceMessageState} error Optional; An error that caused the outgoing voice message to stop.
   */
  OUTGOING_VOICE_MESSAGE_STOPPED = 'onOutgoingVoiceMessageStopped',
  /**
   * An incoming image message has been received.
   * @param {@link types.ZelloImageMessage | ZelloImageMessage} imageMessage The incoming image message.
   */
  INCOMING_IMAGE_MESSAGE_RECEIVED = 'onIncomingImageMessage',
  /**
   * An outgoing image message has been sent.
   * @param {@link types.ZelloImageMessage | ZelloImageMessage} imageMessage The outgoing image message.
   */
  OUTGOING_IMAGE_MESSAGE_SENT = 'onOutgoingImageMessageSent',
  /**
   * An outgoing image message has failed to send.
   * @param {@link types.ZelloImageMessage | ZelloImageMessage} imageMessage The outgoing image message.
   */
  OUTGOING_IMAGE_MESSAGE_SEND_FAILED = 'onOutgoingImageMessageSendFailed',
  /**
   * An incoming alert message has been received.
   * @param {@link types.ZelloAlertMessage | ZelloAlertMessage} alertMessage The incoming alert message.
   */
  INCOMING_ALERT_MESSAGE_RECEIVED = 'onIncomingAlertMessage',
  /**
   * An outgoing alert message has been sent.
   * @param {@link types.ZelloAlertMessage | ZelloAlertMessage} alertMessage The outgoing alert message.
   */
  OUTGOING_ALERT_MESSAGE_SENT = 'onOutgoingAlertMessageSent',
  /**
   * An outgoing alert message has failed to send.
   * @param {@link types.ZelloAlertMessage | ZelloAlertMessage} alertMessage The outgoing alert message.
   */
  OUTGOING_ALERT_MESSAGE_SEND_FAILED = 'onOutgoingAlertMessageSendFailed',
  /**
   * An incoming text message has been received.
   * @param {@link types.ZelloTextMessage | ZelloTextMessage} textMessage The incoming text message.
   */
  INCOMING_TEXT_MESSAGE_RECEIVED = 'onIncomingTextMessage',
  /**
   * An outgoing text message has been sent.
   * @param {@link types.ZelloTextMessage | ZelloTextMessage} textMessage The outgoing text message.
   */
  OUTGOING_TEXT_MESSAGE_SENT = 'onOutgoingTextMessageSent',
  /**
   * An outgoing text message has failed to send.
   * @param {@link types.ZelloTextMessage | ZelloTextMessage} textMessage The outgoing text message.
   */
  OUTGOING_TEXT_MESSAGE_SEND_FAILED = 'onOutgoingTextMessageSendFailed',
  /**
   * An incoming location message has been received.
   * @param {@link types.ZelloLocationMessage | ZelloLocationMessage} locationMessage The incoming location message.
   */
  INCOMING_LOCATION_MESSAGE_RECEIVED = 'onIncomingLocationMessage',
  /**
   * An outgoing location message has been sent.
   * @param {@link types.ZelloLocationMessage | ZelloLocationMessage} locationMessage The outgoing location message.
   */
  OUTGOING_LOCATION_MESSAGE_SENT = 'onOutgoingLocationMessageSent',
  /**
   * An outgoing location message has failed to send.
   * @param {@link types.ZelloLocationMessage | ZelloLocationMessage} locationMessage The outgoing location message.
   */
  OUTGOING_LOCATION_MESSAGE_SEND_FAILED = 'onOutgoingLocationMessageSendFailed',
  /**
   * An incoming emergency has started.
   * {@link sdk.Zello.incomingEmergencies | Zello.incomingEmergencies} will be updated.
   * @param {@link types.ZelloIncomingEmergency | ZelloIncomingEmergency} emergency The incoming emergency.
   * @param {@link types.ZelloIncomingEmergency | ZelloIncomingEmergency[]} emergencies The list of incoming emergencies.
   */
  INCOMING_EMERGENCY_STARTED = 'onIncomingEmergencyStarted',
  /**
   * An incoming emergency has stopped.
   * {@link sdk.Zello.incomingEmergencies | Zello.incomingEmergencies} will be updated.
   * @param {@link types.ZelloIncomingEmergency | ZelloIncomingEmergency} emergency The stopped incoming emergency.
   * @param {@link types.ZelloIncomingEmergency | ZelloIncomingEmergency[]} emergencies The list of incoming emergencies.
   */
  INCOMING_EMERGENCY_STOPPED = 'onIncomingEmergencyStopped',
  /**
   * An outgoing emergency has started.
   * {@link sdk.Zello.outgoingEmergency | Zello.outgoingEmergency} will be updated.
   * @param {@link types.ZelloOutgoingEmergency | ZelloOutgoingEmergency} emergency The outgoing emergency.
   */
  OUTGOING_EMERGENCY_STARTED = 'onOutgoingEmergencyStarted',
  /**
   * An outgoing emergency has stopped.
   * {@link sdk.Zello.outgoingEmergency | Zello.outgoingEmergency} will be set to undefined.
   * @param {@link types.ZelloOutgoingEmergency | ZelloOutgoingEmergency} emergency The stopped outgoing emergency.
   */
  OUTGOING_EMERGENCY_STOPPED = 'onOutgoingEmergencyStopped',
  /**
   * The list of recent entries has been updated.
   * {@link sdk.Zello.recents | Zello.recents} will be updated.
   * @param {@link types.ZelloRecentEntry | ZelloRecentEntry[]} recents The list of recent entries.
   */
  RECENTS_UPDATED = 'onRecentsUpdated',
  /**
   * The history has been updated.
   */
  HISTORY_UPDATED = 'onHistoryUpdated',
  /**
   * The history playback of a voice message has started.
   * {@link sdk.Zello.historyVoiceMessage | Zello.historyVoiceMessage} will be updated.
   * @param {@link types.ZelloHistoryVoiceMessage | ZelloHistoryVoiceMessage} voiceMessage The started history voice message.
   */
  HISTORY_PLAYBACK_STARTED = 'onHistoryPlaybackStarted',
  /**
   * The history playback of a voice message has stopped.
   * {@link sdk.Zello.historyVoiceMessage | Zello.historyVoiceMessage} will be set to undefined.
   * @param {@link types.ZelloHistoryVoiceMessage | ZelloHistoryVoiceMessage} voiceMessage The stopped history voice message.
   */
  HISTORY_PLAYBACK_STOPPED = 'onHistoryPlaybackStopped',
  /**
   * A dispatch call has been received by the server and is pending acceptance by a dispatcher.
   * @param {@link types.ZelloDispatchCall | ZelloDispatchCall} call The pending dispatch call.
   */
  DISPATCH_CALL_PENDING = 'onDispatchCallPending',
  /**
   * A dispatch call has been accepted by a dispatcher.
   * @param {@link types.ZelloDispatchCall | ZelloDispatchCall} call The accepted dispatch call.
   */
  DISPATCH_CALL_ACTIVE = 'onDispatchCallActive',
  /**
   * A dispatch call has been transferred to another dispatcher.
   * @param {@link types.ZelloDispatchCall | ZelloDispatchCall} call The transferred dispatch call.
   */
  DISPATCH_CALL_TRANSFERRED = 'onDispatchCallTransferred',
  /**
   * A dispatch call has ended.
   * @param {@link types.ZelloDispatchCall | ZelloDispatchCall} call The ended dispatch call.
   */
  DISPATCH_CALL_ENDED = 'onDispatchCallEnded',
  /**
   * The console settings have changed.
   * {@link sdk.Zello.consoleSettings | Zello.consoleSettings} will contain the updated console settings.
   * @param {@link types.ZelloConsoleSettings | ZelloConsoleSettings} settings The updated console settings.
   */
  CONSOLE_SETTINGS_CHANGED = 'onConsoleSettingsChanged',
}
