// noinspection JSUnusedGlobalSymbols

import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import {
  bridgeCallToSdkCall,
  bridgeChannelUserToSdkChannelUser,
  bridgeConsoleSettingsToSdkConsoleSettings,
  isAndroid,
} from '../utils';
import {
  ZelloAccountStatus,
  ZelloAlertMessage,
  ZelloChannel,
  ZelloChannelAlertLevel,
  ZelloConfig,
  ZelloConnectionError,
  ZelloConnectionState,
  ZelloConsoleSettings,
  ZelloContact,
  ZelloContactType,
  ZelloCredentials,
  ZelloDispatchChannel,
  ZelloGroupConversation,
  ZelloHistoryImageMessage,
  ZelloHistoryMessage,
  ZelloHistoryVoiceMessage,
  ZelloImageMessage,
  ZelloIncomingEmergency,
  ZelloIncomingVoiceMessage,
  ZelloLocationMessage,
  ZelloOutgoingEmergency,
  ZelloOutgoingVoiceMessage,
  ZelloOutgoingVoiceMessageError,
  ZelloOutgoingVoiceMessageState,
  ZelloRecentEntry,
  ZelloTextMessage,
  ZelloUser,
} from '../types';
import EventEmitter from 'react-native/Libraries/vendor/emitter/EventEmitter';
import { compareNameAscending, sortedArrayFind } from '../utils/algorithms';
import {
  bridgeContactToSdkContact,
  bridgeHistoryMessageToSdkHistoryMessage,
  bridgeIncomingEmergencyToSdkIncomingEmergency,
} from '../utils';
import { ZelloEvent } from '../events';

const { ZelloAndroidSdkModule, ZelloIOSSdkModule } = NativeModules;

/**
 * Zello SDK.
 * This class is a singleton, and can be accessed via {@link Zello.getInstance}.
 */
export class Zello extends EventEmitter {
  private static instance: Zello;

  public static getInstance(): Zello {
    if (!Zello.instance) {
      Zello.instance = new Zello();
    }
    return Zello.instance;
  }

  /**
   * The current connection state of the SDK.
   */
  public state: ZelloConnectionState = ZelloConnectionState.Disconnected;

  /**
   * The currently selected contact.
   */
  public selectedContact: ZelloContact | undefined;

  /**
   * The list of {@link ZelloUser} in the contact list. Sorted by name, ascending.
   */
  public users: ZelloUser[] = [];
  /**
   * The list of {@link ZelloChannel} in the contact list. Sorted by name, ascending.
   */
  public channels: ZelloChannel[] = [];
  /**
   * The list of {@link ZelloGroupConversation} in the contact list. Sorted by name, ascending.
   */
  public groupConversations: ZelloGroupConversation[] = [];

  /**
   * The current account status. undefined when {@link state} is not {@link ZelloConnectionState.Connected}.
   */
  public accountStatus: ZelloAccountStatus | undefined;

  /**
   * The current incoming voice message.
   */
  public incomingVoiceMessage: ZelloIncomingVoiceMessage | undefined;
  /**
   * The current outgoing voice message.
   */
  public outgoingVoiceMessage: ZelloOutgoingVoiceMessage | undefined;

  /**
   * The configured emergency channel.
   */
  public emergencyChannel: ZelloChannel | undefined;
  /**
   * The list of incoming emergencies. There can be multiple emergencies on the emergency channel at once.
   * Sorted by start timestamp, ascending.
   */
  public incomingEmergencies: ZelloIncomingEmergency[] = [];
  /**
   * The current outgoing emergency.
   */
  public outgoingEmergency: ZelloOutgoingEmergency | undefined;

  /**
   * The list of recent entries. Sorted by timestamp, descending.
   */
  public recents: ZelloRecentEntry[] = [];

  /**
   * The currently playing history voice message.
   */
  public historyVoiceMessage: ZelloHistoryVoiceMessage | undefined;

  /**
   * The console settings for the network.
   * This is only expected to be valid when {@link state} is {@link ZelloConnectionState.Connected}.
   */
  public consoleSettings: ZelloConsoleSettings | undefined;

  private eventListener: EmitterSubscription | undefined;

  private constructor() {
    super();
    const sdk = Zello.getSdk();
    if (sdk) {
      let eventEmitter: NativeEventEmitter;
      if (isAndroid) {
        eventEmitter = new NativeEventEmitter();
      } else {
        eventEmitter = new NativeEventEmitter(sdk);
      }
      this.setupEventListener(eventEmitter);
    }
  }

  /**
   * Sets configuration variables for the SDK.
   * @param config The configuration to set.
   */
  public configure(config: ZelloConfig) {
    if (isAndroid) {
      ZelloAndroidSdkModule.configure(
        config.android.enableOfflineMessagePushNotifications,
        config.android.enableForegroundService
      );
    } else {
      ZelloIOSSdkModule.configure(config.ios.isDebugBuild, config.ios.appGroup);
    }
  }

  /**
   * Destroys the SDK instance and cleans up resources.
   * Call this when you are done using the SDK instance for good (application quit).
   */
  public destroy() {
    this.removeAllListeners();
    this.eventListener?.remove();
  }

