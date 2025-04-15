import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../src/services/api';

export default function Index() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        // Check if user has seen welcome screens
        const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
        
        // For development mode - always show welcome screens
        // Remove the following line in production
        await AsyncStorage.removeItem('hasSeenWelcome');
        
        if (!hasSeenWelcome) {
          // First time user, show welcome screen
          setInitialRoute('/welcome1');
        } else {
          // Check authentication status
          const isAuthenticated = await authService.isAuthenticated();
          
          if (isAuthenticated) {
            // Get user and check role
            const user = await authService.getCurrentUser();
            
            if (user && user.role && user.role.toUpperCase() === 'ADMIN') {
              setInitialRoute('/admin/');
            } else {
              setInitialRoute('/(tabs)');
            }
          } else {
            // Not authenticated, go to login
            setInitialRoute('/login');
          }
        }
      } catch (error) {
        console.error('Error determining initial route:', error);
        setInitialRoute('/login'); // Fallback to login
      } finally {
        setIsLoading(false);
      }
    };
    
    checkFirstLaunch();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#DF0000" />
      </View>
    );
  }

  return initialRoute ? <Redirect href={initialRoute} /> : null;
} 