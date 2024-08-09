import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import UsersScreen from './UsersScreen';
import { createContext, useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  PERMISSIONS,
  request,
  requestNotifications,
} from 'react-native-permissions';
import ChannelsScreen from './ChannelsScreen';
import Zello, {
  ZelloAccountStatus,
  ZelloAlertMessage,
  ZelloChannel,
  ZelloContact,
  ZelloIncomingVoiceMessage,
  ZelloImageMessage,
  ZelloLocationMessage,
  ZelloOutgoingVoiceMessage,
  ZelloTextMessage,
  ZelloUser,
  ZelloIncomingEmergency,
  ZelloOutgoingEmergency,
  ZelloRecentEntry,
  ZelloHistoryMessage,
  ZelloHistoryVoiceMessage,
  ZelloConnectionState,
  ZelloConnectionError,
  ZelloOutgoingVoiceMessageError,
  ZelloEvent,
} from '@zelloptt/react-native-zello-sdk';
// @ts-ignore
import Ionicons from 'react-native-vector-icons/Ionicons';
import { MenuProvider } from 'react-native-popup-menu';
import RecentsScreen from './RecentsScreen';
import Toast from 'react-native-toast-message';

const Tab = createBottomTabNavigator();

const sdk = Zello.getInstance();
export const SdkContext = createContext<Zello>(sdk);
export const ConnectionContext = createContext({
  isConnected: false,
  isConnecting: false,
});
export const UsersContext = createContext<ZelloUser[]>([]);
export const ChannelsContext = createContext<ZelloChannel[]>([]);
export const SelectedContactContext = createContext<ZelloContact | undefined>(
  undefined
);
export const AccountStatusContext = createContext<
  ZelloAccountStatus | undefined
>(undefined);
export const IncomingVoiceMessageContext = createContext<
  ZelloIncomingVoiceMessage | undefined
>(undefined);
export const OutgoingVoiceMessageContext = createContext<
  ZelloOutgoingVoiceMessage | undefined
>(undefined);

export const LastIncomingImageMessageContext = createContext<{
  message?: ZelloImageMessage;
  clearMessage?: React.Dispatch<React.SetStateAction<void>>;
}>({});

export const LastIncomingAlertMessageContext = createContext<{
  message?: ZelloAlertMessage;
  clearMessage?: React.Dispatch<React.SetStateAction<void>>;
}>({});

export const LastIncomingTextMessageContext = createContext<{
  message?: ZelloTextMessage;
  clearMessage?: React.Dispatch<React.SetStateAction<void>>;
}>({});

export const LastIncomingLocationMessageContext = createContext<{
  message?: ZelloLocationMessage;
  clearMessage?: React.Dispatch<React.SetStateAction<void>>;
}>({});

export const EmergencyContext = createContext<{
  incomingEmergencies: ZelloIncomingEmergency[];
  outgoingEmergency?: ZelloOutgoingEmergency;
}>({ incomingEmergencies: [] });

export const RecentsContext = createContext<ZelloRecentEntry[]>([]);

export const HistoryContext = createContext<{
  history?: {
    contact: ZelloContact;
    messages: ZelloHistoryMessage[];
  };
  clearHistory?: React.Dispatch<React.SetStateAction<void>>;
  setHistory?: (contact: ZelloContact, messages: ZelloHistoryMessage[]) => void;
}>({});

export const HistoryVoiceMessageContext = createContext<
  ZelloHistoryVoiceMessage | undefined
