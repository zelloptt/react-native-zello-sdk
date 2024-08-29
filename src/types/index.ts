// noinspection JSUnusedGlobalSymbols

/**
 * The parent type for all Zello contact types, including users and channels.
 */
export type ZelloContact = {
  /**
   * The name of the contact. Names are unique within their type.
   * When comparing names, it is recommended to do so in a case-insensitive manner.
   */
  name: string;
  /**
   * The type of contact.
   */
  type: ZelloContactType;
  /**
   * Whether the contact is muted.
   * When a contact is muted, messages from the contact will not play live, but they will still be in the history.
   */
  isMuted: boolean;
};

/**
 * The type of {@link ZelloContact}.
 */
export enum ZelloContactType {
  User = 'user',
  Channel = 'channel',
}

/**
 * The status of a {@link ZelloUser}.
 */
export enum ZelloUserStatus {
  /**
   * The user is connected. Messages will play live.
   */
  Available = 'available',
  /**
   * The user is connected. Messages will not play live.
   */
  Busy = 'busy',
  /**
   * The user is disconnected. Messages will not play live.
   * The user will download messages sent to them when they reconnect.
   */
  Standby = 'standby',
  /**
   * The user is disconnected and cannot receive messages.
   */
  Offline = 'offline',
}

/**
 * A Zello user.
 */
export class ZelloUser implements ZelloContact {
  public name: string;
  /**
   * The display name of the user. This should be used for UI purposes.
   * Display names are not unique.
   */
  public displayName: string;
  public type: ZelloContactType;
  public isMuted: boolean;
  public status: ZelloUserStatus;
  /**
   * The URL of the user's profile picture.
   */
  public profilePictureUrl: string | undefined;
  /**
   * The URL of the user's profile picture thumbnail.
   * This can be used for displaying a smaller version of the profile picture (such as in a list).
   */
  public profilePictureThumbnailUrl: string | undefined;

  constructor(
    name: string,
    displayName: string,
    isMuted: boolean,
    status: ZelloUserStatus,
    profilePictureUrl: string | undefined,
    profilePictureThumbnailUrl: string | undefined
  ) {
    this.name = name;
    this.type = ZelloContactType.User;
    this.displayName = displayName;
    this.isMuted = isMuted;
    this.status = status;
    this.profilePictureUrl = profilePictureUrl;
    this.profilePictureThumbnailUrl = profilePictureThumbnailUrl;
  }
}

/**
 * A Zello channel. A channel contains multiple users.
 */
export class ZelloChannel implements ZelloContact {
  public name: string;
  public type: ZelloContactType;
  public isMuted: boolean;
  /**
   * The connection status of the channel. Connecting to a channel is asynchronous.
   */
  public connectionStatus: ZelloChannelConnectionStatus;
  /**
   * The number of users connected to the channel.
   */
  public usersOnline: number;
  /**
   * The options of the channel.
   */
  public options: ZelloChannelOptions;

  constructor(
    name: string,
    isMuted: boolean,
    connectionStatus: ZelloChannelConnectionStatus,
    usersOnline: number,
    options: ZelloChannelOptions
  ) {
    this.name = name;
    this.type = ZelloContactType.Channel;
    this.isMuted = isMuted;
    this.connectionStatus = connectionStatus;
    this.usersOnline = usersOnline;
    this.options = options;
  }
}

/**
 * A Zello dispatch channel. A dispatch channel is a special type of channel that has calls between a user and a dispatcher.
 */
export class ZelloDispatchChannel extends ZelloChannel {
  /**
   * The current call on the dispatch channel, if any.
   */
  public readonly currentCall: ZelloDispatchCall | undefined;

  constructor(
    name: string,
    isMuted: boolean,
    connectionStatus: ZelloChannelConnectionStatus,
    usersOnline: number,
    options: ZelloChannelOptions,
    currentCall: ZelloDispatchCall | undefined
  ) {
    super(name, isMuted, connectionStatus, usersOnline, options);
    this.currentCall = currentCall;
  }
}

