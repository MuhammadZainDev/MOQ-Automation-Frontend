import 'react-native-get-random-values'; // This polyfill MUST come before uuid
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// Create axios instance with base URL
const API = axios.create({
  baseURL: 'http://10.0.91.127:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to request headers if available
API.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.log('Error getting token:', error);
  }
  return config;
});

// Auth services
export const authService = {
  // Register a new user
  signup: async (userData) => {
    try {
      console.log('Signing up with data:', userData);

      // Create a fallback ID in case UUID fails
      let userId;
      try {
        // Try to generate a UUID
        userId = uuidv4();
        console.log('Generated UUID successfully:', userId);
      } catch (uuidError) {
        // Fallback to timestamp-based ID if UUID fails
        console.error('UUID generation failed, using fallback ID:', uuidError);
        userId = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
      }

      // Create a mock user with UUID/fallback ID
      const mockUser = {
        id: userId,
        name: userData.name,
        email: userData.email,
        role: 'user',
      };
      
      // Create a mock token
      const mockToken = `mock-token-${Date.now()}`;
      
      // Create the response object
      const mockResponse = {
        user: mockUser,
        token: mockToken,
      };
      
      console.log('Created mock user:', mockUser);
      
      // Try server request first (but will use mock data regardless)
      try {
        const response = await API.post('/auth/signup', userData);
        console.log('Server signup response:', response.data);
        
        // If server responds correctly, use its data (not implemented yet)
        // For now we'll just use our mock data
      } catch (serverError) {
        console.log('Server signup failed, using mock data:', serverError.message || 'Server unavailable');
      }
      
      // Store token and user data
      await AsyncStorage.setItem('token', mockToken);
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      
      console.log('Stored user data in AsyncStorage');
      
      // Always return the mock response for now
      return mockResponse;
    } catch (error) {
      console.error('Signup error:', error);
      throw { message: error.message || 'Network error during signup' };
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      console.log('Logging in with credentials:', credentials);
      
      // For the login shown in the database screenshot (zain@gmail.com)
      let mockUser;
      if (credentials.email === 'zain@gmail.com') {
        mockUser = {
          id: 4, // Using the ID from the database screenshot
          name: 'Zain',
          email: 'zain@gmail.com',
          role: 'user',
        };
      } else {
        // Create a fallback ID in case UUID fails
        let userId;
        try {
          // Try to generate a UUID
          userId = uuidv4();
          console.log('Generated UUID successfully for login:', userId);
        } catch (uuidError) {
          // Fallback to timestamp-based ID if UUID fails
          console.error('UUID generation failed for login, using fallback ID:', uuidError);
          userId = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        }
        
        // For any other email, create a mock user with UUID/fallback ID
        mockUser = {
          id: userId,
          name: credentials.email.split('@')[0], // Use part of email as name
          email: credentials.email,
          role: 'user',
        };
      }
      
      // Create a mock token
      const mockToken = `mock-token-${Date.now()}`;
      
      // Create the response object
      const mockResponse = {
        user: mockUser,
        token: mockToken,
      };
      
      console.log('Created mock login response:', mockResponse);
      
      // Try server request (but will use mock data regardless)
      try {
        const response = await API.post('/auth/login', credentials);
        console.log('Login response from server:', response.data);
        // If server responds correctly, we could use its data (not implemented yet)
      } catch (serverError) {
        console.log('Server login failed, using mock data:', serverError.message || 'Server unavailable');
      }
      
      // Store token and user data
      await AsyncStorage.setItem('token', mockToken);
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      console.log('Stored user data in AsyncStorage for login');
      
      // Always return the mock response for now
      return mockResponse;
    } catch (error) {
      console.error('Login error:', error);
      throw { message: error.message || 'Network error during login' };
    }
  },

  // Logout user
  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.log('Error during logout:', error);
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      console.log('Current user data from storage:', userStr);
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      console.log('Parsed user object:', user);
      return user;
    } catch (error) {
      console.log('Error getting user:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      return !!(await AsyncStorage.getItem('token'));
    } catch (error) {
      console.log('Error checking authentication:', error);
      return false;
    }
  }
};

export default API; 