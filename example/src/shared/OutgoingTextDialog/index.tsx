import { useCallback, useContext, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ZelloContact } from 'react-native-zello-sdk';
import { SdkContext } from '../../App';

export interface OutgoingTextDialogProps {
  contact: ZelloContact;
  onClose: () => void;
}

const OutgoingTextDialog = ({ contact, onClose }: OutgoingTextDialogProps) => {
  const sdk = useContext(SdkContext);

  const [text, setText] = useState('');

  const onSend = useCallback(() => {
    sdk.sendText(contact, text);
    onClose();
  }, [contact, sdk, text, onClose]);

  return (
    <Modal visible={true} transparent={true} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.dialogContainer}>
          <Text>{`Send text to ${contact.name}`}</Text>
          <View style={styles.spacer} />
          <TextInput
            placeholder="Type your message"
            onChangeText={(value: string) => setText(value)}
          />
          <View style={styles.spacer} />
          <View style={styles.rowEnd}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.spacer} />
            <TouchableOpacity style={styles.button} onPress={onSend}>
              <Text style={styles.buttonText}>Send</Text>
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
    width: 16,
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

export default OutgoingTextDialog;
