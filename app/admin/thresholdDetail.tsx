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
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { adminService } from '../../src/services/adminApi';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../src/context/AuthContext';

// Progress bar component
const ProgressBar = ({ 
  progress, 
  color, 
  height = 8 
}: { 
  progress: number; 
  color?: string;
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

// Type for threshold detail
type ThresholdDetail = {
  id: string;
  name: string;
  amount: number;
  current: number;
  progress: number;
  createdAt: string;
  type: 'youtube' | 'adsense' | 'music';
  isProtectionEnabled: boolean;
  description?: string;
  history?: {
    date: string;
    amount: number;
  }[];
};

// Helper to get color by threshold type
const getColorByType = (type: string): string => {
  switch (type) {
    case 'youtube':
      return '#DF0000';
    case 'music':
      return '#2F80ED';
    case 'adsense':
      return '#27AE60';
    default:
      return '#DF0000';
  }
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

export default function ThresholdDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const thresholdId = params.id as string;
  
  const [threshold, setThreshold] = useState<ThresholdDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Form state
  const [isProtectionEnabled, setIsProtectionEnabled] = useState(false);
  const [thresholdName, setThresholdName] = useState('');
  const [thresholdAmount, setThresholdAmount] = useState('');
  const [thresholdDescription, setThresholdDescription] = useState('');
  
  // Fetch threshold data
  useEffect(() => {
    const fetchThresholdData = async () => {
      try {
        setLoading(true);
        
        // Simulate API call to get threshold
        setTimeout(() => {
          // Generate fake data
          const fakeThreshold: ThresholdDetail = {
            id: thresholdId,
            name: thresholdId === '1' ? 'YouTube Basic Income' : 
                  thresholdId === '2' ? 'Music Revenue Target' : 
                  thresholdId === '3' ? 'AdSense Minimum' : 
                  thresholdId === '4' ? 'YouTube Premium' : 
                  'Monthly Music Goal',
            amount: thresholdId === '1' ? 100 : 
                    thresholdId === '2' ? 500 : 
                    thresholdId === '3' ? 250 : 
                    thresholdId === '4' ? 1000 : 300,
            current: thresholdId === '1' ? 76 : 
                    thresholdId === '2' ? 320 : 
                    thresholdId === '3' ? 150 : 
                    thresholdId === '4' ? 450 : 290,
            progress: thresholdId === '1' ? 76 : 
                      thresholdId === '2' ? 64 : 
                      thresholdId === '3' ? 60 : 
                      thresholdId === '4' ? 45 : 97,
            createdAt: thresholdId === '1' ? '2023-10-15' : 
                      thresholdId === '2' ? '2023-11-01' : 
                      thresholdId === '3' ? '2023-09-22' : 
                      thresholdId === '4' ? '2023-10-05' : '2023-11-10',
            type: thresholdId === '1' ? 'youtube' : 
                  thresholdId === '2' ? 'music' : 
                  thresholdId === '3' ? 'adsense' : 
                  thresholdId === '4' ? 'youtube' : 'music',
            isProtectionEnabled: Math.random() > 0.5,
            description: "This threshold represents the minimum revenue target for content creators. When enabled, protection features activate once the threshold is reached.",
            history: [
              { date: '2023-11-01', amount: 25 },
              { date: '2023-11-08', amount: 45 },
              { date: '2023-11-15', amount: 65 },
              { date: '2023-11-22', amount: 85 },
              { date: '2023-11-29', amount: 95 }
            ]
          };
          
          setThreshold(fakeThreshold);
          setIsProtectionEnabled(fakeThreshold.isProtectionEnabled);
          setThresholdName(fakeThreshold.name);
          setThresholdAmount(fakeThreshold.amount.toString());
          setThresholdDescription(fakeThreshold.description || '');
          
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching threshold data:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load threshold data',
          position: 'bottom'
        });
        setLoading(false);
      }
    };
    
    if (thresholdId) {
      fetchThresholdData();
    }
  }, [thresholdId]);

  const handleBack = () => {
    router.back();
  };

  const handleSaveThreshold = async () => {
    try {
      setSavingSettings(true);
      
      // Validate inputs - ensure they are numbers
      if (!thresholdName.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Threshold name is required',
          position: 'bottom'
        });
        setSavingSettings(false);
        return;
      }
      
      const amount = parseFloat(thresholdAmount);
      if (isNaN(amount) || amount <= 0) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please enter a valid threshold amount',
          position: 'bottom'
        });
        setSavingSettings(false);
        return;
      }
      
      // In a real app, you would call the API to update the threshold settings
      // For now, we'll just simulate a successful update
      setTimeout(() => {
        // Update the threshold object with new values
        if (threshold) {
          const updatedThreshold: ThresholdDetail = {
            ...threshold,
            name: thresholdName,
            amount: amount,
            isProtectionEnabled: isProtectionEnabled,
            description: thresholdDescription,
            progress: Math.floor((threshold.current / amount) * 100)
          };
          
          setThreshold(updatedThreshold);
        }
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Threshold updated successfully',
          position: 'bottom',
          visibilityTime: 4000,
        });
        
        setSavingSettings(false);
      }, 1000);
    } catch (error) {
      console.error('Error saving threshold settings:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save threshold settings',
        position: 'bottom'
      });
      setSavingSettings(false);
    }
  };

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
          onPress: handleDeleteThreshold,
          style: "destructive"
        }
      ]
    );
  };

  const handleDeleteThreshold = () => {
    // Simulate API call to delete threshold
    setLoading(true);
    
    setTimeout(() => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Threshold deleted successfully',
        position: 'bottom'
      });
      
      // Navigate back after deletion
      router.back();
    }, 1000);
  };

  return (
    <CustomLayout>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.headerContainer}>
            <Text style={styles.pageTitle}>Threshold Detail</Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#DF0000" />
              <Text style={styles.loadingText}>Loading threshold data...</Text>
            </View>
          ) : threshold ? (
            <View style={styles.thresholdDetailContainer}>
              {/* Threshold Header Card */}
              <View style={[
                styles.thresholdHeaderCard,
                { backgroundColor: `rgba(${threshold.type === 'youtube' ? '223, 0, 0' : threshold.type === 'music' ? '47, 128, 237' : '39, 174, 96'}, 0.2)` }
              ]}>
                <View style={styles.thresholdTitleRow}>
                  <Text style={styles.thresholdName}>{threshold.name}</Text>
                  <View style={[
                    styles.thresholdTypeBadge,
                    { backgroundColor: `rgba(${threshold.type === 'youtube' ? '223, 0, 0' : threshold.type === 'music' ? '47, 128, 237' : '39, 174, 96'}, 0.3)` }
                  ]}>
                    <Text style={[
                      styles.thresholdTypeText,
                      { color: getColorByType(threshold.type) }
                    ]}>
                      {threshold.type.charAt(0).toUpperCase() + threshold.type.slice(1)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.thresholdAmount}>
                  <Text style={styles.currentAmount}>${threshold.current.toLocaleString()}</Text>
                  <Text style={styles.targetAmount}>/ ${threshold.amount.toLocaleString()}</Text>
                </View>
                
                <ProgressBar 
                  progress={threshold.progress} 
                  color={getColorByType(threshold.type)} 
                  height={10}
                />
                
                <Text style={styles.progressText}>
                  ${threshold.current.toLocaleString()} of ${threshold.amount.toLocaleString()} ({threshold.progress}%)
                </Text>
                
                <Text style={styles.createdDate}>
                  Created on {threshold.createdAt}
                </Text>
              </View>
              
              {/* History Chart */}
              {threshold.history && (
                <View style={styles.historyCard}>
                  <Text style={styles.cardTitle}>Revenue History</Text>
                  
                  <View style={styles.historyBars}>
                    {threshold.history.map((item, index) => (
                      <View key={index} style={styles.historyBarContainer}>
                        <View style={styles.historyLabelContainer}>
                          <Text style={styles.historyLabel}>${item.amount}</Text>
                        </View>
                        <View 
                          style={[
                            styles.historyBar, 
                            { 
                              height: `${(item.amount / threshold.amount) * 100}%`,
                              backgroundColor: getColorByType(threshold.type)
                            }
                          ]} 
                        />
                        <Text style={styles.historyDate}>
                          {item.date.split('-')[2]}
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.historyLegend}>
                    <View style={styles.historyLegendItem}>
                      <View style={[styles.legendDot, { backgroundColor: getColorByType(threshold.type) }]} />
                      <Text style={styles.legendText}>Revenue</Text>
                    </View>
                    <Text style={styles.legendText}>Target: ${threshold.amount}</Text>
                  </View>
                </View>
              )}
              
              {/* Edit Threshold Form */}
              <View style={styles.editCard}>
                <Text style={styles.cardTitle}>Edit Threshold</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Threshold Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={thresholdName}
                    onChangeText={setThresholdName}
                    placeholder="Enter threshold name"
                    placeholderTextColor="#999"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Threshold Amount ($)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={thresholdAmount}
                    onChangeText={setThresholdAmount}
                    placeholder="Enter amount"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={thresholdDescription}
                    onChangeText={setThresholdDescription}
                    placeholder="Enter description"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
                
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Enable Protection</Text>
                  <Switch
                    value={isProtectionEnabled}
                    onValueChange={setIsProtectionEnabled}
                    trackColor={{ false: '#555', true: 'rgba(223, 0, 0, 0.3)' }}
                    thumbColor={isProtectionEnabled ? '#DF0000' : '#ccc'}
                  />
                </View>
                
                <Text style={styles.switchDescription}>
                  When enabled, automatic protection features will activate once the threshold is reached.
                </Text>
              </View>
              
              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSaveThreshold}
                  disabled={savingSettings}
                >
                  {savingSettings ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={20} color="#fff" />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={confirmDelete}
                >
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                  <Text style={styles.deleteButtonText}>Delete Threshold</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={60} color="#DF0000" />
              <Text style={styles.errorText}>Threshold not found</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    marginLeft: 5,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  thresholdDetailContainer: {
    paddingBottom: 20,
  },
  thresholdHeaderCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  thresholdTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  thresholdName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  thresholdTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  thresholdTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  thresholdAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 15,
  },
  currentAmount: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  targetAmount: {
    color: '#ccc',
    fontSize: 18,
    marginLeft: 5,
  },
  progressContainer: {
    width: '100%',
    backgroundColor: '#333',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 5,
  },
  createdDate: {
    color: '#999',
    fontSize: 12,
    marginTop: 15,
    textAlign: 'right',
  },
  historyCard: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  historyBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    marginBottom: 10,
  },
  historyBarContainer: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  historyLabelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  historyLabel: {
    color: '#ccc',
    fontSize: 10,
    marginBottom: 5,
  },
  historyBar: {
    width: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  historyDate: {
    color: '#999',
    fontSize: 10,
  },
  historyLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  historyLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  legendText: {
    color: '#ccc',
    fontSize: 12,
  },
  editCard: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  switchLabel: {
    color: '#ccc',
    fontSize: 16,
  },
  switchDescription: {
    color: '#999',
    fontSize: 14,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'column',
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#DF0000',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
  },
}); 