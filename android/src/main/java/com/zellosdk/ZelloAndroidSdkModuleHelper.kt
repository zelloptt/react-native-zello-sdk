package com.zellosdk

import android.graphics.Bitmap
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.zello.sdk.ZelloChannel
import com.zello.sdk.ZelloConsoleSettings
import com.zello.sdk.ZelloContact
import com.zello.sdk.ZelloDispatchChannel
import com.zello.sdk.ZelloGroupConversation
import com.zello.sdk.ZelloHistoryAlertMessage
import com.zello.sdk.ZelloHistoryImageMessage
import com.zello.sdk.ZelloHistoryLocationMessage
import com.zello.sdk.ZelloHistoryMessage
import com.zello.sdk.ZelloHistoryTextMessage
import com.zello.sdk.ZelloHistoryVoiceMessage
import com.zello.sdk.ZelloIncomingEmergency
import com.zello.sdk.ZelloRecentEntry
import com.zello.sdk.ZelloUser
import java.io.ByteArrayOutputStream

object ZelloAndroidSdkModuleHelper {
	fun contactListToWritableMap(users: List<ZelloUser>, channels: List<ZelloChannel>, groupConversation: List<ZelloGroupConversation>): WritableMap {
		return Arguments.createMap().apply {
			putArray("users", WritableNativeArray().apply {
				users.forEach { user ->
					pushMap(sdkContactToWritableMap(user))
				}
			})
			putArray("channels", WritableNativeArray().apply {
				channels.forEach { channel ->
					pushMap(sdkContactToWritableMap(channel))
				}
			})
			putArray("groupConversations", WritableNativeArray().apply {
				groupConversation.forEach { conversation ->
					pushMap(sdkContactToWritableMap(conversation))
				}
			})
		}
	}

	fun sdkContactToWritableMap(contact: ZelloContact): WritableMap {
		return when (contact) {
			is ZelloUser -> WritableNativeMap().apply {
				putString("name", contact.name)
				putBoolean("isChannel", false)
				putBoolean("isMuted", contact.isMuted)
				putString("displayName", contact.displayName)
				putString("status", contact.status.toString())
				putString("customStatusText", contact.customStatusText)
				putString("profilePictureUrl", contact.profilePictureUrl)
				putString("profilePictureThumbnailUrl", contact.profilePictureThumbnailUrl)
				putMap("supportedFeatures", WritableNativeMap().apply {
					putBoolean("groupConversations", contact.supportedFeatures.groupConversations)
				})
			}

			is ZelloChannel -> WritableNativeMap().apply {
				putString("name", contact.name)
				putBoolean("isChannel", true)
				putBoolean("isMuted", contact.isMuted)
				putBoolean("isConnected", contact.status == ZelloChannel.ConnectionStatus.CONNECTED)
				putBoolean("isConnecting", contact.status == ZelloChannel.ConnectionStatus.CONNECTING)
				putInt("usersOnline", contact.usersOnline)
				putMap("options", WritableNativeMap().apply {
					val options = contact.options
					putBoolean("noDisconnect", options.noDisconnect)
					putBoolean("hidePowerButton", options.hidePowerButton)
					putBoolean("listenOnly", options.listenOnly)
					putBoolean("allowAlerts", options.allowAlerts)
					putBoolean("allowTextMessages", options.allowTextMessages)
					putBoolean("allowLocations", options.allowLocations)
				})
				if (contact is ZelloDispatchChannel) {
					putBoolean("isDispatchChannel", true)
					contact.currentCall?.let { call ->
						putMap("currentCall", callToWritableMap(call))
					}
				} else if (contact is ZelloGroupConversation) {
					putBoolean("isGroupConversation", true)
					putString("displayName", contact.displayName)
					putArray("users", WritableNativeArray().apply {
						contact.users.forEach { user ->
							pushMap(channelUserToWritableMap(user))
						}
					})
					putArray("onlineUsers", WritableNativeArray().apply {
						contact.onlineUsers.forEach { user ->
							pushMap(channelUserToWritableMap(user))
						}
					})
				}
			}

			else -> WritableNativeMap()
		}
	}

	fun incomingEmergenciesToWritableArray(incomingEmergencies: List<ZelloIncomingEmergency>): WritableNativeArray {
		return WritableNativeArray().apply {
			incomingEmergencies.forEach {
				pushMap(incomingEmergencyToWritableMap(it))
			}
		}
	}

	fun incomingEmergencyToWritableMap(incomingEmergency: ZelloIncomingEmergency): WritableMap {
		return Arguments.createMap().apply {
			putMap("channel", sdkContactToWritableMap(contact = incomingEmergency.channel))
			putMap("channelUser", channelUserToWritableMap(incomingEmergency.channelUser))
			putString("emergencyId", incomingEmergency.emergencyId)
			putString("startTimestamp", incomingEmergency.startTimestamp.toString())
			incomingEmergency.endTimestamp?.let {
				putString("endTimestamp", it.toString())
			}
		}
	}

