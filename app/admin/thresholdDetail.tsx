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
  RefreshControl
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

// Custom layout component without the header for this page
function CustomLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const router = useRouter();
  
  const handleLogout = async () => {
    await logout();
    // Navigation is now handled inside the logout method
  };
  
  return (
    <AdminLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Threshold Details</Text>
        </View>
        {children}
      </View>
    </AdminLayout>
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
        });
        router.back(); // Navigate back if threshold not found
      }
    } catch (error) {
      console.error('Error fetching threshold details:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Failed to load threshold details',
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
      });
      return;
    }
    
    const amount = parseFloat(editData.amount);
    if (isNaN(amount) || amount <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid threshold amount',
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
        });
        
        // Exit edit mode
        setEditMode(false);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to update threshold',
        });
      }
    } catch (error) {
      console.error('Error updating threshold:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Failed to update threshold',
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
      });
      return;
    }
    
    const amount = parseFloat(entryAmount);
    if (isNaN(amount)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid amount',
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
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to add entry',
        });
      }
    } catch (error) {
      console.error('Error adding entry:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Failed to add entry',
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
        });
        
        // Navigate back
        router.back();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to delete threshold',
        });
      }
    } catch (error) {
      console.error('Error deleting threshold:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Failed to delete threshold',
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
            <Text style={styles.historyDate}>{item.created_at}</Text>
            <Text 
              style={[
                styles.historyAmount,
                { color: item.amount >= 0 ? '#4CAF50' : '#F44336' }
              ]}
            >
              {item.amount >= 0 ? '+' : ''}{item.amount}
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
      <ScrollView style={styles.scrollView}>
        {/* Header Actions */}
        <View style={styles.actionButtons}>
          {editMode ? (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setEditMode(false)}
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSaveThreshold}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.actionButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.editButton]}
                onPress={() => setEditMode(true)}
              >
                <Ionicons name="create-outline" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        
        {/* Threshold Details Section */}
        <View style={styles.card}>
          {editMode ? (
            // Edit Mode
            <>
              <Text style={styles.inputLabel}>Threshold Name</Text>
              <TextInput
                style={styles.input}
                value={editData.name}
                onChangeText={(text) => setEditData({ ...editData, name: text })}
                placeholder="Enter threshold name"
                placeholderTextColor="#999"
              />
              
              <Text style={styles.inputLabel}>Amount ($)</Text>
              <TextInput
                style={styles.input}
                value={editData.amount}
                onChangeText={(text) => setEditData({ ...editData, amount: text })}
                placeholder="Enter amount"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </>
          ) : (
            // View Mode
            <>
              <View style={styles.thresholdHeader}>
                <Text style={styles.thresholdName}>{threshold.name}</Text>
              </View>
              
              <View style={styles.amountRow}>
                <Text style={styles.currentAmount}>${threshold.amount}</Text>
              </View>
              
              <Text style={styles.dateText}>Created: {threshold.createdAt}</Text>
            </>
          )}
        </View>
        
        {/* Add Entry Section */}
        {!editMode && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Entry</Text>
            
            <Text style={styles.inputLabel}>Amount ($)</Text>
            <TextInput
              style={styles.input}
              value={entryAmount}
              onChangeText={setEntryAmount}
              placeholder="Enter amount (use - for deduction)"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            
            <TouchableOpacity
              style={styles.addEntryButton}
              onPress={handleAddEntry}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.addEntryButtonText}>Add Entry</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* History Section */}
        {!editMode && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>History</Text>
            {renderHistoryEntries()}
          </View>
        )}
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
  scrollView: {
    flex: 1,
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
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#555',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  thresholdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  thresholdName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  currentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  separator: {
    fontSize: 18,
    color: '#888',
    marginHorizontal: 6,
  },
  targetAmount: {
    fontSize: 18,
    color: '#888',
  },
  dateText: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  inputLabel: {
    color: '#ccc',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  addEntryButton: {
    backgroundColor: '#DF0000',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  addEntryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  historyList: {
    marginTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  historyDate: {
    color: '#fff',
    fontSize: 14,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyHistory: {
    padding: 20,
    alignItems: 'center',
  },
  emptyHistoryText: {
    color: '#888',
    fontSize: 14,
  },
}); 