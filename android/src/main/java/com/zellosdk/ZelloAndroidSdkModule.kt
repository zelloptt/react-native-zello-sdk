@file:Suppress("unused")

package com.zellosdk

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.zello.sdk.Zello
import com.zello.sdk.ZelloAccountStatus
import com.zello.sdk.ZelloAlertMessage
import com.zello.sdk.ZelloChannel
import com.zello.sdk.ZelloConnectionError
import com.zello.sdk.ZelloContact
import com.zello.sdk.ZelloCredentials
import com.zello.sdk.ZelloDispatchChannel
import com.zello.sdk.ZelloHistoryImageMessage
import com.zello.sdk.ZelloHistoryVoiceMessage
import com.zello.sdk.ZelloImageMessage
import com.zello.sdk.ZelloIncomingEmergency
import com.zello.sdk.ZelloIncomingVoiceMessage
import com.zello.sdk.ZelloLocationMessage
import com.zello.sdk.ZelloOutgoingEmergency
import com.zello.sdk.ZelloOutgoingVoiceMessage
import com.zello.sdk.ZelloRecentEntry
import com.zello.sdk.ZelloConsoleSettings
import com.zello.sdk.ZelloGroupConversation
import com.zello.sdk.ZelloState
import com.zello.sdk.ZelloTextMessage
import javax.inject.Inject

