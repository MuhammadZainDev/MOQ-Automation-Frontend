import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { adminService } from '../../src/services/adminApi';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../src/context/AuthContext';

type UserDetail = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

// Custom layout component without the header for this page
function CustomLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Only include the MOQ Admin and logout without the manage users header */}
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
      
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

export default function UserDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.id as string;
  
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [stats, setStats] = useState('');
  const [views, setViews] = useState('');
  const [videos, setVideos] = useState('');
  const [watchHours, setWatchHours] = useState('');
  const [premiumCountryViews, setPremiumCountryViews] = useState('');

  // Fetch user details
  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        setLoading(true);
        
        // Fetch the user from the list of all users for now
        // Later this can be replaced with a specific API endpoint for user details
        const response = await adminService.getAllUsers();
        
        if (response.success) {
          const userData = response.data.find((u: any) => u.id.toString() === userId);
          
          if (userData) {
            const formattedUser = {
              id: userData.id.toString(),
              name: userData.name,
              email: userData.email,
              role: userData.role.toLowerCase(),
              isActive: Boolean(userData.isActive),
              createdAt: new Date(userData.createdAt).toLocaleDateString()
            };
            
            setUser(formattedUser);
            setName(formattedUser.name);
            setEmail(formattedUser.email);
          } else {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'User not found',
              position: 'bottom'
            });
            router.back();
          }
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to load user details',
            position: 'bottom'
          });
          router.back();
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load user details',
          position: 'bottom'
        });
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserDetail();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User ID is required',
        position: 'bottom'
      });
      router.back();
    }
  }, [userId, router]);

  const handleSave = () => {
    // This would be where you would save the user details
    // For now, just show a success message
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'User details saved successfully',
      position: 'bottom'
    });
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <CustomLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DF0000" />
        </View>
      </CustomLayout>
    );
  }

  if (!user) {
    return (
      <CustomLayout>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#DF0000" />
          <Text style={styles.errorText}>User not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </CustomLayout>
    );
  }

  return (
    <CustomLayout>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.label}>Name</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={22} color="#777" style={styles.inputIcon} />
            <TextInput 
              style={[styles.input, styles.disabledInput]} 
              placeholder="Enter name" 
              placeholderTextColor="#777"
              value={name}
              onChangeText={setName}
              editable={false}
            />
          </View>
          
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={22} color="#777" style={styles.inputIcon} />
            <TextInput 
              style={[styles.input, styles.disabledInput]} 
              placeholder="Enter email" 
              placeholderTextColor="#777"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={false}
            />
          </View>
          
          {/* Stats and Views in a row */}
          <View style={styles.rowContainer}>
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Stats</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="stats-chart-outline" size={22} color="#777" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter stats" 
                  placeholderTextColor="#777"
                  value={stats}
                  onChangeText={setStats}
                />
              </View>
            </View>
            
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Views</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="eye-outline" size={22} color="#777" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter views" 
                  placeholderTextColor="#777"
                  keyboardType="numeric"
                  value={views}
                  onChangeText={setViews}
                />
              </View>
            </View>
          </View>
          
          {/* Videos and Watch Hours in a row */}
          <View style={styles.rowContainer}>
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Videos</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="videocam-outline" size={22} color="#777" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter videos" 
                  placeholderTextColor="#777"
                  keyboardType="numeric"
                  value={videos}
                  onChangeText={setVideos}
                />
              </View>
            </View>
            
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Watch Hours</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="time-outline" size={22} color="#777" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter watch hours" 
                  placeholderTextColor="#777"
                  keyboardType="numeric"
                  value={watchHours}
                  onChangeText={setWatchHours}
                />
              </View>
            </View>
          </View>
          
          <Text style={styles.label}>Premium Country Views</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="globe-outline" size={22} color="#777" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Enter premium country views" 
              placeholderTextColor="#777"
              keyboardType="numeric"
              value={premiumCountryViews}
              onChangeText={setPremiumCountryViews}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </CustomLayout>
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
    paddingTop: 50,
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
  },
  contentContainer: {
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#DF0000',
    padding: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  userAvatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(223, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  adminAvatarContainer: {
    backgroundColor: 'rgba(44, 130, 201, 0.2)',
  },
  avatarText: {
    color: '#DF0000',
    fontSize: 36,
    fontWeight: 'bold',
  },
  adminAvatarText: {
    color: '#2c82c9',
  },
  adminBadge: {
    backgroundColor: 'rgba(44, 130, 201, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  adminBadgeText: {
    color: '#2c82c9',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusBadgeText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeStatusText: {
    color: '#4CAF50',
  },
  inactiveStatusText: {
    color: '#E57373',
  },
  joinedText: {
    color: '#777',
    fontSize: 14,
  },
  formContainer: {
    width: '100%',
    marginTop: 20,
  },
  label: {
    color: '#aaa',
    marginBottom: 8,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 20,
    height: 55,
    alignItems: 'center',
  },
  inputIcon: {
    paddingLeft: 15,
  },
  input: {
    flex: 1,
    padding: 10,
    paddingLeft: 10,
    color: '#fff',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#DF0000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    height: 55,
    justifyContent: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfColumn: {
    width: '48%',
  },
  disabledInput: {
    opacity: 0.6,
    color: '#aaa',
  },
}); 