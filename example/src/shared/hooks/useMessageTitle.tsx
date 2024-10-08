import { useCallback } from 'react';
import useContactDisplayName from './useContactDisplayName';
import { ZelloContact } from '@zelloptt/react-native-zello-sdk';

const useMessageTitle = (contact: ZelloContact, channelUserName?: string) => {
  const contactDisplayName = useContactDisplayName(contact)();
  return useCallback(() => {
    if (channelUserName) {
      return `${channelUserName} in ${contactDisplayName}`;
    }
    return contactDisplayName;
  }, [contactDisplayName, channelUserName]);
};

export default useMessageTitle;
