import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
  RefreshControl,
  Platform
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons, AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { adminService } from '../../src/services/adminApi';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
// @ts-ignore
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Get screen width for responsive chart
const screenWidth = Dimensions.get('window').width;

// Define analytics type
type UserAnalyticsData = {
  revenue: number;
  views: number;
  videos: number;
  premium_country_views: number;
  posts: number;
  adsense_revenue?: number;
  music_revenue?: number;
  entries?: Array<{
    revenue: number;
    revenue_type?: string;
    created_at?: string;
    [key: string]: any;
  }>;
};

// Daily/Recent analytics data type
type DailyAnalyticsData = {
  revenue: number;
  views: number;
  videos: number;
  premium_country_views: number;
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
  
  // For smaller numbers, show 2 decimal places for revenue display
  if (Number.isInteger(num)) {
    return num.toString();
  } else {
    return num.toFixed(2);
  }
};

// Update the generatePDF function
const generatePDF = async (data: any, type = 'revenue') => {
  try {
    // Define months array
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentYear = new Date().getFullYear();
    
    // Create some sample data if no entries exist
    let monthlyData: number[] = [];
    let title = type === 'revenue' ? 'Revenue' : 'Views';
    
    if (type === 'revenue' && data.monthlyStats) {
      monthlyData = data.monthlyStats;
    } else if (type === 'views' && data.monthlyViews) {
      monthlyData = data.monthlyViews;
    }
    
    // Generate HTML content for the PDF
    let htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            h1 { color: ${type === 'revenue' ? '#DF0000' : '#2196F3'}; text-align: center; margin-bottom: 30px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { width: 100px; height: 100px; margin: 0 auto; display: block; border-radius: 50%; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: ${type === 'revenue' ? '#DF0000' : '#2196F3'}; color: white; padding: 10px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            .total { font-weight: bold; }
            .date { text-align: right; color: #666; margin-top: 40px; }
            .chart-img { max-width: 100%; height: auto; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title} Report - ${currentYear}</h1>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <table>
            <tr>
              <th>Month</th>
              <th>${title}</th>
            </tr>
    `;
    
    // Add rows for each month
    let totalValue = 0;
    months.forEach((month, index) => {
      const value = monthlyData[index] || 0;
      totalValue += value;
      
      // Add cell color based on value (higher values get darker background)
      const maxValue = Math.max(...monthlyData);
      const opacity = maxValue > 0 ? (value / maxValue) * 0.3 : 0;
      const bgColor = type === 'revenue' 
        ? `rgba(223, 0, 0, ${opacity})` 
        : `rgba(33, 150, 243, ${opacity})`;
      
      htmlContent += `
        <tr>
          <td>${month}</td>
          <td style="background-color: ${bgColor}">
            ${type === 'revenue' ? '$' : ''}${value.toLocaleString()}
          </td>
        </tr>
      `;
    });
    
    // Add total row
    htmlContent += `
        <tr class="total">
          <td>Total</td>
          <td>${type === 'revenue' ? '$' : ''}${totalValue.toLocaleString()}</td>
        </tr>
      </table>
      
      <div class="date">
        <p>This is an auto-generated report. For questions, please contact support.</p>
      </div>
    </body>
    </html>
    `;
    
    // Mobile implementation using react-native-html-to-pdf
    const options = {
      html: htmlContent,
      fileName: `${title}_Report_${currentYear}`,
      directory: 'Documents',
    };
    
    // Check if running on Expo
    if (Platform.OS === 'web') {
      // Web approach - create a data URL and open in new tab
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      return { success: true };
    } else {
      try {
        // For Expo, use FileSystem to write the HTML file
        const htmlFile = FileSystem.documentDirectory + `${title}_Report_${currentYear}.html`;
        await FileSystem.writeAsStringAsync(htmlFile, htmlContent);
        
        // Share the file
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(htmlFile);
          return { success: true };
        } else {
          console.error('Sharing not available');
          return { success: false, error: 'Sharing not available on this device' };
        }
      } catch (error) {
        console.error('Error generating file:', error);
        return { success: false, error: String(error) };
      }
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: String(error) };
  }
};

export default function HomeScreen() {
  const { user, isLoading, logout } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState('280');
  const [showOptions, setShowOptions] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<UserAnalyticsData>({
    revenue: 0,
    views: 0,
    videos: 0,
    premium_country_views: 0,
    posts: 0
  });
  // Store daily analytics separately
  const [dailyAnalyticsData, setDailyAnalyticsData] = useState<DailyAnalyticsData>({
    revenue: 0,
    views: 0,
    videos: 0,
    premium_country_views: 0
  });
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  
  // Add state for profile image cache busting
  const [profileImageKey, setProfileImageKey] = useState(Date.now());
  
  // Move these states before any conditional returns
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedViewsMonth, setSelectedViewsMonth] = useState<number>(new Date().getMonth());

  // Add state for options menu
  const [showRevenueChartOptions, setShowRevenueChartOptions] = useState(false);
  const [showViewsChartOptions, setShowViewsChartOptions] = useState(false);
  
  // Move these states before any conditional returns
  const [selectedMonthValue, setSelectedMonthValue] = useState(0);
  const [selectedMonthHasData, setSelectedMonthHasData] = useState(false);

  // Add state variable for tracking selected month views value
  const [selectedMonthViewsValue, setSelectedMonthViewsValue] = useState(0);
  const [selectedMonthViewsHasData, setSelectedMonthViewsHasData] = useState(false);
  
  // Calculate monthly revenue from analytics entries
  const getMonthlyStats = useCallback(() => {
    // Don't filter by current year - just use the latest data for each month
    const monthlyStats = Array(12).fill(0); // Initialize with zeros for all 12 months
    const hasRealData = Array(12).fill(false); // Track which months have actual data
    
    // Check if we have entries with timestamps in the analytics data
    if (analyticsData && analyticsData.entries && Array.isArray(analyticsData.entries)) {
      console.log(`Processing ${analyticsData.entries.length} entries for monthly revenue`);
      
      // Process each entry and add to the corresponding month
      analyticsData.entries.forEach(entry => {
        if (entry.created_at) {
          // Get the month directly from the date string - most reliable method
          // Format is "2025-03-12 20:26:19.65829+05"
          try {
            const dateStr = entry.created_at.toString();
            
            // Extract month directly from the string using regex
            const monthMatch = dateStr.match(/^\d{4}-(\d{2})-/);
            if (monthMatch && monthMatch[1]) {
              // Convert to zero-based month (JS months are 0-11)
              const month = parseInt(monthMatch[1], 10) - 1;
              
              if (month >= 0 && month < 12) {
                const revenueValue = Number(entry.revenue || 0);
                monthlyStats[month] += revenueValue;
                hasRealData[month] = true;
                console.log(`Added ${revenueValue} to month ${month+1} (${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month]}), new total: ${monthlyStats[month]}`);
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
                  const revenueValue = Number(entry.revenue || 0);
                  monthlyStats[month] += revenueValue;
                  hasRealData[month] = true;
                  console.log(`Fallback: Added ${revenueValue} to month ${month+1}, new total: ${monthlyStats[month]}`);
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
      
      console.log("Monthly revenue after processing:", JSON.stringify(monthlyStats));
      console.log("Months with real data:", JSON.stringify(hasRealData));
    } else {
      // If no entries with timestamps, just set the current month to have the total revenue
      // and leave other months at zero or minimal values
      const currentMonth = new Date().getMonth();
      
      // Set current month to have the actual revenue value
      monthlyStats[currentMonth] = analyticsData.revenue || 0;
      hasRealData[currentMonth] = true;
      console.log(`No entries with timestamps, setting current month ${currentMonth+1} to total revenue: ${monthlyStats[currentMonth]}`);
      
      // Set other months to have minimal value just for visualization (1-5% of the main value)
      const minBarValue = Math.max(1, Math.floor((analyticsData.revenue || 100) * 0.02));
      for (let i = 0; i < 12; i++) {
        if (i !== currentMonth) {
          // Set display height value, but they don't have real data
          monthlyStats[i] = minBarValue;
          hasRealData[i] = false;
        }
      }
    }
    
    return { monthlyStats, hasRealData };
  }, [analyticsData]);
  
  // Calculate monthly views from analytics entries
  const getMonthlyViewsData = useCallback(() => {
    // Don't filter by current year - just use the latest data for each month
    const monthlyViews = Array(12).fill(0); // Initialize with zeros for all 12 months
    const hasRealData = Array(12).fill(false); // Track which months have actual data
    
    // Check if we have entries with timestamps in the analytics data
    if (analyticsData && analyticsData.entries && Array.isArray(analyticsData.entries)) {
      console.log(`Processing ${analyticsData.entries.length} entries for monthly views`);
      
      // Process each entry and add to the corresponding month
      analyticsData.entries.forEach(entry => {
        if (entry.created_at) {
          // Get the month directly from the date string - most reliable method
          // Format is "2025-03-12 20:26:19.65829+05"
          try {
            const dateStr = entry.created_at.toString();
            
            // Extract month directly from the string using regex
            const monthMatch = dateStr.match(/^\d{4}-(\d{2})-/);
            if (monthMatch && monthMatch[1]) {
              // Convert to zero-based month (JS months are 0-11)
              const month = parseInt(monthMatch[1], 10) - 1;
              
              if (month >= 0 && month < 12) {
                const viewsValue = Number(entry.views || 0);
                monthlyViews[month] += viewsValue;
                hasRealData[month] = true;
                console.log(`Added ${viewsValue} views to month ${month+1} (${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month]}), new total: ${monthlyViews[month]}`);
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
                  const viewsValue = Number(entry.views || 0);
                  monthlyViews[month] += viewsValue;
                  hasRealData[month] = true;
                  console.log(`Fallback: Added ${viewsValue} views to month ${month+1}, new total: ${monthlyViews[month]}`);
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
      
      console.log("Monthly views after processing:", JSON.stringify(monthlyViews));
      console.log("Months with real data:", JSON.stringify(hasRealData));
    } else {
      // If no entries with timestamps, just set the current month to have the total views
      // and leave other months at zero or minimal values
      const currentMonth = new Date().getMonth();
      
      // Set current month to have the actual views value
      monthlyViews[currentMonth] = analyticsData.views || 0;
      hasRealData[currentMonth] = true;
      console.log(`No entries with timestamps, setting current month ${currentMonth+1} to total views: ${monthlyViews[currentMonth]}`);
      
      // Set other months to have minimal value just for visualization (1-5% of the main value)
      const minBarValue = Math.max(1, Math.floor((analyticsData.views || 100) * 0.02));
      for (let i = 0; i < 12; i++) {
        if (i !== currentMonth) {
          // Set display height value, but they don't have real data
          monthlyViews[i] = minBarValue;
          hasRealData[i] = false;
        }
      }
    }
    
    return { monthlyViews, hasRealData };
  }, [analyticsData]);
  
  // Get the monthly stats data - moved inside useEffect to avoid hooks ordering issues
  useEffect(() => {
    const { monthlyStats, hasRealData } = getMonthlyStats();
    setSelectedMonthValue(monthlyStats[selectedMonth]);
    setSelectedMonthHasData(hasRealData[selectedMonth]);
    console.log(`Selected month ${selectedMonth+1} value updated to: ${monthlyStats[selectedMonth]}`);
  }, [analyticsData, selectedMonth, getMonthlyStats]);
  
  // Get the monthly views data in a similar useEffect
  useEffect(() => {
    const { monthlyViews, hasRealData } = getMonthlyViewsData();
    setSelectedMonthViewsValue(monthlyViews[selectedViewsMonth]);
    setSelectedMonthViewsHasData(hasRealData[selectedViewsMonth]);
    console.log(`Selected month ${selectedViewsMonth+1} views updated to: ${monthlyViews[selectedViewsMonth]}`);
  }, [analyticsData, selectedViewsMonth, getMonthlyViewsData]);
  
  // Handler for bar press is now a constant function (not dependent on conditions)
  const handleBarPress = useCallback((monthIndex: number, monthValue: number, hasData: boolean) => {
    setSelectedMonth(monthIndex);
    setSelectedMonthValue(monthValue);
    setSelectedMonthHasData(hasData);
    // Update subscriber info based on selected month
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    console.log(`Selected month bar: ${months[monthIndex]}, Stats total: ${hasData ? monthValue : 0}, Has data: ${hasData}`);
  }, []);
  
  // Update the handleViewsBarPress function to be similar to handleBarPress but for views
  const handleViewsBarPress = useCallback((monthIndex: number, monthValue: number, hasData: boolean) => {
    setSelectedViewsMonth(monthIndex);
    setSelectedMonthViewsValue(monthValue);
    setSelectedMonthViewsHasData(hasData);
    // Update subscriber info based on selected month
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    console.log(`Selected month bar: ${months[monthIndex]}, Views total: ${hasData ? monthValue : 0}, Has data: ${hasData}`);
  }, []);
  
  // Function to check if a month has significant data
  const hasSignificantData = useCallback((monthValue: number, hasData: boolean) => {
    return hasData && monthValue > 0;
  }, []);

  // Get bar data based on current analytics data
  const getMonthlyBarData = useCallback(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const { monthlyStats, hasRealData } = getMonthlyStats();
    const currentMonth = new Date().getMonth();
    
    // Find the max value for proper color contrast
    const maxValue = Math.max(...monthlyStats);
    const threshold = maxValue * 0.1; // 10% of max is considered "real data"
    
    return months.map((month, index) => {
      // Determine if this month has significant data or just a placeholder value
      const hasSignificantData = monthlyStats[index] > threshold && hasRealData[index];
      
      return {
        value: monthlyStats[index], // Use actual value for dynamic height
        label: month,
        frontColor: 
          index === selectedMonth 
            ? '#DF0000' // Highlighted month
            : hasSignificantData 
              ? 'rgba(223, 0, 0, 0.7)' // Month with significant data  
              : 'rgba(223, 0, 0, 0.3)', // Month with minimal/no data
        onPress: () => handleBarPress(index, monthlyStats[index], hasRealData[index])
      };
    });
  }, [getMonthlyStats, selectedMonth, handleBarPress]);
  
  // Get bar data for views chart
  const getMonthlyViewsBarData = useCallback(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const { monthlyViews, hasRealData } = getMonthlyViewsData();
    const currentMonth = new Date().getMonth();
    
    // Find the max value for proper color contrast
    const maxValue = Math.max(...monthlyViews);
    const threshold = maxValue * 0.1; // 10% of max is considered "real data"
    
    return months.map((month, index) => {
      // Determine if this month has significant data or just a placeholder value
      const hasSignificantData = monthlyViews[index] > threshold && hasRealData[index];
      
      return {
        value: monthlyViews[index], // Use this for the display height
        label: month,
        frontColor: 
          index === selectedViewsMonth 
            ? '#2196F3' // Highlighted month (blue for views)
            : hasSignificantData 
              ? 'rgba(33, 150, 243, 0.7)' // Month with significant data  
              : 'rgba(33, 150, 243, 0.3)', // Month with minimal/no data
        onPress: () => handleViewsBarPress(index, monthlyViews[index], hasRealData[index])
      };
    });
  }, [getMonthlyViewsData, selectedViewsMonth, handleViewsBarPress]);

  // Calculate maxMonthlyValue based on monthlyStats
  const maxMonthlyValue = useMemo(() => {
    const { monthlyStats } = getMonthlyStats();
    return Math.max(...monthlyStats, 1); // Use actual max value
  }, [getMonthlyStats]);
  
  // Calculate maxMonthlyViewsValue based on monthlyViews
  const maxMonthlyViewsValue = useMemo(() => {
    const { monthlyViews } = getMonthlyViewsData();
    return Math.max(...monthlyViews, 1); // Ensure at least 1 to avoid division by zero
  }, [getMonthlyViewsData]);

  // Update today's analytics with actual data - converted to useCallback
  const updateTodaysAnalytics = useCallback((totalData: UserAnalyticsData) => {
    // Initialize today's values to 0
    let todayRevenue = 0;
    let todayViews = 0;
    let todayVideos = 0;
    let todayPremiumViews = 0;
    
    // Check if entries exist
    if (totalData.entries && Array.isArray(totalData.entries) && totalData.entries.length > 0) {
      // Get today's date - we'll compare only year, month, and day
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();
      const todayDay = today.getDate();
      
      console.log(`Looking for entries matching today's date: ${today.toLocaleDateString()}`);
      
      // Find entries that match today's date by comparing year, month, and day
      const todayEntries = totalData.entries.filter(entry => {
        if (entry.created_at) {
          try {
            // Parse the created_at date string
            const entryDate = new Date(entry.created_at);
            
            // Compare year, month, and day
            return (
              entryDate.getFullYear() === todayYear &&
              entryDate.getMonth() === todayMonth &&
              entryDate.getDate() === todayDay
            );
          } catch (e) {
            console.error("Error parsing entry date:", e);
            return false;
          }
        }
        return false;
      });
      
      // If we found today's entries, sum them up
      if (todayEntries.length > 0) {
        console.log('Found today\'s entries:', todayEntries.length);
        todayEntries.forEach(entry => {
          todayRevenue += Number(entry.revenue || 0);
          todayViews += Number(entry.views || 0);
          todayVideos += Number(entry.videos || 0);
          todayPremiumViews += Number(entry.premium_country_views || 0);
        });
      } else {
        // No entries for today - show zeros instead of using old data
        console.log('No entries found for today - showing zeros');
        // All values remain at 0 (already initialized above)
      }
    } else {
      // No entries at all - also show zeros
      console.log('No entries found at all - showing zeros');
      // All values remain at 0 (already initialized above)
    }
    
    // Set today's analytics with the calculated values (zeros if no today's data)
    setDailyAnalyticsData({
      revenue: todayRevenue,
      views: todayViews,
      videos: todayVideos,
      premium_country_views: todayPremiumViews
    });
    
    console.log('Updated today\'s analytics:', {
      revenue: todayRevenue,
      views: todayViews,
      videos: todayVideos,
      premium_country_views: todayPremiumViews
    });
  }, []);
  
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
  }, [user, updateTodaysAnalytics]);
  
  // Refresh all analytics data
  const refreshData = useCallback(() => {
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
  }, [updateTodaysAnalytics]);

  // Handle logout safely
  const handleLogout = useCallback(async () => {
    try {
      console.log('Calling logout function');
      await logout();
      // Don't navigate here - let the AuthContext handle it
    } catch (error) {
      console.error('Error during logout:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred during logout',
        position: 'bottom'
      });
    }
  }, [logout]);
  
  // Calculate detailed analytics based on the fetched data
  const detailedAnalytics = {
    views: {
      value: analyticsData.views || 0,
      average: ((analyticsData.views || 0) / 28).toFixed(1),
      trend: 'neutral'
    }
  };

  // In the HomeScreen component, add these export functions
  const exportRevenueData = async () => {
    try {
      const { monthlyStats, hasRealData } = getMonthlyStats();
      const result = await generatePDF({ monthlyStats, hasRealData }, 'revenue');
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Export Successful',
          text2: 'Revenue data has been exported',
          position: 'bottom'
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Export Failed',
          text2: result.error || 'Could not export data',
          position: 'bottom'
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      Toast.show({
        type: 'error',
        text1: 'Export Failed',
        text2: 'An error occurred while exporting data',
        position: 'bottom'
      });
    }
  };

  const exportViewsData = async () => {
    try {
      const { monthlyViews, hasRealData } = getMonthlyViewsData();
      const result = await generatePDF({ monthlyViews, hasRealData }, 'views');
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Export Successful',
          text2: 'Views data has been exported',
          position: 'bottom'
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Export Failed',
          text2: result.error || 'Could not export data',
          position: 'bottom'
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      Toast.show({
        type: 'error',
        text1: 'Export Failed',
        text2: 'An error occurred while exporting data',
        position: 'bottom'
      });
    }
  };

  // Function to get the last update time display text
  const getLastUpdateText = useCallback(() => {
    // If no analytics data or no entries, return 'Never'
    if (!analyticsData || !analyticsData.entries || analyticsData.entries.length === 0) {
      return 'Never';
    }
    
    // Find the most recent entry by sorting created_at timestamps
    const sortedEntries = [...analyticsData.entries].sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB.getTime() - dateA.getTime(); // Descending order (most recent first)
    });
    
    // Get the most recent entry
    const latestEntry = sortedEntries[0];
    if (!latestEntry || !latestEntry.created_at) {
      return 'Unknown';
    }
    
    // Parse the timestamp
    const updateDate = new Date(latestEntry.created_at);
    const now = new Date();
    
    // Check if it's today
    if (
      updateDate.getDate() === now.getDate() &&
      updateDate.getMonth() === now.getMonth() &&
      updateDate.getFullYear() === now.getFullYear()
    ) {
      // Format the time if it's today
      return `Today at ${updateDate.getHours().toString().padStart(2, '0')}:${updateDate.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (
      updateDate.getDate() === yesterday.getDate() &&
      updateDate.getMonth() === yesterday.getMonth() &&
      updateDate.getFullYear() === yesterday.getFullYear()
    ) {
      return 'Yesterday';
    }
    
    // Otherwise, return the date
    return `${updateDate.getDate()}/${updateDate.getMonth() + 1}/${updateDate.getFullYear()}`;
  }, [analyticsData]);

  // Remove early returns and use conditional rendering instead
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {isLoading ? (
      <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DF0000" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
      ) : !user ? (
      <View style={styles.loadingContainer}>
        <Text style={styles.message}>Not logged in</Text>
        </View>
      ) : (
      <ScrollView style={styles.container}>
          {/* Channel Header Section */}
          <View style={styles.channelHeader}>
            <View style={styles.channelInfo}>
              <View style={styles.logoContainer}>
                <Image 
                  key={`profile-image-${profileImageKey}`}
                  source={user?.profile_picture 
                    ? { uri: `${user.profile_picture}?cache=${profileImageKey}` } 
                    : require('../../assets/logo/logo.jpg')} 
                  style={styles.logo}
                  resizeMode="cover"
                />
              </View>
              
              <View style={styles.channelTextInfo}>
                <Text style={styles.channelName}>{user.name}</Text>
                <Text style={styles.lastUpdate}>
                  Last updated: {isLoadingAnalytics ? (
                    <ActivityIndicator size="small" color="#DF0000" />
                  ) : getLastUpdateText()}
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
                <Text style={styles.analyticsTitle}>Revenue</Text>
                <Ionicons name="today-outline" size={18} color="#777" />
              </View>
              <Text style={styles.analyticsValue}>
                {isLoadingAnalytics ? (
                  <ActivityIndicator size="small" color="#DF0000" />
                ) : (
                  `$${formatNumber(dailyAnalyticsData.revenue)}`
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
                <Text style={styles.analyticsTitle}>Premium Views</Text>
                <Ionicons name="today-outline" size={18} color="#777" />
              </View>
              <Text style={styles.analyticsValue}>
                {isLoadingAnalytics ? (
                  <ActivityIndicator size="small" color="#DF0000" />
                ) : (
                  formatNumber(dailyAnalyticsData.premium_country_views)
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
                <Text style={styles.analyticsHeaderTitle}>Total Revenue</Text>
                
                {/* Year indicator */}
                <Text style={styles.yearIndicator}>2025</Text>
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
                    {/* Revenue Card */}
                    <View style={styles.detailedCard}>
                      <Text style={styles.cardTitle}>Total Revenue</Text>
                      <Text style={styles.cardValue}>${formatNumber(analyticsData.revenue || 0)}</Text>
                      <View style={styles.averageContainer}>
                        <Text style={styles.averageLabel}>Average</Text>
                        <Text style={styles.averageValue}>${formatNumber(Math.round((analyticsData.revenue || 0) / 28))} / day</Text>
                      </View>
                    </View>
                    
                    {/* Videos Card */}
                    <View style={styles.detailedCard}>
                      <Text style={styles.cardTitle}>Videos</Text>
                      <Text style={styles.cardValue}>{formatNumber(analyticsData.videos || 0)}</Text>
                      <View style={styles.averageContainer}>
                        <Text style={styles.averageLabel}>Average</Text>
                        <Text style={styles.averageValue}>{formatNumber(Math.round((analyticsData.videos || 0) / 28))} / day</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.detailedCardsRow}>
                    {/* Views Card */}
                    <View style={styles.detailedCard}>
                      <Text style={styles.cardTitle}>Views</Text>
                      <Text style={styles.cardValue}>{formatNumber(analyticsData.views || 0)}</Text>
                      <View style={styles.averageContainer}>
                        <Text style={styles.averageLabel}>Average</Text>
                        <Text style={styles.averageValue}>{formatNumber(Math.round((analyticsData.views || 0) / 28))} / day</Text>
                      </View>
                    </View>
                    
                    {/* Premium Views Card */}
                    <View style={styles.detailedCard}>
                      <Text style={styles.cardTitle}>Premium Views</Text>
                      <Text style={styles.cardValue}>{formatNumber(analyticsData.premium_country_views || 0)}</Text>
                      <View style={styles.averageContainer}>
                        <Text style={styles.averageLabel}>Average</Text>
                        <Text style={styles.averageValue}>{formatNumber(Math.round((analyticsData.premium_country_views || 0) / 28))} / day</Text>
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
                  ${formatNumber(selectedMonthHasData ? selectedMonthValue : 0)}
                </Text>
                <Text style={styles.redHeaderText}>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]} Total Revenue
                </Text>
              </View>
              <TouchableOpacity style={styles.redHeaderMoreBtn} onPress={() => setShowRevenueChartOptions(!showRevenueChartOptions)}>
                <Feather name="more-horizontal" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {/* Screenshot-style notification */}
            <View style={styles.notificationContainer}>
              <View style={styles.notificationHeader}>
                <Text style={styles.dateText}>
                  Monthly Summary for {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]}
                </Text>
                </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationText}>
                  In {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]}, your <Text style={styles.blueText}>total revenue</Text> 
                  {(() => {
                    // Calculate previous month's index (with wraparound to December if current is January)
                    const prevMonthIndex = selectedMonth > 0 ? selectedMonth - 1 : 11;
                    
                    // Get current and previous month revenue
                    const currentMonthValue = selectedMonthHasData ? selectedMonthValue : 0;
                    
                    // Find previous month value from analytics entries
                    let prevMonthValue = 0;
                    if (analyticsData.entries && Array.isArray(analyticsData.entries)) {
                      // Try to find an entry for the previous month
                      const prevMonthEntries = analyticsData.entries.filter(entry => {
                        if (entry.created_at) {
                          try {
                            const dateStr = entry.created_at.toString();
                            const prevMonthStr = prevMonthIndex < 9 
                              ? `-0${prevMonthIndex + 1}-` 
                              : `-${prevMonthIndex + 1}-`;
                            return dateStr.includes(prevMonthStr);
                          } catch (e) {
                            return false;
                          }
                        }
                        return false;
                      });
                      
                      // If we found entries for previous month, sum them up
                      if (prevMonthEntries.length > 0) {
                        prevMonthValue = prevMonthEntries.reduce((sum, entry) => sum + Number(entry.revenue || 0), 0);
                      } else {
                        // No entries found for previous month, use 80-90% of current month as estimate
                        prevMonthValue = Math.round(currentMonthValue * 0.85);
                      }
                    }
                    
                    // Calculate difference
                    const difference = currentMonthValue - prevMonthValue;
                    const percentChange = prevMonthValue > 0 ? Math.round((difference / prevMonthValue) * 100) : 0;
                    
                    // Return appropriate message based on change
                    if (difference > 0) {
                      return (
                        <> increased by <Text style={styles.greenText}>${formatNumber(difference)}</Text> ({percentChange}%). Great progress!</>
                      );
                    } else if (difference < 0) {
                      return (
                        <> decreased by <Text style={styles.redText}>${formatNumber(Math.abs(difference))}</Text> ({Math.abs(percentChange)}%). Need to improve strategy.</> 
                      );
                    } else {
                      return (
                        <> remained the same as last month. Time to try new tactics!</>
                      );
                    }
                  })()}
                </Text>
              </View>
            </View>
            
            {/* Chart Options Popup - Revenue Chart */}
            {showRevenueChartOptions && (
              <View style={styles.chartOptionsContainer}>
                <TouchableOpacity style={styles.chartOption} onPress={() => {
                  exportRevenueData();
                  setShowRevenueChartOptions(false);
                }}>
                  <Feather name="download" size={18} color="#fff" />
                  <Text style={styles.chartOptionText}>Export Data</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.chartOption, {borderBottomWidth: 0}]} onPress={() => {
                  refreshData();
                  setShowRevenueChartOptions(false);
                  Toast.show({
                    type: 'success',
                    text1: 'Refreshed',
                    text2: 'Analytics data has been updated',
                    position: 'bottom'
                  });
                }}>
                  <Feather name="refresh-cw" size={18} color="#fff" />
                  <Text style={styles.chartOptionText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.chartWrapper}>
              <BarChart
                data={getMonthlyBarData()}
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
          
          {/* Monthly Views Chart */}
          <View style={[styles.chartContainer, {backgroundColor: '#212121', marginTop: 20}]}>
            <View style={[styles.redHeader, {backgroundColor: 'rgba(33, 150, 243, 0.2)'}]}>
              <View style={styles.redHeaderTextContainer}>
                <Text style={styles.redHeaderAmount}>
                  {formatNumber(selectedMonthViewsHasData ? selectedMonthViewsValue : 0)}
                </Text>
                <Text style={styles.redHeaderText}>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedViewsMonth]} Total Views
              </Text>
              </View>
              <TouchableOpacity style={styles.redHeaderMoreBtn} onPress={() => setShowViewsChartOptions(!showViewsChartOptions)}>
                <Feather name="more-horizontal" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {/* Screenshot-style notification */}
            <View style={styles.notificationContainer}>
              <View style={styles.notificationHeader}>
                <Text style={styles.dateText}>
                  Monthly Summary for {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedViewsMonth]}
                </Text>
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationText}>
                  In {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedViewsMonth]}, your <Text style={styles.blueText}>total views</Text> 
                  {(() => {
                    // Calculate previous month's index (with wraparound to December if current is January)
                    const prevMonthIndex = selectedViewsMonth > 0 ? selectedViewsMonth - 1 : 11;
                    
                    // Get current month views
                    const currentMonthViews = selectedMonthViewsHasData ? selectedMonthViewsValue : 0;
                    
                    // Find previous month value from analytics entries
                    let prevMonthViews = 0;
                    if (analyticsData.entries && Array.isArray(analyticsData.entries)) {
                      // Try to find an entry for the previous month
                      const prevMonthEntries = analyticsData.entries.filter(entry => {
                        if (entry.created_at) {
                          try {
                            const dateStr = entry.created_at.toString();
                            const prevMonthStr = prevMonthIndex < 9 
                              ? `-0${prevMonthIndex + 1}-` 
                              : `-${prevMonthIndex + 1}-`;
                            return dateStr.includes(prevMonthStr);
                          } catch (e) {
                            return false;
                          }
                        }
                        return false;
                      });
                      
                      // If we found entries for previous month, sum them up
                      if (prevMonthEntries.length > 0) {
                        prevMonthViews = prevMonthEntries.reduce((sum, entry) => sum + Number(entry.views || 0), 0);
                      } else {
                        // No entries found for previous month, use 80-90% of current month as estimate
                        prevMonthViews = Math.round(currentMonthViews * 0.85);
                      }
                    }
                    
                    // Calculate difference
                    const difference = currentMonthViews - prevMonthViews;
                    const percentChange = prevMonthViews > 0 ? Math.round((difference / prevMonthViews) * 100) : 0;
                    
                    // Return appropriate message based on change
                    if (difference > 0) {
                      return (
                        <> increased by <Text style={styles.greenText}>{formatNumber(difference)}</Text> ({percentChange}%). Great progress!</>
                      );
                    } else if (difference < 0) {
                      return (
                        <> decreased by <Text style={styles.redText}>{formatNumber(Math.abs(difference))}</Text> ({Math.abs(percentChange)}%). Need to improve strategy.</> 
                      );
                    } else {
                      return (
                        <> remained the same as last month. Time to try new tactics!</>
                      );
                    }
                  })()}
                </Text>
              </View>
            </View>
            
            {/* Chart Options Popup - Views Chart */}
            {showViewsChartOptions && (
              <View style={styles.chartOptionsContainer}>
                <TouchableOpacity style={styles.chartOption} onPress={() => {
                  exportViewsData();
                  setShowViewsChartOptions(false);
                }}>
                  <Feather name="download" size={18} color="#fff" />
                  <Text style={styles.chartOptionText}>Export Data</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.chartOption, {borderBottomWidth: 0}]} onPress={() => {
                  refreshData();
                  setShowViewsChartOptions(false);
                  Toast.show({
                    type: 'success',
                    text1: 'Refreshed',
                    text2: 'Analytics data has been updated',
                    position: 'bottom'
                  });
                }}>
                  <Feather name="refresh-cw" size={18} color="#fff" />
                  <Text style={styles.chartOptionText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.chartWrapper}>
              <BarChart
                data={getMonthlyViewsBarData()}
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
                maxValue={maxMonthlyViewsValue * 1.2}
                labelWidth={30}
                xAxisLabelTextStyle={{color: '#ccc', textAlign: 'center'}}
                hideOrigin
              />
            </View>
          </View>
          
          {/* Subscribers Chart - Temporarily disabled due to missing functions */}
          {/*
          <View style={[styles.chartContainer, {backgroundColor: '#212121'}]}>
            <View style={styles.redHeader}>
              <View style={styles.redHeaderTextContainer}>
                <Text style={styles.redHeaderAmount}>
                  {formatNumber(selectedMonthHasData ? 0 : 0)}
                </Text>
                <Text style={styles.redHeaderText}>
                  Subscribers
                </Text>
              </View>
              <TouchableOpacity style={styles.redHeaderMoreBtn} onPress={() => setShowChartOptions(!showChartOptions)}>
                <Feather name="more-horizontal" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.notificationContainer}>
              <View style={styles.notificationHeader}>
                <Text style={styles.dateText}>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][selectedMonth]} {new Date().getDate()}'
                </Text>
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationText}>
                  Monthly subscribers data unavailable.
                </Text>
              </View>
            </View>
          </View>
          */}
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
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 25 : 16,
    backgroundColor: '#111',
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: 10,
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  logo: {
    width: '100%',
    height: '100%',
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
    display: 'none',
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
    top: 50,
    right: 15,
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
  notificationContainer: {
    padding: 10,
    backgroundColor: '#212121',
    borderRadius: 8,
    marginBottom: 10,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  dateText: {
    color: '#CCC',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationContent: {
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  notificationText: {
    color: '#CCC',
    fontSize: 14,
  },
  blueText: {
    color: '#2F80ED',
    fontWeight: 'bold',
  },
  greenText: {
    color: '#27AE60',
    fontWeight: 'bold',
  },
  redText: {
    color: '#DF0000',
    fontWeight: 'bold',
  },
  yearIndicator: {
    color: '#DF0000',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 'auto',
  },
});
