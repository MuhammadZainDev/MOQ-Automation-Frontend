import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
  const { user, logout, updateName, updateProfilePicture } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      // Navigation is handled in the AuthContext
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleEditName = () => {
    if (user) {
      setNewName(user.name);
      setShowEditModal(true);
    }
  };

  const handleSaveName = async () => {
    if (!user || !newName.trim() || newName === user.name) {
      setShowEditModal(false);
      return;
    }

    setIsUpdating(true);
    try {
      // Call the updateName method from AuthContext
      const result = await updateName(newName.trim());
      
      if (result.success) {
        // Close the modal if successful
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error updating name:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProfilePictureChange = async () => {
    try {
      // Ask for permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photo library to change profile picture.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // Start loading state
        setIsUploadingImage(true);
        
        // Use the URI directly
        const imageUrl = selectedImage.uri;
        
        console.log("Selected image URI:", imageUrl);
        
        try {
          // Update profile picture in backend
          const response = await updateProfilePicture(imageUrl);
          
          if (response.success) {
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'Profile picture updated',
              position: 'bottom'
            });
          } else {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: response.error || 'Failed to update profile picture',
              position: 'bottom'
            });
          }
        } catch (uploadError: any) {
          console.error('Error updating profile picture:', uploadError);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: `Error updating profile picture: ${uploadError.message || 'Unknown error'}`,
            position: 'bottom'
          });
        }
      }
    } catch (error) {
      console.error('Error selecting/uploading image:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update profile picture',
        position: 'bottom'
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <TouchableOpacity 
          style={styles.avatarContainer} 
          onPress={handleProfilePictureChange}
          disabled={isUploadingImage}
        >
          {isUploadingImage ? (
            <ActivityIndicator color="#DF0000" size="large" />
          ) : (
            <>
              <Image 
                source={user?.profile_picture ? { uri: user.profile_picture } : require('../../assets/logo/logo.jpg')} 
                style={styles.logoImage}
                resizeMode="cover"
              />
              <View style={styles.editImageOverlay}>
                <Ionicons name="camera" size={24} color="#fff" />
              </View>
            </>
          )}
        </TouchableOpacity>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{user.name}</Text>
          <TouchableOpacity style={styles.editButton} onPress={handleEditName}>
            <Ionicons name="pencil" size={16} color="#DF0000" />
          </TouchableOpacity>
        </View>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Ionicons name="mail-outline" size={24} color="#DF0000" style={styles.icon} />
          <Text style={styles.infoText}>{user.email}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loggingOut}>
        {loggingOut ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Edit Name Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter new name"
              placeholderTextColor="#999"
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowEditModal(false)}
                disabled={isUpdating}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleSaveName}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 10,
  },
  editButton: {
    padding: 5,
  },
  email: {
    fontSize: 16,
    color: '#999',
    marginBottom: 5,
  },
  infoSection: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  icon: {
    marginRight: 15,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#DF0000',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 6,
    color: '#fff',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#444',
  },
  saveButton: {
    backgroundColor: '#DF0000',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 