/**
 * A Zello dispatch call. A dispatch call is a call between a user and a dispatcher.
 */
export class ZelloDispatchCall {
  /**
   * The status of the call.
   */
  public readonly status: ZelloDispatchCallStatus;
  /**
   * The name of the dispatcher who accepted the call. Null if the call is in the {@link ZelloDispatchCallStatus.Pending} state.
   */
  public readonly dispatcher: string | undefined;

  constructor(status: ZelloDispatchCallStatus, dispatcher: string | undefined) {
    this.status = status;
    this.dispatcher = dispatcher;
  }
}

/**
 * The status of a {@link ZelloDispatchCall}.
 */
export enum ZelloDispatchCallStatus {
  Pending = 'pending',
  Active = 'active',
  Ended = 'ended',
  Disconnected = 'disconnected',
}

/**
 * A ad-hoc group conversation in Zello. A {@link ZelloGroupConversation} is a type of {@link ZelloChannel}, but the provisioning is done by the end user instead of through the Zello Work Administrative Console.
 *
 * {@link ZelloGroupConversation}s are only possible when {@link ZelloConsoleSettings.allowGroupConversations} is true.
 */
export class ZelloGroupConversation extends ZelloChannel {
  /**
   * The display name of the group conversation. This should be used in the UI instead of {@link ZelloChannel#name}, as the {@link ZelloChannel#name} will be a uniquely hashed value starting with c##.
   */
  public readonly displayName: string;
  /**
   * The users in the group conversation.
   */
  public readonly users: ZelloChannelUser[];
  /**
   * The users in the group conversation that are currently online.
   */
  public readonly onlineUsers: ZelloChannelUser[];

  constructor(
    name: string,
    isMuted: boolean,
    connectionStatus: ZelloChannelConnectionStatus,
    usersOnline: number,
    options: ZelloChannelOptions,
    displayName: string,
    users: ZelloChannelUser[],
    onlineUsers: ZelloChannelUser[]
  ) {
    super(name, isMuted, connectionStatus, usersOnline, options);
    this.displayName = displayName;
    this.users = users;
    this.onlineUsers = onlineUsers;
  }
}

/**
 * The connection status of a {@link ZelloChannel}.
 */
export enum ZelloChannelConnectionStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
}

/**
 * The options of a {@link ZelloChannel}.
 */
export type ZelloChannelOptions = {
  /**
   * Whether the user is allowed to disconnect from the channel.
   * When this is true, you should not show any UI to allow the user to disconnect from the channel.
   */
  noDisconnect: boolean;
  /**
   * Whether the user is allowed to change the channel's connection state.
   * When this is true, you should not show any UI to allow the user to connect or disconnect the channel.
   */
  hidePowerButton: boolean;
  /**
   * Whether the user is allowed to talk on the channel.
   * When this is true, you should not show any UI to allow the user to talk on the channel.
   */
  listenOnly: boolean;
  /**
   * Whether the user is allowed to send alert messages to the channel.
   * When this is true, you should not show any UI to allow the user to send alert messages to the channel.
   */
  allowAlerts: boolean;
  /**
   * Whether the user is allowed to send text messages to the channel.
   * When this is true, you should not show any UI to allow the user to send text messages to the channel.
   */
  allowTextMessages: boolean;
  /**
   * Whether the user is allowed to send location messages to the channel.
   * When this is true, you should not show any UI to allow the user to send location messages to the channel.
   */
  allowLocations: boolean;
};

/**
 * A user in a {@link ZelloChannel}. A {@link ZelloChannelUser} may or may not be part of your contact list.
 */
export class ZelloChannelUser {
  public name: string;
  public displayName: string;

  constructor(name: string, displayName: string) {
    this.name = name;
    this.displayName = displayName;
  }
}

/**
 * The credentials required to connect to Zello.
 */
