import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AdminLayout from '../../src/components/AdminLayout';
import { adminService } from '../../src/services/adminApi';
import Toast from 'react-native-toast-message';

// Progress bar component
const ProgressBar = ({ 
  progress, 
  color, 
  height = 8 
}: { 
  progress: number; 
  color: string;
  height?: number;
}) => {
  return (
    <View style={[styles.progressContainer, { height }]}>
      <View 
        style={[
          styles.progressFill, 
          { 
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: color || '#DF0000'
          }
        ]} 
      />
    </View>
  );
};

// Define threshold type
type Threshold = {
  id: string;
  name: string;
  amount: number;
  current: number;
  progress: number;
  createdAt: string;
  type: 'youtube' | 'adsense' | 'music';
};

export default function ThresholdsScreen() {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'youtube', 'music', 'adsense'
  const router = useRouter();
  
  // State for add threshold modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newThresholdName, setNewThresholdName] = useState('');
  const [newThresholdAmount, setNewThresholdAmount] = useState('');
  const [newThresholdType, setNewThresholdType] = useState<'youtube' | 'adsense' | 'music'>('youtube');
  const [addingThreshold, setAddingThreshold] = useState(false);

  // Fetch thresholds from API (simulated)
  const fetchThresholds = async () => {
    try {
      setLoading(true);
      
      // Simulate API call to get thresholds
      setTimeout(() => {
        // Generate fake data
        const fakeThresholds: Threshold[] = [
          {
            id: '1',
            name: 'YouTube Basic Income',
            amount: 100,
            current: 76,
            progress: 76,
            createdAt: '2023-10-15',
            type: 'youtube'
          },
          {
            id: '2',
            name: 'Music Revenue Target',
            amount: 500,
            current: 320,
            progress: 64,
            createdAt: '2023-11-01',
            type: 'music'
          },
          {
            id: '3',
            name: 'AdSense Minimum',
            amount: 250,
            current: 150,
            progress: 60,
            createdAt: '2023-09-22',
            type: 'adsense'
          },
          {
            id: '4',
            name: 'YouTube Premium',
            amount: 1000,
            current: 450,
            progress: 45,
            createdAt: '2023-10-05',
            type: 'youtube'
          },
          {
            id: '5',
            name: 'Monthly Music Goal',
            amount: 300,
            current: 290,
            progress: 97,
            createdAt: '2023-11-10',
            type: 'music'
          }
        ];
        
        setThresholds(fakeThresholds);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load thresholds',
        position: 'bottom'
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThresholds();
  }, []);

  // Navigate to threshold details
  const viewThresholdDetail = (thresholdId: string) => {
    router.push(`/admin/thresholdDetail?id=${thresholdId}`);
  };

  // Add new threshold
  const handleAddThreshold = () => {
    // Validate inputs
    if (!newThresholdName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Threshold name is required',
        position: 'bottom'
      });
      return;
    }
    
    const amount = parseFloat(newThresholdAmount);
    if (isNaN(amount) || amount <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid threshold amount',
        position: 'bottom'
      });
      return;
    }
    
    setAddingThreshold(true);
    
    // Simulate API call to add threshold
    setTimeout(() => {
      const newThreshold: Threshold = {
        id: (thresholds.length + 1).toString(),
        name: newThresholdName,
        amount: amount,
        current: 0,
        progress: 0,
        createdAt: new Date().toISOString().split('T')[0],
        type: newThresholdType
      };
      
      setThresholds(prev => [newThreshold, ...prev]);
      
      // Reset form and close modal
      setNewThresholdName('');
      setNewThresholdAmount('');
      setNewThresholdType('youtube');
      setShowAddModal(false);
      setAddingThreshold(false);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Threshold created successfully',
        position: 'bottom'
      });
    }, 800);
  };

  // Header with navigation back to dashboard
  const Header = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Thresholds</Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Ionicons name="add-outline" size={24} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );

  // Render each threshold item
  const renderThresholdItem = ({ item }: { item: Threshold }) => (
    <TouchableOpacity 
      style={styles.thresholdItem}
      onPress={() => viewThresholdDetail(item.id)}
    >
      <View style={styles.thresholdHeader}>
        <View style={styles.thresholdTitleContainer}>
          <Text style={styles.thresholdName}>{item.name}</Text>
          <View style={[
            styles.thresholdTypeBadge, 
            { 
              backgroundColor: 
                item.type === 'youtube' ? 'rgba(223, 0, 0, 0.2)' : 
                item.type === 'music' ? 'rgba(47, 128, 237, 0.2)' : 
                'rgba(39, 174, 96, 0.2)' 
            }
          ]}>
            <Text style={[
              styles.thresholdTypeText,
              {
                color: 
                  item.type === 'youtube' ? '#DF0000' : 
                  item.type === 'music' ? '#2F80ED' : 
                  '#27AE60'
              }
            ]}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.thresholdDate}>Created: {item.createdAt}</Text>
      </View>
      
      <View style={styles.thresholdAmount}>
        <Text style={styles.currentAmount}>${item.current.toLocaleString()}</Text>
        <Text style={styles.targetAmount}>/ ${item.amount.toLocaleString()}</Text>
      </View>
      
      <ProgressBar progress={item.progress} color={
        item.type === 'youtube' ? '#DF0000' : 
        item.type === 'music' ? '#2F80ED' : 
        '#27AE60'
      } />
      
      <View style={styles.thresholdFooter}>
        <Text style={styles.progressText}>{item.progress}% complete</Text>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  );

  // Add Threshold Modal
  const AddThresholdModal = () => (
    <Modal
      visible={showAddModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Threshold</Text>
            <TouchableOpacity 
              onPress={() => setShowAddModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#999" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Threshold Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter threshold name"
              placeholderTextColor="#999"
              value={newThresholdName}
              onChangeText={setNewThresholdName}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount ($)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter threshold amount"
              placeholderTextColor="#999"
              value={newThresholdAmount}
              onChangeText={setNewThresholdAmount}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.typeSelection}>
              <TouchableOpacity 
                style={[
                  styles.typeOption, 
                  newThresholdType === 'youtube' && styles.selectedTypeOption
                ]}
                onPress={() => setNewThresholdType('youtube')}
              >
                <Text style={[
                  styles.typeOptionText,
                  newThresholdType === 'youtube' && styles.selectedTypeText
                ]}>YouTube</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.typeOption, 
                  newThresholdType === 'music' && styles.selectedTypeOption
                ]}
                onPress={() => setNewThresholdType('music')}
              >
                <Text style={[
                  styles.typeOptionText,
                  newThresholdType === 'music' && styles.selectedTypeText
                ]}>Music</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.typeOption, 
                  newThresholdType === 'adsense' && styles.selectedTypeOption
                ]}
                onPress={() => setNewThresholdType('adsense')}
              >
                <Text style={[
                  styles.typeOptionText,
                  newThresholdType === 'adsense' && styles.selectedTypeText
                ]}>AdSense</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.modalAddButton}
            onPress={handleAddThreshold}
            disabled={addingThreshold}
          >
            {addingThreshold ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>Create Threshold</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <AdminLayout>
      <View style={styles.container}>
        <Header />
        
        <View style={styles.countsContainer}>
          <Text style={styles.countsText}>
            {thresholds.length} threshold{thresholds.length !== 1 ? 's' : ''} found
          </Text>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DF0000" />
          </View>
        ) : (
          <ScrollView style={styles.thresholdsContainer} contentContainerStyle={styles.thresholdsListContent}>
            {thresholds.length > 0 ? (
              thresholds.map((threshold, index) => (
                <React.Fragment key={threshold.id}>
                  {renderThresholdItem({item: threshold})}
                </React.Fragment>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="shield-outline" size={60} color="#555" />
                <Text style={styles.emptyTitle}>No Thresholds Found</Text>
                <Text style={styles.emptyText}>
                  No thresholds found. Click the + button to create a new threshold.
                </Text>
              </View>
            )}
          </ScrollView>
        )}
        
        {/* Add Threshold Modal */}
        <AddThresholdModal />
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#DF0000',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countsContainer: {
    marginBottom: 15,
  },
  countsText: {
    color: '#aaa',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  thresholdsContainer: {
    flex: 1,
  },
  thresholdsListContent: {
    paddingHorizontal: 0,
  },
  thresholdItem: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  thresholdHeader: {
    marginBottom: 10,
  },
  thresholdTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thresholdName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  thresholdTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 10,
  },
  thresholdTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  thresholdDate: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
  thresholdAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  currentAmount: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  targetAmount: {
    color: '#999',
    fontSize: 16,
    marginLeft: 5,
  },
  progressContainer: {
    width: '100%',
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
  },
  thresholdFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  progressText: {
    color: '#ccc',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#333',
    borderRadius: 5,
    padding: 10,
    color: '#fff',
    fontSize: 16,
  },
  typeSelection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeOption: {
    flex: 1,
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  selectedTypeOption: {
    backgroundColor: '#DF0000',
  },
  typeOptionText: {
    color: '#ccc',
    fontSize: 14,
  },
  selectedTypeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalAddButton: {
    backgroundColor: '#DF0000',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
}); 