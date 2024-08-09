import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface ProfilePictureProps {
  url: string;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({ url }) => {
  return <Image source={{ uri: url }} style={styles.profilePicture} />;
};

const styles = StyleSheet.create({
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
});

export default ProfilePicture;
