import { Text } from 'react-native';
import { useContext } from 'react';
import { ConnectionContext } from '../../App';

interface ConnectButtonProps {
  onClick: () => void;
}

const ConnectButton = ({ onClick }: ConnectButtonProps) => {
  const connectionContext = useContext(ConnectionContext);

  return (
    <Text onPress={onClick}>
      {connectionContext.isConnecting
        ? 'Connecting'
        : connectionContext.isConnected
          ? 'Disconnect'
          : 'Connect'}
    </Text>
  );
};

export default ConnectButton;
