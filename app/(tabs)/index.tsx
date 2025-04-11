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

  // Debugging - add console logs
  console.log('Home Screen - isLoading:', isLoading);
  console.log('Home Screen - Current User:', user);
  console.log('Home Screen - Logout Function:', logout ? 'Available' : 'Not Available');

  // Mock analytics data - would come from the API in a real implementation
  const userAnalytics = {
    stats: 2500,
    subs: 1,
    views: 0,
    videos: 0
  };

  // Mock detailed analytics
  const detailedAnalytics = {
    subscribers: {
      value: 0,
      average: 0,
      trend: 'down'
    },
    views: {
      value: 7,
      average: 1.8,
      trend: 'down'
    },
    watchHours: {
      value: 0,
      average: 0,
      trend: 'down'
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

  // User is available, log detailed info
  console.log('Home Screen - User found:', {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
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
              <Text style={styles.lastUpdate}>3 days ago</Text>
          </View>
        </View>

          <TouchableOpacity style={styles.crownIcon}>
            <Ionicons name="star" size={28} color="#FFA000" />
          </TouchableOpacity>
        </View>
        
        {/* Analytics Boxes */}
        <View style={styles.analyticsRow}>
          <View style={styles.analyticsBox}>
            <View style={styles.analyticsHeader}>
              <Text style={styles.analyticsTitle}>Stats</Text>
              <Ionicons name="chevron-forward" size={18} color="#777" />
            </View>
            <Text style={styles.analyticsValue}>{formatNumber(userAnalytics.stats)}</Text>
            <Text style={styles.analyticsTrend}>~</Text>
          </View>
          
          <View style={styles.analyticsBox}>
            <View style={styles.analyticsHeader}>
              <Text style={styles.analyticsTitle}>Subs</Text>
              <Ionicons name="chevron-forward" size={18} color="#777" />
            </View>
            <Text style={styles.analyticsValue}>{formatNumber(userAnalytics.subs)}</Text>
            <Text style={styles.analyticsTrend}>~</Text>
          </View>
        </View>
        
        <View style={styles.analyticsRow}>
          <View style={styles.analyticsBox}>
            <View style={styles.analyticsHeader}>
              <Text style={styles.analyticsTitle}>Views</Text>
              <Ionicons name="chevron-forward" size={18} color="#777" />
            </View>
            <Text style={styles.analyticsValue}>{formatNumber(userAnalytics.views)}</Text>
            <Text style={styles.analyticsTrend}>~</Text>
          </View>
          
          <View style={styles.analyticsBox}>
            <View style={styles.analyticsHeader}>
              <Text style={styles.analyticsTitle}>Videos</Text>
              <Ionicons name="chevron-forward" size={18} color="#777" />
            </View>
            <Text style={styles.analyticsValue}>{formatNumber(userAnalytics.videos)}</Text>
            <Text style={styles.analyticsTrend}>~</Text>
          </View>
        </View>
        
        {/* New Detailed Analytics Section */}
        <View style={styles.detailedAnalyticsContainer}>
          {/* Header with timeframe buttons */}
          <View style={styles.analyticsHeader}>
            <Text style={styles.analyticsHeaderTitle}>Analytics</Text>
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
            <View style={styles.detailedCardsRow}>
              {/* Subscribers Card */}
              <View style={styles.detailedCard}>
                <Text style={styles.cardTitle}>Subscribers</Text>
                <Text style={styles.cardValue}>{detailedAnalytics.subscribers.value}</Text>
                <View style={styles.averageContainer}>
                  <Text style={styles.averageLabel}>Average</Text>
                  <Text style={styles.averageValue}>{detailedAnalytics.subscribers.average} / day</Text>
                </View>
              </View>
              
              {/* Views Card */}
              <View style={styles.detailedCard}>
                <Text style={styles.cardTitle}>Views</Text>
                <Text style={styles.cardValue}>{detailedAnalytics.views.value}</Text>
                <View style={styles.averageContainer}>
                  <Text style={styles.averageLabel}>Average</Text>
                  <Text style={styles.averageValue}>{detailedAnalytics.views.average} / day</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.detailedCardsRow}>
              {/* Watch Hours Card */}
              <View style={styles.detailedCard}>
                <Text style={styles.cardTitle}>Watch hours</Text>
                <Text style={styles.cardValue}>{detailedAnalytics.watchHours.value}</Text>
                <View style={styles.averageContainer}>
                  <Text style={styles.averageLabel}>Average</Text>
                  <Text style={styles.averageValue}>{detailedAnalytics.watchHours.average} / day</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
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
});