export type ZelloCredentials = {
  /**
   * The network to connect to.
   * This is the "x" in your {x.zellowork.com} Zello Work console login.
   */
  network: string;
  /**
   * The username to connect.
   */
  username: string;
  /**
   * The password for the user.
   */
  password: string;
};

/**
 * The connection state of the Zello SDK.
 */
export enum ZelloConnectionState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Reconnecting = 'reconnecting',
}

/**
 * The error that occurred when connecting to Zello.
 */
export enum ZelloConnectionError {
  Unknown = 'unknown',
  InvalidCredentials = 'invalidcredentials',
  InvalidState = 'invalidstate',
}

/**
 * The error that occurred when sending a voice message.
 */
export enum ZelloOutgoingVoiceMessageError {
  Unknown = 'unknown',
  NoMicPermission = 'nomicpermission',
}

/**
 * The status of the current account.
 */
export enum ZelloAccountStatus {
  /**
   * The user is connected. Messages will play live.
   */
  Available = 'available',
  /**
   * The user is connected. Messages will not play live.
   * The received messages will be available in the history.
   */
  Busy = 'busy',
}

/**
 * The parent type for all Zello messages.
 */
export type ZelloMessage = {
  /**
   * The contact that sent or received the message. If this is a channel message, the contact will be the channel.
   */
  contact: ZelloContact;
  /**
   * If incoming, the author that sent the message, if the message was sent in a channel.
   * If outgoing, undefined.
   */
  channelUser: ZelloChannelUser | undefined;
  /**
   * The timestamp of the message.
   */
  timestamp: number;
  /**
   * Whether the message was received or sent.
   */
  incoming: boolean;
};

/**
 * An incoming Zello voice message.
 */
export class ZelloIncomingVoiceMessage implements ZelloMessage {
  public contact: ZelloContact;
  public channelUser: ZelloChannelUser | undefined;
  public timestamp: number;
  public incoming = true;

  constructor(
    contact: ZelloContact,
    channelUser: ZelloChannelUser | undefined,
    timestamp: number
  ) {
    this.contact = contact;
    this.channelUser = channelUser;
    this.timestamp = timestamp;
  }
}

/**
 * An outgoing Zello voice message.
 */
export class ZelloOutgoingVoiceMessage implements ZelloMessage {
  public contact: ZelloContact;
  public timestamp: number;
  public channelUser = undefined;
  public incoming = false;
  /**
   * The state of the message.
   */
  public state: ZelloOutgoingVoiceMessageState;

  constructor(
    contact: ZelloContact,
    timestamp: number,
    state: ZelloOutgoingVoiceMessageState
  ) {
    this.contact = contact;
    this.timestamp = timestamp;
    this.state = state;
  }
}

/**
 * The state of an outgoing Zello voice message.
 */
export enum ZelloOutgoingVoiceMessageState {
  None = 'none',
  Connecting = 'connecting',
  Sending = 'sending',
  Sent = 'sent',
  Failed = 'failed',
}

/**
 * A Zello image message.
 */
export class ZelloImageMessage implements ZelloMessage {
  public contact: ZelloContact;
  public channelUser: ZelloChannelUser | undefined;
  public incoming: boolean;
  public timestamp: number;
  /**
   * Base64 encoded thumbnail image
   */
  public thumbnail: string | undefined;
  /**
   * Base64 encoded full image
   */
  public image: string;

  constructor(
    contact: ZelloContact,
    channelUser: ZelloChannelUser | undefined,
    incoming: boolean,
    timestamp: number,
    thumbnail: string | undefined,
    image: string
  ) {
    this.contact = contact;
    this.channelUser = channelUser;
    this.incoming = incoming;
    this.timestamp = timestamp;
    this.thumbnail = thumbnail;
    this.image = image;
  }
}

/**
 * A Zello alert message. Alert messages contain text and are typically used for important messages.
 * They will play a recurring sound until the user acknowledges them by bringing the app to the foreground.
 */
