import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../src/services/adminApi';
import { useAuth } from '../../src/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

// Define types for analytics data
type AnalyticsEntry = {
  views?: number;
  videos?: number;
  revenue?: number;
  premium_country_views?: number;
  created_at?: string;
  revenue_type?: string;
  [key: string]: any;
};

type AnalyticsData = {
  views?: number;
  videos?: number;
  revenue?: number;
  premium_country_views?: number;
  entries?: AnalyticsEntry[];
  [key: string]: any;
};

type HistoryItem = {
  id: number;
  date: string;
  revenue: number;
  status: string;
  source: string;
  revenue_type?: string;
  timestamp?: Date;
};

type StatsData = {
  total: number;
  history: HistoryItem[];
};

// Utility function to safely call toFixed on possibly undefined values
const safeToFixed = (num: any, digits: number = 2): string => {
  // Handle undefined, null, NaN cases
  if (num === undefined || num === null || isNaN(Number(num))) {
    return '0' + (digits > 0 ? '.' + '0'.repeat(digits) : '');
  }
  
  // Ensure num is a number
  const numValue = Number(num);
  return numValue.toFixed(digits);
};

// Add a formatter function for displaying numbers with commas
const formatNumber = (num: number | undefined | null): string => {
  // Handle undefined, null, or NaN
  if (num === undefined || num === null || isNaN(num)) {
    return "0";
  }
  
  // For decimal values, ensure we show 2 decimal places
  let formatted = Number.isInteger(num) ? num.toString() : safeToFixed(num, 2);
  
  // Add commas for thousands
  return formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export default function StatsScreen() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<StatsData>({ total: 0, history: [] });
  
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(statsData.history.length / itemsPerPage);
  
  // Get current items for pagination
  const getCurrentItems = () => {
    // First filter out items with revenue value of 0
    const nonZeroItems = statsData.history.filter(item => item.revenue > 0);
    
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return nonZeroItems.slice(indexOfFirstItem, indexOfLastItem);
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Fetch analytics data
        const response = await adminService.getCurrentUserAnalytics();
        if (response.success) {
          setAnalytics(response.data);
          // Process stats data immediately after fetching
          processStatsData(response.data);
        } else {
          setError('Could not fetch analytics data');
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Process analytics data to get revenue
  const processStatsData = (data: AnalyticsData | null): void => {
    if (!data) {
      setStatsData({ total: 0, history: [] });
      return;
    }

    // Get total revenue directly from the analytics response
    const totalRevenue = data.revenue || 0;

    // Generate revenue history from entries if available
    let history: HistoryItem[] = [];

    if (data.entries && Array.isArray(data.entries) && data.entries.length > 0) {
      // Convert entries to history items - use exact revenue values from entries
      // and filter out entries with 0 revenue
      history = data.entries
        .filter(entry => {
          // Make sure revenue exists and is greater than 0
          const revenue = Number(entry.revenue || 0);
          return !isNaN(revenue) && revenue > 0;
        })
        .map((entry, index) => {
          // Ensure all values are defined with fallbacks
          const entryRevenue = Number(entry.revenue || 0);
          let createdAt: Date;
          
          try {
            createdAt = entry.created_at ? new Date(entry.created_at) : new Date();
            // Validate the date - if invalid, use current date
            if (isNaN(createdAt.getTime())) {
              createdAt = new Date();
            }
          } catch (e) {
            // If date parsing fails, use current date
            createdAt = new Date();
          }
          
          const revenueType = entry.revenue_type || 'adsense'; // Default to 'adsense' if not specified
          
          // Check if this revenue came from a threshold
          const isFromThreshold = entry.from_threshold || entry.threshold_id;
          
          return {
            id: index,
            date: createdAt.toLocaleDateString(),
            revenue: entryRevenue,
            status: isFromThreshold ? 'Threshold' : 'Recorded',
            source: revenueType === 'music' ? 'Music Revenue' : 'Adsense Revenue',
            revenue_type: revenueType,
            timestamp: createdAt
          };
        }).reverse(); // Most recent first
    }

    setStatsData({
      total: totalRevenue,
      history: history
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeAreaContainer}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DF0000" />
          <Text style={styles.loadingText}>Loading revenue data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeAreaContainer}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#DF0000" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <LinearGradient
        colors={['#DF0000', '#870000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <Image 
                source={require('../../assets/logo/logo.jpg')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.headerTitle}>Your Revenue</Text>
            </View>
            <Text style={styles.totalStats}>${formatNumber(statsData.total)}</Text>
            <Text style={styles.statsPeriod}>Total revenue in this year</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scrollContent}>
        {/* Revenue history */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Revenue History</Text>
          
          {statsData.history.length > 0 ? (
            <>
              {/* Show only current page items */}
              {getCurrentItems().map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <View style={styles.historyItemLeft}>
                    <View style={styles.historyDateContainer}>
                      <Text style={styles.historyDate}>{item.date}</Text>
                    </View>
                    <View style={styles.historyDetails}>
                      <Text style={styles.historySource}>{item.source}</Text>
                      <Text style={item.status === 'Threshold' ? styles.statusThreshold : styles.statusRecorded}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.historyStats}>${formatNumber(item.revenue)}</Text>
                </View>
              ))}
              
              {/* Pagination controls */}
              {totalPages > 1 && (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity 
                    style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                    onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <Ionicons name="chevron-back" size={18} color={currentPage === 1 ? "#555" : "#fff"} />
                    <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>Previous</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.paginationInfo}>Page {currentPage} of {totalPages}</Text>
                  
                  <TouchableOpacity 
                    style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                    onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>Next</Text>
                    <Ionicons name="chevron-forward" size={18} color={currentPage === totalPages ? "#555" : "#fff"} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyHistory}>
              <Ionicons name="bar-chart-outline" size={50} color="#444" />
              <Text style={styles.emptyHistoryText}>No revenue data found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerGradient: {
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerSafeArea: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContent: {
    padding: 20,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingTop: 50,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  totalStats: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statsPeriod: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 10,
  },
  historySection: {
    padding: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 10,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyDateContainer: {
    backgroundColor: 'rgba(223, 0, 0, 0.1)',
    borderRadius: 6,
    padding: 8,
    marginRight: 12,
  },
  historyDate: {
    color: '#DF0000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyDetails: {
    flex: 1,
  },
  historySource: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 2,
  },
  statusRecorded: {
    fontSize: 12,
    color: '#4CD964',
  },
  statusThreshold: {
    fontSize: 12,
    color: '#4CD964',
  },
  historyStats: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
    padding: 40,
    borderRadius: 10,
  },
  emptyHistoryText: {
    color: '#555',
    marginTop: 15,
    fontSize: 16,
  },
  // Add pagination styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(223, 0, 0, 0.8)',
    borderRadius: 6,
  },
  paginationButtonDisabled: {
    backgroundColor: 'rgba(100, 100, 100, 0.2)',
  },
  paginationButtonText: {
    color: '#fff',
    marginHorizontal: 5,
  },
  paginationButtonTextDisabled: {
    color: '#555',
  },
  paginationInfo: {
    color: '#fff',
    fontSize: 14,
  },
}); 