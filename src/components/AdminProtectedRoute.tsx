import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AdminProtectedRouteProps = {
  children: React.ReactNode;
};

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, checkTokenExpiry } = useAuth();
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [hasStoredAdmin, setHasStoredAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);
  const hasCheckedStatus = useRef(false);

  // Add component tracking log with limited frequency
  const renderCount = useRef(0);
  renderCount.current += 1;
  
  if (renderCount.current <= 2) {
    console.log('AdminProtectedRoute rendered with user:', user ? {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    } : 'No user', 'pathname:', pathname, 'render #', renderCount.current);
  }

  // Check if there's an admin user in storage
  useEffect(() => {
    // Skip if we've already checked and found an admin
    if (hasStoredAdmin) {
      return;
    }
    
    const checkStoredAdmin = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const storedUser = JSON.parse(userStr);
          if (storedUser && storedUser.role && storedUser.role.toUpperCase() === 'ADMIN') {
            console.log('AdminProtectedRoute - Found admin user in storage');
            setHasStoredAdmin(true);
            setCheckingAdmin(false);  // Skip additional admin check if found in storage
          } else {
            setHasStoredAdmin(false);
          }
        } else {
          setHasStoredAdmin(false);
        }
      } catch (error) {
        console.error('Error checking stored user:', error);
        setHasStoredAdmin(false);
      }
    };
    
    checkStoredAdmin();
  }, [hasStoredAdmin]);

  useEffect(() => {
    // Skip admin check if it's already been done or if admin was found in storage
    if (hasCheckedStatus.current || hasStoredAdmin) {
      console.log('AdminProtectedRoute - Skipping admin check (already done or admin found in storage)');
      setCheckingAdmin(false);
      return;
    }
    
    hasCheckedStatus.current = true;
    
    const checkAdminStatus = async () => {
      try {
        console.log('AdminProtectedRoute - Checking admin status on path:', pathname);
        // If not loading and user exists, check role
        if (!hasRedirected.current) {
          // Check token validity first
          const tokenValid = await checkTokenExpiry();
          console.log('AdminProtectedRoute - Token valid:', tokenValid);
          
          if (!tokenValid) {
            console.log('AdminProtectedRoute - Token expired, redirecting to login');
            hasRedirected.current = true;
            router.replace('/login');
            return;
          }
          
          // Get user from storage directly to ensure fresh data
          const userStr = await AsyncStorage.getItem('user');
          const storedUser = userStr ? JSON.parse(userStr) : null;
          
          // Log storage info only if needed
          if (!user && storedUser) {
            console.log('AdminProtectedRoute - User found in storage but not in context');
          }
          
          // Check if we have a user either in context or storage
          const effectiveUser = user || storedUser;
          
          if (!effectiveUser) {
            // Not authenticated, redirect to login
            console.log('AdminProtectedRoute - Not authenticated, redirecting to login');
            hasRedirected.current = true;
            router.replace('/login');
            return;
          } 
          
          // Check for admin role
          const isAdmin = effectiveUser.role && effectiveUser.role.toUpperCase() === 'ADMIN';
          
          if (!isAdmin) {
            // Not an admin, redirect to home
            console.log('AdminProtectedRoute - Not admin, redirecting to home');
            console.log('User role:', effectiveUser.role);
            hasRedirected.current = true;
            router.replace('/(tabs)');
            return;
          }
          
          console.log('AdminProtectedRoute - User is admin, allowing access');
          setCheckingAdmin(false);
        }
      } catch (error) {
        console.log('AdminProtectedRoute - Check error:', error);
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          router.replace('/login');
        }
      }
    };
    
    checkAdminStatus();
    
    // Reset the flags when component unmounts
    return () => {
      // Only reset flags if actually navigating away from admin routes
      if (!pathname.startsWith('/admin')) {
        console.log('AdminProtectedRoute - Unmounting and resetting flags');
        hasRedirected.current = false;
        hasCheckedStatus.current = false;
      } else {
        console.log('AdminProtectedRoute - Unmounting but keeping flags for admin routes');
      }
    };
  }, [user, router, pathname, hasStoredAdmin, checkTokenExpiry]);

  if (checkingAdmin && !hasStoredAdmin) {
    // Only show loading if we're actually checking admin status
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DF0000" />
        <Text style={styles.loadingText}>Checking admin privileges...</Text>
      </View>
    );
  }

  // If user exists and is admin, or we found an admin in storage, render children
  const isAdmin = (user && user.role && user.role.toUpperCase() === 'ADMIN') || hasStoredAdmin;
  
  if (isAdmin) {
    if (renderCount.current <= 2) {
      console.log('AdminProtectedRoute - Rendering admin content');
    }
    return <>{children}</>;
  }

  // This should not be reached but for safety
  console.log('AdminProtectedRoute - Fallback return null case reached');
  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#ccc',
    marginTop: 10,
    fontSize: 16,
  },
}); 