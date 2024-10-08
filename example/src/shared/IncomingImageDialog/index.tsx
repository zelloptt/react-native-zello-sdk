import { useCallback, useContext } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { ZelloImageMessage } from '@zelloptt/react-native-zello-sdk';
import { LastIncomingImageMessageContext } from '../../App';
import useMessageTitle from '../hooks/useMessageTitle';

export interface IncomingImageDialogProps {
  message: ZelloImageMessage;
}

const IncomingImageDialog = ({ message }: IncomingImageDialogProps) => {
  const { clearMessage } = useContext(LastIncomingImageMessageContext);

  const title = useMessageTitle(
    message.contact,
    message.channelUser?.displayName
  );

  const onClose = useCallback(() => {
    clearMessage?.();
  }, [clearMessage]);

  return (
    <Modal visible={true} transparent={true} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.dialogContainer}>
          <Text>{title()}</Text>
          <View style={styles.spacer} />
          {message.image && (
            <Image source={{ uri: message.image }} style={styles.image} />
          )}
          <View style={styles.spacer} />
          <View style={styles.rowEnd}>
            <TouchableOpacity onPress={onClose} style={styles.button}>
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
  image: {
    width: '100%',
    height: 500,
    resizeMode: 'contain',
  },
});

export default IncomingImageDialog;
