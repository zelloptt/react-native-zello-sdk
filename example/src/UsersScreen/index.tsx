import { useCallback, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useContext } from 'react';
import {
  HistoryContext,
  LastIncomingAlertMessageContext,
  LastIncomingImageMessageContext,
  LastIncomingLocationMessageContext,
  LastIncomingTextMessageContext,
  SdkContext,
  SelectedContactContext,
  UsersContext,
} from '../App';
import TalkButton from '../shared/TalkButton';
import ConnectModal from '../shared/ConnectModal';
import {
  isSameContact,
  ZelloAccountStatus,
  ZelloHistoryMessage,
  ZelloUser,
  ZelloUserStatus,
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
import ProfilePicture from '../shared/ProfilePicture';

interface UserViewProps {
  user: ZelloUser;
  isSelectedContact: boolean;
  openSendTextDialog: (contact: ZelloUser) => void;
  openSendAlertDialog: (contact: ZelloUser) => void;
  openHistoryDialog: (contact: ZelloUser) => void;
}

const UserView = ({
  user,
  isSelectedContact,
  openSendTextDialog,
  openSendAlertDialog,
  openHistoryDialog,
}: UserViewProps) => {
  const sdk = useContext(SdkContext);
  const statusText = useCallback(() => {
    switch (user.status) {
      case ZelloUserStatus.Available:
        return 'Available';
      case ZelloUserStatus.Busy:
        return 'Busy';
      case ZelloUserStatus.Standby:
        return 'Standby';
      case ZelloUserStatus.Offline:
        return 'Offline';
    }
  }, [user.status]);
  return (
    <TouchableOpacity
      style={styles.userContainer}
      onPress={() => sdk.setSelectedContact(user)}
    >
      {user.profilePictureThumbnailUrl && (
        <ProfilePicture url={user.profilePictureThumbnailUrl} />
      )}
      <View style={styles.usernameContainer}>
        <Text
          style={[styles.username, isSelectedContact && styles.selectedContact]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {user.name}
        </Text>
        <Text>{statusText()}</Text>
      </View>
      <View style={styles.trailingButtons}>
        <ContextMenuButton
          contact={user}
          onSendTextSelected={() => openSendTextDialog(user)}
          onSendAlertSelected={() => openSendAlertDialog(user)}
          onShowHistorySelected={() => openHistoryDialog(user)}
        />
        <TalkButton contact={user} disabled={false} />
      </View>
    </TouchableOpacity>
  );
};

interface UsersScreenProps {
  navigation: any;
}

const UsersScreen = ({ navigation }: UsersScreenProps) => {
  const sdk = useContext(SdkContext);
  const users = useContext(UsersContext);
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

  const [isConnectDialogVisible, setIsConnectDialogVisible] = useState(false);
  const [isStatusDialogVisible, setIsStatusDialogVisible] = useState(false);
  const [sendTextDialogVisible, setSendTextDialogVisible] = useState({
    visible: false,
    user: undefined as ZelloUser | undefined,
  });
  const [sendAlertDialogVisible, setSendAlertDialogVisible] = useState({
    visible: false,
    user: undefined as ZelloUser | undefined,
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
        data={users}
        renderItem={({ item }) => (
          <UserView
            user={item}
            isSelectedContact={
              selectedContact !== undefined &&
              isSameContact(selectedContact, item)
            }
            openSendTextDialog={(contact: ZelloUser) =>
              setSendTextDialogVisible({
                visible: true,
                user: contact,
              })
            }
            openSendAlertDialog={(contact: ZelloUser) =>
              setSendAlertDialogVisible({
                visible: true,
                user: contact,
              })
            }
            openHistoryDialog={(contact: ZelloUser) => {
              sdk
                .getHistory(contact)
                .then((messages: ZelloHistoryMessage[]) => {
                  setHistory?.(contact, messages);
                  setHistoryDialogVisible(true);
                });
            }}
          />
        )}
        keyExtractor={(item) => item.name}
      />
      {isConnectDialogVisible && (
        <ConnectModal
          onConnect={(username: string, password, network) => {
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
      {sendTextDialogVisible.visible && sendTextDialogVisible.user && (
        <OutgoingTextDialog
          contact={sendTextDialogVisible.user}
          onClose={() =>
            setSendTextDialogVisible({ visible: false, user: undefined })
          }
        />
      )}
      {sendAlertDialogVisible.visible && sendAlertDialogVisible.user && (
        <OutgoingAlertDialog
          contact={sendAlertDialogVisible.user}
          onClose={() =>
            setSendAlertDialogVisible({ visible: false, user: undefined })
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
  userContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  usernameContainer: {
    flex: 1,
  },
  username: {
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
});

export default UsersScreen;
