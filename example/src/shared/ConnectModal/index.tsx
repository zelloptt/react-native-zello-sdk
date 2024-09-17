import React, { useCallback, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View, Button } from 'react-native';

interface ConnectDialogProps {
  onClose: () => void;
  onConnect: (username: string, password: string, network: string) => void;
}

const ConnectModal: React.FC<ConnectDialogProps> = ({ onClose, onConnect }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    network: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
  };

  const isValidCredentials = useCallback(() => {
    const { username, password, network } = credentials;
    return username && password && network;
  }, [credentials]);

  const handleConnect = () => {
    const { username, password, network } = credentials;
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
            value={credentials.username}
            autoCapitalize="none"
            onChangeText={(value) => handleInputChange('username', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={credentials.password}
            autoCapitalize="none"
            onChangeText={(value) => handleInputChange('password', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Network"
            value={credentials.network}
            autoCapitalize="none"
            onChangeText={(value) => handleInputChange('network', value)}
          />
          <View style={styles.buttonContainer}>
            <Button title="Cancel" onPress={onClose} />
            <Button
              title="Connect"
              disabled={!isValidCredentials()}
              onPress={handleConnect}
            />
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
