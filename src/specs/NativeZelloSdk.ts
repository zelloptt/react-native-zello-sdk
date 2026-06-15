import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

/**
 * Codegen spec for the unified Zello TurboModule.
 *
 * This single spec replaces the legacy, platform-divergent `ZelloIOSSdkModule`
 * and `ZelloAndroidSdkModule` bridge modules. Both platforms implement the same
 * interface. Events are not part of this spec: they are emitted on the global
 * `DeviceEventEmitter` `'zellosdk'` channel and carry an `eventName`
 * discriminator in their payload (see `src/events`).
 *
 * Codegen notes:
 * - `configure` takes a single object so the platform-specific configuration
 *   fields (`ios.isDebugBuild`, `ios.appGroup`, `android.enableOfflineMessagePushNotifications`,
 *   `android.enableForegroundService`) can live in one signature.
 * - The two legacy callback methods (`getHistory`, `getHistoryImageData`) are
 *   modeled as Promises, which is the TurboModule-native async shape.
 * - `UnsafeObject` is used where the payload is a heterogeneous SDK structure
 *   that is normalized in the JS layer (`src/sdk`).
 */
export interface Spec extends TurboModule {
  configure(config: UnsafeObject): void;

  connect(network: string, username: string, password: string): void;
  disconnect(): void;

  setAccountStatus(status: string): void;

  selectContact(name: string, contactType: string): void;

  startVoiceMessage(name: string, contactType: string): void;
  stopVoiceMessage(): void;

  sendImage(name: string, contactType: string, data: Array<number>): void;
  sendLocation(name: string, contactType: string): void;
  sendText(name: string, contactType: string, text: string): void;
  sendAlert(
    name: string,
    contactType: string,
    text: string,
    level: string
  ): void;

  connectChannel(name: string): void;
  disconnectChannel(name: string): void;

  connectGroupConversation(name: string): void;
  disconnectGroupConversation(name: string): void;

  submitProblemReport(): void;

  muteContact(name: string, contactType: string): void;
  unmuteContact(name: string, contactType: string): void;

  startEmergency(): void;
  stopEmergency(): void;

  getHistory(
    name: string,
    contactType: string,
    maxMessages: number
  ): Promise<UnsafeObject>;
  playHistoryMessage(
    historyId: string,
    contactName: string,
    contactType: string
  ): void;
  stopHistoryMessagePlayback(): void;
  getHistoryImageData(
    historyId: string,
    contactName: string,
    contactType: string
  ): Promise<UnsafeObject>;

  endDispatchCall(channelName: string): void;

  createGroupConversation(usernames: Array<string>, displayName: string): void;
  addUsersToGroupConversation(
    conversationName: string,
    usernames: Array<string>
  ): void;
  leaveGroupConversation(conversationName: string): void;
  renameGroupConversation(conversationName: string, newName: string): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeZelloSdk');