  /**
   * Signs into to the Zello Work network using the provided credentials.
   * This will typically trigger the {@link ZelloEvent.CONNECT_STARTED} event, followed by either {@link ZelloEvent.CONNECT_SUCCEEDED} or {@link ZelloEvent.CONNECT_FAILED}.
   * However, if the state is incorrect, {@link ZelloEvent.CONNECT_FAILED} will be triggered immediately.
   * @param credentials The credentials to use for signing in.
   */
  public connect(credentials: ZelloCredentials) {
    if (isAndroid) {
      ZelloAndroidSdkModule.connect(
        credentials.network,
        credentials.username,
        credentials.password
      );
    } else {
      ZelloIOSSdkModule.connect(
        credentials.network,
        credentials.username,
        credentials.password
      );
    }
  }

  /**
   * Signs out of the Zello Work network.
   * This will trigger the {@link ZelloEvent.DISCONNECTED} event.
   */
  public disconnect() {
    if (isAndroid) {
      ZelloAndroidSdkModule.disconnect();
    } else {
      ZelloIOSSdkModule.disconnect();
    }
  }

  /**
   * Returns the user with the given name. Case-insensitive.
   * @param name The name of the user to search for.
   * @return The user with the given name, or null if no user with that name exists.
   */
  public getUser(name: string): ZelloUser | undefined {
    return sortedArrayFind(this.users, name, compareNameAscending);
  }

  /**
   * Returns the channel with the given name. Case-insensitive.
   * @param name The name of the channel to search for.
   * @return The channel with the given name, or null if no channel with that name exists.
   */
  public getChannel(name: string): ZelloChannel | undefined {
    return sortedArrayFind(this.channels, name, compareNameAscending);
  }

  /**
   * Returns the group conversation with the given name. Case-insensitive.
   * @param name The name of the group conversation to search for.
   * @return The group conversation with the given name, or null if no group conversation with that name exists.
   */
  public getGroupConversation(
    name: string
  ): ZelloGroupConversation | undefined {
    return sortedArrayFind(this.groupConversations, name, compareNameAscending);
  }

  /**
   * Sets the selected contact.
   * While optional, this is typically used for tracking the contact that the user is currently interacting with.
   * This will trigger the {@link ZelloEvent.SELECTED_CONTACT_CHANGED} event.
   * @param contact The contact to set as selected.
   */
  public setSelectedContact(contact: ZelloContact) {
    if (isAndroid) {
      ZelloAndroidSdkModule.setSelectedContact(contact.name, contact.type);
    } else {
      ZelloIOSSdkModule.selectContact(contact.name, contact.type);
    }
  }

  /**
   * Sets the user's online account status.
   * This will trigger the {@link ZelloEvent.ACCOUNT_STATUS_CHANGED} event.
   * @param status The account status to set.
   */
  public setAccountStatus(status: ZelloAccountStatus) {
    if (isAndroid) {
      ZelloAndroidSdkModule.setAccountStatus(status);
    } else {
      ZelloIOSSdkModule.setAccountStatus(status);
    }
  }

  /**
   * Connects to the given channel.
   * Once connected, the user will be able to send and receive messages from the channel.
   * This will trigger the {@link ZelloEvent.CONTACT_LIST_UPDATED} event.
   * @param channel The channel to connect to.
   */
  public connectChannel(channel: ZelloChannel) {
    if (isAndroid) {
      ZelloAndroidSdkModule.connectChannel(channel.name);
    } else {
      if (channel.type === ZelloContactType.GroupConversation) {
        ZelloIOSSdkModule.connectGroupConversation(channel.name);
      } else {
        ZelloIOSSdkModule.connectChannel(channel.name);
      }
    }
  }

  /**
   * Disconnects from the given channel.
   * Once disconnected, the user will no longer be able to send or receive messages from the channel.
   * This will trigger the {@link ZelloEvent.CONTACT_LIST_UPDATED} event.
   * @param channel The channel to disconnect from.
   */
  public disconnectChannel(channel: ZelloChannel) {
    if (isAndroid) {
      ZelloAndroidSdkModule.disconnectChannel(channel.name);
    } else {
      if (channel.type === ZelloContactType.GroupConversation) {
        ZelloIOSSdkModule.disconnectGroupConversation(channel.name);
      } else {
        ZelloIOSSdkModule.disconnectChannel(channel.name);
      }
    }
  }

  /**
   * Starts a voice message with the given contact.
   * This will trigger the {@link ZelloEvent.OUTGOING_VOICE_MESSAGE_CONNECTING} event, followed by the {@link ZelloEvent.OUTGOING_VOICE_MESSAGE_STARTED} event.
   * If there is an error, the {@link ZelloEvent.OUTGOING_VOICE_MESSAGE_STOPPED} event will be triggered.
   * @param contact The contact to start the voice message with.
   */
  public startVoiceMessage(contact: ZelloContact) {
    if (isAndroid) {
      ZelloAndroidSdkModule.startVoiceMessage(contact.name, contact.type);
    } else {
      ZelloIOSSdkModule.startVoiceMessage(contact.name, contact.type);
    }
  }

