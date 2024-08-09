import { useCallback, useContext } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ZelloAlertMessage } from '@zelloptt/react-native-zello-sdk';
import { LastIncomingAlertMessageContext } from '../../App';
import useMessageTitle from '../hooks/useMessageTitle';

export interface IncomingAlertDialogProps {
  message: ZelloAlertMessage;
}

const IncomingAlertDialog = ({ message }: IncomingAlertDialogProps) => {
  const { clearMessage } = useContext(LastIncomingAlertMessageContext);

  const title = useMessageTitle(
    message.contact.name,
    message.channelUser?.name
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
          <Text>{message.text}</Text>
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

export default IncomingAlertDialog;
