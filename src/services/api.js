import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Flag to prevent multiple redirects
let isRedirecting = false;

// Export API_URL as a constant to use in other service files
export const API_URL = 'https://moq-automation-backend-production.up.railway.app/api';

// Create axios instance with base URL
const API = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout configuration (30 seconds)
  timeout: 30000,
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
        
        // Only redirect if not already redirecting
        if (!isRedirecting && typeof window !== 'undefined') {
          isRedirecting = true;
          // Use router navigation instead of window reload
          // We'll let the Protected route handle redirection naturally
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
    if (error.response && error.response.status === 401 && !isRedirecting) {
      console.log('Received 401 unauthorized response, clearing auth data');
      try {
        // Set redirecting flag to prevent multiple redirects
        isRedirecting = true;
        
        // Clear auth data on 401 responses
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('tokenExpiry');
        await AsyncStorage.removeItem('user');
        
        // Let the Protected route handle redirection naturally
        // instead of forcing a reload
      } catch (err) {
        console.error('Error during unauthorized handling:', err);
      }
    }
    return Promise.reject(error);
  }
);

// Add a getAuthToken function to the API object
API.getAuthToken = async () => {
  try {
    // Get the token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    const tokenExpiry = await AsyncStorage.getItem('tokenExpiry');
    
    // Check if token exists and is not expired
    if (!token) {
      console.log('No auth token found');
      return null;
    }
    
    // Check token expiration
    if (tokenExpiry && new Date().getTime() > parseInt(tokenExpiry, 10)) {
      console.log('Token expired during getAuthToken');
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

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
      
      // Reset redirecting flag on successful login
      isRedirecting = false;
      
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
      
      // Reset redirecting flag after logout
      isRedirecting = false;
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
  },

  // Request a password reset code
  forgotPassword: async (email) => {
    try {
      console.log('Requesting password reset for email:', email);
      
      const response = await API.post('/auth/forgot-password', { email });
      
      return {
        success: true,
        message: response.data.message || 'Reset code sent to your email if it exists in our system'
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      throw { 
        message: error.response?.data?.message || error.message || 'Error sending reset code' 
      };
    }
  },
  
  // Verify a password reset code
  verifyResetCode: async (email, resetCode) => {
    try {
      console.log('Verifying reset code for email:', email);
      
      const response = await API.post('/auth/verify-reset-code', { 
        email, 
        code: resetCode  // Changed from resetCode to code to match backend API
      });
      
      console.log('API verify response:', response.data);
      
      return {
        success: true,
        valid: response.data.valid || false,
        message: response.data.message || 'Code verified successfully'
      };
    } catch (error) {
      console.error('Verify reset code error:', error);
      throw { 
        message: error.response?.data?.message || error.message || 'Invalid or expired code' 
      };
    }
  },
  
  // Reset password with valid code
  resetPassword: async (email, resetCode, newPassword) => {
    try {
      console.log('Resetting password with params:', {
        email,
        code: resetCode,
        newPasswordLength: newPassword?.length || 0
      });
      
      // Make sure we're using the correct parameter names that the backend expects
      const requestData = {
        email,
        code: resetCode,
        newPassword  // This is the parameter name expected by the backend
      };
      
      console.log('API request data:', JSON.stringify(requestData));
      
      const response = await API.post('/auth/reset-password', requestData);
      
      console.log('Reset password API response:', response.data);
      
      return {
        success: true,
        message: response.data.message || 'Password reset successfully'
      };
    } catch (error) {
      console.error('Reset password error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      
      // If we got a 400 error, it likely means one of the parameters is wrong or missing
      if (error.response?.status === 400) {
        console.log('Request that caused 400 error:', {
          url: '/auth/reset-password',
          email: email,
          codeLength: resetCode?.length || 0,
          passwordLength: newPassword?.length || 0
        });
      }
      
      throw { 
        message: error.response?.data?.message || error.message || 'Failed to reset password' 
      };
    }
  },
};

export default API; 