  /**
   * Stops the current outgoing voice message.
   * This will trigger the {@link ZelloEvent.OUTGOING_VOICE_MESSAGE_STOPPED} event.
   */
  public stopVoiceMessage() {
    if (isAndroid) {
      ZelloAndroidSdkModule.stopVoiceMessage();
    } else {
      ZelloIOSSdkModule.stopVoiceMessage();
    }
  }

  /**
   * Sends the image message data to the given contact.
   * This will trigger the {@link ZelloEvent.OUTGOING_IMAGE_MESSAGE_SENT} or {@link ZelloEvent.OUTGOING_IMAGE_MESSAGE_SEND_FAILED} event.
   * @param contact The contact to send the image to.
   * @param data The image data to send.
   */
  public sendImage(contact: ZelloContact, data: number[]) {
    if (isAndroid) {
      ZelloAndroidSdkModule.sendImage(contact.name, contact.type, data);
    } else {
      ZelloIOSSdkModule.sendImage(contact.name, contact.type, data);
    }
  }

  /**
   * Sends the alert message to the given contact.
   * This will trigger the {@link ZelloEvent.OUTGOING_ALERT_MESSAGE_SENT} or {@link ZelloEvent.OUTGOING_ALERT_MESSAGE_SEND_FAILED} event.
   * @param contact The contact to send the alert to.
   */
  public sendLocation(contact: ZelloContact) {
    if (isAndroid) {
      ZelloAndroidSdkModule.sendLocation(contact.name, contact.type);
    } else {
      ZelloIOSSdkModule.sendLocation(contact.name, contact.type);
    }
  }

  /**
   * Sends the text message to the given contact.
   * This will trigger the {@link ZelloEvent.OUTGOING_TEXT_MESSAGE_SENT} or {@link ZelloEvent.OUTGOING_TEXT_MESSAGE_SEND_FAILED} event.
   * @param contact The contact to send the text to.
   * @param text The text to send.
   */
  public sendText(contact: ZelloContact, text: string) {
    if (isAndroid) {
      ZelloAndroidSdkModule.sendText(contact.name, contact.type, text);
    } else {
      ZelloIOSSdkModule.sendText(contact.name, contact.type, text);
    }
  }

  /**
   * Sends the alert message to the given contact.
   * This will trigger the {@link ZelloEvent.OUTGOING_ALERT_MESSAGE_SENT} or {@link ZelloEvent.OUTGOING_ALERT_MESSAGE_SEND_FAILED} event.
   * @param contact The contact to send the alert to.
   * @param text The text to send.
   * @param level Optional; The alert level to send. Only applicable for channels.
   */
  public sendAlert(
    contact: ZelloContact,
    text: string,
    level?: ZelloChannelAlertLevel
  ) {
    if (isAndroid) {
      ZelloAndroidSdkModule.sendAlert(contact.name, contact.type, text, level);
    } else {
      ZelloIOSSdkModule.sendAlert(contact.name, contact.type, text, level);
    }
  }

  /**
   * Submits a problem report to Zello.
   * Additionally, please contact us to provide more information on what happened.
   */
  public submitProblemReport() {
    if (isAndroid) {
      ZelloAndroidSdkModule.submitProblemReport();
    } else {
      ZelloIOSSdkModule.submitProblemReport();
    }
  }

  /**
   * Mutes the given contact. When muted, incoming messages from this contact will not play live, but will still appear in the history.
   * This will trigger the {@link ZelloEvent.CONTACT_LIST_UPDATED} event.
   * @param contact The contact to mute.
   */
  public muteContact(contact: ZelloContact) {
    if (isAndroid) {
      ZelloAndroidSdkModule.muteContact(contact.name, contact.type);
    } else {
      ZelloIOSSdkModule.muteContact(contact.name, contact.type);
    }
  }

  /**
   * Unmutes a previously muted contact. When unmuted, incoming messages from this contact will play live.
   * This will trigger the {@link ZelloEvent.CONTACT_LIST_UPDATED} event.
   * @param contact The contact to unmute.
   */
  public unmuteContact(contact: ZelloContact) {
    if (isAndroid) {
      ZelloAndroidSdkModule.unmuteContact(contact.name, contact.type);
    } else {
      ZelloIOSSdkModule.unmuteContact(contact.name, contact.type);
    }
  }

  /**
   * Starts an outgoing emergency to the emergency channel.
   * Upon starting, the user's location will be sent, an alert message will be sent, and a 10-second-long voice message will start recording.
   * This will trigger the {@link ZelloEvent.OUTGOING_EMERGENCY_STARTED} event.
   */
  public startEmergency() {
    if (isAndroid) {
      ZelloAndroidSdkModule.startEmergency();
    } else {
      ZelloIOSSdkModule.startEmergency();
    }
  }

  /**
   * Stops the outgoing emergency.
   * This will trigger the {@link ZelloEvent.OUTGOING_EMERGENCY_STOPPED} event.
   */
  public stopEmergency() {
    if (isAndroid) {
      ZelloAndroidSdkModule.stopEmergency();
    } else {
      ZelloIOSSdkModule.stopEmergency();
    }
  }

