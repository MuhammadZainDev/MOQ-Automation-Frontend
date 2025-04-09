import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with base URL
const API = axios.create({
  baseURL: 'http://192.168.0.106:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to request headers if available
API.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const tokenExpiry = await AsyncStorage.getItem('tokenExpiry');
    
    // Check if token exists and is not expired
    if (token) {
      // Check token expiration
      if (tokenExpiry && new Date().getTime() > parseInt(tokenExpiry, 10)) {
        console.log('Token expired, clearing auth data');
        // Clear auth data if token expired
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('tokenExpiry');
        await AsyncStorage.removeItem('user');
        
        // Force reload to trigger login redirection
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            // This timeout is needed to allow the current request to complete
            // without a token, which will likely result in a 401 anyway
            window.location.reload();
          }, 500);
        }
      } else {
        // Add token to headers if valid
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (error) {
    console.log('Error getting token:', error);
  }
  return config;
});

// Add response interceptor for handling 401 Unauthorized errors
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.log('Received 401 unauthorized response, clearing auth data');
      try {
        // Clear auth data on 401 responses
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('tokenExpiry');
        await AsyncStorage.removeItem('user');
        
        // Force reload to trigger login redirection
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      } catch (err) {
        console.error('Error during unauthorized handling:', err);
      }
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  // Register a new user
  signup: async (userData) => {
    try {
      console.log('Signing up with data:', userData);
      
      const response = await API.post('/auth/signup', userData);
      console.log('Server signup response:', response.data);
      
      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Signup failed');
      }
      
      // The backend doesn't return a token on signup, only on login
      return {
        user: response.data.data.user
      };
    } catch (error) {
      console.error('Signup error:', error);
      throw { 
        message: error.response?.data?.message || error.message || 'Network error during signup' 
      };
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      console.log('Logging in with credentials:', credentials.email);
      
      const response = await API.post('/auth/login', credentials);
      console.log('Login response from server:', response.data);
      
      if (response.data.status !== 'success' || !response.data.token) {
        throw new Error(response.data.message || 'Login failed');
      }
      
      // Store token and token expiry time
      await AsyncStorage.setItem('token', response.data.token);
      
      // Calculate token expiry time (15 days from now in milliseconds)
      const expiryTime = new Date().getTime() + (15 * 24 * 60 * 60 * 1000);
      await AsyncStorage.setItem('tokenExpiry', expiryTime.toString());
      
      // Log received user data for debugging
      console.log('User data from server:', response.data.data.user);
      console.log('User role from server:', response.data.data.user.role);
      console.log('Token expiry set to:', new Date(expiryTime).toLocaleString());
      
      await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));
      
      console.log('Stored user data in AsyncStorage');
      
      // Verify the stored data (debugging)
      const storedUser = await AsyncStorage.getItem('user');
      console.log('Stored user data in AsyncStorage (verified):', JSON.parse(storedUser));
      
      return {
        user: response.data.data.user,
        token: response.data.token
      };
    } catch (error) {
      console.error('Login error:', error);
      throw { 
        message: error.response?.data?.message || error.message || 'Network error during login' 
      };
    }
  },

  // Logout user
  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('tokenExpiry');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.log('Error during logout:', error);
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      // Check if token is expired
      const tokenExpiry = await AsyncStorage.getItem('tokenExpiry');
      if (tokenExpiry && new Date().getTime() > parseInt(tokenExpiry, 10)) {
        console.log('Token expired during getCurrentUser check, logging out');
        await authService.logout();
        return null;
      }
      
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      console.log('Retrieved user from storage:', user);
      console.log('User role from storage:', user.role);
      return user;
    } catch (error) {
      console.log('Error getting user:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const tokenExpiry = await AsyncStorage.getItem('tokenExpiry');
      
      // If no token, not authenticated
      if (!token) return false;
      
      // If token exists but expiry date has passed, clear auth and return false
      if (tokenExpiry && new Date().getTime() > parseInt(tokenExpiry, 10)) {
        console.log('Token expired during authentication check, logging out');
        await authService.logout();
        return false;
      }
      
      // Token exists and is not expired
      return true;
    } catch (error) {
      console.log('Error checking authentication:', error);
      return false;
    }
  }
};

export default API; 