	fun bitmapToBase64String(bitmap: Bitmap?): String? {
		if (bitmap == null) {
			return null
		}
		val byteArrayOutputStream = ByteArrayOutputStream()
		bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream)
		val byteArray = byteArrayOutputStream.toByteArray()
		val base64String: String = Base64.encodeToString(byteArray, Base64.DEFAULT)
		return "data:image/jpeg;base64,$base64String"
	}

	fun recentsToWritableArray(recents: List<ZelloRecentEntry>): WritableNativeArray {
		return WritableNativeArray().apply {
			recents.forEach {
				pushMap(WritableNativeMap().apply {
					putMap("contact", sdkContactToWritableMap(it.contact))
					putMap("channelUser", channelUserToWritableMap(it.channelUser))
					putString("type", it.type.toString())
					putString("timestamp", it.timestamp.toString())
					putBoolean("incoming", it.incoming)
				})
			}
		}
	}

	fun historyMessagesToWritableArray(messages: List<ZelloHistoryMessage>): WritableNativeArray {
		return WritableNativeArray().apply {
			messages.forEach {
				pushMap(historyMessageToWritableMap(it))
			}
		}
	}

	fun historyMessageToWritableMap(message: ZelloHistoryMessage): WritableMap {
		return when (message) {
			is ZelloHistoryVoiceMessage -> historyVoiceMessageToWritableMap(message)
			is ZelloHistoryImageMessage -> historyImageMessageToWritableMap(message)
			is ZelloHistoryTextMessage -> historyTextMessageToWritableMap(message)
			is ZelloHistoryAlertMessage -> historyAlertMessageToWritableMap(message)
			is ZelloHistoryLocationMessage -> historyLocationMessageToWritableMap(message)
			else -> WritableNativeMap()
		}
	}

	fun historyVoiceMessageToWritableMap(message: ZelloHistoryVoiceMessage): WritableMap {
		return Arguments.createMap().apply {
			putMap("contact", sdkContactToWritableMap(contact = message.contact))
			putString("type", "voice")
			putMap("channelUser", channelUserToWritableMap(message.channelUser))
			putString("timestamp", message.timestamp.toString())
			putString("historyId", message.historyId)
			putBoolean("incoming", message.incoming)
			putInt("durationMs", message.durationMs.toInt())
		}
	}

	fun historyImageMessageToWritableMap(message: ZelloHistoryImageMessage): WritableMap {
		return Arguments.createMap().apply {
			putMap("contact", sdkContactToWritableMap(contact = message.contact))
			putString("type", "image")
			putMap("channelUser", channelUserToWritableMap(message.channelUser))
			putString("timestamp", message.timestamp.toString())
			putString("historyId", message.historyId)
			putBoolean("incoming", message.incoming)
		}
	}

	fun historyTextMessageToWritableMap(message: ZelloHistoryTextMessage): WritableMap {
		return Arguments.createMap().apply {
			putMap("contact", sdkContactToWritableMap(contact = message.contact))
			putString("type", "text")
			putMap("channelUser", channelUserToWritableMap(message.channelUser))
			putString("timestamp", message.timestamp.toString())
			putString("historyId", message.historyId)
			putBoolean("incoming", message.incoming)
			putString("text", message.text)
		}
	}

	fun historyAlertMessageToWritableMap(message: ZelloHistoryAlertMessage): WritableMap {
		return Arguments.createMap().apply {
			putMap("contact", sdkContactToWritableMap(contact = message.contact))
			putString("type", "alert")
			putMap("channelUser", channelUserToWritableMap(message.channelUser))
			putString("timestamp", message.timestamp.toString())
			putString("historyId", message.historyId)
			putBoolean("incoming", message.incoming)
			putString("text", message.text)
		}
	}

	fun historyLocationMessageToWritableMap(message: ZelloHistoryLocationMessage): WritableMap {
		return Arguments.createMap().apply {
			putMap("contact", sdkContactToWritableMap(contact = message.contact))
			putString("type", "location")
			putMap("channelUser", channelUserToWritableMap(message.channelUser))
			putString("timestamp", message.timestamp.toString())
			putString("historyId", message.historyId)
			putBoolean("incoming", message.incoming)
			putDouble("latitude", message.latitude)
			putDouble("longitude", message.longitude)
			putDouble("accuracy", message.accuracy)
			putString("address", message.address)
		}
	}

	fun consoleSettingsToWritableMap(settings: ZelloConsoleSettings): WritableMap {
		return Arguments.createMap().apply {
			putBoolean("allowNonDispatchersToEndCalls", settings.allowNonDispatchersToEndCalls)
			putBoolean("allowTextMessages", settings.allowTextMessages)
			putBoolean("allowImageMessages", settings.allowImageMessages)
			putBoolean("allowLocationMessages", settings.allowLocationMessages)
			putBoolean("allowAlertMessages", settings.allowAlertMessages)
			putBoolean("allowGroupConversations", settings.allowGroupConversations)
		}
	}

	fun callToWritableMap(call: ZelloDispatchChannel.Call): WritableMap {
		return Arguments.createMap().apply {
			putInt("id", call.id.toInt())
			putString("status", call.status.toString())
			putString("dispatcher", call.dispatcher)
			putString("timestamp", call.timestamp.toString())
		}
	}

	fun channelUserToWritableMap(channelUser: ZelloChannel.User?): WritableMap? {
		if (channelUser == null) {
			return null
		}
		return Arguments.createMap().apply {
			putString("name", channelUser.name)
			putString("displayName", channelUser.displayName)
		}
	}

	fun channelUsersToWritableArray(channelUsers: List<ZelloChannel.User>): WritableNativeArray {
		return WritableNativeArray().apply {
			channelUsers.forEach {
				pushMap(channelUserToWritableMap(it))
			}
		}
	}
}