  /**
   * Returns the history messages for the given contact.
   * @param contact The contact to get the history for.
   * @param size Optional; The number of history items to retrieve. Defaults to 50.
   * @return The history items for the given contact.
   */
  public getHistory(
    contact: ZelloContact,
    size?: number
  ): Promise<ZelloHistoryMessage[]> {
    const defaultHistorySize = 50;
    return new Promise((resolve) => {
      const callback = (history: any[] | undefined) => {
        if (!history) {
          resolve([]);
          return;
        }
        const messages = history
          .map((message) => bridgeHistoryMessageToSdkHistoryMessage(message))
          .filter((item) => item !== undefined) as ZelloHistoryMessage[];
        resolve(messages);
      };
      if (isAndroid) {
        ZelloAndroidSdkModule.getHistory(
          contact.name,
          contact.type,
          size ?? defaultHistorySize,
          callback
        );
      } else {
        ZelloIOSSdkModule.getHistory(
          contact.name,
          contact.type,
          size ?? defaultHistorySize,
          callback
        );
      }
    });
  }

  /**
   * Plays the given history message.
   * This will trigger the {@link ZelloEvent.HISTORY_PLAYBACK_STARTED} event.
   * @param message The history message to play.
   */
  public playHistoryMessage(message: ZelloHistoryVoiceMessage) {
    if (isAndroid) {
      ZelloAndroidSdkModule.playHistoryMessage(
        message.historyId,
        message.contact.name,
        message.contact.type
      );
    } else {
      ZelloIOSSdkModule.playHistoryMessage(
        message.historyId,
        message.contact.name,
        message.contact.type
      );
    }
  }

  /**
   * Stops the current history message playback.
   * This will trigger the {@link ZelloEvent.HISTORY_PLAYBACK_STOPPED} event.
   */
  public stopHistoryMessagePlayback() {
    if (isAndroid) {
      ZelloAndroidSdkModule.stopHistoryMessagePlayback();
    } else {
      ZelloIOSSdkModule.stopHistoryMessagePlayback();
    }
  }

  /**
   * Returns the image data for the given history image message.
   * @param message The history image message to get the image data for.
   * @return The image data for the given history image message.
   */
  public getImageDataForHistoryImageMessage(
    message: ZelloHistoryImageMessage
  ): Promise<string | undefined> {
    return new Promise((resolve) => {
      if (isAndroid) {
        ZelloAndroidSdkModule.getImageDataForHistoryImageMessage(
          message.historyId,
          message.contact.name,
          message.contact.type,
          (data: string | undefined) => resolve(data)
        );
      } else {
        ZelloIOSSdkModule.getHistoryImageData(
          message.historyId,
          message.contact.name,
          message.contact.type,
          (data: string | undefined) => resolve(data)
        );
      }
    });
  }

  /**
   * Ends the dispatch call for the given dispatch channel.
   * This will trigger the {@link ZelloEvent.DISPATCH_CALL_ENDED} event.
   *
   * If {@link consoleSettings | ZelloConsoleSettings.allowNonDispatchersToEndCalls} is false, this method will do nothing.
   *
   * @param channel The dispatch channel to end the call for.
   */
  public endDispatchCall(channel: ZelloDispatchChannel) {
    if (isAndroid) {
      ZelloAndroidSdkModule.endDispatchCall(channel.name);
    } else {
      ZelloIOSSdkModule.endDispatchCall(channel.name);
    }
  }

  /**
   * Creates a new group conversation with the given users.
   * This will trigger the {@link ZelloEvent.GROUP_CONVERSATION_CREATED} and {@link ZelloEvent.CONTACT_LIST_UPDATED} events.
   * @param users The users to create the group conversation with.
   * @param displayName Optional; The display name of the group conversation. The conversation can be renamed later by using {@link renameGroupConversation}.
   */
  public createGroupConversation(users: ZelloUser[], displayName?: string) {
    if (!this.consoleSettings?.allowGroupConversations) {
      return;
    }
    if (isAndroid) {
      ZelloAndroidSdkModule.createGroupConversation(
        users.map((user) => user.name),
        displayName
      );
    } else {
      ZelloIOSSdkModule.createGroupConversation(
        users.map((user) => user.name),
        displayName
      );
    }
  }

  /**
   * Adds users to the given group conversation.
   * This will trigger the {@link ZelloEvent.GROUP_CONVERSATION_USERS_ADDED} and {@link ZelloEvent.CONTACT_LIST_UPDATED} events.
   * @param groupConversation The group conversation to add users to.
   * @param users The users to add to the group conversation.
   */
  public addUsersToGroupConversation(
    groupConversation: ZelloGroupConversation,
    users: ZelloUser[]
  ) {
    if (!this.consoleSettings?.allowGroupConversations) {
      return;
    }
    if (isAndroid) {
      ZelloAndroidSdkModule.addUsersToGroupConversation(
        groupConversation.name,
        users.map((user) => user.name)
      );
    } else {
      ZelloIOSSdkModule.addUsersToGroupConversation(
        groupConversation.name,
        users.map((user) => user.name)
      );
    }
  }

