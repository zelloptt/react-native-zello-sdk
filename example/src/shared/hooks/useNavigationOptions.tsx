import { useLayoutEffect, useContext } from 'react';
import { ConnectionContext, SdkContext } from '../../App';
import { isAndroid, isiOS } from 'react-native-zello-sdk';
import { AndroidNavigationBar } from '../AndroidNavigationBar';
import IOSRightNavigationBar from '../IOSRightNavigationBar';
import IOSLeftNavigationBar from '../IOSLeftNavigationBar';

const useNavigationOptions = (
  navigation: any,
  setIsConnectDialogVisible: (visible: boolean) => void,
  setIsStatusDialogVisible: (visible: boolean) => void
) => {
  const sdk = useContext(SdkContext);
  const connection = useContext(ConnectionContext);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        isAndroid ? (
          <AndroidNavigationBar
            onConnectButtonClick={() =>
              connection.isConnected
                ? sdk.disconnect()
                : setIsConnectDialogVisible(true)
            }
            onStatusButtonClick={() => setIsStatusDialogVisible(true)}
          />
        ) : (
          <IOSRightNavigationBar
            onConnectButtonClick={() =>
              connection.isConnected
                ? sdk.disconnect()
                : setIsConnectDialogVisible(true)
            }
          />
        ),
      headerLeft: () =>
        isiOS ? (
          <IOSLeftNavigationBar
            onStatusButtonClick={() => setIsStatusDialogVisible(true)}
          />
        ) : null,
    });
  }, [
    sdk,
    navigation,
    setIsConnectDialogVisible,
    setIsStatusDialogVisible,
    connection,
  ]);
};

export default useNavigationOptions;
