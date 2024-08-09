import { useCallback } from 'react';

const useMessageTitle = (contactName: string, channelUserName?: string) => {
  return useCallback(() => {
    if (channelUserName) {
      return `${channelUserName} in ${contactName}`;
    }
    return contactName;
  }, [contactName, channelUserName]);
};

export default useMessageTitle;