  /**
   * Removes the user from the group conversation.
   * This will trigger the {@link ZelloEvent.GROUP_CONVERSATION_LEFT} and {@link ZelloEvent.CONTACT_LIST_UPDATED} events.
   * @param groupConversation The group conversation to leave.
   */
  public leaveGroupConversation(groupConversation: ZelloGroupConversation) {
    if (!this.consoleSettings?.allowGroupConversations) {
      return;
    }
    if (isAndroid) {
      ZelloAndroidSdkModule.leaveGroupConversation(groupConversation.name);
    } else {
      ZelloIOSSdkModule.leaveGroupConversation(groupConversation.name);
    }
  }

  /**
   * Renames the group conversation.
   * This will trigger the {@link ZelloEvent.GROUP_CONVERSATION_RENAMED} and {@link ZelloEvent.CONTACT_LIST_UPDATED} events.
   * @param groupConversation The group conversation to rename.
   * @param name The new name for the group conversation.
   */
  public renameGroupConversation(
    groupConversation: ZelloGroupConversation,
    name: string
  ) {
    if (!this.consoleSettings?.allowGroupConversations) {
      return;
    }
    if (isAndroid) {
      ZelloAndroidSdkModule.renameGroupConversation(
        groupConversation.name,
        name
      );
    } else {
      ZelloIOSSdkModule.renameGroupConversation(groupConversation.name, name);
    }
  }

