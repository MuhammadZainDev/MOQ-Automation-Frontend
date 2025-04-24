import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { adminService } from '../../src/services/adminApi';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../src/context/AuthContext';
import { 
  getThresholdById, 
  updateThreshold, 
  deleteThreshold, 
  addThresholdEntry 
} from '../../src/services/thresholdApi';
import AdminLayout from '../../src/components/AdminLayout';

// Define detailed threshold type
type ThresholdDetail = {
  id: string;
  name: string;
  amount: number;
  createdAt: string;
  user_id: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  entries?: ThresholdEntry[];
  current_amount?: number;
};

type ThresholdEntry = {
  id: string;
  threshold_id: string;
    amount: number;
  created_at: string;
};

// Helper function to format date properly
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Format as DD/MM/YYYY
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// Custom layout component
function CustomLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const router = useRouter();
  
  const handleLogout = async () => {
    await logout();
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
      
        {children}
    </View>
  );
}

export default function ThresholdDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const thresholdId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [threshold, setThreshold] = useState<ThresholdDetail | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // Editing fields
  const [editData, setEditData] = useState({
    name: '',
    amount: ''
  });
  
  // Add entry fields
  const [entryAmount, setEntryAmount] = useState('');
  
  // Load threshold data
    const fetchThresholdData = async () => {
    if (!thresholdId) return;
    
      try {
        setLoading(true);
      const response = await getThresholdById(thresholdId);
      
      if (response.success && response.data) {
        setThreshold(response.data);
        // Initialize edit data
        setEditData({
          name: response.data.name,
          amount: response.data.amount.toString()
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load threshold details',
          position: 'bottom'
        });
        router.back(); // Navigate back if threshold not found
      }
    } catch (error) {
      console.error('Error fetching threshold details:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Failed to load threshold details',
        position: 'bottom'
      });
      router.back(); // Navigate back on error
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data on mount
  useEffect(() => {
    if (thresholdId) {
      fetchThresholdData();
    }
  }, [thresholdId]);

  // Handle back button
  const handleBack = () => {
    router.back();
  };

  // Handle save threshold
  const handleSaveThreshold = async () => {
    // Validate inputs
    if (!editData.name.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Threshold name is required',
          position: 'bottom'
        });
        return;
      }
      
    const amount = parseFloat(editData.amount);
      if (isNaN(amount) || amount <= 0) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please enter a valid threshold amount',
          position: 'bottom'
        });
        return;
      }
      
    try {
      setSaving(true);
      
      // Update threshold
      const response = await updateThreshold(thresholdId, {
        name: editData.name,
        amount
      });
      
      if (response.success) {
        // Update local state
        setThreshold({
          ...threshold!,
          name: editData.name,
          amount
        });
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Threshold updated successfully',
          position: 'bottom'
        });
        
        // Exit edit mode
        setEditMode(false);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to update threshold',
          position: 'bottom'
        });
      }
    } catch (error) {
      console.error('Error updating threshold:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Failed to update threshold',
        position: 'bottom'
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Handle add entry
  const handleAddEntry = async () => {
    if (!entryAmount.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Amount is required',
        position: 'bottom'
      });
      return;
    }
    
    const amount = parseFloat(entryAmount);
    if (isNaN(amount)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid amount',
        position: 'bottom'
      });
      return;
    }
    
    try {
      setSaving(true);
      
      const response = await addThresholdEntry(thresholdId, {
        amount
      });
      
      if (response.success) {
        // Clear input fields
        setEntryAmount('');
        
        // Refresh threshold data
        fetchThresholdData();
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Entry added successfully',
          position: 'bottom'
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to add entry',
          position: 'bottom'
        });
      }
    } catch (error) {
      console.error('Error adding entry:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Failed to add entry',
        position: 'bottom'
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete threshold confirmation
  const confirmDelete = () => {
    Alert.alert(
      "Delete Threshold",
      "Are you sure you want to delete this threshold? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: handleDeleteThreshold
        }
      ]
    );
  };

  // Handle delete threshold
  const handleDeleteThreshold = async () => {
    try {
      setSaving(true);
      
      // Delete threshold
      const response = await deleteThreshold(thresholdId);
      
      if (response.success) {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Threshold deleted successfully',
        position: 'bottom'
      });
      
        // Navigate back
      router.back();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to delete threshold',
          position: 'bottom'
        });
      }
    } catch (error) {
      console.error('Error deleting threshold:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Failed to delete threshold',
        position: 'bottom'
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Render history entries if available
  const renderHistoryEntries = () => {
    if (!threshold?.entries || threshold.entries.length === 0) {
  return (
        <View style={styles.emptyHistory}>
          <Text style={styles.emptyHistoryText}>No history entries</Text>
          </View>
      );
    }
    
    return (
      <FlatList
        data={threshold.entries}
        keyExtractor={(item, index) => `history-${index}`}
        renderItem={({ item, index }) => (
          <View style={styles.historyItem}>
            <View style={styles.historyItemLeft}>
              <View style={styles.historyDot}>
                <View style={[
                  styles.historyDotInner,
                  { backgroundColor: item.amount >= 0 ? '#DF0000' : '#F44336' }
                ]} />
              </View>
              <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
            </View>
            <Text 
              style={[
                styles.historyAmount,
                { color: item.amount >= 0 ? '#DF0000' : '#F44336' }
              ]}
            >
              {item.amount >= 0 ? '+$' : '-$'}{Math.abs(item.amount).toFixed(2)}
                    </Text>
                  </View>
        )}
        style={styles.historyList}
      />
    );
  };
  
  // If loading, show spinner
  if (loading) {
    return (
      <CustomLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DF0000" />
                </View>
      </CustomLayout>
    );
  }
  
  // If threshold not found
  if (!threshold) {
    return (
      <CustomLayout>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#DF0000" />
          <Text style={styles.errorText}>Threshold not found</Text>
                </View>
      </CustomLayout>
    );
  }

  return (
    <CustomLayout>
      <View style={styles.contentContainer}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Main heading and description */}
          <View style={styles.headingContainer}>
            <Text style={styles.mainHeading}>Threshold Details</Text>
            <Text style={styles.headingDescription}>
              View and manage details for this threshold. You can update settings or add new entries.
                </Text>
              </View>
              
          {/* Input Fields Section - Styled like Add Threshold page */}
                  <Text style={styles.inputLabel}>Threshold Name</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="bookmark-outline" size={22} color="#777" style={styles.inputIcon} />
                  <TextInput
              style={styles.input}
              value={editData.name}
              onChangeText={(text) => setEditData({ ...editData, name: text })}
                    placeholder="Enter threshold name"
              placeholderTextColor="#777"
                  />
                </View>
                
          <Text style={styles.inputLabel}>Amount ($)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="cash-outline" size={22} color="#777" style={styles.inputIcon} />
                  <TextInput
              style={styles.input}
              value={editData.amount}
              onChangeText={(text) => setEditData({ ...editData, amount: text })}
                    placeholder="Enter amount"
              placeholderTextColor="#777"
                    keyboardType="numeric"
                  />
                </View>
                
                <TouchableOpacity 
            style={styles.submitButton}
                  onPress={handleSaveThreshold}
            disabled={saving}
                >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
                  ) : (
              <Text style={styles.submitButtonText}>Update Threshold</Text>
                  )}
                </TouchableOpacity>
        </ScrollView>
        
        {/* History Section with fixed height */}
        <View style={styles.historySection}>
          <View style={styles.historySectionHeader}>
            <Text style={styles.historySectionTitle}>History</Text>
              </View>
          
          {!threshold?.entries || threshold.entries.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>No history entries</Text>
            </View>
          ) : (
            <FlatList
              data={threshold.entries}
              keyExtractor={(item, index) => `history-${index}`}
              renderItem={({ item, index }) => (
                <View style={styles.historyItem}>
                  <View style={styles.historyItemLeft}>
                    <View style={styles.historyDot}>
                      <View style={[
                        styles.historyDotInner,
                        { backgroundColor: item.amount >= 0 ? '#DF0000' : '#F44336' }
                      ]} />
                    </View>
                    <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                  </View>
                  <Text 
                    style={[
                      styles.historyAmount,
                      { color: item.amount >= 0 ? '#DF0000' : '#F44336' }
                    ]}
                  >
                    {item.amount >= 0 ? '+$' : '-$'}{Math.abs(item.amount).toFixed(2)}
                  </Text>
            </View>
              )}
              style={styles.historyList}
            />
          )}
        </View>
      </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
    marginTop: 16,
    textAlign: 'center',
  },
  headingContainer: {
    marginBottom: 24,
    marginTop: 8,
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
  },
  inputContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: 16,
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
  submitButton: {
    backgroundColor: '#DF0000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  historySection: {
    backgroundColor: '#1A1A1A',
    height: 300,  // Fixed height
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  historySectionHeader: {
    backgroundColor: '#222',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  historySectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  historyDate: {
    color: '#ddd',
    fontSize: 14,
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyHistoryText: {
    color: '#888',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  }
}); 