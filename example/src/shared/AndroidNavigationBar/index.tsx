import ConnectButton from '../ConnectButton';
import { StyleSheet, Text, View } from 'react-native';
import { ConnectionContext } from '../../App';
import { useContext } from 'react';

interface NavigationBarProps {
  onConnectButtonClick: () => void;
  onStatusButtonClick: () => void;
}

export const AndroidNavigationBar = ({
  onConnectButtonClick,
  onStatusButtonClick,
}: NavigationBarProps) => {
  const connection = useContext(ConnectionContext);
  return (
    <View style={styles.container}>
      {connection.isConnected ? (
        <>
          <Text onPress={onStatusButtonClick}>Set Status</Text>
          <View style={styles.spacer} />
        </>
      ) : null}
      <ConnectButton onClick={onConnectButtonClick} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center', // Center items vertically
    paddingVertical: 10, // Adjust vertical padding
    paddingHorizontal: 15, // Adjust horizontal padding
  },
  spacer: {
    width: 10,
  },
});
