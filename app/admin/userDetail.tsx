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
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { adminService } from '../../src/services/adminApi';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../src/context/AuthContext';

// Utility function to format numbers in a human-readable way (1k, 1.2M, etc)
const formatNumber = (num: number): string => {
  if (num === 0) return '0';
  
  // Handle millions
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  
  // Handle thousands
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  
  // Return the number as is if less than 1000
  return num.toString();
};

type UserDetail = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  analytics?: UserAnalytics;
};

type UserAnalytics = {
  stats: number;
  views: number;
  videos: number;
  watch_hours: number;
  premium_country_views: number;
  subscribers?: number;
  entries?: any[];
};

// Custom layout component without the header for this page
function CustomLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const router = useRouter();
  
  const handleLogout = async () => {
    await logout();
    // Navigation is now handled inside the logout method
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
  const [subscribers, setSubscribers] = useState('');
  const [savingAnalytics, setSavingAnalytics] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Fetch user details and analytics
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user details
        const userResponse = await adminService.getUserById(userId);
        if (userResponse.success && userResponse.data) {
          const userData = userResponse.data;
          setUser(userData);
          setName(userData.name);
          setEmail(userData.email);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to load user details',
            position: 'bottom'
          });
          return;
        }
        
        // Fetch user analytics - use try/catch here to prevent errors from blocking UI
        try {
          const analyticsResponse = await adminService.getUserAnalytics(userId);
          if (analyticsResponse.success && analyticsResponse.data) {
            const analyticsData = analyticsResponse.data;
            
            // Store analytics data in user object
            setUser(prevUser => prevUser ? {
              ...prevUser,
              analytics: analyticsData
            } : null);
            
            // Set individual analytics fields (for display purposes)
            setStats('');
            setViews('');
            setVideos('');
            setWatchHours('');
            setPremiumCountryViews('');
            setSubscribers('');
          }
        } catch (analyticsError) {
          console.log('Analytics not available yet, using default values');
          // Just use the default values we already have
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load user data',
          position: 'bottom'
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    try {
      setSavingAnalytics(true);
      
      // Convert numeric fields to numbers, default to 0 if invalid
      const analyticsData = {
        stats: !isNaN(Number(stats)) ? Number(stats) : 0,
        views: !isNaN(Number(views)) ? Number(views) : 0,
        videos: !isNaN(Number(videos)) ? Number(videos) : 0,
        watch_hours: !isNaN(Number(watchHours)) ? Number(watchHours) : 0,
        premium_country_views: !isNaN(Number(premiumCountryViews)) ? Number(premiumCountryViews) : 0,
        subscribers: !isNaN(Number(subscribers)) ? Number(subscribers) : 0
      };
      
      // Update user analytics
      const response = await adminService.updateUserAnalytics(userId, analyticsData);
      
      if (response.success) {
        // Clear the input fields
        setStats('');
        setViews('');
        setVideos('');
        setWatchHours('');
        setPremiumCountryViews('');
        setSubscribers('');
        
        // Show success message
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Analytics data added successfully',
          position: 'bottom'
        });
        
        // Fetch the updated analytics
        try {
          const analyticsResponse = await adminService.getUserAnalytics(userId);
          if (analyticsResponse.success && analyticsResponse.data) {
            // Update user analytics data in state
            setUser(prevUser => prevUser ? {
              ...prevUser,
              analytics: analyticsResponse.data
            } : null);
            
            // Show updated totals
            Toast.show({
              type: 'info',
              text1: 'Current Totals Updated',
              text2: 'Analytics data has been updated',
              position: 'bottom',
              visibilityTime: 2000
            });
          }
        } catch (analyticsError) {
          console.error('Error fetching updated analytics:', analyticsError);
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to update user analytics',
          position: 'bottom'
        });
      }
    } catch (error) {
      console.error('Error saving user analytics:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save user analytics',
        position: 'bottom'
      });
    } finally {
      setSavingAnalytics(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      setToggleLoading(true);
      
      const response = await adminService.toggleUserActive(userId);
      
      if (response.success) {
        // Fetch the updated user details
        const updatedUserResponse = await adminService.getUserById(userId);
        if (updatedUserResponse.success && updatedUserResponse.data) {
          setUser(updatedUserResponse.data);
        }
        
        // Show success message
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'User status updated successfully',
          position: 'bottom'
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to update user status',
          position: 'bottom'
        });
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update user status',
        position: 'bottom'
      });
    } finally {
      setToggleLoading(false);
    }
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
          
          {/* Note about cumulative behavior */}
          <View style={styles.noteContainer}>
            <Ionicons name="information-circle-outline" size={22} color="#777" />
            <Text style={styles.noteText}>
              Values you enter will be added to existing analytics data.
            </Text>
          </View>
          
          {/* Current Analytics Totals */}
          <View style={styles.currentTotalsContainer}>
            <Text style={styles.currentTotalsTitle}>Current Analytics Totals</Text>
            
            <View style={styles.boxesRow}>
              <View style={styles.analyticsBox}>
                <Text style={styles.boxLabel}>Stats</Text>
                <Text style={styles.boxValue}>{formatNumber(user?.analytics?.stats || 0)}</Text>
              </View>
              
              <View style={styles.analyticsBox}>
                <Text style={styles.boxLabel}>Views</Text>
                <Text style={styles.boxValue}>{formatNumber(user?.analytics?.views || 0)}</Text>
              </View>
              
              <View style={styles.analyticsBox}>
                <Text style={styles.boxLabel}>Videos</Text>
                <Text style={styles.boxValue}>{formatNumber(user?.analytics?.videos || 0)}</Text>
              </View>
            </View>
            
            <View style={styles.boxesRow}>
              <View style={styles.analyticsBox}>
                <Text style={styles.boxLabel}>Watch Hours</Text>
                <Text style={styles.boxValue}>{formatNumber(user?.analytics?.watch_hours || 0)}</Text>
              </View>
              
              <View style={styles.analyticsBox}>
                <Text style={styles.boxLabel}>Premium Views</Text>
                <Text style={styles.boxValue}>{formatNumber(user?.analytics?.premium_country_views || 0)}</Text>
              </View>
              
              <View style={styles.analyticsBox}>
                <Text style={styles.boxLabel}>Subscribers</Text>
                <Text style={styles.boxValue}>{formatNumber(user?.analytics?.subscribers || 0)}</Text>
              </View>
            </View>
          </View>
          
          {/* Stats and Views in a row */}
          <View style={styles.rowContainer}>
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Stats</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="stats-chart-outline" size={22} color="#777" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter new stats to add" 
                  placeholderTextColor="#777"
                  value={stats}
                  onChangeText={setStats}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Views</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="eye-outline" size={22} color="#777" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter new views to add" 
                  placeholderTextColor="#777"
                  value={views}
                  onChangeText={setViews}
                  keyboardType="numeric"
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
                  placeholder="Enter new videos to add" 
                  placeholderTextColor="#777"
                  value={videos}
                  onChangeText={setVideos}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Watch Hours</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="time-outline" size={22} color="#777" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter new watch hours to add" 
                  placeholderTextColor="#777"
                  value={watchHours}
                  onChangeText={setWatchHours}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
          
          {/* Subscribers on its own line with full width */}
          <Text style={styles.label}>Subscribers</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="people-outline" size={22} color="#777" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Enter new subscribers to add" 
              placeholderTextColor="#777"
              value={subscribers}
              onChangeText={setSubscribers}
              keyboardType="numeric"
            />
          </View>
          
          {/* Premium Country Views on its own line with full width */}
          <Text style={styles.label}>Premium Country Views</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="globe-outline" size={22} color="#777" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Enter new premium views to add" 
              placeholderTextColor="#777"
              value={premiumCountryViews}
              onChangeText={setPremiumCountryViews}
              keyboardType="numeric"
            />
          </View>
          
          {/* Status Toggle Button */}
          <TouchableOpacity 
            style={[
              styles.statusToggleButton, 
              user.isActive ? styles.statusToggleDeactivate : styles.statusToggleActivate
            ]} 
            onPress={() => {
              Alert.alert(
                user.isActive ? 'Deactivate User' : 'Activate User',
                user.isActive 
                  ? `Are you sure you want to deactivate ${user.name}? They will lose access to the platform.`
                  : `Are you sure you want to activate ${user.name}? An email notification will be sent to ${user.email} informing them of their approval.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: user.isActive ? 'Deactivate' : 'Activate', 
                    onPress: handleToggleActive,
                    style: 'destructive'
                  }
                ]
              )
            }}
          >
            {toggleLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons 
                  name={user.isActive ? 'close-circle-outline' : 'checkmark-circle-outline'} 
                  size={18} 
                  color="#fff" 
                  style={styles.toggleIcon} 
                />
                <Text style={styles.statusToggleText}>
                  {user.isActive ? 'Deactivate User' : 'Activate User'}
                </Text>
                {!user.isActive && (
                  <Text style={styles.emailNotificationText}>
                    Email notification will be sent
                  </Text>
                )}
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.saveButton, savingAnalytics && styles.savingButton]} 
            onPress={handleSave}
            disabled={savingAnalytics}
          >
            {savingAnalytics ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Add Analytics Data</Text>
            )}
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
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 20,
    height: 55,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  inputIcon: {
    paddingLeft: 15,
    color: '#999',
  },
  input: {
    flex: 1,
    padding: 10,
    paddingLeft: 10,
    color: '#fff',
    fontSize: 16,
    height: '100%',
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
  savingButton: {
    opacity: 0.7,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  noteText: {
    color: '#777',
    marginLeft: 5,
  },
  currentTotalsContainer: {
    marginBottom: 20,
  },
  currentTotalsTitle: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  analyticsBox: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    width: '31%',
    alignItems: 'center',
  },
  boxLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 5,
  },
  boxValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  boxesRowCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  widerAnalyticsBox: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    width: '48%',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statusToggleButton: {
    backgroundColor: '#DF0000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    height: 55,
    justifyContent: 'center',
    marginTop: 10,
  },
  statusToggleDeactivate: {
    backgroundColor: '#E57373',
  },
  statusToggleActivate: {
    backgroundColor: '#4CAF50',
  },
  toggleIcon: {
    marginRight: 10,
  },
  statusToggleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emailNotificationText: {
    color: '#fff',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    opacity: 0.8,
  },
}); 