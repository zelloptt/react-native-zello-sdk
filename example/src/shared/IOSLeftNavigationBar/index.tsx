import { StyleSheet, Text, View } from 'react-native';
import { useContext } from 'react';
import { ConnectionContext } from '../../App';

interface IOSLeftNavigationBarProps {
  onStatusButtonClick: () => void;
}

const IOSLeftNavigationBar = ({
  onStatusButtonClick,
}: IOSLeftNavigationBarProps) => {
  const connection = useContext(ConnectionContext);
  return (
    <View style={styles.container}>
      {connection.isConnected ? (
        <>
          <Text onPress={onStatusButtonClick}>Set Status</Text>
          <View style={styles.spacer} />
        </>
      ) : null}
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

export default IOSLeftNavigationBar;
