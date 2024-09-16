import { useCallback, useContext, useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  ListRenderItem,
  Image,
} from 'react-native';
import {
  HistoryContext,
  HistoryVoiceMessageContext,
  SdkContext,
} from '../../App';
// @ts-ignore
import Ionicons from 'react-native-vector-icons/Ionicons';
import useMessageTitle from '../hooks/useMessageTitle';
import {
  ZelloHistoryAlertMessage,
  ZelloHistoryImageMessage,
  ZelloHistoryLocationMessage,
  ZelloHistoryMessage,
  ZelloHistoryTextMessage,
  ZelloHistoryVoiceMessage,
} from '@zelloptt/react-native-zello-sdk';

const HistoryItem = ({ item }: { item: ZelloHistoryMessage }) => {
  const sdk = useContext(SdkContext);
  const historyVoiceMessage = useContext(HistoryVoiceMessageContext);

  const title = useMessageTitle(
    item.contact.name,
    item.channelUser?.displayName
  );
  const timestamp = useCallback(
    () => new Date(item.timestamp).toLocaleString(),
    [item.timestamp]
  );

  const renderMessageDetails = () => {
    if (item instanceof ZelloHistoryVoiceMessage) {
      return <Text style={styles.historyText}>{`${item.durationMs} ms`}</Text>;
    }
    if (item instanceof ZelloHistoryImageMessage) {
      return <HistoryImage item={item} />;
    }
    if (
      item instanceof ZelloHistoryAlertMessage ||
      item instanceof ZelloHistoryTextMessage
    ) {
      return <Text style={styles.historyText}>{item.text}</Text>;
    }
    if (item instanceof ZelloHistoryLocationMessage) {
      return <HistoryLocation item={item} />;
    }
    return null;
  };

  const handlePress = useCallback(() => {
    if (item instanceof ZelloHistoryVoiceMessage) {
      historyVoiceMessage
        ? sdk.stopHistoryMessagePlayback()
        : sdk.playHistoryMessage(item);
    }
  }, [item, historyVoiceMessage, sdk]);

  return (
    <TouchableOpacity style={styles.historyItem} onPress={handlePress}>
      <Ionicons
        name={item.incoming ? 'arrow-down-outline' : 'arrow-up-outline'}
        size={20}
        style={styles.icon}
      />
      <View style={styles.historyTextContainer}>
        <Text style={styles.historyText}>{title()}</Text>
        <Text style={styles.historyText}>{timestamp()}</Text>
        <Text style={styles.historyText}>{item.constructor.name}</Text>
        {renderMessageDetails()}
      </View>
    </TouchableOpacity>
  );
};

const HistoryImage = ({ item }: { item: ZelloHistoryImageMessage }) => {
  const sdk = useContext(SdkContext);
  const [imageData, setImageData] = useState<string | undefined>(undefined);

  useEffect(() => {
    sdk
      .getImageDataForHistoryImageMessage(item)
      .then((data) => setImageData(data));
  }, [item, sdk]);

  return imageData ? (
    <Image source={{ uri: imageData }} style={styles.image} />
  ) : null;
};

const HistoryLocation = ({ item }: { item: ZelloHistoryLocationMessage }) => (
  <>
    <Text style={styles.historyText}>{item.latitude}</Text>
    <Text style={styles.historyText}>{item.longitude}</Text>
    <Text style={styles.historyText}>{item.accuracy}</Text>
    <Text style={styles.historyText}>{item.address}</Text>
  </>
);

export interface HistoryDialogProps {
  onClose: () => void;
}

const HistoryDialog = ({ onClose }: HistoryDialogProps) => {
  const { history, clearHistory } = useContext(HistoryContext);

  const close = useCallback(() => {
    clearHistory?.();
    onClose();
  }, [clearHistory, onClose]);

  const renderItem: ListRenderItem<ZelloHistoryMessage> = ({ item }) => (
    <HistoryItem item={item} />
  );

  return (
    <Modal visible={true} transparent={true} onRequestClose={close}>
      <View style={styles.modalContainer}>
        <View style={styles.dialogContainer}>
          <FlatList
            data={history?.messages || []}
            renderItem={renderItem}
            keyExtractor={(item) => item.historyId}
            ListEmptyComponent={<Text>No history available.</Text>}
          />
          <View style={styles.spacer} />
          <View style={styles.rowEnd}>
            <TouchableOpacity onPress={close} style={styles.button}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dialogContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    width: '80%',
    maxHeight: '80%',
  },
  spacer: {
    height: 16,
  },
  rowEnd: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  historyText: {
    fontSize: 16,
  },
  historyTextContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginLeft: 10,
  },
  icon: {
    marginRight: 10,
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginTop: 10,
  },
});

export default HistoryDialog;
