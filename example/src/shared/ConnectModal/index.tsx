import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View, Button } from 'react-native';

interface ConnectDialogProps {
  onClose: () => void;
  onConnect: (username: string, password: string, network: string) => void;
}

const ConnectModal: React.FC<ConnectDialogProps> = ({ onClose, onConnect }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [network, setNetwork] = useState('');

  const handleConnect = () => {
    onConnect(username, password, network);
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
          <Text style={styles.modalText}>Connect</Text>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            autoCapitalize="none"
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            autoCapitalize="none"
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Network"
            value={network}
            autoCapitalize="none"
            onChangeText={setNetwork}
          />
          <View style={styles.buttonContainer}>
            <Button title="Cancel" onPress={onClose} />
            <Button title="Connect" onPress={handleConnect} />
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
    marginBottom: 10,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 20,
    width: '100%',
  },
});

export default ConnectModal;