>(undefined);

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [users, setUsers] = useState<ZelloUser[]>([]);
  const [channels, setChannels] = useState<ZelloChannel[]>([]);
  const [selectedContact, setSelectedContact] = useState<
    ZelloContact | undefined
  >(undefined);
  const [accountStatus, setAccountStatus] = useState<
    ZelloAccountStatus | undefined
  >(undefined);
  const [incomingAudioMessage, setIncomingAudioMessage] = useState<
    ZelloIncomingVoiceMessage | undefined
  >(undefined);
  const [outgoingAudioMessage, setOutgoingAudioMessage] = useState<
    ZelloOutgoingVoiceMessage | undefined
  >(undefined);
  const [lastIncomingImageMessage, setLastIncomingImageMessage] = useState<
    ZelloImageMessage | undefined
  >(undefined);
  const [lastIncomingAlertMessage, setLastIncomingAlertMessage] = useState<
    ZelloAlertMessage | undefined
  >(undefined);
  const [lastIncomingTextMessage, setLastIncomingTextMessage] = useState<
    ZelloTextMessage | undefined
  >(undefined);
  const [lastIncomingLocationMessage, setLastIncomingLocationMessage] =
    useState<ZelloLocationMessage | undefined>(undefined);
  const [emergency, setEmergency] = useState<{
    incomingEmergencies: ZelloIncomingEmergency[];
    outgoingEmergency?: ZelloOutgoingEmergency;
  }>({ incomingEmergencies: [] });
  const [recents, setRecents] = useState<ZelloRecentEntry[]>([]);
  const [history, setHistory] = useState<
    | {
        contact: ZelloContact;
        messages: ZelloHistoryMessage[];
      }
    | undefined
  >(undefined);
  const [historyVoiceMessage, setHistoryVoiceMessage] = useState<
    ZelloHistoryVoiceMessage | undefined
  >(undefined);

  const showToast = (text: string) => {
    Toast.show({
      type: 'error',
      text1: text,
      visibilityTime: 5000,
    });
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS).then(() => {
        request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION).then(() => {
          request(PERMISSIONS.ANDROID.RECORD_AUDIO);
        });
      });
    } else {
      request(PERMISSIONS.IOS.MICROPHONE).then(() => {
        requestNotifications(['alert', 'sound', 'badge']).then(() => {
          request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE).then(() => {
            request(PERMISSIONS.IOS.BLUETOOTH);
          });
        });
      });
    }
    sdk.configure({
      android: {
        enableOfflineMessagePushNotifications: true,
        enableForegroundService: true,
      },
      ios: {
        isDebugBuild: true,
      },
    });

    sdk.addListener(
      ZelloEvent.CONNECT_FAILED,
      (_state: ZelloConnectionState, error: ZelloConnectionError) => {
        showToast(`Connection failed: ${error}`);
        setIsConnecting(false);
      }
    );
    sdk.addListener(ZelloEvent.CONNECT_STARTED, () => {
      setIsConnecting(true);
    });
    sdk.addListener(ZelloEvent.CONNECT_SUCCEEDED, () => {
      setIsConnecting(false);
      setIsConnected(true);
    });
    sdk.addListener(ZelloEvent.DISCONNECTED, () => {
      setIsConnected(false);
    });
    sdk.addListener(ZelloEvent.CONTACT_LIST_UPDATED, () => {
      setUsers(sdk.users);
      setChannels(sdk.channels);
    });
    sdk.addListener(ZelloEvent.SELECTED_CONTACT_CHANGED, () => {
      setSelectedContact(sdk.selectedContact);
    });
    sdk.addListener(ZelloEvent.ACCOUNT_STATUS_CHANGED, () => {
      setAccountStatus(sdk.accountStatus);
    });
    sdk.addListener(ZelloEvent.INCOMING_VOICE_MESSAGE_STARTED, () => {
      setIncomingAudioMessage(sdk.incomingVoiceMessage);
    });
    sdk.addListener(ZelloEvent.INCOMING_VOICE_MESSAGE_STOPPED, () => {
      setIncomingAudioMessage(sdk.incomingVoiceMessage);
    });
    sdk.addListener(ZelloEvent.OUTGOING_VOICE_MESSAGE_CONNECTING, () => {
      setOutgoingAudioMessage(sdk.outgoingVoiceMessage);
    });
    sdk.addListener(ZelloEvent.OUTGOING_VOICE_MESSAGE_STARTED, () => {
      setOutgoingAudioMessage(sdk.outgoingVoiceMessage);
    });
    sdk.addListener(
      ZelloEvent.OUTGOING_VOICE_MESSAGE_STOPPED,
      (
        _message: ZelloOutgoingVoiceMessage,
        error: ZelloOutgoingVoiceMessageError | undefined
      ) => {
        if (error) {
          showToast(`Outgoing voice message error: ${error}`);
        }
        setOutgoingAudioMessage(sdk.outgoingVoiceMessage);
      }
    );
    sdk.addListener(
      ZelloEvent.INCOMING_IMAGE_MESSAGE_RECEIVED,
      (message: ZelloImageMessage) => {
        setLastIncomingImageMessage(message);
      }
    );
    sdk.addListener(ZelloEvent.OUTGOING_IMAGE_MESSAGE_SEND_FAILED, () => {
      showToast('Failed to send image');
    });
    sdk.addListener(
      ZelloEvent.INCOMING_ALERT_MESSAGE_RECEIVED,
      (message: ZelloAlertMessage) => {
        setLastIncomingAlertMessage(message);
      }
    );
    sdk.addListener(ZelloEvent.OUTGOING_ALERT_MESSAGE_SEND_FAILED, () => {
      showToast('Failed to send alert');
    });
    sdk.addListener(
      ZelloEvent.INCOMING_TEXT_MESSAGE_RECEIVED,
      (message: ZelloTextMessage) => {
        setLastIncomingTextMessage(message);
      }
    );
    sdk.addListener(ZelloEvent.OUTGOING_TEXT_MESSAGE_SEND_FAILED, () => {
      showToast('Failed to send text');
    });
    sdk.addListener(
      ZelloEvent.INCOMING_LOCATION_MESSAGE_RECEIVED,
      (message: ZelloLocationMessage) => {
        setLastIncomingLocationMessage(message);
      }
    );
    sdk.addListener(ZelloEvent.OUTGOING_LOCATION_MESSAGE_SEND_FAILED, () => {
      showToast('Failed to send location');
    });
    sdk.addListener(ZelloEvent.INCOMING_EMERGENCY_STARTED, () => {
      setEmergency({
        outgoingEmergency: sdk.outgoingEmergency,
        incomingEmergencies: sdk.incomingEmergencies,
      });
    });
    sdk.addListener(ZelloEvent.INCOMING_EMERGENCY_STOPPED, () => {
      setEmergency({
        outgoingEmergency: sdk.outgoingEmergency,
        incomingEmergencies: sdk.incomingEmergencies,
      });
    });
    sdk.addListener(ZelloEvent.OUTGOING_EMERGENCY_STARTED, () => {
      setEmergency({
        outgoingEmergency: sdk.outgoingEmergency,
        incomingEmergencies: sdk.incomingEmergencies,
      });
    });
    sdk.addListener(ZelloEvent.OUTGOING_EMERGENCY_STOPPED, () => {
      setEmergency({
        outgoingEmergency: sdk.outgoingEmergency,
        incomingEmergencies: sdk.incomingEmergencies,
      });
    });
    sdk.addListener(ZelloEvent.RECENTS_UPDATED, () => {
      setRecents(sdk.recents);
    });
    sdk.addListener(ZelloEvent.HISTORY_PLAYBACK_STARTED, () => {
      setHistoryVoiceMessage(sdk.historyVoiceMessage);
    });
    sdk.addListener(ZelloEvent.HISTORY_PLAYBACK_STOPPED, () => {
      setHistoryVoiceMessage(sdk.historyVoiceMessage);
    });

    // Removes the listener once unmounted
    return () => {
      sdk.destroy();
    };
  }, []);

  useEffect(() => {
    sdk.addListener(ZelloEvent.HISTORY_UPDATED, async () => {
      if (history) {
        const messages = await sdk.getHistory(history.contact);
        setHistory({ contact: history.contact, messages: messages });
      }
    });
  }, [history]);

  const clearLastIncomingImageMessage = useCallback(() => {
    setLastIncomingImageMessage(undefined);
  }, [setLastIncomingImageMessage]);

  const clearLastIncomingAlertMessage = useCallback(() => {
    setLastIncomingAlertMessage(undefined);
  }, [setLastIncomingAlertMessage]);

  const clearLastIncomingTextMessage = useCallback(() => {
    setLastIncomingTextMessage(undefined);
  }, [setLastIncomingTextMessage]);

  const clearLastIncomingLocationMessage = useCallback(() => {
    setLastIncomingLocationMessage(undefined);
  }, [setLastIncomingLocationMessage]);

  const clearHistory = useCallback(() => {
    setHistory(undefined);
  }, [setHistory]);

  const addHistory = useCallback(
    (contact: ZelloContact, messages: ZelloHistoryMessage[]) => {
      setHistory({
        messages: messages,
        contact: contact,
      });
    },
    [setHistory]
  );

  return (
    <>
      <MenuProvider>
        <SdkContext.Provider value={sdk}>
          <ConnectionContext.Provider value={{ isConnected, isConnecting }}>
            <UsersContext.Provider value={users}>
              <ChannelsContext.Provider value={channels}>
                <SelectedContactContext.Provider value={selectedContact}>
                  <AccountStatusContext.Provider value={accountStatus}>
                    <IncomingVoiceMessageContext.Provider
                      value={incomingAudioMessage}
                    >
                      <OutgoingVoiceMessageContext.Provider
                        value={outgoingAudioMessage}
                      >
                        <LastIncomingImageMessageContext.Provider
                          value={{
                            message: lastIncomingImageMessage,
                            clearMessage: clearLastIncomingImageMessage,
                          }}
                        >
                          <LastIncomingAlertMessageContext.Provider
                            value={{
                              message: lastIncomingAlertMessage,
                              clearMessage: clearLastIncomingAlertMessage,
                            }}
                          >
                            <LastIncomingTextMessageContext.Provider
                              value={{
                                message: lastIncomingTextMessage,
                                clearMessage: clearLastIncomingTextMessage,
                              }}
                            >
                              <LastIncomingLocationMessageContext.Provider
                                value={{
                                  message: lastIncomingLocationMessage,
                                  clearMessage:
                                    clearLastIncomingLocationMessage,
                                }}
                              >
                                <EmergencyContext.Provider value={emergency}>
                                  <RecentsContext.Provider value={recents}>
                                    <HistoryContext.Provider
                                      value={{
                                        history: history,
                                        clearHistory: clearHistory,
                                        setHistory: addHistory,
                                      }}
                                    >
                                      <HistoryVoiceMessageContext.Provider
                                        value={historyVoiceMessage}
                                      >
                                        <NavigationContainer>
                                          <Tab.Navigator
                                            screenOptions={({ route }) => ({
                                              // eslint-disable-next-line react/no-unstable-nested-components
                                              tabBarIcon: ({ color, size }) => {
                                                let iconName;
                                                if (route.name === 'Recents') {
                                                  iconName = 'time-outline';
                                                } else if (
                                                  route.name === 'Users'
                                                ) {
                                                  iconName = 'person';
                                                } else if (
                                                  route.name === 'Channels'
                                                ) {
                                                  iconName = 'people';
                                                }
                                                return (
                                                  <Ionicons
                                                    name={iconName}
                                                    size={size}
                                                    color={color}
                                                  />
                                                );
                                              },
                                              tabBarActiveTintColor: 'tomato',
                                              tabBarInactiveTintColor: 'gray',
                                            })}
                                          >
                                            <Tab.Screen
                                              name="Recents"
                                              component={RecentsScreen}
                                            />
                                            <Tab.Screen
                                              name="Users"
                                              component={UsersScreen}
                                            />
                                            <Tab.Screen
                                              name="Channels"
                                              component={ChannelsScreen}
                                            />
                                          </Tab.Navigator>
                                        </NavigationContainer>
                                      </HistoryVoiceMessageContext.Provider>
                                    </HistoryContext.Provider>
                                  </RecentsContext.Provider>
                                </EmergencyContext.Provider>
                              </LastIncomingLocationMessageContext.Provider>
                            </LastIncomingTextMessageContext.Provider>
                          </LastIncomingAlertMessageContext.Provider>
                        </LastIncomingImageMessageContext.Provider>
                      </OutgoingVoiceMessageContext.Provider>
                    </IncomingVoiceMessageContext.Provider>
                  </AccountStatusContext.Provider>
                </SelectedContactContext.Provider>
              </ChannelsContext.Provider>
            </UsersContext.Provider>
          </ConnectionContext.Provider>
        </SdkContext.Provider>
      </MenuProvider>
      <Toast />
    </>
  );
}
