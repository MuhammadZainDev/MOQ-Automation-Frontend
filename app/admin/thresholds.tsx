import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AdminLayout from '../../src/components/AdminLayout';
import Toast from 'react-native-toast-message';
import { getAllThresholds, deleteThreshold, recalculateThresholds, resetAllThresholds } from '../../src/services/thresholdApi';
import { adminService } from '../../src/services/adminApi';
import API from '../../src/services/api';

// Define threshold type
type Threshold = {
  id: string;
  name: string;
  amount: number;
  current: number;
  createdAt: string;
  user_id: string;
  updated_at: string;
  type: 'youtube' | 'adsense' | 'music';
  user?: {
    id: string;
    name: string;
    email: string;
  };
  // Add revenue breakdown by type
  music_revenue?: number;
  adsense_revenue?: number;
  // Add user name separately
  userName?: string;
  // Add created_at for database compatibility
  created_at?: string;
};

// User type
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};

// Type tag colors
const TYPE_COLORS = {
  youtube: '#FF0000',
  adsense: '#4CAF50',
  music: '#2196F3'
};

// Main theme color - using red as the app theme
const THEME_COLOR = '#DF0000';

export default function ThresholdsScreen() {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersById, setUsersById] = useState<Record<string, User>>({});
  const router = useRouter();
  
  // Load users directly from the API
  const fetchUserData = async () => {
    try {
      console.log('Fetching users directly from API...');
      // Use the auth endpoint to get all users
      const response = await API.get('/auth/users');
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const userData = response.data.data;
        console.log(`Got ${userData.length} users from API`);
        
        // Create a lookup object by user ID
        const userMap: Record<string, User> = {};
        userData.forEach((user: any) => {
          userMap[user.id.toString()] = {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive
          };
        });
        
        setUsers(userData);
        setUsersById(userMap);
        return userMap;
      } else {
        console.error('Failed to fetch users or unexpected response format');
        return {};
      }
    } catch (error) {
      console.error('Error fetching users from API:', error);
      return {};
    }
  };
  
  // Get user name by ID
  const getUserName = (userId: string) => {
    // Check if we have this user in our lookup
    const user = usersById[userId];
    
    if (user) {
      return user.name;
    }
    
    // If we don't have the user yet, use a placeholder
    return `Loading...`;
  };
  
  // Load thresholds from API
  const fetchThresholds = async () => {
    try {
      setLoading(true);
      console.log('Fetching thresholds...');
      
      // First fetch users to have them ready
      const userMap = Object.keys(usersById).length > 0 ? usersById : await fetchUserData();
      
      // Then fetch thresholds
      const response = await getAllThresholds();
      
      if (response.success) {
        console.log('Thresholds fetched successfully, count:', response.data.length);
        
        // Enhance thresholds with user information
        const enhancedThresholds = response.data.map((threshold: Threshold) => {
          // Get user from our map
          const user = userMap[threshold.user_id];
          const userName = user ? user.name : `User ${threshold.user_id}`;
          
          // Format date properly - in the backend it might be in created_at instead of createdAt
          let createdDate = threshold.createdAt || threshold.created_at;
          
          // Log for debugging
          console.log(`Threshold ${threshold.id} date info:`, { 
            createdAt: threshold.createdAt, 
            created_at: (threshold as any).created_at 
          });
          
          console.log(`Mapped threshold ${threshold.id} to user ${threshold.user_id} (${userName})`);
          
          return {
            ...threshold,
            userName, // Add user name directly to the threshold object
            createdAt: createdDate // Ensure createdAt is properly set
          };
        });
        
        // Log the first few thresholds with user names
        enhancedThresholds.slice(0, 3).forEach((threshold: Threshold) => {
          console.log(`Threshold: ${threshold.name}`);
          console.log(`  ID: ${threshold.id}`);
          console.log(`  User ID: ${threshold.user_id}`);
          console.log(`  User Name: ${threshold.userName}`);
        });
        
        setThresholds(enhancedThresholds);
      } else {
        console.error('Failed to fetch thresholds:', response.message);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load threshold data',
          position: 'bottom'
        });
      }
    } catch (error) {
      console.error('Error loading thresholds:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Failed to load threshold data',
        position: 'bottom'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchUserData();
    fetchThresholds();
  }, []);

  // Function to handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchThresholds();
  };

  // Navigate to threshold details
  const viewThresholdDetail = (thresholdId: string) => {
    router.push(`/admin/thresholdDetail?id=${thresholdId}`);
  };

  // Navigate to add threshold page
  const handleAddThreshold = () => {
    router.push('/admin/addThreshold');
  };

  // Calculate progress percentage safely
  const calculateProgress = (current: number, target: number) => {
    if (!target || typeof target !== 'number' || target <= 0) return 0;
    if (!current || typeof current !== 'number') current = 0;
    
    // Make sure we don't exceed 100%
    const progress = Math.min(100, Math.round((current / target) * 100));
    return progress;
  };

  // Format type display name with first letter capitalized
  const formatType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Format date nicely
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log(`Invalid date string: ${dateString}`);
        return 'Unknown date';
      }
      
      // Format as DD/MM/YYYY
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  // Header with just title and add button
  const Header = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Thresholds</Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddThreshold}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // Render each threshold item
  const renderThresholdItem = ({ item }: { item: Threshold }) => {
    console.log(`Rendering threshold: ${item.id} - ${item.name}`);
    
    // Make sure amount is a number and greater than 0
    // This is the target amount set by admin when creating the threshold
    const amount = typeof item.amount === 'number' && item.amount > 0 
      ? item.amount 
      : 0;
    
    // For displaying revenue breakdown
    const musicRevenue = typeof item.music_revenue === 'number' ? item.music_revenue : 0;
    const adsenseRevenue = typeof item.adsense_revenue === 'number' ? item.adsense_revenue : 0;
    
    // Calculate total revenue from the breakdown
    const totalRevenue = musicRevenue + adsenseRevenue;
    
    // Use total revenue as the current value for progress calculation
    const effectiveCurrent = totalRevenue;
    
    // Calculate progress safely
    const progress = calculateProgress(effectiveCurrent, amount);
    
    // Determine color based on progress
    const progressColor = progress >= 100 ? THEME_COLOR : (progress >= 75 ? '#FFA000' : '#DF0000');
    
    // Format percentage for display
    const progressDisplay = `${progress}%`;
    
    // Get user name from the threshold object or look it up
    const userName = item.userName || getUserName(item.user_id);
    
    // Check if threshold is completed (100% or more)
    const isCompleted = progress >= 100;
    
    return (
    <TouchableOpacity 
      style={[styles.thresholdItem, isCompleted && styles.completedThresholdItem]}
      onPress={() => viewThresholdDetail(item.id)}
    >
      <View style={styles.thresholdHeader}>
          <Text style={styles.thresholdName}>{item.name || 'Unnamed Threshold'}</Text>
          <View style={[styles.typeTag, { backgroundColor: TYPE_COLORS[item.type] || '#888' }]}>
            <Text style={styles.typeText}>
              {userName}
            </Text>
          </View>
      </View>
      
      <Text style={styles.dateText}>
        Created: {formatDate(item.createdAt)}
      </Text>
      
      <View style={styles.amountSection}>
        <Text style={styles.amountText}>
          ${effectiveCurrent.toFixed(2)}
        </Text>
        <Text style={styles.targetAmount}>
          of ${amount.toFixed(2)}
        </Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${progress}%`,
                backgroundColor: progressColor 
              }
            ]} 
          />
        </View>
        <View style={styles.progressFooter}>
          <Text style={styles.progressText}>{progressDisplay} complete</Text>
          <Ionicons name="chevron-forward" size={18} color="#666" />
        </View>
      </View>
        
      {/* Revenue breakdown section */}
      <View style={styles.revenueBreakdown}>
        {musicRevenue > 0 && (
          <View style={styles.revenueItem}>
            <View style={[styles.revenueDot, { backgroundColor: TYPE_COLORS.music }]} />
            <Text style={styles.revenueText}>Music Revenue: ${musicRevenue.toFixed(2)}</Text>
          </View>
        )}
        {adsenseRevenue > 0 && (
          <View style={styles.revenueItem}>
            <View style={[styles.revenueDot, { backgroundColor: TYPE_COLORS.adsense }]} />
            <Text style={styles.revenueText}>Adsense Revenue: ${adsenseRevenue.toFixed(2)}</Text>
          </View>
        )}
          </View>
          
      {/* Completed overlay - only shown when 100% complete */}
      {isCompleted && (
        <View style={styles.completedOverlay}>
          <View style={styles.completedContent}>
            <View style={styles.checkmarkCircle}>
              <Ionicons name="checkmark-sharp" size={24} color="#fff" />
            </View>
            <Text style={styles.completedText}>COMPLETED</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
  };

  return (
    <AdminLayout>
      <View style={styles.container}>
        <Header />
        
        <View style={styles.countsContainer}>
          <Text style={styles.countsText}>
            {thresholds.length} threshold{thresholds.length !== 1 ? 's' : ''} found
          </Text>
        </View>
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : (
          <FlatList
            data={thresholds}
            renderItem={renderThresholdItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="shield-outline" size={64} color="#444" />
                <Text style={styles.emptyText}>No thresholds found</Text>
                <Text style={styles.emptySubText}>
                  Use the Add button to create a new threshold
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh}
                colors={[THEME_COLOR]}
                tintColor={THEME_COLOR}
              />
            }
          />
        )}
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: THEME_COLOR,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonIcon: {
    marginRight: 0,
  },
  addButtonText: {
    display: 'none',
  },
  countsContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  countsText: {
    color: '#888',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  thresholdItem: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    position: 'relative', // For absolute positioning of overlay
  },
  thresholdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  thresholdName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  amountSection: {
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  targetAmount: {
    color: '#888',
    fontWeight: 'normal',
    fontSize: 14,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: THEME_COLOR,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 3,
    minWidth: 3,
    backgroundColor: THEME_COLOR, // Default color if not set inline
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#888',
  },
  listContent: {
    paddingBottom: 20,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  revenueBreakdown: {
    marginTop: 4,
  },
  revenueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  revenueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  revenueText: {
    color: '#999',
    fontSize: 12,
  },
  // Add new styles for completed overlay
  completedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)', // Darker overlay
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    zIndex: 10,
  },
  completedContent: {
    alignItems: 'center',
  },
  checkmarkCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  completedText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  completedThresholdItem: {
    borderColor: THEME_COLOR,
    borderWidth: 2,
  },
}); 