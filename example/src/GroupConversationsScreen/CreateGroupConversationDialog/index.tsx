import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Button,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Checkbox } from 'react-native-paper';
import { ZelloUser } from '@zelloptt/react-native-zello-sdk';

interface CreateGroupConversationDialogProps {
  onClose: () => void;
  onCreate: (selectedUsers: ZelloUser[]) => void;
  users: ZelloUser[];
}

const CreateGroupConversationDialog: React.FC<
  CreateGroupConversationDialogProps
> = ({ onClose, onCreate, users }) => {
  const filteredUsers = users.filter(
    (user) => user.supportedFeatures.groupConversations
  );
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
  };

  const handleCreate = () => {
    const selectedUsers = users.filter((user) =>
      selectedUserIds.includes(user.name)
    );
    onCreate(selectedUsers);
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
          <Text style={styles.modalText}>Select Users</Text>
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.userItem}
                onPress={() => toggleUserSelection(item.name)}
              >
                <Text style={styles.userName}>{item.displayName}</Text>
                <Checkbox
                  status={
                    selectedUserIds.includes(item.name)
                      ? 'checked'
                      : 'unchecked'
                  }
                  onPress={() => toggleUserSelection(item.name)}
                />
              </TouchableOpacity>
            )}
          />
          <View style={styles.buttonContainer}>
            <Button title="Close" onPress={onClose} />
            <Button title="Create" onPress={handleCreate} />
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
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
  },
  userName: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 20,
    width: '100%',
  },
});

export default CreateGroupConversationDialog;
