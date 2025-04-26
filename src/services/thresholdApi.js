import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api';

// Helper function to get the auth token
const getAuthToken = async () => {
  const token = await AsyncStorage.getItem('token');
  return token;
};

// Configure axios with auth token and longer timeout
const getAuthorizedApi = async () => {
  const token = await getAuthToken();
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    timeout: 60000 // 60 seconds timeout for threshold operations
  });
};

// Get thresholds for current user
export const getUserThresholds = async () => {
  try {
    const api = await getAuthorizedApi();
    // Add a timestamp as a query parameter to prevent caching
    const timestamp = new Date().getTime();
    const response = await api.get(`/thresholds/my-thresholds?_t=${timestamp}`);
    
    console.log('Raw user thresholds API response:', JSON.stringify(response.data));
    
    // Process the data similar to how we do in getAllThresholds
    if (response.data && response.data.data) {
      response.data.data = response.data.data.map(threshold => {
        // Convert amount to number if it's a string
        if (threshold.amount && typeof threshold.amount === 'string') {
          threshold.amount = Number(threshold.amount);
        }
        
        // Ensure current value is a number
        if (threshold.current && typeof threshold.current === 'string') {
          threshold.current = Number(threshold.current);
        }
        
        // Process music_revenue and adsense_revenue
        if (threshold.music_revenue && typeof threshold.music_revenue === 'string') {
          threshold.music_revenue = Number(threshold.music_revenue);
        }
        
        if (threshold.adsense_revenue && typeof threshold.adsense_revenue === 'string') {
          threshold.adsense_revenue = Number(threshold.adsense_revenue);
        }
        
        console.log(`Processed user threshold ${threshold.id}: amount=${threshold.amount}, current=${threshold.current}, music_revenue=${threshold.music_revenue}, adsense_revenue=${threshold.adsense_revenue}`);
        return threshold;
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching user thresholds:', error);
    throw error;
  }
};

// Admin functions
// Get all thresholds
export const getAllThresholds = async () => {
  try {
    const api = await getAuthorizedApi();
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const response = await api.get(`/thresholds?_t=${timestamp}`);
    
    // Log raw response for debugging
    console.log('Raw thresholds from API:', JSON.stringify(response.data));
    
    // Make sure the amount field is properly processed
    if (response.data && response.data.data) {
      response.data.data = response.data.data.map(threshold => {
        // Convert amount to number if it's a string
        if (threshold.amount && typeof threshold.amount === 'string') {
          threshold.amount = Number(threshold.amount);
        }
        
        // Ensure current value is a number
        if (threshold.current && typeof threshold.current === 'string') {
          threshold.current = Number(threshold.current);
        }
        
        console.log(`Processed threshold ${threshold.id}: amount=${threshold.amount}, current=${threshold.current}`);
        return threshold;
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching all thresholds:', error);
    throw error;
  }
};

// Get thresholds for a specific user
export const getUserThresholdsById = async (userId) => {
  try {
    const api = await getAuthorizedApi();
    const response = await api.get(`/thresholds/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching thresholds for user ${userId}:`, error);
    throw error;
  }
};

// Get a single threshold
export const getThresholdById = async (thresholdId) => {
  try {
    const api = await getAuthorizedApi();
    const response = await api.get(`/thresholds/${thresholdId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching threshold ${thresholdId}:`, error);
    throw error;
  }
};

// Create a new threshold
export const createThreshold = async (thresholdData) => {
  try {
    const api = await getAuthorizedApi();
    const response = await api.post('/thresholds', thresholdData);
    return response.data;
  } catch (error) {
    console.error('Error creating threshold:', error);
    throw error;
  }
};

// Update a threshold
export const updateThreshold = async (thresholdId, thresholdData) => {
  try {
    const api = await getAuthorizedApi();
    const response = await api.put(`/thresholds/${thresholdId}`, thresholdData);
    return response.data;
  } catch (error) {
    console.error(`Error updating threshold ${thresholdId}:`, error);
    throw error;
  }
};

// Delete a threshold
export const deleteThreshold = async (thresholdId) => {
  try {
    const api = await getAuthorizedApi();
    const response = await api.delete(`/thresholds/${thresholdId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting threshold ${thresholdId}:`, error);
    throw error;
  }
};

// Add entry to a threshold
export const addThresholdEntry = async (thresholdId, entryData) => {
  try {
    const api = await getAuthorizedApi();
    const response = await api.post(`/thresholds/${thresholdId}/entries`, entryData);
    return response.data;
  } catch (error) {
    console.error(`Error adding entry to threshold ${thresholdId}:`, error);
    throw error;
  }
};

// Add revenue to threshold via admin update
export const addRevenueToThreshold = async (userId, thresholdId, amount, options = {}) => {
  try {
    const api = await getAuthorizedApi();
    
    // Ensure we're preserving the exact decimal value by keeping it as a string
    // Log the exact value we're sending to the API
    console.log(`\n=== THRESHOLD API: addRevenueToThreshold ===`);
    console.log(`Raw input amount: '${amount}' (type: ${typeof amount})`);
    
    // Make sure amount is always passed as a string to preserve decimal places
    let revenueValue = typeof amount === 'string' ? amount : String(amount);
    console.log(`After initial conversion: '${revenueValue}'`);
    
    // Ensure the decimal format is correct with exactly 2 decimal places
    if (!revenueValue.includes('.')) {
      // If no decimal point, add .00
      console.log(`No decimal point, adding .00`);
      revenueValue = revenueValue + '.00';
    } else {
      // If has decimal point, ensure it has exactly 2 digits after
      const parts = revenueValue.split('.');
      console.log(`Split parts:`, parts);
      
      if (parts[1].length === 1) {
        // If only one digit after decimal, add a zero
        console.log(`Only one decimal digit, adding 0`);
        revenueValue = revenueValue + '0';
      } else if (parts[1].length > 2) {
        // If more than 2 digits after decimal, truncate to 2
        console.log(`More than 2 decimal digits, truncating`);
        revenueValue = parts[0] + '.' + parts[1].substring(0, 2);
      }
    }
    
    console.log(`Final formatted revenue value: '${revenueValue}'`);
    
    // Build request data - pass amount as string without any further processing
    const requestData = {
      revenue: revenueValue,
      addToThreshold: true,
      thresholdId,
      // Include optional fields if provided
      views: options.views || 0,
      videos: options.videos || 0,
      premium_country_views: options.premiumCountryViews || 0,
      revenue_type: options.revenueType || 'adsense'
    };
    
    console.log(`Sending data to backend:`, JSON.stringify(requestData));
    
    const response = await api.patch(`/admin/users/${userId}/analytics-with-threshold`, requestData);
    return response.data;
  } catch (error) {
    console.error(`Error adding revenue to threshold:`, error);
    throw error;
  }
};

// Recalculate all threshold values
export const recalculateThresholds = async () => {
  try {
    const api = await getAuthorizedApi();
    const response = await api.post('/thresholds/recalculate');
    return response.data;
  } catch (error) {
    console.error('Error recalculating thresholds:', error);
    throw error;
  }
};

// Reset all threshold values to zero
export const resetAllThresholds = async () => {
  try {
    const api = await getAuthorizedApi();
    const response = await api.post('/thresholds/reset');
    return response.data;
  } catch (error) {
    console.error('Error resetting thresholds:', error);
    throw error;
  }
}; 