import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../services/authApi';
import axios from 'axios';

// User type definition
type User = {
  id: number | string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  profile_picture?: string;
};

// Auth context type definition
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  verifyResetCode: (email: string, resetCode: string) => Promise<any>;
  resetPassword: (email: string, resetCode: string, newPassword: string) => Promise<any>;
  checkTokenExpiry: () => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<any>;
  clearError: () => void;
  verifyCode: (email: string, code: string) => Promise<any>;
  updateName: (newName: string) => Promise<any>;
  updateProfilePicture: (pictureUrl: string) => Promise<{success: boolean, error?: string, user?: User}>;
};

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: async () => {},
  checkTokenExpiry: async () => false,
  forgotPassword: async () => ({ success: false }),
  verifyResetCode: async () => ({ success: false }),
  resetPassword: async () => ({ success: false }),
  register: async () => ({ success: false }),
  clearError: () => {},
  verifyCode: async () => ({ success: false }),
  updateName: async () => ({ success: false }),
  updateProfilePicture: async () => ({ success: false }),
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
    } catch (error: any) {
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
      } catch (error: any) {
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
        
        // Check user role and redirect accordingly
        if (response.user.role && response.user.role.toUpperCase() === 'ADMIN') {
          console.log('Admin user detected, redirecting to admin dashboard');
          setTimeout(() => {
            router.replace('/admin/' as any);
          }, 300);
        } else {
          console.log('Regular user detected, redirecting to home');
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 300);
        }
        
        return { success: true };
      } else {
        console.log('Invalid login response format:', response);
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
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
      
      // Then clear storage before updating UI state
      await authService.logout();
      
      console.log('Logout completed successfully');
      
      // Clear user state immediately - don't use setTimeout which can cause issues
      setUser(null);
      
      Toast.show({
        type: 'info',
        text1: 'Logged Out',
        text2: 'You have been logged out successfully.',
        position: 'bottom'
      });
      
      // Explicitly navigate to login page
      setTimeout(() => {
        router.replace('/login' as any);
      }, 100);
      
      // The ProtectedRoute component will handle the redirection
      console.log('User state cleared after logout');
    } catch (error: any) {
      console.error('Logout error:', error);
      
      // Even if there's an error, still clear the user state immediately
      setUser(null);
      
      // Also redirect to login page after error
      setTimeout(() => {
        router.replace('/login' as any);
      }, 100);
      
      Toast.show({
        type: 'error',
        text1: 'Logout Error',
        text2: 'There was an error logging out, but you have been logged out anyway.',
        position: 'bottom'
      });
    }
  };

  // Forgot password method
  const forgotPassword = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting forgot password process for email:', email);
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Code Sent',
          text2: 'If your email is registered, you will receive a reset code.',
          position: 'bottom'
        });
        
        return { success: true, email };
      }
    } catch (error) {
      const errorMsg = error.message || 'Failed to send reset code';
      setError(errorMsg);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMsg,
        position: 'bottom'
      });
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Verify reset code method
  const verifyResetCode = async (email: string, resetCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Verifying reset code for email:', email, 'code:', resetCode);
      
      const response = await authService.verifyResetCode(email, resetCode);
      console.log("Verification API response:", response);
      
      // Check if the response indicates success
      if (response && response.valid === true) {
        Toast.show({
          type: 'success',
          text1: 'Code Verified',
          text2: 'Reset code verified successfully.',
          position: 'bottom'
        });
        
        return { success: true, email, resetCode };
      } else {
        const errorMsg = 'Invalid or expired verification code';
        setError(errorMsg);
        Toast.show({
          type: 'error',
          text1: 'Verification Failed',
          text2: errorMsg,
          position: 'bottom'
        });
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      const errorMsg = error.message || 'Invalid or expired code';
      setError(errorMsg);
      console.error("Verification error:", error);
      
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: errorMsg,
        position: 'bottom'
      });
      
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset password method
  const resetPassword = async (email: string, resetCode: string, newPassword: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Resetting password for email:', email);
      const response = await authService.resetPassword(email, resetCode, newPassword);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Password Reset',
          text2: 'Your password has been reset successfully. Please login with your new password.',
          position: 'bottom'
        });
        
        return { success: true };
      }
    } catch (error) {
      const errorMsg = error.message || 'Failed to reset password';
      setError(errorMsg);
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: errorMsg,
        position: 'bottom'
      });
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
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

  const clearError = () => {
    setError(null);
  };

  const verifyCode = async (email: string, code: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Verifying reset code for email:', email);
      const response = await authService.verifyResetCode(email, code);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Code Verified',
          text2: 'Reset code verified successfully.',
          position: 'bottom'
        });
        
        return { success: true, email, resetCode: code };
      }
    } catch (error) {
      const errorMsg = error.message || 'Failed to verify code';
      setError(errorMsg);
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: errorMsg,
        position: 'bottom'
      });
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const updateName = async (newName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting name update process with new name:', newName);
      const response = await authApi.updateUserName(newName);
      console.log('Name update response received:', response);
      
      if (response && response.user) {
        console.log('Name update successful, updating user data:', response.user);
        setUser(response.user);
        
        Toast.show({
          type: 'success',
          text1: 'Name Updated',
          text2: 'Your profile name has been updated successfully!',
          position: 'bottom'
        });
        
        return { success: true };
      } else {
        console.log('Invalid response format:', response);
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Name update failed';
      setError(errorMsg);
      console.error('Name update error details:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: errorMsg,
        position: 'bottom'
      });
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfilePicture = async (pictureUrl: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await authApi.updateProfilePicture(pictureUrl);
      
      if (response.status === 'success') {
        // Immediately update the user state with the new profile picture
        setUser(prevUser => {
          if (!prevUser) return null;
          
          const updatedUser = { 
            ...prevUser, 
            profile_picture: pictureUrl 
          };
          
          // Also persist the updated user info to AsyncStorage
          AsyncStorage.setItem('user', JSON.stringify(updatedUser))
            .catch(error => console.error('Error saving updated user to AsyncStorage:', error));
            
          return updatedUser;
        });
        
        Toast.show({
          type: 'success',
          text1: 'Profile picture updated',
          position: 'bottom'
        });
        
        return { success: true };
      } else {
        console.error('Failed to update profile picture:', response);
        return { success: false, error: response.message || 'Failed to update profile picture' };
      }
    } catch (error: any) {
      console.error('Error updating profile picture:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  };

  const contextValue = {
        user,
        isLoading,
        error,
        login,
    logout,
        signup,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    checkTokenExpiry,
    register,
    clearError,
    verifyCode,
    updateName,
    updateProfilePicture,
  };

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext); 