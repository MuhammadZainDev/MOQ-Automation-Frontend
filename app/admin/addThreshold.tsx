import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  Image,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { createThreshold } from '../../src/services/thresholdApi';
import { adminService } from '../../src/services/adminApi';
import { useAuth } from '../../src/context/AuthContext';

// Type definition for user
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  profile_picture?: string;
};

export default function AddThresholdScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    user_id: ''
  });
  
  // Form errors
  const [errors, setErrors] = useState({
    name: '',
    amount: '',
    user_id: ''
  });
  
  // Handle logout function
  const handleLogout = async () => {
    await logout();
  };
  
  // Load real users from the API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        // Get all users from the admin API
        const response = await adminService.getAllUsers();
        
        if (response.success) {
          // Only include active users
          const activeUsers = response.data
            .filter((user: any) => Boolean(user.isActive))
            .map((user: any) => ({
              id: user.id.toString(),
              name: user.name,
              email: user.email,
              role: user.role.toLowerCase(),
              isActive: Boolean(user.isActive),
              createdAt: new Date(user.createdAt).toLocaleDateString(),
              profile_picture: user.profile_picture
            }));
          
          setUsers(activeUsers);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to load users',
          });
        }
      } catch (error) {
        console.error('Error loading users:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error instanceof Error ? error.message : 'Failed to load users',
        });
      } finally {
        setLoadingUsers(false);
      }
    };
    
    loadUsers();
  }, []);
  
  // Validate and submit form
  const handleSubmit = async () => {
    // Validate form
    let isValid = true;
    const newErrors = { name: '', amount: '', user_id: '' };
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
      isValid = false;
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
      isValid = false;
    }
    
    if (!formData.user_id) {
      newErrors.user_id = 'User is required';
      isValid = false;
    }
    
    setErrors(newErrors);
    
    if (!isValid) return;
    
    try {
      setLoading(true);
      
      // Format threshold data according to API expectations
      const thresholdData = {
        name: formData.name.trim(),
        amount: Number(formData.amount),
        user_id: formData.user_id
      };
      
      console.log('Submitting threshold data:', JSON.stringify(thresholdData));
      
      const response = await createThreshold(thresholdData);
      
      if (response?.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Threshold created successfully',
        });
        
        // Navigate back to thresholds list
        router.back();
      } else {
        const errorMessage = response?.message || 'Failed to create threshold';
        console.error('API Error:', errorMessage);
        
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
        });
      }
    } catch (error: any) {
      // Enhanced error logging
      console.error('Error creating threshold:', error);
      let errorMsg = 'Failed to create threshold';
      
      // Try to extract more details from the error
      if (error?.response) {
        console.error('Error response data:', JSON.stringify(error.response.data));
        console.error('Error response status:', error.response.status);
        
        if (error.response.data?.message) {
          errorMsg = error.response.data.message;
        } else if (error.response.status === 500) {
          errorMsg = 'Server error. Please check your data and try again.';
          
          // Show server error details in an alert for debugging
          Alert.alert(
            'Server Error Details',
            `Status: ${error.response.status}\nData: ${JSON.stringify(error.response.data || {})}`,
            [{ text: 'OK' }]
          );
        }
      } else if (error?.message) {
        errorMsg = error.message;
      }
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Get selected user
  const getSelectedUser = () => {
    if (!formData.user_id) return null;
    return users.find(user => user.id === formData.user_id);
  };
  
  // Select user handler
  const selectUser = (userId: string) => {
    setFormData({...formData, user_id: userId});
    setModalVisible(false);
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header with MOQ Admin and logout */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MOQ Admin</Text>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <ScrollView style={styles.scrollContent}>
            {loadingUsers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#DF0000" />
                <Text style={styles.loadingText}>Loading users...</Text>
              </View>
            ) : (
              <>
                {/* Main heading and description */}
                <View style={styles.headingContainer}>
                  <Text style={styles.mainHeading}>Add Threshold</Text>
                  <Text style={styles.headingDescription}>
                    Create a new threshold for a user. Thresholds help track and notify when a user reaches specific revenue milestones.
                  </Text>
                </View>
                
                {/* User Selection field */}
                <Text style={styles.inputLabel}>Select User</Text>
                <TouchableOpacity 
                  style={styles.inputContainer}
                  onPress={() => setModalVisible(true)}
                >
                  <Ionicons name="person-outline" size={22} color="#777" style={styles.inputIcon} />
                  <View style={styles.selectedUserContainer}>
                    {getSelectedUser() ? (
                      <Text style={styles.selectedValue}>
                        {getSelectedUser()?.name}
                      </Text>
                    ) : (
                      <Text style={[styles.selectedValue, { color: '#777' }]}>
                        Select a user
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-down" size={18} color="#777" style={styles.dropdownIcon} />
                </TouchableOpacity>
                
                {errors.user_id ? (
                  <Text style={styles.errorText}>{errors.user_id}</Text>
                ) : null}
                
                <Text style={styles.inputLabel}>Threshold Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="bookmark-outline" size={22} color="#777" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter threshold name"
                    placeholderTextColor="#777"
                    value={formData.name}
                    onChangeText={(text) => setFormData({...formData, name: text})}
                  />
                </View>
                {errors.name ? (
                  <Text style={styles.errorText}>{errors.name}</Text>
                ) : null}
                
                <Text style={styles.inputLabel}>Amount ($)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="cash-outline" size={22} color="#777" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter amount"
                    placeholderTextColor="#777"
                    keyboardType="numeric"
                    value={formData.amount}
                    onChangeText={(text) => setFormData({...formData, amount: text})}
                  />
                </View>
                {errors.amount ? (
                  <Text style={styles.errorText}>{errors.amount}</Text>
                ) : null}
                
                <TouchableOpacity
                  style={[
                    styles.submitButton, 
                    (!formData.name || !formData.amount || !formData.user_id) && styles.disabledButton
                  ]}
                  onPress={handleSubmit}
                  disabled={loading || !formData.name || !formData.amount || !formData.user_id}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Create Threshold</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      
      {/* User Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select User</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {users.length === 0 ? (
                <View style={styles.noUsersContainer}>
                  <Text style={styles.noUsersText}>No active users found</Text>
                </View>
              ) : (
                <ScrollView style={styles.userList}>
                  {users.map(user => (
                    <TouchableOpacity 
                      key={user.id}
                      style={styles.userItem}
                      onPress={() => selectUser(user.id)}
                    >
                      <View style={styles.userItemContent}>
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>{user.name}</Text>
                          <Text style={styles.userEmail}>{user.email}</Text>
                        </View>
                        {formData.user_id === user.id && (
                          <Ionicons name="checkmark-circle" size={24} color="#DF0000" />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 14,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    position: 'relative',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 10,
  },
  headingContainer: {
    marginBottom: 24,
    marginTop: 8,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headingDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  inputLabel: {
    color: '#ccc',
    marginBottom: 8,
    fontSize: 14,
  },
  inputContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 50,
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#fff',
    paddingRight: 12,
  },
  selectedUserContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  selectedValue: {
    color: '#fff',
    fontSize: 16,
  },
  dropdownIcon: {
    marginRight: 12,
  },
  submitButton: {
    backgroundColor: '#DF0000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  disabledButton: {
    backgroundColor: 'rgba(223, 0, 0, 0.5)',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#DF0000',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#222',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
    maxHeight: '80%',
  },
  userList: {
    maxHeight: 400,
  },
  userItem: {
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
  },
  userItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#888',
    fontSize: 12,
  },
  noUsersContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noUsersText: {
    color: '#888',
    fontSize: 16,
  },
});