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
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { adminService } from '../../src/services/adminApi';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../src/context/AuthContext';
import ConfirmationModal from '../../src/components/ConfirmationModal';
import { getUserThresholdsById, addRevenueToThreshold } from '../../src/services/thresholdApi';

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
  
  // For smaller numbers, preserve exactly what the user sees
  // Convert to string to check for decimal places
  const numStr = num.toString();
  
  // If it's an integer (no decimal point), return as is
  if (!numStr.includes('.')) {
    return numStr;
  }
  
  // If it has decimal places, show them exactly as they are
  const [intPart, decimalPart] = numStr.split('.');
  
  // Don't show ".0" but do show all other decimals
  if (decimalPart === '0') {
    return intPart;
  }
  
  // Return with exact decimal places as in the original
  return numStr;
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
  revenue: number;
  views: number;
  videos: number;
  premium_country_views: number;
  entries?: any[];
  revenue_type?: string;
  adsense_revenue?: number;
  music_revenue?: number;
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
  const [revenue, setRevenue] = useState('');
  const [views, setViews] = useState('');
  const [videos, setVideos] = useState('');
  const [premiumCountryViews, setPremiumCountryViews] = useState('');
  const [revenueType, setRevenueType] = useState('adsense'); // Default to 'adsense'
  const [savingAnalytics, setSavingAnalytics] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [thresholdModalVisible, setThresholdModalVisible] = useState(false);
  const [revenueTypeModalVisible, setRevenueTypeModalVisible] = useState(false);
  
  // Add state for thresholds
  const [thresholds, setThresholds] = useState<any[]>([]);
  const [selectedThreshold, setSelectedThreshold] = useState<string | null>(null);
  const [loadingThresholds, setLoadingThresholds] = useState(false);
  
  // Modify notification states - remove message state
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('Your data has been updated');
  const [sendingNotification, setSendingNotification] = useState(false);

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
            setRevenue('');
            setViews('');
            setVideos('');
            setPremiumCountryViews('');
          }
        } catch (analyticsError) {
          console.log('Analytics not available yet, using default values');
          // Just use the default values we already have
        }
        
        // Fetch user thresholds
        fetchUserThresholds();
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
  
  // Function to fetch user thresholds
  const fetchUserThresholds = async () => {
    try {
      setLoadingThresholds(true);
      const response = await getUserThresholdsById(userId);
      
      if (response.success) {
        setThresholds(response.data || []);
      } else {
        console.error('Error in threshold response:', response.message);
      }
    } catch (error) {
      console.error('Error fetching user thresholds:', error);
    } finally {
      setLoadingThresholds(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    try {
      setSavingAnalytics(true);
      
      console.log('\n=== USER DETAIL SCREEN: handleSave ===');
      console.log(`Raw revenue input: '${revenue}' (type: ${typeof revenue})`);
      
      // First, make sure we preserve the exact string format
      const revenueStr = revenue.trim();
      console.log(`After trim: '${revenueStr}'`);
      
      // Ensure the decimal part is preserved
      let formattedRevenue = revenueStr;
      
      // If there's no decimal point but we need one, add .00
      if (revenueStr !== '' && !revenueStr.includes('.')) {
        console.log(`No decimal point, adding .00`);
        formattedRevenue = revenueStr + '.00';
      } 
      // If there's a decimal point but only one digit after it, add a trailing 0
      else if (revenueStr.includes('.') && revenueStr.split('.')[1].length === 1) {
        console.log(`One decimal digit, adding trailing 0`);
        formattedRevenue = revenueStr + '0';
      }
      
      console.log(`After decimal formatting: '${formattedRevenue}'`);
      
      // Validate inputs - ensure they are numbers but preserve the exact string for revenue
      const analyticsData = {
        // Pass revenue as the exact string to preserve decimal format
        revenue: formattedRevenue !== '' ? formattedRevenue : '0.00',
        views: !isNaN(Number(views)) ? Number(views) : 0,
        videos: !isNaN(Number(videos)) ? Number(videos) : 0,
        premium_country_views: !isNaN(Number(premiumCountryViews)) ? Number(premiumCountryViews) : 0,
        revenue_type: revenueType // Add the revenue_type field
      };
      
      // Log the exact value we're sending to verify it's correct
      console.log(`Revenue value in analyticsData: '${analyticsData.revenue}' (type: ${typeof analyticsData.revenue})`);
      console.log(`Complete analyticsData:`, JSON.stringify(analyticsData));
      
      let response;
      
      // Check if threshold is selected
      if (selectedThreshold && revenue.trim() !== '') {
        console.log(`Using threshold ${selectedThreshold}, sending to addRevenueToThreshold`);
        // Update with threshold - use the same string value
        response = await addRevenueToThreshold(
          userId, 
          selectedThreshold, 
          formattedRevenue,
          {
            views: analyticsData.views,
            videos: analyticsData.videos,
            premiumCountryViews: analyticsData.premium_country_views,
            revenueType: analyticsData.revenue_type
          }
        );
      } else {
        console.log(`No threshold selected, sending to updateUserAnalytics`);
        // Regular update
        response = await adminService.updateUserAnalytics(userId, analyticsData);
      }
      
      console.log(`API response:`, response);
      
      if (response.success) {
        // Clear the input fields
        setRevenue('');
        setViews('');
        setVideos('');
        setPremiumCountryViews('');
        // Keep the revenue type selection for convenience
        
        // Show success message
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: selectedThreshold 
            ? 'Analytics data and threshold updated successfully' 
            : 'Analytics data added successfully',
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
        
        // If threshold was selected, refresh thresholds too
        if (selectedThreshold) {
          fetchUserThresholds();
          setSelectedThreshold(null);
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
    // Get the current active status before the API call
    const currentIsActive = user?.isActive || false;
    
    // IMPORTANT: Update UI state immediately
    setUser(prevUser => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        isActive: !currentIsActive
      };
    });
    
    // Show brief loading while updating UI, then reset it immediately
    setToggleLoading(true);
    setTimeout(() => {
      setToggleLoading(false);
    }, 300); // Just a brief visual feedback that something happened
    
    // Show immediate success message
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: currentIsActive 
        ? 'User deactivated successfully' 
        : 'User activated successfully',
      position: 'bottom'
    });
    
    // BACKGROUND: Make the actual API call without blocking UI
    try {
      // Send API call in background
      adminService.toggleUserActiveImmediate(userId)
        .then(response => {
          if (!response.success) {
            // Only show error if the API call fails, but don't revert UI state
            // to avoid confusing the user
            console.error('API call failed but UI was already updated');
            Toast.show({
              type: 'info',
              text1: 'Note',
              text2: 'Server sync in progress...',
              position: 'bottom'
            });
          }
          
          // Refresh user details in background
          return adminService.getUserById(userId);
        })
        .then(updatedUserResponse => {
          if (updatedUserResponse?.success && updatedUserResponse?.data) {
            // Silently update user data from server to stay in sync
            setUser(updatedUserResponse.data);
          }
        })
        .catch(error => {
          console.error('Background API error:', error);
          // Don't show error to user since UI is already updated
        });
    } catch (error) {
      console.error('Error initiating background user status update:', error);
      // Still don't revert UI state to avoid user confusion
    }
  };

  const confirmUserStatusChange = () => {
    // Check if user is null
    if (!user) return;
    
    // Show custom confirmation modal
    setConfirmModalVisible(true);
  };

  const handleSendNotification = async () => {
    try {
      setSendingNotification(true);
      
      // Validate input
      if (!notificationTitle.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please enter a notification title',
          position: 'bottom'
        });
        setSendingNotification(false);
        return;
      }
      
      // Use our new simpler notification method
      const response = await adminService.sendSimpleNotification(userId, notificationTitle);
      
      if (response.success) {
        // Close modal
        setNotificationModalVisible(false);
        
        // Show success message with longer duration
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `Notification "${notificationTitle}" sent to ${user?.name}`,
          position: 'bottom',
          visibilityTime: 4000
        });
        
        // Reset to default value
        setNotificationTitle('Your data has been updated');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to send notification',
          position: 'bottom'
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send notification',
        position: 'bottom'
      });
    } finally {
      setSendingNotification(false);
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
            <Text style={styles.currentTotalsTitle}>Current Revenue Totals</Text>
            
            <View style={styles.boxesRow}>
              <View style={styles.analyticsBox}>
                <Text style={styles.boxLabel}>Revenue (Total)</Text>
                <Text style={styles.boxValue}>${formatNumber(user?.analytics?.revenue || 0)}</Text>
              </View>
              
              <View style={styles.analyticsBox}>
                <Text style={styles.boxLabel}>Views</Text>
                <Text style={styles.boxValue}>{formatNumber(user?.analytics?.views || 0)}</Text>
              </View>
            </View>
            
            <View style={styles.boxesRow}>
              <View style={styles.analyticsBox}>
                <Text style={styles.boxLabel}>Adsense Revenue</Text>
                <Text style={styles.boxValue}>${formatNumber(user?.analytics?.adsense_revenue || 0)}</Text>
              </View>
              
              <View style={styles.analyticsBox}>
                <Text style={styles.boxLabel}>Music Revenue</Text>
                <Text style={styles.boxValue}>${formatNumber(user?.analytics?.music_revenue || 0)}</Text>
              </View>
            </View>
            
            <View style={styles.boxesRow}>
              <View style={styles.analyticsBox}>
                <Text style={styles.boxLabel}>Videos</Text>
                <Text style={styles.boxValue}>{formatNumber(user?.analytics?.videos || 0)}</Text>
              </View>
              
              <View style={styles.analyticsBox}>
                <Text style={styles.boxLabel}>Premium Views</Text>
                <Text style={styles.boxValue}>{formatNumber(user?.analytics?.premium_country_views || 0)}</Text>
              </View>
            </View>
          </View>
          
          {/* Threshold Selection Dropdown - Replace with Modal-based approach */}
          <Text style={styles.label}>Select Threshold (Optional)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="trending-up-outline" size={22} color="#777" style={styles.inputIcon} />
            <TouchableOpacity 
              style={styles.dropdownSelectorInline}
              onPress={() => setThresholdModalVisible(true)}
            >
              <Text style={[styles.input, {paddingVertical: 0, height: 'auto', textAlignVertical: 'center'}]}>
                {selectedThreshold 
                  ? thresholds.find(t => t.id === selectedThreshold)?.name || 'Select a threshold'
                  : 'Select a threshold'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#999" style={{marginRight: 15}} />
            </TouchableOpacity>
          </View>
          
          {/* Note about threshold selection */}
          {selectedThreshold && (
            <View style={[styles.noteContainer, {marginTop: -10}]}>
              <Ionicons name="alert-circle-outline" size={22} color="#DF0000" />
              <Text style={[styles.noteText, {color: '#DF0000'}]}>
                Revenue will be added to the selected threshold. Other analytics data will be processed normally.
              </Text>
            </View>
          )}
          
          {/* Revenue and Views in a row */}
          <View style={styles.rowContainer}>
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Revenue</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="stats-chart-outline" size={22} color="#777" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter new revenue to add" 
                  placeholderTextColor="#777"
                  value={revenue}
                  onChangeText={(text) => {
                    // Make sure we accept decimal values correctly
                    // Allow only digits and at most one decimal point
                    const formattedText = text.replace(/[^0-9.]/g, '');
                    
                    // Prevent multiple decimal points
                    const decimalPoints = formattedText.match(/\./g);
                    if (decimalPoints && decimalPoints.length > 1) {
                      // If there are multiple decimal points, keep only the first one
                      const parts = formattedText.split('.');
                      setRevenue(parts[0] + '.' + parts.slice(1).join(''));
                    } else {
                      setRevenue(formattedText);
                    }
                  }}
                  keyboardType="decimal-pad"
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
          
          {/* Videos - full width */}
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
          
          {/* Premium Country Views - full width */}
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
          
          {/* Revenue Type - Add it here after Premium Country Views */}
          <Text style={styles.label}>Revenue Type</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="wallet-outline" size={22} color="#777" style={styles.inputIcon} />
            <TouchableOpacity 
              style={styles.dropdownSelectorInline}
              onPress={() => setRevenueTypeModalVisible(true)}
            >
              <Text style={[styles.input, {paddingVertical: 0, height: 'auto', textAlignVertical: 'center'}]}>
                {revenueType === 'adsense' ? 'Adsense Revenue' : 'Music Revenue'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#999" style={{marginRight: 15}} />
            </TouchableOpacity>
          </View>
          
          {/* Simple Toggle Button */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>
              User Status: <Text style={user.isActive ? styles.activeStatusText : styles.inactiveStatusText}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Text>
            </Text>
            <TouchableOpacity 
              style={[
                styles.simpleToggle, 
                user.isActive ? styles.toggleActive : styles.toggleInactive
              ]} 
              onPress={confirmUserStatusChange}
              disabled={toggleLoading}
            >
              {toggleLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View style={[styles.toggleCircle, user.isActive ? styles.toggleCircleRight : styles.toggleCircleLeft]} />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Send Notification Button - add after toggle button */}
          <TouchableOpacity 
            style={styles.notificationButton} 
            onPress={() => setNotificationModalVisible(true)}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Send Notification</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              savingAnalytics && styles.savingButton,
              (revenue === '' && views === '' && videos === '' && premiumCountryViews === '') && styles.disabledButton
            ]} 
            onPress={handleSave}
            disabled={savingAnalytics || (revenue === '' && views === '' && videos === '' && premiumCountryViews === '')}
          >
            {savingAnalytics ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Add Analytics Data</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Custom Confirmation Modal */}
        <ConfirmationModal
          visible={confirmModalVisible}
          onClose={() => setConfirmModalVisible(false)}
          onConfirm={handleToggleActive}
          title={user?.isActive ? 'Deactivate User' : 'Activate User'}
          message={user?.isActive 
            ? `Are you sure you want to deactivate "${user?.name}"? They will lose access to the platform.`
            : `Are you sure you want to activate "${user?.name}"? They will gain immediate access to the platform, and an email notification will be sent.`}
          confirmText={user?.isActive ? 'Deactivate' : 'Activate'}
          cancelText="Cancel"
        />
        
        {/* Notification Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={notificationModalVisible}
          onRequestClose={() => setNotificationModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Send Notification</Text>
                <TouchableOpacity 
                  onPress={() => setNotificationModalVisible(false)}
                  disabled={sendingNotification}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Notification Title</Text>
                <View style={styles.modalInputContainer}>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="Enter notification title" 
                    placeholderTextColor="#777"
                    value={notificationTitle}
                    onChangeText={setNotificationTitle}
                    editable={!sendingNotification}
                  />
                </View>
                
                <TouchableOpacity 
                  style={[styles.sendButton, sendingNotification && styles.savingButton]} 
                  onPress={handleSendNotification}
                  disabled={sendingNotification}
                >
                  {sendingNotification ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="send-outline" size={20} color="#fff" style={styles.buttonIcon} />
                      <Text style={styles.sendButtonText}>Send Notification</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Revenue Type Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={revenueTypeModalVisible}
          onRequestClose={() => setRevenueTypeModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Revenue Type</Text>
                <TouchableOpacity onPress={() => setRevenueTypeModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <TouchableOpacity 
                  style={styles.userItem}
                  onPress={() => {
                    setRevenueType('adsense');
                    setRevenueTypeModalVisible(false);
                  }}
                >
                  <View style={styles.userItemContent}>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>Adsense Revenue</Text>
                    </View>
                    {revenueType === 'adsense' && (
                      <Ionicons name="checkmark-circle" size={24} color="#DF0000" style={styles.checkIcon} />
                    )}
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.userItem}
                  onPress={() => {
                    setRevenueType('music');
                    setRevenueTypeModalVisible(false);
                  }}
                >
                  <View style={styles.userItemContent}>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>Music Revenue</Text>
                    </View>
                    {revenueType === 'music' && (
                      <Ionicons name="checkmark-circle" size={24} color="#DF0000" style={styles.checkIcon} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Threshold Modal Popup */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={thresholdModalVisible}
          onRequestClose={() => setThresholdModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Threshold</Text>
                <TouchableOpacity onPress={() => setThresholdModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                {loadingThresholds ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#DF0000" />
                    <Text style={styles.loadingText}>Loading thresholds...</Text>
                  </View>
                ) : (
                  <ScrollView style={styles.userList}>
                    <TouchableOpacity 
                      style={styles.userItem}
                      onPress={() => {
                        setSelectedThreshold(null);
                        setThresholdModalVisible(false);
                      }}
                    >
                      <View style={styles.userItemContent}>
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>No Threshold</Text>
                        </View>
                        {selectedThreshold === null && (
                          <Ionicons name="checkmark-circle" size={24} color="#DF0000" style={styles.checkIcon} />
                        )}
                      </View>
                    </TouchableOpacity>
                    
                    {thresholds.length === 0 ? (
                      <View style={styles.noUsersContainer}>
                        <Text style={styles.noUsersText}>No thresholds available</Text>
                      </View>
                    ) : (
                      thresholds.map(threshold => (
                        <TouchableOpacity 
                          key={threshold.id}
                          style={styles.userItem}
                          onPress={() => {
                            setSelectedThreshold(threshold.id);
                            setThresholdModalVisible(false);
                          }}
                        >
                          <View style={styles.userItemContent}>
                            <View style={styles.userInfo}>
                              <Text style={styles.userName}>{threshold.name}</Text>
                              <Text style={styles.userEmail}>${threshold.amount}</Text>
                            </View>
                            {selectedThreshold === threshold.id && (
                              <Ionicons name="checkmark-circle" size={24} color="#DF0000" style={styles.checkIcon} />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                )}
              </View>
            </View>
          </View>
        </Modal>
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
    fontWeight: 'bold',
  },
  inactiveStatusText: {
    color: '#DF0000',
    fontWeight: 'bold',
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
    marginBottom: 10,
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
    width: '48%',
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
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  toggleLabel: {
    color: '#fff',
    fontSize: 16,
  },
  simpleToggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 3,
  },
  toggleActive: {
    backgroundColor: '#4CAF50',
  },
  toggleInactive: {
    backgroundColor: '#DF0000',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleCircleLeft: {
    alignSelf: 'flex-start',
  },
  toggleCircleRight: {
    alignSelf: 'flex-end',
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#666',
  },
  dropdownContainer: {
    marginBottom: 15,
    position: 'relative',
    zIndex: 100,
  },
  dropdownSelector: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  dropdownSelectorInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    height: 50,
  },
  dropdownText: {
    color: '#FFF',
    fontSize: 16,
  },
  dropdownOptions: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: '#333',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#444',
    paddingVertical: 5,
    marginHorizontal: 10,
    zIndex: 100,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 200,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  selectedOption: {
    backgroundColor: '#1e88e5',
  },
  dropdownOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  selectedOptionText: {
    fontWeight: 'bold',
  },
  
  // New styles for notification button and modal
  notificationButton: {
    backgroundColor: '#2F80ED',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 15,
    height: 55,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
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
    width: '90%',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1A1A1A',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    backgroundColor: '#1A1A1A',
    maxHeight: '80%',
  },
  modalLabel: {
    color: '#aaa',
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  modalInputContainer: {
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#444',
  },
  modalInput: {
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#2F80ED',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    height: 55,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dropdownModalList: {
    maxHeight: 300,
  },
  dropdownModalOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  selectedModalOption: {
    backgroundColor: '#1e88e5',
  },
  dropdownModalOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  selectedModalOptionText: {
    fontWeight: 'bold',
  },
  userItem: {
    marginBottom: 0,
    borderRadius: 0,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  userItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    position: 'relative',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  userEmail: {
    fontSize: 14,
    color: '#777',
  },
  loadingText: {
    marginLeft: 10,
    color: '#fff',
  },
  noUsersContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  noUsersText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    padding: 15,
  },
  userList: {
    maxHeight: 300,
  },
  checkIcon: {
    position: 'absolute',
    right: 10,
  },
}); 