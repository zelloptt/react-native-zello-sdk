import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View, Button, TextInput } from 'react-native';
import { ZelloGroupConversation } from '@zelloptt/react-native-zello-sdk';

interface RenameGroupConversationDialogProps {
  onClose: () => void;
  onRename: (conversation: ZelloGroupConversation, newName: string) => void;
  groupConversation: ZelloGroupConversation;
}

const RenameGroupConversationDialog: React.FC<
  RenameGroupConversationDialogProps
> = ({ onClose, onRename, groupConversation }) => {
  const [newName, setNewName] = useState<string>(groupConversation.displayName);

  const handleRename = () => {
    onRename(groupConversation, newName);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Rename Conversation</Text>
          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
          />
          <View style={styles.buttonContainer}>
            <Button title="Cancel" onPress={onClose} />
            <Button title="Save" onPress={handleRename} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
});

export default RenameGroupConversationDialog;