export class ZelloAlertMessage implements ZelloMessage {
  public contact: ZelloContact;
  public channelUser: ZelloChannelUser | undefined;
  public incoming: boolean;
  public timestamp: number;
  /**
   * The text body of the message.
   */
  public text: string;

  constructor(
    contact: ZelloContact,
    channelUser: ZelloChannelUser | undefined,
    incoming: boolean,
    timestamp: number,
    text: string
  ) {
    this.contact = contact;
    this.channelUser = channelUser;
    this.incoming = incoming;
    this.timestamp = timestamp;
    this.text = text;
  }
}

/**
 * The level of user a channel alert message should be sent to.
 */
export enum ZelloChannelAlertLevel {
  /**
   * Users currently connected to the channel.
   */
  Connected = 'connected',
  /**
   * All users part of the channel, whether they are connected or not.
   * This will send as a push notification if the user is not connected to Zello.
   */
  All = 'all',
}

/**
 * A Zello text message.
 */
export class ZelloTextMessage implements ZelloMessage {
  public contact: ZelloContact;
  public channelUser: ZelloChannelUser | undefined;
  public incoming: boolean;
  public timestamp: number;
  /**
   * The text body of the message.
   */
  public text: string;

  constructor(
    contact: ZelloContact,
    channelUser: ZelloChannelUser | undefined,
    incoming: boolean,
    timestamp: number,
    text: string
  ) {
    this.contact = contact;
    this.channelUser = channelUser;
    this.incoming = incoming;
    this.timestamp = timestamp;
    this.text = text;
  }
}

/**
 * A Zello location message.
 */
export class ZelloLocationMessage implements ZelloMessage {
  public contact: ZelloContact;
  public channelUser: ZelloChannelUser | undefined;
  public incoming: boolean;
  public timestamp: number;
  /**
   * The latitude of the location.
   */
  public latitude: number;
  /**
   * The longitude of the location.
   */
  public longitude: number;
  /**
   * The horizontal accuracy of the location in meters.
   */
  public accuracy: number;
  /**
   * The reverse-geolocation address, if available.
   */
  public address: string | undefined;

  constructor(
    contact: ZelloContact,
    channelUser: ZelloChannelUser | undefined,
    incoming: boolean,
    timestamp: number,
    latitude: number,
    longitude: number,
    accuracy: number,
    address: string | undefined
  ) {
    this.contact = contact;
    this.channelUser = channelUser;
    this.incoming = incoming;
    this.timestamp = timestamp;
    this.latitude = latitude;
    this.longitude = longitude;
    this.accuracy = accuracy;
    this.address = address;
  }
}

/**
 * An incoming Zello emergency.
 */
export class ZelloIncomingEmergency {
  /**
   * The emergency channel.
   */
  public channel: ZelloChannel;
  /**
   * The user that started the emergency.
   */
  public channelUser: ZelloChannelUser;
  /**
   * The unique identifier of the emergency.
   */
  public emergencyId: string;
  /**
   * The timestamp when the emergency started.
   */
  public startTimestamp: number;
  /**
   * The timestamp when the emergency ended, or undefined if it's ongoing.
   */
  public endTimestamp: number | undefined;

  constructor(
    channel: ZelloChannel,
    channelUser: ZelloChannelUser,
    emergencyId: string,
    startTimestamp: number,
    endTimestamp: number | undefined
  ) {
    this.channel = channel;
    this.channelUser = channelUser;
    this.emergencyId = emergencyId;
    this.startTimestamp = startTimestamp;
    this.endTimestamp = endTimestamp;
  }
}

/**
 * An outgoing Zello emergency.
 */
export class ZelloOutgoingEmergency {
  /**
   * The emergency channel.
   */
  public channel: ZelloChannel;
  /**
   * The timestamp when the emergency started.
   */
  public startTimestamp: number;
  /**
   * The timestamp when the emergency ended, or undefined if it's ongoing.
   */
  public endTimestamp: number | undefined;

