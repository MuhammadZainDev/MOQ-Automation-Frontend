import axios from 'axios';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Axois configuration
axios.defaults.baseURL = API_URL;

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