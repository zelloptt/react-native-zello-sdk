import { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { Icon } from 'react-native-paper';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import { SdkContext } from '../../App';
import { ZelloContact } from '@zelloptt/react-native-zello-sdk';

interface ContextMenuButtonProps {
  contact: ZelloContact;
  showSendImageOption?: boolean;
  showSendLocationOption?: boolean;
  showSendTextOption?: boolean;
  showSendAlertOption?: boolean;
  showEmergencyOption?: boolean;
  showEndCallOption?: boolean;
  isInOutgoingEmergency?: boolean;
  onSendTextSelected: () => void;
  onSendAlertSelected: () => void;
  onShowHistorySelected: () => void;
  onEndCallSelected?: () => void;
}

const ContextMenuButton = ({
  contact,
  showSendImageOption = true,
  showSendLocationOption = true,
  showSendTextOption = true,
  showSendAlertOption = true,
  showEmergencyOption = false,
  showEndCallOption = false,
  isInOutgoingEmergency = false,
  onSendTextSelected,
  onSendAlertSelected,
  onShowHistorySelected,
  onEndCallSelected,
}: ContextMenuButtonProps) => {
  const sdk = useContext(SdkContext);

  return (
    <View style={styles.container}>
      <Menu>
        <MenuTrigger>
          <Icon size={24} source="dots-horizontal" />
        </MenuTrigger>
        <MenuOptions>
          {showSendImageOption && (
            <MenuOption
              onSelect={async () => {
                const response = await fetch(
                  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Yellow_Happy.jpg/1200px-Yellow_Happy.jpg'
                );
                const arrayBuffer = await response.arrayBuffer();
                sdk.sendImage(contact, Array.from(new Uint8Array(arrayBuffer)));
              }}
              text="Send Image"
            />
          )}
          {showSendLocationOption && (
            <MenuOption
              onSelect={() => {
                sdk.sendLocation(contact);
              }}
              text="Send Location"
            />
          )}
          {showSendTextOption && (
            <MenuOption
              onSelect={() => onSendTextSelected()}
              text="Send Text"
            />
          )}
          {showSendAlertOption && (
            <MenuOption
              onSelect={() => onSendAlertSelected()}
              text="Send Alert"
            />
          )}
          <MenuOption
            onSelect={() => {
              contact.isMuted
                ? sdk.unmuteContact(contact)
                : sdk.muteContact(contact);
            }}
            text={contact.isMuted ? 'Unmute' : 'Mute'}
          />
          {showEmergencyOption && (
            <MenuOption
              onSelect={() => {
                if (isInOutgoingEmergency) {
                  sdk.stopEmergency();
                } else {
                  sdk.startEmergency();
                }
              }}
              text={
                isInOutgoingEmergency ? 'Stop Emergency' : 'Start Emergency'
              }
            />
          )}
          {showEndCallOption && (
            <MenuOption
              onSelect={() => onEndCallSelected?.()}
              text="End Call"
            />
          )}
          <MenuOption
            onSelect={() => onShowHistorySelected()}
            text="Show History"
          />
        </MenuOptions>
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 8,
  },
});

export default ContextMenuButton;
