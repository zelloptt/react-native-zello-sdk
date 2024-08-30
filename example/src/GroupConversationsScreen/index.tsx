import React, { useCallback, useContext, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  GroupConversationsContext,
  HistoryContext,
  IncomingVoiceMessageContext,
  LastIncomingAlertMessageContext,
  LastIncomingImageMessageContext,
  LastIncomingLocationMessageContext,
  LastIncomingTextMessageContext,
  SdkContext,
  SelectedContactContext,
} from '../App';
import TalkButton from '../shared/TalkButton';
import ConnectModal from '../shared/ConnectModal';
import {
  ZelloAccountStatus,
  ZelloChannelConnectionStatus,
  ZelloGroupConversation,
  ZelloHistoryMessage,
} from '@zelloptt/react-native-zello-sdk';
import StatusDialog from '../shared/StatusDialog';
import useNavigationOptions from '../shared/hooks/useNavigationOptions';
import ContextMenuButton from '../shared/ContextMenuButton';
import IncomingImageDialog from '../shared/IncomingImageDialog';
import IncomingAlertDialog from '../shared/IncomingAlertDialog';
import IncomingLocationDialog from '../shared/IncomingLocationDialog';
import IncomingTextDialog from '../shared/IncomingTextDialog';
import OutgoingTextDialog from '../shared/OutgoingTextDialog';
import OutgoingAlertDialog from '../shared/OutgoingAlertDialog';
import HistoryDialog from '../shared/HistoryDialog';
import { isSameContact } from '@zelloptt/react-native-zello-sdk';

interface GroupConversationViewProps {
  conversation: ZelloGroupConversation;
  isSelectedContact: boolean;
  openSendTextDialog: (contact: ZelloGroupConversation) => void;
  openSendAlertDialog: (contact: ZelloGroupConversation) => void;
  openHistoryDialog: (contact: ZelloGroupConversation) => void;
}

