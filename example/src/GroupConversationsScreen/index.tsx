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
import CreateGroupConversationDialog from './CreateGroupConversationDialog';
import AddUsersToGroupConversationDialog from './AddUsersToGroupConversationDialog';
import RenameGroupConversationDialog from './RenameGroupConversationDialog';

interface GroupConversationViewProps {
  conversation: ZelloGroupConversation;
  isSelectedContact: boolean;
  openSendTextDialog: (contact: ZelloGroupConversation) => void;
  openSendAlertDialog: (contact: ZelloGroupConversation) => void;
  openHistoryDialog: (contact: ZelloGroupConversation) => void;
  openAddUsersDialog: (contact: ZelloGroupConversation) => void;
  openRenameDialog: (contact: ZelloGroupConversation) => void;
}

const GroupConversationView = ({
  conversation,
  isSelectedContact,
  openSendTextDialog,
  openSendAlertDialog,
  openHistoryDialog,
  openAddUsersDialog,
  openRenameDialog,
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
          showSendImageOption={isConnected}
          showSendAlertOption={isConnected}
          showSendTextOption={isConnected}
          showSendLocationOption={isConnected}
          showAddUsersToGroupConversationOption={true}
          showLeaveGroupConversationOption={true}
          showRenameGroupConversationOption={true}
          onSendTextSelected={() => openSendTextDialog(conversation)}
          onSendAlertSelected={() => openSendAlertDialog(conversation)}
          onShowHistorySelected={() => openHistoryDialog(conversation)}
          onAddUsersToGroupConversationSelected={() =>
            openAddUsersDialog(conversation)
          }
          onRenameGroupConversationSelected={() =>
            openRenameDialog(conversation)
          }
          onLeaveGroupConversationSelected={() =>
            sdk.leaveGroupConversation(conversation)
          }
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
  const [
    createGroupConversationDialogVisible,
    setCreateGroupConversationDialogVisible,
  ] = useState(false);
  const [
    addUsersToGroupConversationDialogVisible,
    setAddUsersToGroupConversationDialogVisible,
  ] = useState({
    visible: false,
    conversation: undefined as ZelloGroupConversation | undefined,
  });
  const [
    renameGroupConversationDialogVisible,
    setRenameGroupConversationDialogVisible,
  ] = useState({
    visible: false,
    conversation: undefined as ZelloGroupConversation | undefined,
  });

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
            openAddUsersDialog={(contact: ZelloGroupConversation) =>
              setAddUsersToGroupConversationDialogVisible({
                visible: true,
                conversation: contact,
              })
            }
            openRenameDialog={(contact: ZelloGroupConversation) =>
              setRenameGroupConversationDialogVisible({
                visible: true,
                conversation: contact,
              })
            }
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
      {createGroupConversationDialogVisible && (
        <CreateGroupConversationDialog
          users={sdk.users}
          onCreate={(selectedUsers) => {
            sdk.createGroupConversation(selectedUsers);
          }}
          onClose={() => setCreateGroupConversationDialogVisible(false)}
        />
      )}
      {addUsersToGroupConversationDialogVisible.visible &&
        addUsersToGroupConversationDialogVisible.conversation && (
          <AddUsersToGroupConversationDialog
            onClose={() =>
              setAddUsersToGroupConversationDialogVisible({
                visible: false,
                conversation: undefined,
              })
            }
            onAddUsers={(conversation, selectedUsers) => {
              sdk.addUsersToGroupConversation(conversation, selectedUsers);
            }}
            groupConversation={
              addUsersToGroupConversationDialogVisible.conversation
            }
            availableUsers={sdk.users}
          />
        )}
      {renameGroupConversationDialogVisible.visible &&
        renameGroupConversationDialogVisible.conversation && (
          <RenameGroupConversationDialog
            onClose={() =>
              setRenameGroupConversationDialogVisible({
                visible: false,
                conversation: undefined,
              })
            }
            onRename={(conversation, newName) => {
              sdk.renameGroupConversation(conversation, newName);
            }}
            groupConversation={
              renameGroupConversationDialogVisible.conversation
            }
          />
        )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setCreateGroupConversationDialogVisible(true);
        }}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3f51b5',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 16,
    right: 16,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
    color: 'white',
  },
});

export default GroupConversationsScreen;