class ZelloAndroidSdkModule @Inject constructor(
  reactContext: ReactApplicationContext,
  private val zello: Zello
) : ReactContextBaseJavaModule(reactContext), Zello.Listener {
  companion object {
    private const val BRIDGE_EVENT_NAME = "zellosdk"
    private const val EVENT_NAME = "eventName"
  }

  init {
    zello.listener = this
  }

  override fun getName() = "ZelloAndroidSdkModule"

  @ReactMethod fun configure(enableOfflineMessagePushNotifications: Boolean, enableForegroundService: Boolean) {
    zello.configure(enableOfflineMessagePushNotifications, enableForegroundService)
  }

  @ReactMethod fun connect(network: String, username: String, password: String) {
    zello.connect(ZelloCredentials(network, username, password))
  }

  @ReactMethod fun disconnect() {
    zello.disconnect()
  }

  @ReactMethod fun setSelectedContact(name: String, isChannel: Boolean) {
    val contact = (if (isChannel) zello.getChannel(name) else zello.getUser(name)) ?: return
    zello.setSelectedContact(contact)
  }

  @ReactMethod fun setAccountStatus(status: String) {
    val accountStatus = when (status) {
      "available" -> ZelloAccountStatus.AVAILABLE
      "busy" -> ZelloAccountStatus.BUSY
      else -> return
    }
    zello.setAccountStatus(accountStatus)
  }

  @ReactMethod fun connectChannel(name: String) {
    val channel = zello.getChannel(name) ?: return
    zello.connectChannel(channel)
  }

  @ReactMethod fun disconnectChannel(name: String) {
    val channel = zello.getChannel(name) ?: return
    zello.disconnectChannel(channel)
  }

  @ReactMethod fun startVoiceMessage(name: String, isChannel: Boolean) {
    val contact = (if (isChannel) zello.getChannel(name) else zello.getUser(name)) ?: return
    zello.startVoiceMessage(contact)
  }

  @ReactMethod fun stopVoiceMessage() {
    zello.stopVoiceMessage()
  }

  @ReactMethod
  fun sendImage(name: String, isChannel: Boolean, data: ReadableArray) {
    val contact = (if (isChannel) zello.getChannel(name) else zello.getUser(name)) ?: return
    val byteArray = ByteArray(data.size())
    for (i in 0 until data.size()) {
      byteArray[i] = data.getInt(i).toByte()
    }
    zello.sendImage(byteArray, contact)
  }

  @ReactMethod
  fun sendLocation(name: String, isChannel: Boolean) {
    val contact = (if (isChannel) zello.getChannel(name) else zello.getUser(name)) ?: return
    zello.sendLocation(contact)
  }

  @ReactMethod
  fun sendText(name: String, isChannel: Boolean, text: String) {
    val contact = (if (isChannel) zello.getChannel(name) else zello.getUser(name)) ?: return
    zello.sendText(text, contact)
  }

  @ReactMethod
  fun sendAlert(name: String, isChannel: Boolean, text: String, level: String?) {
    val contact = (if (isChannel) zello.getChannel(name) else zello.getUser(name)) ?: return
    val channelAlertLevel = when (level) {
      "all" -> ZelloAlertMessage.ChannelLevel.ALL
      "connected" -> ZelloAlertMessage.ChannelLevel.CONNECTED
      else -> null
    }
    zello.sendAlert(contact, text, channelAlertLevel)
  }

  @ReactMethod
  fun submitProblemReport() {
    zello.submitProblemReport()
  }

  @ReactMethod
  fun muteContact(name: String, isChannel: Boolean) {
    val contact = (if (isChannel) zello.getChannel(name) else zello.getUser(name)) ?: return
    zello.muteContact(contact)
  }

  @ReactMethod
  fun unmuteContact(name: String, isChannel: Boolean) {
    val contact = (if (isChannel) zello.getChannel(name) else zello.getUser(name)) ?: return
    zello.unmuteContact(contact)
  }

  @ReactMethod
  fun startEmergency() {
    zello.startEmergency()
  }

  @ReactMethod
  fun stopEmergency() {
    zello.stopEmergency()
  }

  @ReactMethod
  fun getHistory(name: String, isChannel: Boolean, size: Int?, callback: Callback) {
    val contact = (if (isChannel) zello.getChannel(name) else zello.getUser(name)) ?: return
    val messages = if (size != null) zello.getHistory(contact, size) else zello.getHistory(contact)
    callback.invoke(ZelloAndroidSdkModuleHelper.historyMessagesToWritableArray(messages))
  }

  @ReactMethod
  fun playHistoryMessage(historyId: String, contactName: String, isChannel: Boolean) {
    val contact = (if (isChannel) zello.getChannel(contactName) else zello.getUser(contactName)) ?: return
    val message = zello.getHistoryMessage(historyId, contact) as? ZelloHistoryVoiceMessage ?: return
    zello.playHistoryMessage(message)
  }

  @ReactMethod
  fun stopHistoryMessagePlayback() {
    zello.stopHistoryMessagePlayback()
  }

  @ReactMethod
  fun getImageDataForHistoryImageMessage(historyId: String, contactName: String, isChannel: Boolean, callback: Callback) {
    val contact = (if (isChannel) zello.getChannel(contactName) else zello.getUser(contactName)) ?: return
    val message = zello.getHistoryMessage(historyId, contact) as? ZelloHistoryImageMessage ?: return
    zello.loadBitmapForHistoryImageMessage(message) {
      callback.invoke(ZelloAndroidSdkModuleHelper.bitmapToBase64String(it))
    }
  }

  @ReactMethod
  fun endDispatchCall(channelName: String) {
    val dispatchChannel = zello.getChannel(channelName) as? ZelloDispatchChannel ?: return
    val call = dispatchChannel.currentCall ?: return
    zello.endDispatchCall(call, dispatchChannel)
  }

  @ReactMethod
  fun createGroupConversation(usernames: ReadableArray, name: String?) {
    val users = usernames.toArrayList().mapNotNull { zello.getUser(it as String) }
    zello.createGroupConversation(users, name)
  }

  @ReactMethod
  fun addUsersToGroupConversation(conversationName: String, usernames: ReadableArray) {
    val conversation = zello.getGroupConversation(conversationName) ?: return
    val users = usernames.toArrayList().mapNotNull { zello.getUser(it as String) }
    zello.addUsersToGroupConversation(conversation, users)
  }

  @ReactMethod
  fun leaveGroupConversation(conversationName: String) {
    val conversation = zello.getGroupConversation(conversationName) ?: return
    zello.leaveGroupConversation(conversation)
  }

  @ReactMethod
  fun renameGroupConversation(conversationName: String, newName: String) {
    val conversation = zello.getGroupConversation(conversationName) ?: return
    zello.renameGroupConversation(conversation, newName)
  }

  override fun onStateChanged(sdk: Zello, state: ZelloState) {
  }

  override fun onConnectFailed(zello: Zello, error: ZelloConnectionError) {
    sendEvent(reactApplicationContext, "onConnectFailed", Arguments.createMap().apply {
      putString("error", error.toString())
    })
  }

  override fun onConnectStarted(zello: Zello) {
    sendEvent(reactApplicationContext, "onConnectStarted", null)
  }

  override fun onConnectSucceeded(zello: Zello) {
    sendEvent(reactApplicationContext, "onConnectSucceeded", null)
  }

  override fun onContactListUpdated(zello: Zello) {
    val map = ZelloAndroidSdkModuleHelper.contactListToWritableMap(this.zello.users, this.zello.channels, this.zello.groupConversations)
    this.zello.emergencyChannel?.let {
      map.putMap("emergencyChannel", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(it))
    }
    sendEvent(reactApplicationContext, "onContactListUpdated", map)
  }

  override fun onSelectedContactChanged(zello: Zello, contact: ZelloContact?) {
    sendEvent(reactApplicationContext, "onSelectedContactChanged", contact?.let {
      Arguments.createMap().apply {
        putMap("contact", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(it))
      }
    })
  }

  override fun onWillReconnect(zello: Zello) {
    sendEvent(reactApplicationContext, "onWillReconnect", null)
  }

  override fun onDisconnected(zello: Zello) {
    sendEvent(reactApplicationContext, "onDisconnected", null)
  }

  override fun onAccountStatusChanged(zello: Zello, status: ZelloAccountStatus?) {
    sendEvent(reactApplicationContext, "onAccountStatusChanged", status?.let {
      Arguments.createMap().apply {
        putString("status", it.toString())
      }
    })
  }

  override fun onIncomingAlertMessage(zello: Zello, message: ZelloAlertMessage) {
    sendEvent(reactApplicationContext, "onIncomingAlertMessage", Arguments.createMap().apply {
      putMap("contact", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(contact = message.contact))
      putMap("channelUser", ZelloAndroidSdkModuleHelper.channelUserToWritableMap(message.channelUser))
      putString("timestamp", message.timestamp.toString())
      putString("text", message.text)
    })
  }

  override fun onOutgoingAlertMessageSent(zello: Zello, message: ZelloAlertMessage) {
    sendEvent(reactApplicationContext, "onOutgoingAlertMessageSent", Arguments.createMap().apply {
      putMap("contact", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(contact = message.contact))
      putString("timestamp", message.timestamp.toString())
      putString("text", message.text)
    })
  }

  override fun onOutgoingAlertMessageSendFailed(zello: Zello, message: ZelloAlertMessage) {
    sendEvent(reactApplicationContext, "onOutgoingAlertMessageSendFailed", Arguments.createMap().apply {
      putMap("contact", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(contact = message.contact))
      putString("timestamp", message.timestamp.toString())
      putString("text", message.text)
    })
  }

  override fun onIncomingImageMessage(message: ZelloImageMessage) {
    sendEvent(reactApplicationContext, "onIncomingImageMessage", Arguments.createMap().apply {
      putMap("contact", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(contact = message.contact))
      putMap("channelUser", ZelloAndroidSdkModuleHelper.channelUserToWritableMap(message.channelUser))
      putString("timestamp", message.timestamp.toString())
      putString("thumbnail", ZelloAndroidSdkModuleHelper.bitmapToBase64String(message.thumbnail))
      putString("image", ZelloAndroidSdkModuleHelper.bitmapToBase64String(message.image))
    })
  }

  override fun onIncomingLocationMessage(zello: Zello, message: ZelloLocationMessage) {
    sendEvent(reactApplicationContext, "onIncomingLocationMessage", Arguments.createMap().apply {
      putMap("contact", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(contact = message.contact))
      putMap("channelUser", ZelloAndroidSdkModuleHelper.channelUserToWritableMap(message.channelUser))
      putString("timestamp", message.timestamp.toString())
      putString("address", message.address)
      putDouble("latitude", message.latitude)
      putDouble("longitude", message.longitude)
      putDouble("accuracy", message.accuracy)
    })
  }

  override fun onOutgoingLocationMessageSent(zello: Zello, message: ZelloLocationMessage) {
    sendEvent(reactApplicationContext, "onOutgoingLocationMessageSent", Arguments.createMap().apply {
      putMap("contact", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(contact = message.contact))
      putString("timestamp", message.timestamp.toString())
      putString("address", message.address)
      putDouble("latitude", message.latitude)
      putDouble("longitude", message.longitude)
      putDouble("accuracy", message.accuracy)
    })
  }

  override fun onOutgoingLocationMessageSendFailed(zello: Zello, message: ZelloLocationMessage, isPermissionIssue: Boolean) {
    sendEvent(reactApplicationContext, "onOutgoingLocationMessageSendFailed", Arguments.createMap().apply {
      putMap("contact", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(contact = message.contact))
      putString("timestamp", message.timestamp.toString())
      putString("address", message.address)
      putDouble("latitude", message.latitude)
      putDouble("longitude", message.longitude)
      putDouble("accuracy", message.accuracy)
    })
  }

  override fun onOutgoingTextMessageSent(zello: Zello, message: ZelloTextMessage) {
    sendEvent(reactApplicationContext, "onOutgoingTextMessageSent", Arguments.createMap().apply {
      putMap("contact", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(contact = message.contact))
      putString("timestamp", message.timestamp.toString())
      putString("text", message.text)
    })
  }

  override fun onOutgoingTextMessageSendFailed(zello: Zello, message: ZelloTextMessage) {
    sendEvent(reactApplicationContext, "onOutgoingTextMessageSendFailed", Arguments.createMap().apply {
      putMap("contact", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(contact = message.contact))
      putString("timestamp", message.timestamp.toString())
      putString("text", message.text)
    })
  }

  override fun onIncomingTextMessage(message: ZelloTextMessage) {
    sendEvent(reactApplicationContext, "onIncomingTextMessage", Arguments.createMap().apply {
      putMap("contact", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(contact = message.contact))
      putMap("channelUser", ZelloAndroidSdkModuleHelper.channelUserToWritableMap(message.channelUser))
      putString("timestamp", message.timestamp.toString())
      putString("text", message.text)
    })
  }

  override fun onIncomingVoiceMessageStarted(zello: Zello, message: ZelloIncomingVoiceMessage) {
    sendEvent(reactApplicationContext, "onIncomingVoiceMessageStarted", Arguments.createMap().apply {
      putMap("contact", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(contact = message.contact))
      putMap("channelUser", ZelloAndroidSdkModuleHelper.channelUserToWritableMap(message.channelUser))
      putString("timestamp", message.timestamp.toString())
    })
  }

  override fun onIncomingVoiceMessageStopped(zello: Zello, message: ZelloIncomingVoiceMessage) {
    sendEvent(reactApplicationContext, "onIncomingVoiceMessageStopped", Arguments.createMap().apply {
      putMap("contact", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(contact = message.contact))
      putMap("channelUser", ZelloAndroidSdkModuleHelper.channelUserToWritableMap(message.channelUser))
      putString("timestamp", message.timestamp.toString())
    })
  }

  override fun onOutgoingImageMessageSent(zello: Zello, message: ZelloImageMessage) {
    sendEvent(reactApplicationContext, "onOutgoingImageMessageSent", Arguments.createMap().apply {
      putMap("contact", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(contact = message.contact))
      putString("timestamp", message.timestamp.toString())
      putString("thumbnail", ZelloAndroidSdkModuleHelper.bitmapToBase64String(message.thumbnail))
      putString("image", ZelloAndroidSdkModuleHelper.bitmapToBase64String(message.image))
    })
  }

  override fun onOutgoingImageMessageSendFailed(zello: Zello, message: ZelloImageMessage) {
    sendEvent(reactApplicationContext, "onOutgoingImageMessageSendFailed", Arguments.createMap().apply {
      putMap("contact", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(contact = message.contact))
      putString("timestamp", message.timestamp.toString())
      putString("thumbnail", ZelloAndroidSdkModuleHelper.bitmapToBase64String(message.thumbnail))
      putString("image", ZelloAndroidSdkModuleHelper.bitmapToBase64String(message.image))
    })
  }

  override fun onOutgoingVoiceMessageConnecting(zello: Zello, message: ZelloOutgoingVoiceMessage) {
    sendEvent(reactApplicationContext, "onOutgoingVoiceMessageConnecting", Arguments.createMap().apply {
      putMap("contact", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(contact = message.contact))
      putString("timestamp", message.timestamp.toString())
      putString("state", message.state.toString())
    })
  }

  override fun onOutgoingVoiceMessageStarted(zello: Zello, message: ZelloOutgoingVoiceMessage) {
    sendEvent(reactApplicationContext, "onOutgoingVoiceMessageStarted", Arguments.createMap().apply {
      putMap("contact", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(contact = message.contact))
      putString("timestamp", message.timestamp.toString())
      putString("state", message.state.toString())
    })
  }

  override fun onOutgoingVoiceMessageStopped(zello: Zello, message: ZelloOutgoingVoiceMessage, error: ZelloOutgoingVoiceMessage.Error?) {
    sendEvent(reactApplicationContext, "onOutgoingVoiceMessageStopped", Arguments.createMap().apply {
      putMap("contact", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(contact = message.contact))
      putString("timestamp", message.timestamp.toString())
      putString("state", message.state.toString())
      putMap("error", error?.let {
        Arguments.createMap().apply {
          putString("message", it.toString())
        }
      })
    })
  }

  override fun onIncomingEmergencyStarted(zello: Zello, incomingEmergency: ZelloIncomingEmergency) {
    sendEvent(reactApplicationContext, "onIncomingEmergencyStarted", Arguments.createMap().apply {
      putMap("emergency", ZelloAndroidSdkModuleHelper.incomingEmergencyToWritableMap(incomingEmergency))
      putArray("emergencies", ZelloAndroidSdkModuleHelper.incomingEmergenciesToWritableArray(this@ZelloAndroidSdkModule.zello.incomingEmergencies))
    })
  }

  override fun onIncomingEmergencyStopped(zello: Zello, incomingEmergency: ZelloIncomingEmergency) {
    sendEvent(reactApplicationContext, "onIncomingEmergencyStopped", Arguments.createMap().apply {
      putMap("emergency", ZelloAndroidSdkModuleHelper.incomingEmergencyToWritableMap(incomingEmergency))
      putArray("emergencies", ZelloAndroidSdkModuleHelper.incomingEmergenciesToWritableArray(this@ZelloAndroidSdkModule.zello.incomingEmergencies))
    })
  }

  override fun onOutgoingEmergencyStarted(zello: Zello, outgoingEmergency: ZelloOutgoingEmergency) {
    sendEvent(reactApplicationContext, "onOutgoingEmergencyStarted", Arguments.createMap().apply {
      putMap("channel", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(contact = outgoingEmergency.channel))
      putInt("startTimestamp", outgoingEmergency.startTimestamp.toInt())
    })
  }

  override fun onOutgoingEmergencyStopped(zello: Zello, outgoingEmergency: ZelloOutgoingEmergency) {
    sendEvent(reactApplicationContext, "onOutgoingEmergencyStopped", Arguments.createMap().apply {
      putMap("channel", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(contact = outgoingEmergency.channel))
      putInt("startTimestamp", outgoingEmergency.startTimestamp.toInt())
      outgoingEmergency.endTimestamp?.let {
        putInt("endTimestamp", it.toInt())
      }
    })
  }

  override fun onRecentsUpdated(zello: Zello, recents: List<ZelloRecentEntry>) {
    sendEvent(reactApplicationContext, "onRecentsUpdated", Arguments.createMap().apply {
      putArray("recents", ZelloAndroidSdkModuleHelper.recentsToWritableArray(recents))
    })
  }

  override fun onHistoryPlaybackStarted(zello: Zello, message: ZelloHistoryVoiceMessage) {
    sendEvent(reactApplicationContext, "onHistoryPlaybackStarted", ZelloAndroidSdkModuleHelper.historyVoiceMessageToWritableMap(message))
  }

  override fun onHistoryPlaybackStopped(zello: Zello, message: ZelloHistoryVoiceMessage) {
    sendEvent(reactApplicationContext, "onHistoryPlaybackStopped", ZelloAndroidSdkModuleHelper.historyVoiceMessageToWritableMap(message))
  }

  override fun onHistoryUpdated(zello: Zello) {
    sendEvent(reactApplicationContext, "onHistoryUpdated", null)
  }

  override fun onConsoleSettingsChanged(zello: Zello, settings: ZelloConsoleSettings) {
    sendEvent(reactApplicationContext, "onConsoleSettingsChanged", ZelloAndroidSdkModuleHelper.consoleSettingsToWritableMap(settings))
  }

  override fun onDispatchCallPending(zello: Zello, channel: ZelloDispatchChannel, call: ZelloDispatchChannel.Call) {
    sendEvent(reactApplicationContext, "onDispatchCallPending", Arguments.createMap().apply {
      putMap("call", ZelloAndroidSdkModuleHelper.callToWritableMap(call))
      putMap("channel", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(channel))
    })
  }

  override fun onDispatchCallActive(zello: Zello, channel: ZelloDispatchChannel, call: ZelloDispatchChannel.Call) {
    sendEvent(reactApplicationContext, "onDispatchCallActive", Arguments.createMap().apply {
      putMap("call", ZelloAndroidSdkModuleHelper.callToWritableMap(call))
      putMap("channel", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(channel))
    })
  }

  override fun onDispatchCallTransferred(zello: Zello, channel: ZelloDispatchChannel, call: ZelloDispatchChannel.Call) {
    sendEvent(reactApplicationContext, "onDispatchCallTransferred", Arguments.createMap().apply {
      putMap("call", ZelloAndroidSdkModuleHelper.callToWritableMap(call))
      putMap("channel", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(channel))
    })
  }

  override fun onDispatchCallEnded(zello: Zello, channel: ZelloDispatchChannel, call: ZelloDispatchChannel.Call) {
    sendEvent(reactApplicationContext, "onDispatchCallEnded", Arguments.createMap().apply {
      putMap("call", ZelloAndroidSdkModuleHelper.callToWritableMap(call))
      putMap("channel", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(channel))
    })
  }

  override fun onGroupConversationLeft(sdk: Zello, conversation: ZelloGroupConversation) {
    sendEvent(reactApplicationContext, "onGroupConversationLeft", Arguments.createMap().apply {
      putMap("conversation", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(conversation))
    })
  }

  override fun onGroupConversationInvite(sdk: Zello, conversation: ZelloGroupConversation) {
    sendEvent(reactApplicationContext, "onGroupConversationInvite", Arguments.createMap().apply {
      putMap("conversation", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(conversation))
    })
  }

  override fun onGroupConversationCreated(sdk: Zello, conversation: ZelloGroupConversation) {
    sendEvent(reactApplicationContext, "onGroupConversationCreated", Arguments.createMap().apply {
      putMap("conversation", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(conversation))
    })
  }

  override fun onGroupConversationRenamed(sdk: Zello, conversation: ZelloGroupConversation) {
    sendEvent(reactApplicationContext, "onGroupConversationRenamed", Arguments.createMap().apply {
      putMap("conversation", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(conversation))
    })
  }

  override fun onGroupConversationUsersAdded(sdk: Zello, conversation: ZelloGroupConversation, users: List<ZelloChannel.User>) {
    sendEvent(reactApplicationContext, "onGroupConversationUsersAdded", Arguments.createMap().apply {
      putMap("conversation", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(conversation))
      putArray("users", ZelloAndroidSdkModuleHelper.channelUsersToWritableArray(users))
    })
  }

  override fun onGroupConversationUsersLeft(sdk: Zello, conversation: ZelloGroupConversation, users: List<ZelloChannel.User>) {
    sendEvent(reactApplicationContext, "onGroupConversationUsersLeft", Arguments.createMap().apply {
      putMap("conversation", ZelloAndroidSdkModuleHelper.sdkContactToWritableMap(conversation))
      putArray("users", ZelloAndroidSdkModuleHelper.channelUsersToWritableArray(users))
    })
  }

  private fun sendEvent(reactContext: ReactContext, name: String, params: WritableMap?) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(BRIDGE_EVENT_NAME, params?.apply { putString(EVENT_NAME, name) } ?: Arguments.createMap().apply { putString(EVENT_NAME, name) })
  }
}