  constructor(
    channel: ZelloChannel,
    startTimestamp: number,
    endTimestamp: number | undefined
  ) {
    this.channel = channel;
    this.startTimestamp = startTimestamp;
    this.endTimestamp = endTimestamp;
  }
}

/**
 * A Zello recent entry.
 */
export class ZelloRecentEntry {
  /**
   * The contact that the recent entry is for.
   */
  public contact: ZelloContact;
  /**
   * If incoming, the author that sent the most recent message, if the message was sent in a channel.
   * If outgoing, undefined.
   */
  public channelUser: ZelloChannelUser | undefined;
  /**
   * The timestamp of the most recent message.
   */
  public timestamp: number;
  /**
   * The type of the most recent message.
   */
  public type: ZelloRecentEntryType;
  /**
   * Whether the most recent message was incoming.
   */
  public incoming: boolean;

  constructor(
    contact: ZelloContact,
    channelUser: ZelloChannelUser | undefined,
    timestamp: number,
    type: ZelloRecentEntryType,
    incoming: boolean
  ) {
    this.contact = contact;
    this.channelUser = channelUser;
    this.timestamp = timestamp;
    this.type = type;
    this.incoming = incoming;
  }
}

/**
 * The type of {@link ZelloRecentEntry}.
 */
export enum ZelloRecentEntryType {
  Voice = 'voice',
  Image = 'image',
  Alert = 'alert',
  Text = 'text',
  Location = 'location',
}

/**
 * The parent type for all Zello history messages.
 */
export type ZelloHistoryMessage = {
  /**
   * The contact that sent or received the message.
   */
  contact: ZelloContact;
  /**
   * If incoming, the author that sent the message, if the message was sent in a channel.
   * If outgoing, undefined.
   */
  channelUser: ZelloChannelUser | undefined;
  /**
   * The timestamp of the message.
   */
  timestamp: number;
  /**
   * The unique identifier of the message. This can be used to lookup messages in the history.
   * This identifier persists across sessions.
   */
  historyId: string;
  /**
   * Whether the message was received or sent.
   */
  incoming: boolean;
};

/**
 * A Zello history voice message.
 * To play the message, use the {@link sdk.Zello#playHistoryMessage | Zello#playHistoryMessage} function.
 */
export class ZelloHistoryVoiceMessage implements ZelloHistoryMessage {
  public contact: ZelloContact;
  public channelUser: ZelloChannelUser | undefined;
  public timestamp: number;
  public historyId: string;
  public incoming: boolean;
  /**
   * The duration of the voice message in milliseconds.
   */
  public durationMs: number;

  constructor(
    contact: ZelloContact,
    channelUser: ZelloChannelUser | undefined,
    timestamp: number,
    historyId: string,
    incoming: boolean,
    durationMs: number
  ) {
    this.contact = contact;
    this.channelUser = channelUser;
    this.timestamp = timestamp;
    this.historyId = historyId;
    this.incoming = incoming;
    this.durationMs = durationMs;
  }
}

/**
 * A Zello history image message.
 * To retrieve the image data for the message, use the {@link sdk.Zello#getImageDataForHistoryImageMessage | Zello#getImageDataForHistoryImageMessage} method.
 */
export class ZelloHistoryImageMessage implements ZelloHistoryMessage {
  public contact: ZelloContact;
  public channelUser: ZelloChannelUser | undefined;
  public timestamp: number;
  public historyId: string;
  public incoming: boolean;

  constructor(
    contact: ZelloContact,
    channelUser: ZelloChannelUser | undefined,
    timestamp: number,
    historyId: string,
    incoming: boolean
  ) {
    this.contact = contact;
    this.channelUser = channelUser;
    this.timestamp = timestamp;
    this.historyId = historyId;
    this.incoming = incoming;
  }
}

/**
 * A Zello history alert message.
 */
export class ZelloHistoryAlertMessage implements ZelloHistoryMessage {
  public contact: ZelloContact;
  public channelUser: ZelloChannelUser | undefined;
  public timestamp: number;
  public historyId: string;
  public incoming: boolean;
  /**
   * The text body of the message.
   */
  public text: string;

