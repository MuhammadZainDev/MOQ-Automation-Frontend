import React, { useEffect, useRef } from 'react';
import { Stack, usePathname } from 'expo-router';
import AdminProtectedRoute from '../../src/components/AdminProtectedRoute';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminLayout() {
  // Use ref to track if we've already mounted
  const hasMounted = useRef(false);
  const pathname = usePathname();
  const initialRenderComplete = useRef(false);

  // Add logging to track when this layout mounts
  useEffect(() => {
    // Only run this effect once per path
    if (hasMounted.current && pathname === '/admin/') {
      console.log('Preventing duplicate AdminLayout mount for same path');
      return;
    }
    
    hasMounted.current = true;
    
    const trackAdminLayoutMount = async () => {
      try {
        console.log('ADMIN LAYOUT MOUNTED - This is the admin dashboard');
        console.log('Current path:', pathname);
        
        // Check if there's a user in storage and log it
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          console.log('Admin Layout - Current user from storage:', {
            id: user.id,
            name: user.name, 
            email: user.email,
            role: user.role
          });
        } else {
          console.log('Admin Layout - No user found in storage');
        }

        // Mark initial render complete
        setTimeout(() => {
          initialRenderComplete.current = true;
        }, 500);
      } catch (error) {
        console.error('Error in admin layout mount:', error);
      }
    };
    
    trackAdminLayoutMount();
    
    return () => {
      console.log('ADMIN LAYOUT UNMOUNTED');
      // Only reset the flag when actually changing routes
      if (pathname !== '/admin/') {
        hasMounted.current = false;
      }
    };
  }, [pathname]);

  return (
    <AdminProtectedRoute>
      <Stack screenOptions={{
        animation: initialRenderComplete.current ? 'default' : 'none'
      }}>
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
            title: 'Admin Dashboard'
          }} 
        />
        <Stack.Screen 
          name="approvals" 
          options={{ 
            headerShown: false,
            title: 'User Approvals'
          }} 
        />
        <Stack.Screen 
          name="users" 
          options={{ 
            headerShown: false,
            title: 'Manage Users'
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            headerShown: false,
            title: 'Admin Settings'
          }} 
        />
        <Stack.Screen 
          name="userDetail" 
          options={{ 
            headerShown: false,
            title: 'User Details'
          }} 
        />
        <Stack.Screen 
          name="thresholds" 
          options={{ 
            headerShown: false,
            title: 'User Thresholds'
          }} 
        />
        <Stack.Screen 
          name="thresholdDetail" 
          options={{ 
            headerShown: false,
            title: 'Threshold Details'
          }} 
        />
      </Stack>
    </AdminProtectedRoute>
  );
} 