import ConnectButton from '../ConnectButton';
import { StyleSheet, View } from 'react-native';

interface IOSRightNavigationBarProps {
  onConnectButtonClick: () => void;
}

const IOSRightNavigationBar = ({
  onConnectButtonClick,
}: IOSRightNavigationBarProps) => {
  return (
    <View style={styles.container}>
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

export default IOSRightNavigationBar;
