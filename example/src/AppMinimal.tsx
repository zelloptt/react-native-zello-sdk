import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, Button, StyleSheet } from 'react-native';
import Zello, {
  ZelloEvent,
  type ZelloConnectionState,
  type ZelloConnectionError,
} from '@zelloptt/react-native-zello-sdk';

// Minimal SPM smoke test. Importing the SDK runs
// TurboModuleRegistry.getEnforcing('NativeZelloSdk') at module load — if the
// prebuilt xcframework didn't register the TurboModule over SPM, this throws
// before the screen renders. Rendering + a working configure() call proves the
// SPM-linked native module resolves and its methods are callable. Deliberately
// uses NONE of the RN-0.87-lagged native deps (screens/nav/paper/...).
const sdk = Zello.getInstance();

export default function App() {
  const [status, setStatus] = useState('starting…');

  useEffect(() => {
    try {
      sdk.configure({
        android: {
          enableOfflineMessagePushNotifications: true,
          enableForegroundService: true,
        },
        ios: { isDebugBuild: true, appGroup: '' },
      });
      sdk.addListener(ZelloEvent.CONNECT_STARTED, () =>
        setStatus('connecting…')
      );
      sdk.addListener(ZelloEvent.CONNECT_SUCCEEDED, () =>
        setStatus('connected')
      );
      sdk.addListener(
        ZelloEvent.CONNECT_FAILED,
        (_s: ZelloConnectionState, e: ZelloConnectionError) =>
          setStatus(`connect failed (expected w/o creds): ${e}`)
      );
      setStatus('TurboModule resolved via SPM ✓ — configure() ok');
    } catch (e) {
      setStatus(`SDK error: ${String(e)}`);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Zello SDK · SPM smoke test</Text>
      <Text style={styles.status}>{status}</Text>
      <Button
        title="try connect"
        onPress={() =>
          sdk.connect({ network: 'example', username: 'u', password: 'p' })
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  title: { fontSize: 18, fontWeight: '600' },
  status: { fontSize: 14, color: '#555', textAlign: 'center' },
});
