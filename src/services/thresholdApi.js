import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api';

// Helper function to get the auth token
const getAuthToken = async () => {
  const token = await AsyncStorage.getItem('token');
  return token;
};

// Configure axios with auth token
const getAuthorizedApi = async () => {
  const token = await getAuthToken();
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
};

// Get thresholds for current user
export const getUserThresholds = async () => {
  try {
    const api = await getAuthorizedApi();
    // Add a timestamp as a query parameter to prevent caching
    const timestamp = new Date().getTime();
    const response = await api.get(`/thresholds/my-thresholds?_t=${timestamp}`);
    console.log('Thresholds API response:', JSON.stringify(response.data));
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
    const response = await api.get('/thresholds');
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
    
    // Build request data
    const requestData = {
      revenue: amount,
      addToThreshold: true,
      thresholdId,
      // Include optional fields if provided
      views: options.views || 0,
      videos: options.videos || 0,
      premium_country_views: options.premiumCountryViews || 0,
      revenue_type: options.revenueType || 'adsense'
    };
    
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