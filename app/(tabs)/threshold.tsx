import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import Toast from 'react-native-toast-message';

// Get screen width for responsive design
const { width } = Dimensions.get('window');

// Progress bar component
const ProgressBar = ({ progress, color, height = 8 }) => {
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

// Threshold card component
const ThresholdCard = ({ title, amount, threshold, progress, musicRevenue, adsenseRevenue, icon }) => {
  return (
    <View style={styles.thresholdCard}>
      <View style={styles.thresholdCardHeader}>
        <Ionicons name={icon} size={24} color="#777" />
        <Text style={styles.thresholdCardTitle}>{title}</Text>
      </View>
      
      <Text style={styles.thresholdAmount}>${amount.toLocaleString()}</Text>
      
      <ProgressBar progress={progress} color="#DF0000" height={10} />
      
      <View style={styles.thresholdLabelRow}>
        <Text style={styles.thresholdProgressText}>{progress}% complete</Text>
        <Text style={styles.thresholdProgressText}>${threshold.toLocaleString()}</Text>
      </View>
      
      <View style={styles.revenueSourceContainer}>
        <View style={styles.revenueSource}>
          <View style={[styles.revenueDot, { backgroundColor: '#2F80ED' }]} />
          <Text style={styles.revenueSourceText}>Music Revenue: ${musicRevenue.toLocaleString()}</Text>
        </View>
        
        <View style={styles.revenueSource}>
          <View style={[styles.revenueDot, { backgroundColor: '#27AE60' }]} />
          <Text style={styles.revenueSourceText}>Adsense Revenue: ${adsenseRevenue.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );
};

const ThresholdScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Revenue data
  const [monthlyRevenue, setMonthlyRevenue] = useState({
    total: 580,
    threshold: 1000,
    progress: 58,
    music: 350,
    adsense: 230
  });
  
  // Total revenue data
  const [totalRevenue, setTotalRevenue] = useState({
    total: 4250,
    threshold: 5000, 
    progress: 85,
    music: 2800,
    adsense: 1450
  });
  
  // Load user threshold settings
  useEffect(() => {
    const loadThresholdSettings = async () => {
      try {
        setLoading(true);
        // Simulate API call to get threshold settings
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading threshold settings:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load threshold settings',
          position: 'bottom',
        });
        setLoading(false);
      }
    };
    
    loadThresholdSettings();
  }, []);
  
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DF0000" />
          <Text style={styles.loadingText}>Loading threshold data...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Thresholds</Text>
          <Text style={styles.headerSubtitle}>Track your earnings and set protection limits</Text>
        </View>
        
        {/* Revenue Threshold Cards */}
        <View style={styles.thresholdCardsContainer}>
          <ThresholdCard 
            title="Monthly Revenue"
            amount={monthlyRevenue.total}
            threshold={monthlyRevenue.threshold}
            progress={monthlyRevenue.progress}
            musicRevenue={monthlyRevenue.music}
            adsenseRevenue={monthlyRevenue.adsense}
            icon="calendar-outline"
          />
          
          <ThresholdCard 
            title="Total Revenue"
            amount={totalRevenue.total}
            threshold={totalRevenue.threshold}
            progress={totalRevenue.progress}
            musicRevenue={totalRevenue.music}
            adsenseRevenue={totalRevenue.adsense}
            icon="cash-outline"
          />
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Set thresholds to protect your earnings and views. When enabled, your account will be automatically protected when these thresholds are reached.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    marginTop: Platform.OS === 'ios' ? 10 : 30,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    color: '#999',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  scrollViewContent: {
    paddingVertical: 20,
  },
  // Threshold card styles
  thresholdCardsContainer: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  thresholdCard: {
    backgroundColor: '#212121',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  thresholdCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  thresholdCardTitle: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  thresholdAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  progressContainer: {
    width: '100%',
    backgroundColor: '#333',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  thresholdLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 15,
  },
  thresholdProgressText: {
    color: '#999',
    fontSize: 12,
  },
  revenueSourceContainer: {
    marginTop: 5,
  },
  revenueSource: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  revenueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  revenueSourceText: {
    color: '#ccc',
    fontSize: 14,
  },
  // Info card style
  infoCard: {
    backgroundColor: '#212121',
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 20,
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ThresholdScreen; 