  constructor(
    contact: ZelloContact,
    channelUser: ZelloChannelUser | undefined,
    timestamp: number,
    historyId: string,
    incoming: boolean,
    text: string
  ) {
    this.contact = contact;
    this.channelUser = channelUser;
    this.timestamp = timestamp;
    this.historyId = historyId;
    this.incoming = incoming;
    this.text = text;
  }
}

/**
 * A Zello history text message.
 */
export class ZelloHistoryTextMessage implements ZelloHistoryMessage {
  public contact: ZelloContact;
  public channelUser: ZelloChannelUser | undefined;
  public timestamp: number;
  public historyId: string;
  public incoming: boolean;
  /**
   * The text body of the message.
   */
  public text: string;

  constructor(
    contact: ZelloContact,
    channelUser: ZelloChannelUser | undefined,
    timestamp: number,
    historyId: string,
    incoming: boolean,
    text: string
  ) {
    this.contact = contact;
    this.channelUser = channelUser;
    this.timestamp = timestamp;
    this.historyId = historyId;
    this.incoming = incoming;
    this.text = text;
  }
}

/**
 * A Zello history location message.
 */
export class ZelloHistoryLocationMessage implements ZelloHistoryMessage {
  public contact: ZelloContact;
  public channelUser: ZelloChannelUser | undefined;
  public timestamp: number;
  public historyId: string;
  public incoming: boolean;
  /**
   * The latitude of the location.
   */
  public latitude: number;
  /**
   * The longitude of the location.
   */
  public longitude: number;
  /**
   * The horizontal accuracy of the location in meters.
   */
  public accuracy: number;
  /**
   * The reverse-geolocation address, if available.
   */
  public address: string | undefined;

  constructor(
    contact: ZelloContact,
    channelUser: ZelloChannelUser | undefined,
    timestamp: number,
    historyId: string,
    incoming: boolean,
    latitude: number,
    longitude: number,
    accuracy: number,
    address: string | undefined
  ) {
    this.contact = contact;
    this.channelUser = channelUser;
    this.timestamp = timestamp;
    this.historyId = historyId;
    this.incoming = incoming;
    this.latitude = latitude;
    this.longitude = longitude;
    this.accuracy = accuracy;
    this.address = address;
  }
}

/**
 * The configuration for the Zello SDK.
 */
export type ZelloConfig = {
  android: {
    /**
     * Whether to enable message push notifications.
     * By setting this to false, the user will not receive any push notifications for incoming messages when the user is offline.
     */
    enableOfflineMessagePushNotifications: boolean;
    /**
     * Whether to enable the foreground service. A foreground service is necessary for the SDK to function properly in the background.
     * The SDK comes configured with a default foreground service, but you can provide your own if you wish.
     * If this is set to false, the SDK will not work properly when the app is in the background, unless you configure your own foreground service.
     */
    enableForegroundService: boolean;
  };
  ios: {
    /**
     * Whether your application is being run in a debug or release build.
     */
    isDebugBuild: boolean;
    /**
     * The app group for shared data. This is required for the Notification Service Extension to work properly.
     */
    appGroup: string;
  };
};

/**
 * Settings for the network. These are configured via the Zello Work Administrative Console.
 */
export class ZelloConsoleSettings {
  /**
   * Allow non-dispatchers to end calls. When this is false, you should not show any UI to allow non-dispatchers to end calls.
   */
  public readonly allowNonDispatchersToEndCalls: boolean;
  /**
   * Allow group conversations. When this is false, you should not show any UI to allow users to create group conversations.
   */
  public readonly allowGroupConversations: boolean;

  constructor(
    allowNonDispatchersToEndCalls: boolean,
    allowGroupConversations: boolean
  ) {
    this.allowNonDispatchersToEndCalls = allowNonDispatchersToEndCalls;
    this.allowGroupConversations = allowGroupConversations;
  }
}
