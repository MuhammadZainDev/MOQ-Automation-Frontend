import axios from 'axios';
// Remove the @env import that's causing the error
// import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Axois configuration
// Use hardcoded base URL instead of API_URL from env
axios.defaults.baseURL = 'http://192.168.0.104:4000/api';

// Add auth token to requests if available
axios.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  try {
    const response = await axios.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to login');
  }
};

export const signup = async (userData) => {
  try {
    const response = await axios.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Signup error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to register');
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await axios.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to process forgot password request');
  }
};

export const verifyResetCode = async (email, code) => {
  try {
    const response = await axios.post('/auth/verify-reset-code', { email, code });
    return response.data;
  } catch (error) {
    console.error('Verify code error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to verify reset code');
  }
};

export const resetPassword = async (email, code, newPassword) => {
  try {
    const response = await axios.post('/auth/reset-password', { 
      email, 
      code, 
      newPassword 
    });
    return response.data;
  } catch (error) {
    console.error('Reset password error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to reset password');
  }
};

export const checkTokenValidity = async () => {
  try {
    const response = await axios.get('/auth/verify-token');
    return response.data;
  } catch (error) {
    console.error('Token validation error:', error.response?.data || error);
    return { valid: false };
  }
};

export const updateUserName = async (newName) => {
  try {
    const response = await axios.patch('/auth/update-name', { newName });
    return response.data;
  } catch (error) {
    console.error('Update name error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to update name');
  }
};

/**
 * Update user profile picture
 * @param {string} imageUri - Local URI of the image
 * @returns {Promise<Object>}
 */
export const updateProfilePicture = async (imageUri) => {
  try {
    console.log("Starting profile picture upload with URI:", imageUri);
    
    // Create a new FormData instance
    const formData = new FormData();
    
    // Get the filename from the URI path
    const uriParts = imageUri.split('/');
    const fileName = uriParts[uriParts.length - 1];
    
    // Create the file object
    const file = {
      uri: imageUri,
      type: 'image/jpeg', // Default to jpeg, adjust if needed
      name: fileName,
    };
    
    console.log("Creating file object:", { name: fileName, uri: imageUri.substring(0, 50) + '...' });
    
    // Append the file to FormData
    formData.append('profileImage', file);
    
    // Send the request with FormData
    console.log("Sending profile picture update request...");
    const response = await axios.patch('/auth/update-profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log("Profile picture update response:", response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error updating profile picture:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
}; 