const GroupConversationView = ({
  conversation,
  isSelectedContact,
  openSendTextDialog,
  openSendAlertDialog,
  openHistoryDialog,
}: GroupConversationViewProps) => {
  const sdk = useContext(SdkContext);
  const incomingVoiceMessage = useContext(IncomingVoiceMessageContext);

  const onSwitchChange = useCallback(() => {
    if (
      conversation.connectionStatus === ZelloChannelConnectionStatus.Connected
    ) {
      sdk.disconnectChannel(conversation);
    } else {
      sdk.connectChannel(conversation);
    }
  }, [sdk, conversation]);

  const isReceiving = useCallback(() => {
    if (!incomingVoiceMessage) {
      return false;
    }
    return isSameContact(incomingVoiceMessage?.contact, conversation);
  }, [incomingVoiceMessage, conversation]);

  const isConnected =
    conversation.connectionStatus === ZelloChannelConnectionStatus.Connected;

  return (
    <TouchableOpacity
      style={styles.conversationContainer}
      onPress={() => sdk.setSelectedContact(conversation)}
    >
      <View style={styles.conversationNameContainer}>
        <Text
          style={[
            styles.conversationName,
            isSelectedContact && styles.selectedContact,
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {conversation.displayName}
        </Text>
        <Text>
          {isConnected
            ? 'Users Online: ' + conversation.usersOnline
            : conversation.connectionStatus ===
                ZelloChannelConnectionStatus.Connecting
              ? 'Connecting'
              : 'Disconnected'}
        </Text>
        {isReceiving() && (
          <Text>{`Talking: ${incomingVoiceMessage?.channelUser?.displayName}`}</Text>
        )}
      </View>
      <View style={styles.trailingButtons}>
        <ContextMenuButton
          contact={conversation}
          onSendTextSelected={() => openSendTextDialog(conversation)}
          onSendAlertSelected={() => openSendAlertDialog(conversation)}
          onShowHistorySelected={() => openHistoryDialog(conversation)}
        />
        <Switch
          value={isConnected}
          onValueChange={onSwitchChange}
          style={styles.connectionSwitch}
        />
        <TalkButton contact={conversation} disabled={!isConnected} />
      </View>
    </TouchableOpacity>
  );
};

const GroupConversationsScreen = ({ navigation }: { navigation: any }) => {
  const sdk = useContext(SdkContext);
  const conversations = useContext(GroupConversationsContext);
  const selectedContact = useContext(SelectedContactContext);
  const { message: lastIncomingImageMessage } = useContext(
    LastIncomingImageMessageContext
  );
  const { message: lastIncomingAlertMessage } = useContext(
    LastIncomingAlertMessageContext
  );
  const { message: lastIncomingTextMessage } = useContext(
    LastIncomingTextMessageContext
  );
  const { message: lastIncomingLocationMessage } = useContext(
    LastIncomingLocationMessageContext
  );
  const { setHistory } = useContext(HistoryContext);

  const [isConnectDialogVisible, setIsConnectDialogVisible] =
    React.useState(false);
  const [isStatusDialogVisible, setIsStatusDialogVisible] =
    React.useState(false);
  const [sendTextDialogVisible, setSendTextDialogVisible] = useState({
    visible: false,
    conversation: undefined as ZelloGroupConversation | undefined,
  });
  const [sendAlertDialogVisible, setSendAlertDialogVisible] = useState({
    visible: false,
    conversation: undefined as ZelloGroupConversation | undefined,
  });
  const [historyDialogVisible, setHistoryDialogVisible] = useState(false);

  useNavigationOptions(
    navigation,
    setIsConnectDialogVisible,
    setIsStatusDialogVisible
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={({ item }) => (
          <GroupConversationView
            conversation={item}
            isSelectedContact={
              selectedContact !== undefined &&
              isSameContact(selectedContact, item)
            }
            openSendTextDialog={(contact: ZelloGroupConversation) =>
              setSendTextDialogVisible({
                visible: true,
                conversation: contact,
              })
            }
            openSendAlertDialog={(contact: ZelloGroupConversation) =>
              setSendAlertDialogVisible({
                visible: true,
                conversation: contact,
              })
            }
            openHistoryDialog={(contact: ZelloGroupConversation) => {
              sdk
                .getHistory(contact)
                .then((messages: ZelloHistoryMessage[]) => {
                  setHistory?.(contact, messages);
                  setHistoryDialogVisible(true);
                });
            }}
          />
        )}
      />
      {isConnectDialogVisible && (
        <ConnectModal
          onConnect={(username: string, password: string, network: string) => {
            sdk.connect({ network, username, password });
          }}
          onClose={() => setIsConnectDialogVisible(false)}
        />
      )}
      {isStatusDialogVisible && (
        <StatusDialog
          onDismiss={() => setIsStatusDialogVisible(false)}
          onSelectStatus={(status: ZelloAccountStatus) => {
            sdk.setAccountStatus(status);
            setIsStatusDialogVisible(false);
          }}
        />
      )}
      {lastIncomingImageMessage && (
        <IncomingImageDialog message={lastIncomingImageMessage} />
      )}
      {lastIncomingAlertMessage && (
        <IncomingAlertDialog message={lastIncomingAlertMessage} />
      )}
      {lastIncomingTextMessage && (
        <IncomingTextDialog message={lastIncomingTextMessage} />
      )}
      {lastIncomingLocationMessage && (
        <IncomingLocationDialog message={lastIncomingLocationMessage} />
      )}
      {sendTextDialogVisible.visible && sendTextDialogVisible.conversation && (
        <OutgoingTextDialog
          contact={sendTextDialogVisible.conversation}
          onClose={() =>
            setSendTextDialogVisible({
              visible: false,
              conversation: undefined,
            })
          }
        />
      )}
      {sendAlertDialogVisible.visible &&
        sendAlertDialogVisible.conversation && (
          <OutgoingAlertDialog
            contact={sendAlertDialogVisible.conversation}
            onClose={() =>
              setSendAlertDialogVisible({
                visible: false,
                conversation: undefined,
              })
            }
          />
        )}
      {historyDialogVisible && (
        <HistoryDialog onClose={() => setHistoryDialogVisible(false)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  conversationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  conversationNameContainer: {
    flex: 1,
  },
  conversationName: {
    flex: 1,
    flexWrap: 'wrap',
    width: '100%',
  },
  selectedContact: {
    fontWeight: 'bold',
  },
  trailingButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  connectionSwitch: {
    marginHorizontal: 8,
  },
});

export default GroupConversationsScreen;