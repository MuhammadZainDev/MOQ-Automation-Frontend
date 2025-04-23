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
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { createThreshold } from '../../src/services/thresholdApi';
import { adminService } from '../../src/services/adminApi';
import AdminLayout from '../../src/components/AdminLayout';

// Type definition for user
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export default function AddThresholdScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
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
              createdAt: new Date(user.createdAt).toLocaleDateString()
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
  
  // Select user handler
  const selectUser = (userId: string) => {
    setFormData({...formData, user_id: userId});
  };
  
  return (
    <AdminLayout>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Threshold</Text>
          </View>
          
          <ScrollView style={styles.content}>
            {loadingUsers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#DF0000" />
                <Text style={styles.loadingText}>Loading users...</Text>
              </View>
            ) : (
              <>
                {/* User Selection */}
                <Text style={styles.sectionTitle}>User Selection</Text>
                <View style={styles.userList}>
                  {users.length > 0 ? (
                    users.map(user => (
                      <TouchableOpacity
                        key={user.id}
                        style={[
                          styles.userItem,
                          formData.user_id === user.id && styles.userItemSelected
                        ]}
                        onPress={() => selectUser(user.id)}
                      >
                        <View style={styles.userAvatar}>
                          <Text style={styles.userInitial}>{user.name.charAt(0)}</Text>
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>{user.name}</Text>
                          <Text style={styles.userEmail}>{user.email}</Text>
                        </View>
                        {formData.user_id === user.id && (
                          <Ionicons name="checkmark-circle" size={24} color="#DF0000" />
                        )}
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.emptyUsers}>
                      <Text style={styles.emptyUsersText}>No active users found</Text>
                    </View>
                  )}
                </View>
                {errors.user_id ? (
                  <Text style={styles.errorText}>{errors.user_id}</Text>
                ) : null}
                
                {/* Threshold Details */}
                <Text style={styles.sectionTitle}>Threshold Details</Text>
                
                <Text style={styles.inputLabel}>Threshold Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter threshold name"
                  placeholderTextColor="#666"
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                />
                {errors.name ? (
                  <Text style={styles.errorText}>{errors.name}</Text>
                ) : null}
                
                <Text style={styles.inputLabel}>Amount ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={formData.amount}
                  onChangeText={(text) => setFormData({...formData, amount: text})}
                />
                {errors.amount ? (
                  <Text style={styles.errorText}>{errors.amount}</Text>
                ) : null}
                
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={loading}
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
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 16,
  },
  userList: {
    marginBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  userItemSelected: {
    backgroundColor: '#222',
    borderColor: '#DF0000',
    borderWidth: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    fontSize: 14,
  },
  emptyUsers: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
  emptyUsersText: {
    color: '#888',
    fontSize: 16,
  },
  inputLabel: {
    color: '#ccc',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#DF0000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#DF0000',
    fontSize: 12,
    marginTop: 4,
  },
});