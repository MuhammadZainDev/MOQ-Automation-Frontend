import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { BarChart } from 'react-native-gifted-charts';
import { adminService } from '../../src/services/adminApi';
import { useAuth } from '../../src/context/AuthContext';
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

// Utility function to format numbers in a human-readable way
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

// Generate PDF function
const generatePDF = async (data: any, type = 'revenue') => {
  try {
    // Define months array
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentYear = new Date().getFullYear();
    
    // Create some sample data if no entries exist
    let monthlyData: number[] = [];
    let title = '';
    let color = '#000000';
    
    if (type === 'revenue' && data.monthlyStats) {
      monthlyData = data.monthlyStats;
      title = 'Revenue';
      color = '#DF0000';
    } else if (type === 'views' && data.monthlyViews) {
      monthlyData = data.monthlyViews;
      title = 'Views';
      color = '#2196F3';
    } else if (type === 'videos' && data.monthlyVideos) {
      monthlyData = data.monthlyVideos;
      title = 'Videos';
      color = '#FF9800';
    } else if (type === 'premiumViews' && data.monthlyPremiumViews) {
      monthlyData = data.monthlyPremiumViews;
      title = 'Premium Country Views';
      color = '#9C27B0';
    }
    
    // Generate HTML content for the PDF
    let htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            h1 { color: ${color}; text-align: center; margin-bottom: 30px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { width: 100px; height: 100px; margin: 0 auto; display: block; border-radius: 50%; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: ${color}; color: white; padding: 10px; text-align: left; }
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
      const bgColor = `rgba(${color.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ')}, ${opacity})`;
      
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

export default function GraphsScreen() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<UserAnalyticsData>({
    revenue: 0,
    views: 0,
    videos: 0,
    premium_country_views: 0,
    posts: 0
  });
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  
  // Chart state variables
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedViewsMonth, setSelectedViewsMonth] = useState<number>(new Date().getMonth());
  const [selectedVideosMonth, setSelectedVideosMonth] = useState<number>(new Date().getMonth());
  const [selectedPremiumViewsMonth, setSelectedPremiumViewsMonth] = useState<number>(new Date().getMonth());
  
  const [selectedMonthValue, setSelectedMonthValue] = useState(0);
  const [selectedMonthHasData, setSelectedMonthHasData] = useState(false);
  const [selectedMonthViewsValue, setSelectedMonthViewsValue] = useState(0);
  const [selectedMonthViewsHasData, setSelectedMonthViewsHasData] = useState(false);
  const [selectedMonthVideosValue, setSelectedMonthVideosValue] = useState(0);
  const [selectedMonthVideosHasData, setSelectedMonthVideosHasData] = useState(false);
  const [selectedMonthPremiumViewsValue, setSelectedMonthPremiumViewsValue] = useState(0);
  const [selectedMonthPremiumViewsHasData, setSelectedMonthPremiumViewsHasData] = useState(false);
  
  const [showRevenueChartOptions, setShowRevenueChartOptions] = useState(false);
  const [showViewsChartOptions, setShowViewsChartOptions] = useState(false);
  const [showVideosChartOptions, setShowVideosChartOptions] = useState(false);
  const [showPremiumViewsChartOptions, setShowPremiumViewsChartOptions] = useState(false);

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
              }
            }
          } catch (error) {
            console.error("Error processing entry date:", error);
          }
        }
      });
    } else {
      // If no entries with timestamps, just set the current month to have the total revenue
      // and leave other months at zero or minimal values
      const currentMonth = new Date().getMonth();
      
      // Set current month to have the actual revenue value
      monthlyStats[currentMonth] = analyticsData.revenue || 0;
      hasRealData[currentMonth] = true;
      
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
              }
            }
          } catch (error) {
            console.error("Error processing entry date:", error);
          }
        }
      });
    } else {
      // If no entries with timestamps, just set the current month to have the total views
      // and leave other months at zero or minimal values
      const currentMonth = new Date().getMonth();
      
      // Set current month to have the actual views value
      monthlyViews[currentMonth] = analyticsData.views || 0;
      hasRealData[currentMonth] = true;
      
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

  // Calculate monthly videos from analytics entries
  const getMonthlyVideosData = useCallback(() => {
    // Don't filter by current year - just use the latest data for each month
    const monthlyVideos = Array(12).fill(0); // Initialize with zeros for all 12 months
    const hasRealData = Array(12).fill(false); // Track which months have actual data
    
    // Check if we have entries with timestamps in the analytics data
    if (analyticsData && analyticsData.entries && Array.isArray(analyticsData.entries)) {
      console.log(`Processing ${analyticsData.entries.length} entries for monthly videos`);
      
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
                const videosValue = Number(entry.videos || 0);
                monthlyVideos[month] += videosValue;
                hasRealData[month] = true;
              }
            }
          } catch (error) {
            console.error("Error processing entry date:", error);
          }
        }
      });
    } else {
      // If no entries with timestamps, just set the current month to have the total videos
      // and leave other months at zero or minimal values
      const currentMonth = new Date().getMonth();
      
      // Set current month to have the actual videos value
      monthlyVideos[currentMonth] = analyticsData.videos || 0;
      hasRealData[currentMonth] = true;
      
      // Set other months to have minimal value just for visualization (1-5% of the main value)
      const minBarValue = Math.max(1, Math.floor((analyticsData.videos || 100) * 0.02));
      for (let i = 0; i < 12; i++) {
        if (i !== currentMonth) {
          // Set display height value, but they don't have real data
          monthlyVideos[i] = minBarValue;
          hasRealData[i] = false;
        }
      }
    }
    
    return { monthlyVideos, hasRealData };
  }, [analyticsData]);

  // Calculate monthly premium country views from analytics entries
  const getMonthlyPremiumViewsData = useCallback(() => {
    // Don't filter by current year - just use the latest data for each month
    const monthlyPremiumViews = Array(12).fill(0); // Initialize with zeros for all 12 months
    const hasRealData = Array(12).fill(false); // Track which months have actual data
    
    // Check if we have entries with timestamps in the analytics data
    if (analyticsData && analyticsData.entries && Array.isArray(analyticsData.entries)) {
      console.log(`Processing ${analyticsData.entries.length} entries for monthly premium views`);
      
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
                const premiumViewsValue = Number(entry.premium_country_views || 0);
                monthlyPremiumViews[month] += premiumViewsValue;
                hasRealData[month] = true;
              }
            }
          } catch (error) {
            console.error("Error processing entry date:", error);
          }
        }
      });
    } else {
      // If no entries with timestamps, just set the current month to have the total premium views
      // and leave other months at zero or minimal values
      const currentMonth = new Date().getMonth();
      
      // Set current month to have the actual premium views value
      monthlyPremiumViews[currentMonth] = analyticsData.premium_country_views || 0;
      hasRealData[currentMonth] = true;
      
      // Set other months to have minimal value just for visualization (1-5% of the main value)
      const minBarValue = Math.max(1, Math.floor((analyticsData.premium_country_views || 100) * 0.02));
      for (let i = 0; i < 12; i++) {
        if (i !== currentMonth) {
          // Set display height value, but they don't have real data
          monthlyPremiumViews[i] = minBarValue;
          hasRealData[i] = false;
        }
      }
    }
    
    return { monthlyPremiumViews, hasRealData };
  }, [analyticsData]);

  // Get the monthly stats data
  useEffect(() => {
    const { monthlyStats, hasRealData } = getMonthlyStats();
    setSelectedMonthValue(monthlyStats[selectedMonth]);
    setSelectedMonthHasData(hasRealData[selectedMonth]);
  }, [analyticsData, selectedMonth, getMonthlyStats]);

  // Get the monthly views data
  useEffect(() => {
    const { monthlyViews, hasRealData } = getMonthlyViewsData();
    setSelectedMonthViewsValue(monthlyViews[selectedViewsMonth]);
    setSelectedMonthViewsHasData(hasRealData[selectedViewsMonth]);
  }, [analyticsData, selectedViewsMonth, getMonthlyViewsData]);

  // Get the monthly videos data
  useEffect(() => {
    const { monthlyVideos, hasRealData } = getMonthlyVideosData();
    setSelectedMonthVideosValue(monthlyVideos[selectedVideosMonth]);
    setSelectedMonthVideosHasData(hasRealData[selectedVideosMonth]);
  }, [analyticsData, selectedVideosMonth, getMonthlyVideosData]);

  // Get the monthly premium views data
  useEffect(() => {
    const { monthlyPremiumViews, hasRealData } = getMonthlyPremiumViewsData();
    setSelectedMonthPremiumViewsValue(monthlyPremiumViews[selectedPremiumViewsMonth]);
    setSelectedMonthPremiumViewsHasData(hasRealData[selectedPremiumViewsMonth]);
  }, [analyticsData, selectedPremiumViewsMonth, getMonthlyPremiumViewsData]);

  // Handler for bar press
  const handleBarPress = useCallback((monthIndex: number, monthValue: number, hasData: boolean) => {
    setSelectedMonth(monthIndex);
    setSelectedMonthValue(monthValue);
    setSelectedMonthHasData(hasData);
  }, []);

  // Handler for views bar press
  const handleViewsBarPress = useCallback((monthIndex: number, monthValue: number, hasData: boolean) => {
    setSelectedViewsMonth(monthIndex);
    setSelectedMonthViewsValue(monthValue);
    setSelectedMonthViewsHasData(hasData);
  }, []);

  // Handler for videos bar press
  const handleVideosBarPress = useCallback((monthIndex: number, monthValue: number, hasData: boolean) => {
    setSelectedVideosMonth(monthIndex);
    setSelectedMonthVideosValue(monthValue);
    setSelectedMonthVideosHasData(hasData);
  }, []);

  // Handler for premium views bar press
  const handlePremiumViewsBarPress = useCallback((monthIndex: number, monthValue: number, hasData: boolean) => {
    setSelectedPremiumViewsMonth(monthIndex);
    setSelectedMonthPremiumViewsValue(monthValue);
    setSelectedMonthPremiumViewsHasData(hasData);
  }, []);

  // Get bar data based on current analytics data
  const getMonthlyBarData = useCallback(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const { monthlyStats, hasRealData } = getMonthlyStats();
    
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

  // Get bar data for videos chart
  const getMonthlyVideosBarData = useCallback(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const { monthlyVideos, hasRealData } = getMonthlyVideosData();
    
    // Find the max value for proper color contrast
    const maxValue = Math.max(...monthlyVideos);
    const threshold = maxValue * 0.1; // 10% of max is considered "real data"
    
    return months.map((month, index) => {
      // Determine if this month has significant data or just a placeholder value
      const hasSignificantData = monthlyVideos[index] > threshold && hasRealData[index];
      
      return {
        value: monthlyVideos[index], // Use this for the display height
        label: month,
        frontColor: 
          index === selectedVideosMonth 
            ? '#FF9800' // Highlighted month (orange for videos)
            : hasSignificantData 
              ? 'rgba(255, 152, 0, 0.7)' // Month with significant data  
              : 'rgba(255, 152, 0, 0.3)', // Month with minimal/no data
        onPress: () => handleVideosBarPress(index, monthlyVideos[index], hasRealData[index])
      };
    });
  }, [getMonthlyVideosData, selectedVideosMonth, handleVideosBarPress]);

  // Get bar data for premium views chart
  const getMonthlyPremiumViewsBarData = useCallback(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const { monthlyPremiumViews, hasRealData } = getMonthlyPremiumViewsData();
    
    // Find the max value for proper color contrast
    const maxValue = Math.max(...monthlyPremiumViews);
    const threshold = maxValue * 0.1; // 10% of max is considered "real data"
    
    return months.map((month, index) => {
      // Determine if this month has significant data or just a placeholder value
      const hasSignificantData = monthlyPremiumViews[index] > threshold && hasRealData[index];
      
      return {
        value: monthlyPremiumViews[index], // Use this for the display height
        label: month,
        frontColor: 
          index === selectedPremiumViewsMonth 
            ? '#9C27B0' // Highlighted month (purple for premium views)
            : hasSignificantData 
              ? 'rgba(156, 39, 176, 0.7)' // Month with significant data  
              : 'rgba(156, 39, 176, 0.3)', // Month with minimal/no data
        onPress: () => handlePremiumViewsBarPress(index, monthlyPremiumViews[index], hasRealData[index])
      };
    });
  }, [getMonthlyPremiumViewsData, selectedPremiumViewsMonth, handlePremiumViewsBarPress]);

  // Calculate maxMonthlyValue based on monthlyStats
  const maxMonthlyValue = useMemo(() => {
    const { monthlyStats } = getMonthlyStats();
    return Math.max(...monthlyStats, 1); // Ensure at least 1 to avoid division by zero
  }, [getMonthlyStats]);

  // Calculate maxMonthlyViewsValue based on monthlyViews
  const maxMonthlyViewsValue = useMemo(() => {
    const { monthlyViews } = getMonthlyViewsData();
    return Math.max(...monthlyViews, 1); // Ensure at least 1 to avoid division by zero
  }, [getMonthlyViewsData]);

  // Calculate maxMonthlyVideosValue based on monthlyVideos
  const maxMonthlyVideosValue = useMemo(() => {
    const { monthlyVideos } = getMonthlyVideosData();
    return Math.max(...monthlyVideos, 1); // Ensure at least 1 to avoid division by zero
  }, [getMonthlyVideosData]);

  // Calculate maxMonthlyPremiumViewsValue based on monthlyPremiumViews
  const maxMonthlyPremiumViewsValue = useMemo(() => {
    const { monthlyPremiumViews } = getMonthlyPremiumViewsData();
    return Math.max(...monthlyPremiumViews, 1); // Ensure at least 1 to avoid division by zero
  }, [getMonthlyPremiumViewsData]);

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

  // Refresh all analytics data
  const refreshData = useCallback(() => {
    setIsLoadingAnalytics(true);
    adminService.getCurrentUserAnalytics()
      .then(response => {
        if (response.success && response.data) {
          setAnalyticsData(response.data);
        }
      })
      .catch(error => console.error('Error refreshing analytics:', error))
      .finally(() => setIsLoadingAnalytics(false));
  }, []);

  // Export functions for each chart type
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

  const exportVideosData = async () => {
    try {
      const { monthlyVideos, hasRealData } = getMonthlyVideosData();
      const result = await generatePDF({ monthlyVideos, hasRealData }, 'videos');
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Export Successful',
          text2: 'Videos data has been exported',
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

  const exportPremiumViewsData = async () => {
    try {
      const { monthlyPremiumViews, hasRealData } = getMonthlyPremiumViewsData();
      const result = await generatePDF({ monthlyPremiumViews, hasRealData }, 'premiumViews');
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Export Successful',
          text2: 'Premium Views data has been exported',
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {isLoadingAnalytics ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DF0000" />
          <Text style={styles.loadingText}>Loading analytics data...</Text>
        </View>
      ) : (
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Analytics Graphs</Text>
            <Text style={styles.headerSubtitle}>Visualize your performance data</Text>
          </View>
          
          {/* Monthly Revenue Chart */}
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
              <TouchableOpacity style={styles.redHeaderMoreBtn} onPress={() => {
                // Close all other option menus first
                setShowViewsChartOptions(false);
                setShowVideosChartOptions(false);
                setShowPremiumViewsChartOptions(false);
                // Toggle this menu
                setShowRevenueChartOptions(!showRevenueChartOptions);
              }}>
                <Feather name="more-horizontal" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {/* Revenue Chart Options Popup */}
            {showRevenueChartOptions && (
              <>
                <TouchableOpacity 
                  style={styles.modalOverlay} 
                  activeOpacity={0} 
                  onPress={() => setShowRevenueChartOptions(false)} 
                />
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
              </>
            )}
            
            {/* Revenue Monthly Summary Box */}
            <Text style={styles.monthSummaryHeading}>
              Monthly Summary for {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]}
            </Text>
            <View style={styles.notificationContainer}>
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
              <TouchableOpacity style={styles.redHeaderMoreBtn} onPress={() => {
                // Close all other option menus first
                setShowRevenueChartOptions(false);
                setShowVideosChartOptions(false);
                setShowPremiumViewsChartOptions(false);
                // Toggle this menu
                setShowViewsChartOptions(!showViewsChartOptions);
              }}>
                <Feather name="more-horizontal" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {/* Views Chart Options Popup */}
            {showViewsChartOptions && (
              <>
                <TouchableOpacity 
                  style={styles.modalOverlay} 
                  activeOpacity={0} 
                  onPress={() => setShowViewsChartOptions(false)} 
                />
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
              </>
            )}
            
            {/* Views Monthly Summary Box */}
            <Text style={styles.monthSummaryHeading}>
              Monthly Summary for {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedViewsMonth]}
            </Text>
            <View style={styles.notificationContainer}>
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
          
          {/* Monthly Videos Chart */}
          <View style={[styles.chartContainer, {backgroundColor: '#212121', marginTop: 20}]}>
            <View style={[styles.redHeader, {backgroundColor: 'rgba(255, 152, 0, 0.2)'}]}>
              <View style={styles.redHeaderTextContainer}>
                <Text style={styles.redHeaderAmount}>
                  {formatNumber(selectedMonthVideosHasData ? selectedMonthVideosValue : 0)}
                </Text>
                <Text style={styles.redHeaderText}>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedVideosMonth]} Total Videos
                </Text>
              </View>
              <TouchableOpacity style={styles.redHeaderMoreBtn} onPress={() => {
                // Close all other option menus first
                setShowRevenueChartOptions(false);
                setShowViewsChartOptions(false);
                setShowPremiumViewsChartOptions(false);
                // Toggle this menu
                setShowVideosChartOptions(!showVideosChartOptions);
              }}>
                <Feather name="more-horizontal" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {/* Videos Chart Options Popup */}
            {showVideosChartOptions && (
              <>
                <TouchableOpacity 
                  style={styles.modalOverlay} 
                  activeOpacity={0} 
                  onPress={() => setShowVideosChartOptions(false)} 
                />
                <View style={styles.chartOptionsContainer}>
                  <TouchableOpacity style={styles.chartOption} onPress={() => {
                    exportVideosData();
                    setShowVideosChartOptions(false);
                  }}>
                    <Feather name="download" size={18} color="#fff" />
                    <Text style={styles.chartOptionText}>Export Data</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.chartOption, {borderBottomWidth: 0}]} onPress={() => {
                    refreshData();
                    setShowVideosChartOptions(false);
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
              </>
            )}
            
            {/* Videos Monthly Summary Box */}
            <Text style={styles.monthSummaryHeading}>
              Monthly Summary for {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedVideosMonth]}
            </Text>
            <View style={styles.notificationContainer}>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationText}>
                  In {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedVideosMonth]}, your <Text style={styles.blueText}>total videos</Text> 
                  {(() => {
                    // Calculate previous month's index (with wraparound to December if current is January)
                    const prevMonthIndex = selectedVideosMonth > 0 ? selectedVideosMonth - 1 : 11;
                    
                    // Get current month videos
                    const currentMonthVideos = selectedMonthVideosHasData ? selectedMonthVideosValue : 0;
                    
                    // Find previous month value from analytics entries
                    let prevMonthVideos = 0;
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
                        prevMonthVideos = prevMonthEntries.reduce((sum, entry) => sum + Number(entry.videos || 0), 0);
                      } else {
                        // No entries found for previous month, use 80-90% of current month as estimate
                        prevMonthVideos = Math.round(currentMonthVideos * 0.85);
                      }
                    }
                    
                    // Calculate difference
                    const difference = currentMonthVideos - prevMonthVideos;
                    const percentChange = prevMonthVideos > 0 ? Math.round((difference / prevMonthVideos) * 100) : 0;
                    
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
            
            <View style={styles.chartWrapper}>
              <BarChart
                data={getMonthlyVideosBarData()}
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
                maxValue={maxMonthlyVideosValue * 1.2}
                labelWidth={30}
                xAxisLabelTextStyle={{color: '#ccc', textAlign: 'center'}}
                hideOrigin
              />
            </View>
          </View>
          
          {/* Monthly Premium Country Views Chart */}
          <View style={[styles.chartContainer, {backgroundColor: '#212121', marginTop: 20}]}>
            <View style={[styles.redHeader, {backgroundColor: 'rgba(156, 39, 176, 0.2)'}]}>
              <View style={styles.redHeaderTextContainer}>
                <Text style={styles.redHeaderAmount}>
                  {formatNumber(selectedMonthPremiumViewsHasData ? selectedMonthPremiumViewsValue : 0)}
                </Text>
                <Text style={styles.redHeaderText}>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedPremiumViewsMonth]} Premium Views
                </Text>
              </View>
              <TouchableOpacity style={styles.redHeaderMoreBtn} onPress={() => {
                // Close all other option menus first
                setShowRevenueChartOptions(false);
                setShowViewsChartOptions(false);
                setShowVideosChartOptions(false);
                // Toggle this menu
                setShowPremiumViewsChartOptions(!showPremiumViewsChartOptions);
              }}>
                <Feather name="more-horizontal" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {/* Premium Views Chart Options Popup */}
            {showPremiumViewsChartOptions && (
              <>
                <TouchableOpacity 
                  style={styles.modalOverlay} 
                  activeOpacity={0} 
                  onPress={() => setShowPremiumViewsChartOptions(false)} 
                />
                <View style={styles.chartOptionsContainer}>
                  <TouchableOpacity style={styles.chartOption} onPress={() => {
                    exportPremiumViewsData();
                    setShowPremiumViewsChartOptions(false);
                  }}>
                    <Feather name="download" size={18} color="#fff" />
                    <Text style={styles.chartOptionText}>Export Data</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.chartOption, {borderBottomWidth: 0}]} onPress={() => {
                    refreshData();
                    setShowPremiumViewsChartOptions(false);
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
              </>
            )}
            
            {/* Premium Views Monthly Summary Box */}
            <Text style={styles.monthSummaryHeading}>
              Monthly Summary for {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedPremiumViewsMonth]}
            </Text>
            <View style={styles.notificationContainer}>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationText}>
                  In {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedPremiumViewsMonth]}, your <Text style={styles.blueText}>premium country views</Text> 
                  {(() => {
                    // Calculate previous month's index (with wraparound to December if current is January)
                    const prevMonthIndex = selectedPremiumViewsMonth > 0 ? selectedPremiumViewsMonth - 1 : 11;
                    
                    // Get current month premium views
                    const currentMonthPremiumViews = selectedMonthPremiumViewsHasData ? selectedMonthPremiumViewsValue : 0;
                    
                    // Find previous month value from analytics entries
                    let prevMonthPremiumViews = 0;
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
                        prevMonthPremiumViews = prevMonthEntries.reduce((sum, entry) => sum + Number(entry.premium_country_views || 0), 0);
                      } else {
                        // No entries found for previous month, use 80-90% of current month as estimate
                        prevMonthPremiumViews = Math.round(currentMonthPremiumViews * 0.85);
                      }
                    }
                    
                    // Calculate difference
                    const difference = currentMonthPremiumViews - prevMonthPremiumViews;
                    const percentChange = prevMonthPremiumViews > 0 ? Math.round((difference / prevMonthPremiumViews) * 100) : 0;
                    
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
            
            <View style={styles.chartWrapper}>
              <BarChart
                data={getMonthlyPremiumViewsBarData()}
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
                maxValue={maxMonthlyPremiumViewsValue * 1.2}
                labelWidth={30}
                xAxisLabelTextStyle={{color: '#ccc', textAlign: 'center'}}
                hideOrigin
              />
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

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
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  chartContainer: {
    marginBottom: 30,
    backgroundColor: '#212121',
    borderRadius: 10,
    marginHorizontal: 16,
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
  // New styles for notification container
  notificationContainer: {
    backgroundColor: '#212121',
    borderRadius: 8,
    marginHorizontal: 15,
    marginBottom: 15,
    overflow: 'hidden',
  },
  notificationContent: {
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  notificationText: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 20,
  },
  blueText: {
    color: '#2F80ED',
    fontWeight: 'bold',
  },
  redText: {
    color: '#FF5252',
    fontWeight: 'bold',
  },
  greenText: {
    color: '#27AE60',
    fontWeight: 'bold',
  },
  // Add new style for the month summary heading
  monthSummaryHeading: {
    color: '#CCC',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 25,
    marginBottom: 10,
    marginTop: 10,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
}); 