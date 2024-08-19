import {
  ZelloChannel,
  ZelloChannelConnectionStatus,
  ZelloChannelUser,
  ZelloConsoleSettings,
  ZelloContact,
  ZelloDispatchCall,
  ZelloDispatchCallStatus,
  ZelloDispatchChannel,
  ZelloHistoryAlertMessage,
  ZelloHistoryImageMessage,
  ZelloHistoryLocationMessage,
  ZelloHistoryMessage,
  ZelloHistoryTextMessage,
  ZelloHistoryVoiceMessage,
  ZelloIncomingEmergency,
  ZelloUser,
  ZelloUserStatus,
} from '../types';
import { Platform } from 'react-native';

export const isSameContact = (a: ZelloContact, b: ZelloContact): boolean =>
  a.name.toLowerCase() === b.name.toLowerCase() && a.type === b.type;

export const isAndroid = Platform.OS === 'android';
export const isiOS = Platform.OS === 'ios';

export function bridgeContactToSdkContact(
  eventContact: any
): ZelloContact | undefined {
  let contact: ZelloContact | undefined;
  const contactName = eventContact.name;
  if (contactName) {
    if (eventContact.isChannel) {
      const isMuted = eventContact.isMuted;
      const connectionStatus = eventContact.isConnected
        ? ZelloChannelConnectionStatus.Connected
        : eventContact.isConnecting
          ? ZelloChannelConnectionStatus.Connecting
          : ZelloChannelConnectionStatus.Disconnected;
      const usersOnline = eventContact.usersOnline;
      const options = eventContact.options;
      if (eventContact.isDispatchChannel) {
        let call: ZelloDispatchCall | undefined;
        if (eventContact.currentCall) {
          const statusValue =
            eventContact.currentCall.status.toLowerCase() as ZelloDispatchCallStatus;
          if (Object.values(ZelloDispatchCallStatus).includes(statusValue)) {
            call = new ZelloDispatchCall(
              statusValue,
              eventContact.currentCall.dispatcher
            );
          }
        }
        contact = new ZelloDispatchChannel(
          contactName,
          isMuted,
          connectionStatus,
          usersOnline,
          options,
          call
        );
      } else {
        contact = new ZelloChannel(
          contactName,
          isMuted,
          connectionStatus,
          usersOnline,
          options
        );
      }
    } else {
      const statusValue = eventContact.status.toLowerCase() as ZelloUserStatus;
      let userStatus = ZelloUserStatus.Offline;
      if (Object.values(ZelloUserStatus).includes(statusValue)) {
        userStatus = statusValue;
      }
      contact = new ZelloUser(
        contactName,
        eventContact.displayName,
        eventContact.isMuted,
        userStatus,
        eventContact.profilePictureUrl,
        eventContact.profilePictureThumbnailUrl
      );
    }
  }
  return contact;
}

export function bridgeIncomingEmergencyToSdkIncomingEmergency(
  emergency: any
): ZelloIncomingEmergency | undefined {
  const channel = bridgeContactToSdkContact(emergency.channel) as ZelloChannel;
  if (!channel) {
    return undefined;
  }
  return new ZelloIncomingEmergency(
    channel,
    new ZelloChannelUser(emergency.channelUserName),
    emergency.emergencyId,
    parseInt(emergency.startTimestamp, 10),
    parseInt(emergency.endTimestamp, 10)
  );
}

export function bridgeHistoryMessageToSdkHistoryMessage(
  message: any
): ZelloHistoryMessage | undefined {
  const contact = bridgeContactToSdkContact(message.contact);
  if (!contact) {
    return undefined;
  }
  switch (message.type) {
    case 'voice':
      return new ZelloHistoryVoiceMessage(
        contact,
        message.channelUserName
          ? new ZelloChannelUser(message.channelUserName)
          : undefined,
        parseInt(message.timestamp, 10),
        message.historyId,
        message.incoming,
        message.durationMs
      );
    case 'image':
      return new ZelloHistoryImageMessage(
        contact,
        message.channelUserName
          ? new ZelloChannelUser(message.channelUserName)
          : undefined,
        parseInt(message.timestamp, 10),
        message.historyId,
        message.incoming
      );
    case 'location':
      return new ZelloHistoryLocationMessage(
        contact,
        message.channelUserName
          ? new ZelloChannelUser(message.channelUserName)
          : undefined,
        parseInt(message.timestamp, 10),
        message.historyId,
        message.incoming,
        message.latitude,
        message.longitude,
        message.accuracy,
        message.address
      );
    case 'text':
      return new ZelloHistoryTextMessage(
        contact,
        message.channelUserName
          ? new ZelloChannelUser(message.channelUserName)
          : undefined,
        parseInt(message.timestamp, 10),
        message.historyId,
        message.incoming,
        message.text
      );
    case 'alert':
      return new ZelloHistoryAlertMessage(
        contact,
        message.channelUserName
          ? new ZelloChannelUser(message.channelUserName)
          : undefined,
        parseInt(message.timestamp, 10),
        message.historyId,
        message.incoming,
        message.text
      );
    default:
      return undefined;
  }
}

export function bridgeCallToSdkCall(call: any): ZelloDispatchCall | undefined {
  if (!call) {
    return undefined;
  }
  const statusValue = call.status.toLowerCase() as ZelloDispatchCallStatus;
  if (!Object.values(ZelloDispatchCallStatus).includes(statusValue)) {
    return undefined;
  }
  return new ZelloDispatchCall(statusValue, call.dispatcher);
}

export function bridgeConsoleSettingsToSdkConsoleSettings(
  settings: any
): ZelloConsoleSettings | undefined {
  if (!settings) {
    return undefined;
  }
  return new ZelloConsoleSettings(settings.allowNonDispatchersToEndCalls);
}
