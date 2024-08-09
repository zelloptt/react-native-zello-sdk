import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCallback, useContext } from 'react';
import {
  isSameContact,
  ZelloContact,
  ZelloOutgoingVoiceMessageState,
} from 'react-native-zello-sdk';
import {
  IncomingVoiceMessageContext,
  OutgoingVoiceMessageContext,
  SdkContext,
} from '../../App';

interface TalkButtonProps {
  contact: ZelloContact;
  disabled: boolean;
}

const TalkButton = ({ contact, disabled }: TalkButtonProps) => {
  const sdk = useContext(SdkContext);
  const incomingVoiceMessage = useContext(IncomingVoiceMessageContext);
  const outgoingVoiceMessage = useContext(OutgoingVoiceMessageContext);

  const onButtonDown = useCallback(() => {
    sdk.startVoiceMessage(contact);
  }, [sdk, contact]);
  const onButtonUp = useCallback(() => {
    sdk.stopVoiceMessage();
  }, [sdk]);

  const isIncomingMessageReceiving = useCallback((): boolean => {
    return (
      incomingVoiceMessage !== undefined &&
      isSameContact(incomingVoiceMessage.contact, contact)
    );
  }, [incomingVoiceMessage, contact]);
  const isOutgoingMessageConnecting = useCallback((): boolean => {
    return (
      outgoingVoiceMessage?.state ===
        ZelloOutgoingVoiceMessageState.Connecting &&
      isSameContact(outgoingVoiceMessage.contact, contact)
    );
  }, [outgoingVoiceMessage, contact]);
  const isOutgoingMessageSending = useCallback((): boolean => {
    return (
      outgoingVoiceMessage?.state === ZelloOutgoingVoiceMessageState.Sending &&
      isSameContact(outgoingVoiceMessage.contact, contact)
    );
  }, [outgoingVoiceMessage, contact]);

  return (
    <TouchableOpacity
      onPressIn={onButtonDown}
      onPressOut={onButtonUp}
      disabled={disabled}
    >
      <View style={styles.pttButton}>
        <Text style={styles.pttText}>
          {isOutgoingMessageSending()
            ? 'Sending'
            : isOutgoingMessageConnecting()
              ? 'Connecting'
              : isIncomingMessageReceiving()
                ? 'Receiving'
                : 'PTT'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pttButton: {
    padding: 10,
    backgroundColor: 'blue',
  },
  pttText: {
    color: 'white',
  },
});

export default TalkButton;
