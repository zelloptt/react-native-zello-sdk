import { useCallback } from 'react';
import {
  ZelloContact,
  ZelloGroupConversation,
  ZelloUser,
} from '@zelloptt/react-native-zello-sdk';

const useContactDisplayName = (contact: ZelloContact) => {
  return useCallback(() => {
    if (contact instanceof ZelloGroupConversation) {
      return contact.displayName;
    } else if (contact instanceof ZelloUser) {
      return contact.displayName;
    }
    return contact.name;
  }, [contact]);
};

export default useContactDisplayName;
