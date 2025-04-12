import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator, 
  Alert,
  Image,
  StatusBar 
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { adminService } from '../../src/services/adminApi';

// Define analytics type
type UserAnalyticsData = {
  stats: number;
  views: number;
  videos: number;
  watch_hours: number;
  premium_country_views: number;
  subscribers: number;
  posts: number;
  likes: number;
};

// Daily/Recent analytics data type
type DailyAnalyticsData = {
  stats: number;
  views: number;
  videos: number;
  subscribers: number;
};

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

export default function HomeScreen() {
  const { user, isLoading, logout } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState('280');
  const [analyticsData, setAnalyticsData] = useState<UserAnalyticsData>({
    stats: 0,
    views: 0,
    videos: 0,
    watch_hours: 0,
    premium_country_views: 0,
    subscribers: 0,
    posts: 0,
    likes: 0
  });
  // Store daily analytics separately
  const [dailyAnalyticsData, setDailyAnalyticsData] = useState<DailyAnalyticsData>({
    stats: 0,
    views: 0,
    videos: 0,
    subscribers: 0
  });
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [todayRefreshCount, setTodayRefreshCount] = useState(0);

  // Debug user info
  console.log('Home Screen - Current User:', user?.name, user?.role);
  
  // Update today's analytics with actual data
  const updateTodaysAnalytics = (totalData: UserAnalyticsData) => {
    // Use real data from backend
    setDailyAnalyticsData({
      stats: totalData.stats || 0,
      views: totalData.views || 0,
      videos: totalData.videos || 0,
      subscribers: totalData.subscribers || 0
    });
    
    // Increment refresh counter when we get new data
    setTodayRefreshCount(prev => prev + 1);
    
    console.log('Updated today\'s analytics with real data:', totalData);
  };
  
  // Fetch user analytics data
  useEffect(() => {
    const fetchUserAnalytics = async () => {
      if (!user) return;
      
      try {
        setIsLoadingAnalytics(true);
        
        // Get total analytics from API
        const response = await adminService.getCurrentUserAnalytics();
        
        if (response.success && response.data) {
          console.log('Successfully fetched analytics data:', response.data);
          setAnalyticsData(response.data);
          
          // Update today's analytics with real data from API
          updateTodaysAnalytics(response.data);
        } else {
          console.error('Error in analytics response:', response);
        }
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setIsLoadingAnalytics(false);
      }
    };
    
    fetchUserAnalytics();
  }, [user]);
  
  // Calculate detailed analytics based on the fetched data
  const detailedAnalytics = {
    subscribers: {
      value: analyticsData.subscribers || 0,
      average: ((analyticsData.subscribers || 0) / 28).toFixed(1),
      trend: 'neutral'
    },
    views: {
      value: analyticsData.views || 0,
      average: ((analyticsData.views || 0) / 28).toFixed(1),
      trend: 'neutral'
    },
    watchHours: {
      value: analyticsData.watch_hours || 0,
      average: ((analyticsData.watch_hours || 0) / 28).toFixed(1),
      trend: 'neutral'
    }
  };

  // If still checking authentication, show loading indicator
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DF0000" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If no user is found after loading completes, redirect to login
  if (!user) {
    console.log('Home Screen - No user found, user object is null or undefined');
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.message}>Not logged in</Text>
      </View>
    );
  }

  const handleLogout = () => {
    console.log('Logout button pressed');
    try {
        console.log('Calling logout function');
        logout();
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'An error occurred during logout');
    }
  };
  
  // Refresh all analytics data
  const refreshData = () => {
    setIsLoadingAnalytics(true);
    adminService.getCurrentUserAnalytics()
      .then(response => {
        if (response.success && response.data) {
          setAnalyticsData(response.data);
          
          // Update today's analytics with real data
          updateTodaysAnalytics(response.data);
        }
      })
      .catch(error => console.error('Error refreshing analytics:', error))
      .finally(() => setIsLoadingAnalytics(false));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {isLoading ? (
        <View style={styles.fullLoadingContainer}>
          <ActivityIndicator size="large" color="#DF0000" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : (
        <ScrollView style={styles.container}>
          {/* Channel Header Section */}
          <View style={styles.channelHeader}>
            <View style={styles.channelInfo}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../assets/logo/logo.jpg')} 
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              
              <View style={styles.channelTextInfo}>
                <Text style={styles.channelName}>{user.name}</Text>
                <Text style={styles.lastUpdate}>
                  Last updated: {isLoadingAnalytics ? (
                    <ActivityIndicator size="small" color="#DF0000" />
                  ) : 'Today'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.crownIcon}>
              <Ionicons name="star" size={28} color="#FFA000" />
            </TouchableOpacity>
          </View>
          
          {/* Daily Analytics Title */}
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Today's Updates{todayRefreshCount > 0 ? ` (${todayRefreshCount})` : ''}</Text>
            <TouchableOpacity onPress={refreshData} disabled={isLoadingAnalytics}>
              <Ionicons 
                name="refresh-outline" 
                size={18} 
                color="#DF0000" 
                style={isLoadingAnalytics ? styles.refreshingIcon : {}}
              />
            </TouchableOpacity>
          </View>
          
          {/* Analytics Boxes - Show Daily Updates */}
          <View style={styles.analyticsRow}>
            <View style={styles.analyticsBox}>
              <View style={styles.analyticsHeader}>
                <Text style={styles.analyticsTitle}>Stats</Text>
                <Ionicons name="today-outline" size={18} color="#777" />
              </View>
              <Text style={styles.analyticsValue}>
                {isLoadingAnalytics ? (
                  <ActivityIndicator size="small" color="#DF0000" />
                ) : (
                  formatNumber(dailyAnalyticsData.stats)
                )}
              </Text>
              <View style={styles.analyticsFooter}>
                <Text style={styles.analyticsTrend}>Today</Text>
                {todayRefreshCount > 1 && (
                  <Text style={styles.analyticsAccumulated}>Updates: {todayRefreshCount}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.analyticsBox}>
              <View style={styles.analyticsHeader}>
                <Text style={styles.analyticsTitle}>Subs</Text>
                <Ionicons name="today-outline" size={18} color="#777" />
              </View>
              <Text style={styles.analyticsValue}>
                {isLoadingAnalytics ? (
                  <ActivityIndicator size="small" color="#DF0000" />
                ) : (
                  formatNumber(dailyAnalyticsData.subscribers)
                )}
              </Text>
              <View style={styles.analyticsFooter}>
                <Text style={styles.analyticsTrend}>Today</Text>
                {todayRefreshCount > 1 && (
                  <Text style={styles.analyticsAccumulated}>Updates: {todayRefreshCount}</Text>
                )}
              </View>
            </View>
          </View>
          
          <View style={styles.analyticsRow}>
            <View style={styles.analyticsBox}>
              <View style={styles.analyticsHeader}>
                <Text style={styles.analyticsTitle}>Views</Text>
                <Ionicons name="today-outline" size={18} color="#777" />
              </View>
              <Text style={styles.analyticsValue}>
                {isLoadingAnalytics ? (
                  <ActivityIndicator size="small" color="#DF0000" />
                ) : (
                  formatNumber(dailyAnalyticsData.views)
                )}
              </Text>
              <View style={styles.analyticsFooter}>
                <Text style={styles.analyticsTrend}>Today</Text>
                {todayRefreshCount > 1 && (
                  <Text style={styles.analyticsAccumulated}>Updates: {todayRefreshCount}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.analyticsBox}>
              <View style={styles.analyticsHeader}>
                <Text style={styles.analyticsTitle}>Videos</Text>
                <Ionicons name="today-outline" size={18} color="#777" />
              </View>
              <Text style={styles.analyticsValue}>
                {isLoadingAnalytics ? (
                  <ActivityIndicator size="small" color="#DF0000" />
                ) : (
                  formatNumber(dailyAnalyticsData.videos)
                )}
              </Text>
              <View style={styles.analyticsFooter}>
                <Text style={styles.analyticsTrend}>Today</Text>
                {todayRefreshCount > 1 && (
                  <Text style={styles.analyticsAccumulated}>Updates: {todayRefreshCount}</Text>
                )}
              </View>
            </View>
          </View>
          
          {/* New Detailed Analytics Section - Shows Total Analytics */}
          <View style={styles.detailedAnalyticsContainer}>
            {/* Header with timeframe buttons */}
            <View style={styles.analyticsHeader}>
              <View style={styles.analyticsHeaderTitleContainer}>
                <Text style={styles.analyticsHeaderTitle}>Total Analytics</Text>
                <TouchableOpacity 
                  style={styles.refreshButton} 
                  onPress={refreshData}
                  disabled={isLoadingAnalytics}
                >
                  <Ionicons 
                    name="refresh-outline" 
                    size={20} 
                    color="#DF0000" 
                    style={isLoadingAnalytics ? styles.refreshingIcon : {}}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.timeframeButtons}>
                <TouchableOpacity 
                  style={[styles.timeframeButton, selectedTimeframe === '280' && styles.selectedTimeframe]}
                  onPress={() => setSelectedTimeframe('280')}
                >
                  <Text style={[styles.timeframeText, selectedTimeframe === '280' && styles.selectedTimeframeText]}>28D</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.timeframeButton, selectedTimeframe === '90D' && styles.selectedTimeframe]}
                  onPress={() => setSelectedTimeframe('90D')}
                >
                  <Text style={styles.timeframeText}>90D</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.timeframeButton, selectedTimeframe === 'Apr' && styles.selectedTimeframe]}
                  onPress={() => setSelectedTimeframe('Apr')}
                >
                  <Text style={styles.timeframeText}>Apr</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.timeframeButton, selectedTimeframe === 'Mar' && styles.selectedTimeframe]}
                  onPress={() => setSelectedTimeframe('Mar')}
                >
                  <Text style={styles.timeframeText}>Mar</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Analytics Cards */}
            <View style={styles.detailedCardsContainer}>
              {isLoadingAnalytics ? (
                <View style={styles.loadingDetailedCards}>
                  <ActivityIndicator size="large" color="#DF0000" />
                  <Text style={styles.loadingText}>Loading analytics...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.detailedCardsRow}>
                    {/* Subscribers Card */}
                    <View style={styles.detailedCard}>
                      <Text style={styles.cardTitle}>Subscribers</Text>
                      <Text style={styles.cardValue}>{formatNumber(detailedAnalytics.subscribers.value)}</Text>
                      <View style={styles.averageContainer}>
                        <Text style={styles.averageLabel}>Average</Text>
                        <Text style={styles.averageValue}>{formatNumber(parseFloat(detailedAnalytics.subscribers.average))} / day</Text>
                      </View>
                    </View>
                    
                    {/* Views Card */}
                    <View style={styles.detailedCard}>
                      <Text style={styles.cardTitle}>Views</Text>
                      <Text style={styles.cardValue}>{formatNumber(detailedAnalytics.views.value)}</Text>
                      <View style={styles.averageContainer}>
                        <Text style={styles.averageLabel}>Average</Text>
                        <Text style={styles.averageValue}>{formatNumber(parseFloat(detailedAnalytics.views.average))} / day</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.detailedCardsRow}>
                    {/* Watch Hours Card */}
                    <View style={styles.detailedCard}>
                      <Text style={styles.cardTitle}>Watch hours</Text>
                      <Text style={styles.cardValue}>{formatNumber(detailedAnalytics.watchHours.value)}</Text>
                      <View style={styles.averageContainer}>
                        <Text style={styles.averageLabel}>Average</Text>
                        <Text style={styles.averageValue}>{formatNumber(parseFloat(detailedAnalytics.watchHours.average))} / day</Text>
                      </View>
                    </View>
                    
                    {/* Likes Card */}
                    <View style={styles.detailedCard}>
                      <Text style={styles.cardTitle}>Likes</Text>
                      <Text style={styles.cardValue}>{formatNumber(analyticsData.likes || 0)}</Text>
                      <View style={styles.averageContainer}>
                        <Text style={styles.averageLabel}>Total</Text>
                        <Text style={styles.averageValue}>Engagement</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#FFA000',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  channelTextInfo: {
    marginLeft: 16,
  },
  channelName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  lastUpdate: {
    color: '#777',
    fontSize: 14,
    marginTop: 4,
  },
  crownIcon: {
    padding: 8,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  analyticsBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    width: '48%',
    padding: 16,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  analyticsTitle: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
  },
  analyticsValue: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  analyticsTrend: {
    color: '#777',
    fontSize: 16,
  },
  analyticsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analyticsAccumulated: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // New Analytics Styles
  detailedAnalyticsContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  analyticsHeaderTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timeframeButtons: {
    flexDirection: 'row',
  },
  timeframeButton: {
    backgroundColor: '#333',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 8,
  },
  selectedTimeframe: {
    backgroundColor: '#DF0000',
  },
  timeframeText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
  },
  selectedTimeframeText: {
    color: '#FFF',
  },
  detailedCardsContainer: {
    marginTop: 10,
  },
  detailedCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailedCard: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
  },
  cardTitle: {
    color: '#999',
    fontSize: 14,
    marginBottom: 5,
  },
  cardValue: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  averageContainer: {
    flexDirection: 'column',
  },
  averageLabel: {
    color: '#777',
    fontSize: 12,
  },
  averageValue: {
    color: '#999',
    fontSize: 12,
  },
  loadingDetailedCards: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyticsHeaderTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  refreshingIcon: {
    opacity: 0.5,
  },
  fullLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
