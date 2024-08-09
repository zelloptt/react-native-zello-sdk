import { useContext } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { AccountStatusContext } from '../../App';
import { ZelloAccountStatus } from 'react-native-zello-sdk';

export type StatusDialogProps = {
  onDismiss: () => void;
  onSelectStatus: (status: ZelloAccountStatus) => void;
};

const statusLabels = {
  [ZelloAccountStatus.Available]: 'Available',
  [ZelloAccountStatus.Busy]: 'Busy',
};

const StatusDialog = ({ onDismiss, onSelectStatus }: StatusDialogProps) => {
  const selectedStatus = useContext(AccountStatusContext);
  const statuses = Object.values(ZelloAccountStatus);

  return (
    <Modal visible={true} transparent={true} onRequestClose={onDismiss}>
      <View style={styles.modalContainer}>
        <View style={styles.dialogContainer}>
          {statuses.map((status) => (
            <View key={status} style={styles.row}>
              <RadioButton
                value={status.toString()}
                status={status === selectedStatus ? 'checked' : 'unchecked'}
                onPress={() => onSelectStatus(status)}
              />
              <Text style={styles.statusText}>{statusLabels[status]}</Text>
            </View>
          ))}
          <View style={styles.spacer} />
          <View style={styles.rowEnd}>
            <TouchableOpacity onPress={onDismiss} style={styles.button}>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 8,
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
});

export default StatusDialog;
