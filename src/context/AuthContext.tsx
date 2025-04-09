import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

// User type definition
type User = {
  id: number | string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};

// Auth context type definition
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{success: boolean, error?: string}>;
  signup: (name: string, email: string, password: string) => Promise<{success: boolean, error?: string}>;
  logout: () => void;
  checkTokenExpiry: () => Promise<boolean>;
};

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: () => {},
  checkTokenExpiry: async () => false,
});

// Auth provider props
type AuthProviderProps = {
  children: ReactNode;
};

// Auth provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenExpiryTimer, setTokenExpiryTimer] = useState<NodeJS.Timeout | null>(null);

  // Check if token is expired and set up auto-logout timer
  const checkTokenExpiry = async () => {
    try {
      const tokenExpiry = await AsyncStorage.getItem('tokenExpiry');
      
      if (!tokenExpiry) {
        return false;
      }
      
      const expiryTime = parseInt(tokenExpiry, 10);
      const currentTime = new Date().getTime();
      
      // If token is expired, logout user
      if (currentTime > expiryTime) {
        console.log('Token has expired, logging out');
        logout();
        return false;
      }
      
      // Set up timer to auto-logout when token expires
      const timeUntilExpiry = expiryTime - currentTime;
      console.log(`Token expires in ${Math.round(timeUntilExpiry / (1000 * 60 * 60 * 24))} days`);
      
      // Clear any existing timer
      if (tokenExpiryTimer) {
        clearTimeout(tokenExpiryTimer);
      }
      
      // Set new timer to logout when token expires
      const timer = setTimeout(() => {
        console.log('Token expiry timer triggered, logging out');
        logout();
        Toast.show({
          type: 'info',
          text1: 'Session Expired',
          text2: 'Your session has expired. Please login again.',
          position: 'bottom'
        });
      }, timeUntilExpiry);
      
      setTokenExpiryTimer(timer);
      return true;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return false;
    }
  };

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication status...');
        const currentUser = await authService.getCurrentUser();
        console.log('Auth check result:', currentUser);
        
        if (currentUser) {
          console.log('Setting user in AuthContext:', currentUser);
          setUser(currentUser);
          
          // Set up auto-logout timer
          await checkTokenExpiry();
        } else {
          console.log('No user found in storage');
          setUser(null);
        }
      } catch (error) {
        console.log('Auth check error:', error);
        setUser(null);
      } finally {
        console.log('Auth check complete, setting isLoading to false');
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    // Cleanup timer on unmount
    return () => {
      if (tokenExpiryTimer) {
        clearTimeout(tokenExpiryTimer);
      }
    };
  }, []);

  // Login method
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting login process with email:', email);
      const response = await authService.login({ email, password });
      console.log('Login response received:', response);
      
      if (response && response.user) {
        console.log('Login successful, setting user data:', response.user);
        setUser(response.user);
        
        // Set up auto-logout timer
        await checkTokenExpiry();
        
        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: `Welcome back, ${response.user.name}!`,
          position: 'bottom'
        });
        // Navigation is now handled by ProtectedRoute, not here
        return { success: true };
      } else {
        console.log('Invalid login response format:', response);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      const errorMsg = error.message || 'Login failed';
      setError(errorMsg);
      console.error('Login error details:', error);
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMsg,
        position: 'bottom'
      });
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Signup method
  const signup = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting signup process with name:', name);
      const response = await authService.signup({ name, email, password });
      console.log('Signup response received:', response);
      
      if (response && response.user) {
        console.log('Signup successful with user:', response.user);
        
        // Don't set the user after signup - just show success message
        Toast.show({
          type: 'success',
          text1: 'Signup Successful',
          text2: 'Your account has been created successfully! Please login.',
          position: 'bottom'
        });
        
        // Return success so the calling component can handle navigation
        return { success: true };
      } else {
        console.log('Invalid response format:', response);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      const errorMsg = error.message || 'Signup failed';
      setError(errorMsg);
      console.error('Signup error details:', error);
      Toast.show({
        type: 'error',
        text1: 'Signup Failed',
        text2: errorMsg,
        position: 'bottom'
      });
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout method
  const logout = async () => {
    try {
      console.log('Starting logout process');
      
      // Clear token expiry timer
      if (tokenExpiryTimer) {
        clearTimeout(tokenExpiryTimer);
        setTokenExpiryTimer(null);
      }
      
      // Clear user state first to ensure UI updates immediately
      setUser(null);
      
      // Then clear storage
      await authService.logout();
      
      console.log('Logout completed successfully');
      
      Toast.show({
        type: 'info',
        text1: 'Logged Out',
        text2: 'You have been logged out successfully.',
        position: 'bottom'
      });
      
      // Force redirect to login after logout
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if there's an error, still clear the user state and redirect
      setUser(null);
      router.replace('/login');
      
      Toast.show({
        type: 'error',
        text1: 'Logout Error',
        text2: 'There was an error logging out, but you have been logged out anyway.',
        position: 'bottom'
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        signup,
        logout,
        checkTokenExpiry
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext); 