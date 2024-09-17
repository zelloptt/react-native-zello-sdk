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
import {
  ZelloUser,
  ZelloGroupConversation,
} from '@zelloptt/react-native-zello-sdk';

interface AddUsersToGroupConversationDialogProps {
  onClose: () => void;
  onAddUsers: (
    conversation: ZelloGroupConversation,
    selectedUsers: ZelloUser[]
  ) => void;
  groupConversation: ZelloGroupConversation;
  availableUsers: ZelloUser[]; // List of all users to filter against
}

const AddUsersToGroupConversationDialog: React.FC<
  AddUsersToGroupConversationDialogProps
> = ({ onClose, onAddUsers, groupConversation, availableUsers }) => {
  const filteredUsers = availableUsers.filter(
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

  const handleAddUsers = () => {
    const selectedUsers = filteredUsers.filter((user) =>
      selectedUserIds.includes(user.name)
    );
    onAddUsers(groupConversation, selectedUsers);
    onClose();
  };

  // Filter available users to show only those not already in the conversation
  const usersNotInConversation = filteredUsers.filter(
    (user) =>
      !groupConversation.users.some(
        (channelUser) =>
          channelUser.name.toLowerCase() === user.name.toLowerCase()
      )
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Add Users to Conversation</Text>
          <FlatList
            data={usersNotInConversation}
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
            <Button title="Add Users" onPress={handleAddUsers} />
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

export default AddUsersToGroupConversationDialog;