  private setupEventListener(eventEmitter: NativeEventEmitter) {
    this.eventListener = eventEmitter.addListener('zellosdk', (event) => {
      const eventName = event.eventName;
      switch (eventName) {
        case 'onConnectFailed': {
          this.state = ZelloConnectionState.Disconnected;
          const error =
            (event.error?.toLowerCase() as ZelloConnectionError) ??
            ZelloConnectionError.Unknown;
          this.emit(ZelloEvent.CONNECT_FAILED, this.state, error);
          break;
        }
        case 'onConnectStarted': {
          this.state = ZelloConnectionState.Connecting;
          this.emit(ZelloEvent.CONNECT_STARTED, this.state);
          break;
        }
        case 'onConnectSucceeded': {
          this.state = ZelloConnectionState.Connected;
          this.emit(ZelloEvent.CONNECT_SUCCEEDED, this.state);
          break;
        }
        case 'onDisconnected': {
          this.state = ZelloConnectionState.Disconnected;
          this.emit(ZelloEvent.DISCONNECTED, this.state);
          break;
        }
        case 'onWillReconnect': {
          this.state = ZelloConnectionState.Reconnecting;
          this.emit(ZelloEvent.RECONNECTING, this.state);
          break;
        }
        case 'onContactListUpdated': {
          this.clearContactList();

          this.users = event.users.map((user: any) =>
            bridgeContactToSdkContact(user)
          );
          this.users.sort(compareNameAscending);

          this.channels = event.channels.map((channel: any) =>
            bridgeContactToSdkContact(channel)
          );
          this.channels.sort(compareNameAscending);

          this.groupConversations = event.groupConversations.map(
            (groupConversation: any) =>
              bridgeContactToSdkContact(groupConversation)
          );
          this.groupConversations.sort(compareNameAscending);

          if (event.emergencyChannel) {
            this.emergencyChannel = bridgeContactToSdkContact(
              event.emergencyChannel
            ) as ZelloChannel;
          }

          this.emit(
            ZelloEvent.CONTACT_LIST_UPDATED,
            this.users,
            this.channels,
            this.groupConversations
          );
          break;
        }
        case 'onSelectedContactChanged': {
          this.selectedContact = event.contact
            ? bridgeContactToSdkContact(event.contact)
            : undefined;
          this.emit(ZelloEvent.SELECTED_CONTACT_CHANGED, this.selectedContact);
          break;
        }
        case 'onAccountStatusChanged': {
          const statusValue = event.status?.toLowerCase() as ZelloAccountStatus;
          if (
            !statusValue ||
            Object.values(ZelloAccountStatus).includes(statusValue)
          ) {
            this.accountStatus = statusValue;
            this.emit(ZelloEvent.ACCOUNT_STATUS_CHANGED, this.accountStatus);
          }
          break;
        }
        case 'onIncomingVoiceMessageStarted': {
          const contact = bridgeContactToSdkContact(event.contact);
          if (!contact) {
            break;
          }
          this.incomingVoiceMessage = new ZelloIncomingVoiceMessage(
            contact,
            bridgeChannelUserToSdkChannelUser(event.channelUser),
            parseInt(event.timestamp, 10)
          );
          this.emit(
            ZelloEvent.INCOMING_VOICE_MESSAGE_STARTED,
            this.incomingVoiceMessage
          );
          break;
        }
        case 'onIncomingVoiceMessageStopped': {
          this.incomingVoiceMessage = undefined;
          const contact = bridgeContactToSdkContact(event.contact);
          if (!contact) {
            break;
          }
          this.emit(
            ZelloEvent.INCOMING_VOICE_MESSAGE_STOPPED,
            new ZelloIncomingVoiceMessage(
              contact,
              bridgeChannelUserToSdkChannelUser(event.channelUser),
              parseInt(event.timestamp, 10)
            )
          );
          break;
        }
        case 'onOutgoingVoiceMessageConnecting': {
          const contact = bridgeContactToSdkContact(event.contact);
          if (!contact) {
            break;
          }
          this.outgoingVoiceMessage = new ZelloOutgoingVoiceMessage(
            contact,
            parseInt(event.timestamp, 10),
            ZelloOutgoingVoiceMessageState.Connecting
          );
          this.emit(
            ZelloEvent.OUTGOING_VOICE_MESSAGE_CONNECTING,
            this.outgoingVoiceMessage
          );
          break;
        }
        case 'onOutgoingVoiceMessageStarted': {
          const contact = bridgeContactToSdkContact(event.contact);
          if (!contact) {
            break;
          }
          this.outgoingVoiceMessage = new ZelloOutgoingVoiceMessage(
            contact,
            parseInt(event.timestamp, 10),
            ZelloOutgoingVoiceMessageState.Sending
          );
          this.emit(
            ZelloEvent.OUTGOING_VOICE_MESSAGE_STARTED,
            this.outgoingVoiceMessage
          );
          break;
        }
        case 'onOutgoingVoiceMessageStopped': {
          this.outgoingVoiceMessage = undefined;
          const contact = bridgeContactToSdkContact(event.contact);
          if (!contact) {
            break;
          }
          const isError = event.error != null; // This checks for both null and undefined
          let error: ZelloOutgoingVoiceMessageError | undefined;
          if (isError) {
            error =
              (event.error?.toLowerCase() as ZelloOutgoingVoiceMessageError) ??
              ZelloOutgoingVoiceMessageError.Unknown;
          }
          this.emit(
            ZelloEvent.OUTGOING_VOICE_MESSAGE_STOPPED,
            new ZelloOutgoingVoiceMessage(
              contact,
              parseInt(event.timestamp, 10),
              isError
                ? ZelloOutgoingVoiceMessageState.Failed
                : ZelloOutgoingVoiceMessageState.Sent
            ),
            error
          );
          break;
        }
        case 'onIncomingImageMessage': {
          const contact = bridgeContactToSdkContact(event.contact);
          if (!contact) {
            break;
          }
          this.emit(
            ZelloEvent.INCOMING_IMAGE_MESSAGE_RECEIVED,
            new ZelloImageMessage(
              contact,
              bridgeChannelUserToSdkChannelUser(event.channelUser),
              true,
              parseInt(event.timestamp, 10),
              event.thumbnail,
              event.image
            )
          );
          break;
        }
        case 'onOutgoingImageMessageSent': {
          const contact = bridgeContactToSdkContact(event.contact);
          if (!contact) {
            break;
          }
          this.emit(
            ZelloEvent.OUTGOING_IMAGE_MESSAGE_SENT,
            new ZelloImageMessage(
              contact,
              undefined,
              false,
              parseInt(event.timestamp, 10),
              event.thumbnail,
              event.image
            )
          );
          break;
        }
        case 'onOutgoingImageMessageSendFailed': {
          const contact = bridgeContactToSdkContact(event.contact);
          if (!contact) {
            break;
          }
          this.emit(
            ZelloEvent.OUTGOING_IMAGE_MESSAGE_SEND_FAILED,
            new ZelloImageMessage(
              contact,
              undefined,
              false,
              parseInt(event.timestamp, 10),
              event.thumbnail,
              event.image
            )
          );
          break;
        }
        case 'onIncomingAlertMessage': {
          const contact = bridgeContactToSdkContact(event.contact);
          if (!contact) {
            break;
          }
          this.emit(
            ZelloEvent.INCOMING_ALERT_MESSAGE_RECEIVED,
            new ZelloAlertMessage(
              contact,
              bridgeChannelUserToSdkChannelUser(event.channelUser),
              true,
              parseInt(event.timestamp, 10),
              event.text
            )
          );
          break;
        }
        case 'onOutgoingAlertMessageSent': {
          const contact = bridgeContactToSdkContact(event.contact);
          if (!contact) {
            break;
          }
          this.emit(
            ZelloEvent.OUTGOING_ALERT_MESSAGE_SENT,
            new ZelloAlertMessage(
              contact,
              undefined,
              false,
              parseInt(event.timestamp, 10),
              event.text
            )
          );
          break;
        }
        case 'onOutgoingAlertMessageSendFailed': {
          const contact = bridgeContactToSdkContact(event.contact);
          if (!contact) {
            break;
          }
          this.emit(
            ZelloEvent.OUTGOING_ALERT_MESSAGE_SEND_FAILED,
            new ZelloAlertMessage(
              contact,
              undefined,
              false,
              parseInt(event.timestamp, 10),
              event.text
            )
          );
          break;
        }
        case 'onIncomingTextMessage': {
          const contact = bridgeContactToSdkContact(event.contact);
          if (!contact) {
            break;
          }
          this.emit(
            ZelloEvent.INCOMING_TEXT_MESSAGE_RECEIVED,
            new ZelloTextMessage(
              contact,
              bridgeChannelUserToSdkChannelUser(event.channelUser),
              true,
              parseInt(event.timestamp, 10),
              event.text
            )
          );
          break;
        }
        case 'onOutgoingTextMessageSent': {
          const contact = bridgeContactToSdkContact(event.contact);
          if (!contact) {
            break;
          }
          this.emit(
            ZelloEvent.OUTGOING_TEXT_MESSAGE_SENT,
            new ZelloTextMessage(
              contact,
              undefined,
              false,
              parseInt(event.timestamp, 10),
              event.text
            )
          );
          break;
        }
        case 'onOutgoingTextMessageSendFailed': {
          const contact = bridgeContactToSdkContact(event.contact);
          if (!contact) {
            break;
          }
          this.emit(
            ZelloEvent.OUTGOING_TEXT_MESSAGE_SEND_FAILED,
            new ZelloTextMessage(
              contact,
              undefined,
              false,
              parseInt(event.timestamp, 10),
              event.text
            )
          );
          break;
        }
        case 'onIncomingLocationMessage': {
          const contact = bridgeContactToSdkContact(event.contact);
          if (!contact) {
            break;
          }
          this.emit(
            ZelloEvent.INCOMING_LOCATION_MESSAGE_RECEIVED,
            new ZelloLocationMessage(
              contact,
              bridgeChannelUserToSdkChannelUser(event.channelUser),
              true,
              parseInt(event.timestamp, 10),
              event.latitude,
              event.longitude,
              event.accuracy,
              event.address
            ).contact
          );
          break;
        }
        case 'onOutgoingLocationMessageSent': {
          const contact = bridgeContactToSdkContact(event.contact);
          if (!contact) {
            break;
          }
          this.emit(
            ZelloEvent.OUTGOING_LOCATION_MESSAGE_SENT,
            new ZelloLocationMessage(
              contact,
              undefined,
              false,
              parseInt(event.timestamp, 10),
              event.latitude,
              event.longitude,
              event.accuracy,
              event.address
            )
          );
          break;
        }
        case 'onOutgoingLocationMessageSendFailed': {
          const contact = bridgeContactToSdkContact(event.contact);
          if (!contact) {
            break;
          }
          this.emit(
            ZelloEvent.OUTGOING_LOCATION_MESSAGE_SEND_FAILED,
            new ZelloLocationMessage(
              contact,
              undefined,
              false,
              parseInt(event.timestamp, 10),
              event.latitude,
              event.longitude,
              event.accuracy,
              event.address
            )
          );
          break;
        }
        case 'onIncomingEmergencyStarted': {
          this.incomingEmergencies = [];
          event.emergencies.forEach((emergency: any) => {
            const incomingEmergency =
              bridgeIncomingEmergencyToSdkIncomingEmergency(emergency);
            if (incomingEmergency) {
              this.incomingEmergencies.push(incomingEmergency);
            }
          });
          this.incomingEmergencies.sort(
            (a: ZelloIncomingEmergency, b: ZelloIncomingEmergency) =>
              a.startTimestamp - b.startTimestamp
          );
          this.emit(
            ZelloEvent.INCOMING_EMERGENCY_STARTED,
            bridgeIncomingEmergencyToSdkIncomingEmergency(event.emergency),
            this.incomingEmergencies
          );
          break;
        }
        case 'onIncomingEmergencyStopped': {
          this.incomingEmergencies = [];
          event.emergencies.forEach((emergency: any) => {
            const incomingEmergency =
              bridgeIncomingEmergencyToSdkIncomingEmergency(emergency);
            if (incomingEmergency) {
              this.incomingEmergencies.push(incomingEmergency);
            }
          });
          this.emit(
            ZelloEvent.INCOMING_EMERGENCY_STOPPED,
            bridgeIncomingEmergencyToSdkIncomingEmergency(event.emergency)
          );
          break;
        }
        case 'onOutgoingEmergencyStarted': {
          const channel = bridgeContactToSdkContact(
            event.channel
          ) as ZelloChannel;
          if (!channel) {
            break;
          }
          this.outgoingEmergency = new ZelloOutgoingEmergency(
            channel,
            parseInt(event.startTimestamp, 10),
            undefined
          );
          this.emit(
            ZelloEvent.OUTGOING_EMERGENCY_STARTED,
            this.outgoingEmergency
          );
          break;
        }
        case 'onOutgoingEmergencyStopped': {
          const channel = bridgeContactToSdkContact(
            event.channel
          ) as ZelloChannel;
          if (!channel) {
            break;
          }
          this.outgoingEmergency = undefined;
          this.emit(
            ZelloEvent.OUTGOING_EMERGENCY_STOPPED,
            new ZelloOutgoingEmergency(
              channel,
              parseInt(event.startTimestamp, 10),
              event.endTimestamp
            )
          );
          break;
        }
        case 'onRecentsUpdated': {
          this.recents = event.recents
            .map((recent: any) => {
              const contact = bridgeContactToSdkContact(recent.contact);
              if (!contact) {
                return undefined;
              }
              return new ZelloRecentEntry(
                contact,
                bridgeChannelUserToSdkChannelUser(event.channelUser),
                parseInt(recent.timestamp, 10),
                recent.type.toLowerCase(),
                recent.incoming
              );
            })
            .filter(
              (recent: ZelloRecentEntry | undefined) => recent !== undefined
            );
          this.emit(ZelloEvent.RECENTS_UPDATED, this.recents);
          break;
        }
        case 'onHistoryUpdated': {
          this.emit(ZelloEvent.HISTORY_UPDATED);
          break;
        }
        case 'onHistoryPlaybackStarted': {
          this.historyVoiceMessage = bridgeHistoryMessageToSdkHistoryMessage(
            event
          ) as ZelloHistoryVoiceMessage;
          this.emit(
            ZelloEvent.HISTORY_PLAYBACK_STARTED,
            this.historyVoiceMessage
          );
          break;
        }
        case 'onHistoryPlaybackStopped': {
          this.historyVoiceMessage = undefined;
          this.emit(
            ZelloEvent.HISTORY_PLAYBACK_STOPPED,
            this.historyVoiceMessage
          );
          break;
        }
        case 'onConsoleSettingsChanged': {
          this.consoleSettings =
            bridgeConsoleSettingsToSdkConsoleSettings(event);
          this.emit(ZelloEvent.CONSOLE_SETTINGS_CHANGED, this.consoleSettings);
          break;
        }
        case 'onDispatchCallTransferred':
        case 'onDispatchCallEnded':
        case 'onDispatchCallActive':
        case 'onDispatchCallPending': {
          this.processDispatchCallEvent(event);
          break;
        }
        case 'onGroupConversationLeft': {
          const groupConversation = bridgeContactToSdkContact(
            event.conversation
          ) as ZelloGroupConversation;
          if (!groupConversation) {
            break;
          }
          this.emit(ZelloEvent.GROUP_CONVERSATION_LEFT, groupConversation);
          break;
        }
        case 'onGroupConversationInvite': {
          const groupConversation = bridgeContactToSdkContact(
            event.conversation
          ) as ZelloGroupConversation;
          if (!groupConversation) {
            break;
          }
          this.emit(ZelloEvent.GROUP_CONVERSATION_INVITE, groupConversation);
          break;
        }
        case 'onGroupConversationCreated': {
          const groupConversation = bridgeContactToSdkContact(
            event.conversation
          ) as ZelloGroupConversation;
          if (!groupConversation) {
            break;
          }
          this.emit(ZelloEvent.GROUP_CONVERSATION_CREATED, groupConversation);
          break;
        }
        case 'onGroupConversationRenamed': {
          const groupConversation = bridgeContactToSdkContact(
            event.conversation
          ) as ZelloGroupConversation;
          if (!groupConversation) {
            break;
          }
          this.emit(ZelloEvent.GROUP_CONVERSATION_RENAMED, groupConversation);
          break;
        }
        case 'onGroupConversationUsersAdded': {
          const groupConversation = bridgeContactToSdkContact(
            event.conversation
          ) as ZelloGroupConversation;
          if (!groupConversation) {
            break;
          }
          const users = event.users.map((user: any) =>
            bridgeChannelUserToSdkChannelUser(user)
          );
          if (!users || users.length === 0) {
            return;
          }
          this.emit(
            ZelloEvent.GROUP_CONVERSATION_USERS_ADDED,
            groupConversation,
            users
          );
          break;
        }
        case 'onGroupConversationUsersLeft': {
          const groupConversation = bridgeContactToSdkContact(
            event.conversation
          ) as ZelloGroupConversation;
          if (!groupConversation) {
            break;
          }
          const users = event.users.map((user: any) =>
            bridgeChannelUserToSdkChannelUser(user)
          );
          if (!users || users.length === 0) {
            return;
          }
          this.emit(
            ZelloEvent.GROUP_CONVERSATION_USERS_LEFT,
            groupConversation,
            users
          );
          break;
        }
        default:
          break;
      }
    });
  }

  private processDispatchCallEvent(event: any) {
    const channel = bridgeContactToSdkContact(
      event.channel
    ) as ZelloDispatchChannel;
    const call = bridgeCallToSdkCall(event.call);
    if (!channel || !call) {
      return;
    }
    switch (event.name) {
      case 'onDispatchCallTransferred':
        this.emit(ZelloEvent.DISPATCH_CALL_TRANSFERRED, channel, call);
        break;
      case 'onDispatchCallEnded':
        this.emit(ZelloEvent.DISPATCH_CALL_ENDED, channel, call);
        break;
      case 'onDispatchCallActive':
        this.emit(ZelloEvent.DISPATCH_CALL_ACTIVE, channel, call);
        break;
      case 'onDispatchCallPending':
        this.emit(ZelloEvent.DISPATCH_CALL_PENDING, channel, call);
        break;
      default:
        break;
    }
  }

  private clearContactList() {
    this.users = [];
    this.channels = [];
    this.groupConversations = [];
  }

  private static getSdk() {
    if (isAndroid) {
      return ZelloAndroidSdkModule;
    }
    return ZelloIOSSdkModule;
  }
}
