import React, { useCallback, useState, useContext } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  LastIncomingAlertMessageContext,
  LastIncomingImageMessageContext,
  LastIncomingLocationMessageContext,
  LastIncomingTextMessageContext,
  RecentsContext,
  SdkContext,
} from '../App';
import ConnectModal from '../shared/ConnectModal';
import {
  ZelloAccountStatus,
  ZelloRecentEntry,
} from '@zelloptt/react-native-zello-sdk';
import StatusDialog from '../shared/StatusDialog';
import useNavigationOptions from '../shared/hooks/useNavigationOptions';
// @ts-ignore
import Ionicons from 'react-native-vector-icons/Ionicons';
import IncomingImageDialog from '../shared/IncomingImageDialog';
import IncomingAlertDialog from '../shared/IncomingAlertDialog';
import IncomingTextDialog from '../shared/IncomingTextDialog';
import IncomingLocationDialog from '../shared/IncomingLocationDialog';

interface RecentViewProps {
  recent: ZelloRecentEntry;
}

const RecentView = React.memo(
  ({ recent }: RecentViewProps) => {
    const title = useCallback(() => {
      if (recent.channelUser) {
        return `${recent.channelUser.name} : ${recent.contact.name}`;
      }
      return recent.contact.name;
    }, [recent.contact, recent.channelUser]);

    const timestamp = useCallback(() => {
      return new Date(recent.timestamp).toLocaleString();
    }, [recent.timestamp]);

    return (
      <TouchableOpacity style={styles.recentContainer}>
        <Ionicons
          name={recent.incoming ? 'arrow-down-outline' : 'arrow-up-outline'}
        />
        <View style={styles.recentTextContainer}>
          <Text>{title()}</Text>
          <Text>{recent.type}</Text>
          <Text>{timestamp()}</Text>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => prevProps.recent === nextProps.recent
);

interface RecentsScreenProps {
  navigation: any;
}

const RecentsScreen = ({ navigation }: RecentsScreenProps) => {
  const sdk = useContext(SdkContext);
  const recents = useContext(RecentsContext);
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

  const [isConnectDialogVisible, setIsConnectDialogVisible] = useState(false);
  const [isStatusDialogVisible, setIsStatusDialogVisible] = useState(false);

  useNavigationOptions(
    navigation,
    setIsConnectDialogVisible,
    setIsStatusDialogVisible
  );

  const renderItem = useCallback(
    ({ item }: { item: ZelloRecentEntry }) => <RecentView recent={item} />,
    []
  );

  const keyExtractor = useCallback(
    (item: ZelloRecentEntry) => item.contact.name,
    []
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={recents}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  recentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  recentTextContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 10,
  },
});

export default RecentsScreen;
