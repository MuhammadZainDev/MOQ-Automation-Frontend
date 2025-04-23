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
};

// Type tag colors
const TYPE_COLORS = {
  youtube: '#FF0000',
  adsense: '#4CAF50',
  music: '#2196F3'
};

export default function ThresholdsScreen() {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Load thresholds from API
  const fetchThresholds = async () => {
    try {
      setLoading(true);
      const response = await getAllThresholds();
      
      if (response.success) {
        setThresholds(response.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load thresholds',
        });
      }
    } catch (error) {
      console.error('Error fetching thresholds:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Failed to load thresholds',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load initial data
  useEffect(() => {
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

  // Calculate progress percentage
  const calculateProgress = (current: number, target: number) => {
    if (!target) return 0;
    const progress = Math.min(100, Math.round((current / target) * 100));
    return progress;
  };

  // Format type display name with first letter capitalized
  const formatType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
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
    const progress = calculateProgress(item.current || 0, item.amount);
    
    return (
      <TouchableOpacity 
        style={styles.thresholdItem}
        onPress={() => viewThresholdDetail(item.id)}
      >
        <View style={styles.thresholdHeader}>
          <Text style={styles.thresholdName}>{item.name}</Text>
          <View style={[styles.typeTag, { backgroundColor: TYPE_COLORS[item.type] || '#888' }]}>
            <Text style={styles.typeText}>{formatType(item.type || 'youtube')}</Text>
          </View>
        </View>
        
        <Text style={styles.dateText}>
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        
        <View style={styles.amountSection}>
          <Text style={styles.amountText}>
            ${item.current || 0} <Text style={styles.targetAmount}>/ ${item.amount}</Text>
          </Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progress}%` }
              ]} 
            />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.progressText}>{progress}% complete</Text>
            <Ionicons name="chevron-forward" size={18} color="#666" />
          </View>
        </View>
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
                colors={["#4CAF50"]}
                tintColor="#4CAF50"
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countsContainer: {
    paddingHorizontal: 16,
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
    padding: 20,
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
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
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
  },
  amountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  targetAmount: {
    color: '#888',
    fontWeight: 'normal',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#444',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DF0000',
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
  },
  listContent: {
    paddingBottom: 20,
    paddingTop: 8,
  },
}); 