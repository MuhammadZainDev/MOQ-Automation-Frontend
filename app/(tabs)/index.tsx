import React, { useEffect, useState, useRef } from 'react';
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
  StatusBar,
  TextInput,
  Dimensions,
  RefreshControl
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons, AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { adminService } from '../../src/services/adminApi';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';

// Get screen width for responsive chart
const screenWidth = Dimensions.get('window').width;

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
  entries?: Array<{
    stats: number;
    created_at?: string;
    [key: string]: any;
  }>;
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
  const [showOptions, setShowOptions] = useState(false);
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
  
  // Mock data for monthly average bar chart
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  // Calculate monthly stats from analytics entries
  const getMonthlyStats = () => {
    // Don't filter by current year - just use the latest data for each month
    const monthlyStats = Array(12).fill(0); // Initialize with zeros for all 12 months
    const hasRealData = Array(12).fill(false); // Track which months have actual data
    
    // Check if we have entries with timestamps in the analytics data
    if (analyticsData && analyticsData.entries && Array.isArray(analyticsData.entries)) {
      console.log("Processing entries:", JSON.stringify(analyticsData.entries));
      
      // Process each entry and add to the corresponding month
      analyticsData.entries.forEach(entry => {
        console.log("Processing raw entry:", JSON.stringify(entry));
        if (entry.created_at) {
          // Get the month directly from the date string - most reliable method
          // Format is "2025-03-12 20:26:19.65829+05"
          try {
            const dateStr = entry.created_at.toString();
            console.log("Raw date string:", dateStr);
            
            // Extract month directly from the string using regex
            const monthMatch = dateStr.match(/^\d{4}-(\d{2})-/);
            if (monthMatch && monthMatch[1]) {
              // Convert to zero-based month (JS months are 0-11)
              const month = parseInt(monthMatch[1], 10) - 1;
              
              if (month >= 0 && month < 12) {
                console.log(`Extracted month ${month} (${monthMatch[1]}) from date string, stats: ${entry.stats}`);
                
                monthlyStats[month] += Number(entry.stats || 0);
                hasRealData[month] = true;
              } else {
                console.error("Invalid month extracted:", month, "from", dateStr);
              }
            } else {
              console.error("Failed to extract month from date string:", dateStr);
              
              // Fallback to try parsing the whole date
              try {
                const entryDate = new Date(dateStr);
                if (!isNaN(entryDate.getTime())) {
                  const month = entryDate.getMonth();
                  console.log(`Fallback: parsed date ${entryDate.toISOString()}, month: ${month}`);
                  
                  monthlyStats[month] += Number(entry.stats || 0);
                  hasRealData[month] = true;
                }
              } catch (parseError) {
                console.error("Error in fallback date parsing:", parseError);
              }
            }
          } catch (error) {
            console.error("Error processing entry date:", error);
          }
        }
      });
      
      console.log("Monthly stats after processing:", JSON.stringify(monthlyStats));
      console.log("Months with real data:", JSON.stringify(hasRealData));
    } else {
      // If no entries with timestamps, just set the current month to have the total stats
      // and leave other months at zero or minimal values
      const currentMonth = new Date().getMonth();
      
      // Set current month to have the actual stats value
      monthlyStats[currentMonth] = analyticsData.stats || 0;
      hasRealData[currentMonth] = true;
      
      // Set other months to have minimal value just for visualization (1-5% of the main value)
      const minBarValue = Math.max(1, Math.floor((analyticsData.stats || 100) * 0.02));
      for (let i = 0; i < 12; i++) {
        if (i !== currentMonth) {
          // Set display height value, but they don't have real data
          monthlyStats[i] = minBarValue;
          hasRealData[i] = false;
        }
      }
    }
    
    return { monthlyStats, hasRealData };
  };

  const getMonthlyBarData = () => {
    const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const { monthlyStats, hasRealData } = getMonthlyStats();
    const currentMonth = new Date().getMonth();
    
    // Find the max value for proper color contrast
    const maxValue = Math.max(...monthlyStats);
    const threshold = maxValue * 0.1; // 10% of max is considered "real data"
    
    return months.map((month, index) => {
      // Determine if this month has significant data or just a placeholder value
      const hasSignificantData = monthlyStats[index] > threshold && hasRealData[index];
      
      return {
        value: monthlyStats[index], // Use this for the display height
        label: month,
        frontColor: 
          index === selectedMonth ? '#FF4D4D' : // Selected month is bright red
          hasRealData[index] ? 'rgba(255, 77, 77, 0.8)' : // Month with real data is semi-transparent red
          'rgba(255, 77, 77, 0.2)', // Month with minimal/no data is very transparent
        onPress: () => handleBarPress(index, monthlyStats[index], hasRealData[index])
      };
    });
  };

  // Get the monthly stats data
  const { monthlyStats, hasRealData } = getMonthlyStats();
  // Find maximum monthly value for chart scaling
  const maxMonthlyValue = Math.max(...monthlyStats, 1); // Ensure at least 1 to avoid division by zero
  // Get bar data based on current analytics data
  const barData = getMonthlyBarData();
  // Track the selected month's value and if it has real data
  const [selectedMonthValue, setSelectedMonthValue] = useState(monthlyStats[selectedMonth]);
  const [selectedMonthHasData, setSelectedMonthHasData] = useState(hasRealData[selectedMonth]);

  const handleBarPress = (monthIndex: number, monthValue: number, hasData: boolean) => {
    setSelectedMonth(monthIndex);
    setSelectedMonthValue(monthValue);
    setSelectedMonthHasData(hasData);
    // Update subscriber info based on selected month
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    console.log(`Selected month: ${months[monthIndex]}, Stats: ${hasData ? monthValue : 0}, Has data: ${hasData}`);
  };

  // Function to check if a month has significant data
  const hasSignificantData = (monthValue: number, hasData: boolean) => {
    return hasData && monthValue > 0;
  };

  // Mock data for yearly views line chart
  const lineData = [
    {value: 0},
    {value: 20},
    {value: 18},
    {value: 40},
    {value: 36},
    {value: 60},
    {value: 54},
    {value: 85},
    {value: 78},
    {value: 105},
  ];
  
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
    
    console.log('Updated today\'s analytics with real data:', totalData);
  };
  
  // Update selectedMonthValue when analytics data changes
  useEffect(() => {
    const { monthlyStats, hasRealData } = getMonthlyStats();
    setSelectedMonthValue(monthlyStats[selectedMonth]);
    setSelectedMonthHasData(hasRealData[selectedMonth]);
  }, [analyticsData, selectedMonth]);

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

  const handleLogout = async () => {
    console.log('Logout button pressed');
    try {
      console.log('Calling logout function');
      await logout();
      // Don't navigate here - let the AuthContext handle it
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

  // Add state for options menu
  const [showChartOptions, setShowChartOptions] = useState(false);

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
            <Text style={styles.sectionTitle}>Today's Updates</Text>
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
              </View>
            </View>
          </View>
          
          {/* New Detailed Analytics Section - Shows Total Analytics */}
          <View style={styles.detailedAnalyticsContainer}>
            {/* Header with standard dropdown */}
            <View style={styles.analyticsHeader}>
              <View style={styles.analyticsHeaderTitleContainer}>
                <Text style={styles.analyticsHeaderTitle}>Total Analytics</Text>
                
                {/* Standard dropdown select */}
                <View style={styles.selectContainer}>
                  <TouchableOpacity 
                    style={styles.standardDropdown}
                    onPress={() => setShowOptions(!showOptions)}
                  >
                    <Text style={styles.dropdownValue}>
                      {selectedTimeframe === '280' ? '28 Days' : 
                       selectedTimeframe === '90D' ? '90 Days' : 
                       selectedTimeframe === 'Apr' ? 'April' : 'March'}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#999" />
                  </TouchableOpacity>
                  
                  {showOptions && (
                    <View style={styles.optionsContainer}>
                      <TouchableOpacity 
                        style={[styles.option, selectedTimeframe === '280' && styles.selectedOption]}
                        onPress={() => {
                          setSelectedTimeframe('280');
                          setShowOptions(false);
                        }}
                      >
                        <Text style={[styles.optionText, selectedTimeframe === '280' && styles.selectedOptionText]}>28 Days</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.option, selectedTimeframe === '90D' && styles.selectedOption]}
                        onPress={() => {
                          setSelectedTimeframe('90D');
                          setShowOptions(false);
                        }}
                      >
                        <Text style={[styles.optionText, selectedTimeframe === '90D' && styles.selectedOptionText]}>90 Days</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.option, selectedTimeframe === 'Apr' && styles.selectedOption]}
                        onPress={() => {
                          setSelectedTimeframe('Apr');
                          setShowOptions(false);
                        }}
                      >
                        <Text style={[styles.optionText, selectedTimeframe === 'Apr' && styles.selectedOptionText]}>April</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.option, selectedTimeframe === 'Mar' && styles.selectedOption]}
                        onPress={() => {
                          setSelectedTimeframe('Mar');
                          setShowOptions(false);
                        }}
                      >
                        <Text style={[styles.optionText, selectedTimeframe === 'Mar' && styles.selectedOptionText]}>March</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
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
          
          {/* Monthly Average Chart */}
          <View style={[styles.chartContainer, {backgroundColor: '#212121'}]}>
            <View style={styles.redHeader}>
              <View style={styles.redHeaderTextContainer}>
                <Text style={styles.redHeaderAmount}>
                  {formatNumber(selectedMonthHasData ? selectedMonthValue : 0)}
                </Text>
                <Text style={styles.redHeaderText}>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]} Stats
                </Text>
              </View>
              <TouchableOpacity style={styles.redHeaderMoreBtn} onPress={() => setShowChartOptions(!showChartOptions)}>
                <Feather name="more-horizontal" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {/* Subscribers Info Box */}
            <View style={styles.subscriberInfoBox}>
              <View style={styles.subscriberInfoHeader}>
                <Text style={styles.subscriberCount}>
                  {formatNumber(selectedMonthHasData ? selectedMonthValue : 0)}
                </Text>
                <Text style={styles.subscriberDate}>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]} Stats
                </Text>
                <View style={styles.infoBadge}>
                  <Text style={styles.infoBadgeText}>i</Text>
                </View>
              </View>
              <Text style={styles.subscriberMessage}>
                {hasSignificantData(selectedMonthValue, selectedMonthHasData) 
                  ? `Stats for ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]} show ${formatNumber(selectedMonthValue)} engagements.`
                  : `No stats available for ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]}. Stats value: 0`
                }
              </Text>
            </View>
            
            {/* Divider */}
            <View style={styles.divider} />
            
            {/* Chart Options Popup */}
            {showChartOptions && (
              <View style={styles.chartOptionsContainer}>
                <TouchableOpacity style={styles.chartOption}>
                  <Feather name="download" size={18} color="#fff" />
                  <Text style={styles.chartOptionText}>Export Data</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chartOption}>
                  <Feather name="refresh-cw" size={18} color="#fff" />
                  <Text style={styles.chartOptionText}>Refresh</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chartOption}>
                  <Feather name="settings" size={18} color="#fff" />
                  <Text style={styles.chartOptionText}>Settings</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.chartWrapper}>
              <BarChart
                data={barData}
                width={screenWidth - 80}
                height={220}
                barWidth={30}
                spacing={18}
                barBorderRadius={4}
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                hideYAxisText
                noOfSections={3}
                maxValue={maxMonthlyValue * 1.2}
                labelWidth={30}
                xAxisLabelTextStyle={{color: '#ccc', textAlign: 'center'}}
                hideOrigin
              />
            </View>
          </View>
          
          {/* Yearly Views Chart removed */}
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
  selectContainer: {
    position: 'relative',
    marginLeft: 'auto',
    zIndex: 100,
  },
  standardDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 120,
  },
  dropdownValue: {
    color: '#FFF',
    fontSize: 14,
  },
  optionsContainer: {
    position: 'absolute',
    top: '100%',
    right: 0,
    width: 120,
    backgroundColor: '#333',
    borderWidth: 1, 
    borderColor: '#555',
    borderRadius: 5,
    marginTop: 5,
    overflow: 'hidden',
    zIndex: 1000,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  selectedOption: {
    backgroundColor: '#444',
  },
  optionText: {
    color: '#CCC',
    fontSize: 14,
  },
  selectedOptionText: {
    color: '#FFF',
    fontWeight: 'bold',
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
    width: '100%',
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
  chartContainer: {
    marginTop: 20,
    marginBottom: 30,
    backgroundColor: '#212121',
    borderRadius: 10,
    marginHorizontal: 16,
  },
  chartTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  redHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#DF0000',
    padding: 15,
    borderTopEndRadius: 8,
    borderTopStartRadius: 8,
    marginBottom: 15,
  },
  redHeaderTextContainer: {
    flexDirection: 'column',
  },
  redHeaderAmount: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  redHeaderText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
  },
  redHeaderMoreBtn: {
    alignSelf: 'center',
  },
  dailyAverageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
    backgroundColor: '#DF0000',
    paddingBottom: 15,
    paddingHorizontal: 0,
    paddingTop: 0,
    borderRadius: 8,
    marginHorizontal: 0,
  },
  subscriberInfoBox: {
    borderRadius: 8,
    padding: 20,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  subscriberInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  subscriberCount: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  subscriberDate: {
    color: '#CCC',
    fontSize: 16,
  },
  superscript: {
    fontSize: 10,
    lineHeight: 14,
    color: '#CCC',
  },
  infoBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2F80ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  infoBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subscriberMessage: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 10,
    marginBottom: 15,
  },
  chartOptionsContainer: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 5,
    zIndex: 100,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  chartOptionText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 14,
  },
});
