import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  // Add logging to track when this layout mounts
  useEffect(() => {
    const trackTabsLayoutMount = async () => {
      try {
        console.log('TABS LAYOUT MOUNTED - This is the regular user dashboard');
        
        // Check if there's a user in storage and log it
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          console.log('Tabs Layout - Current user from storage:', {
            id: user.id,
            name: user.name, 
            email: user.email,
            role: user.role
          });
          
          // Check if this is an admin user who should be redirected
          if (user.role && user.role.toUpperCase() === 'ADMIN') {
            console.log('WARNING: Admin user loaded into regular tabs layout - should redirect to admin dashboard');
          }
        } else {
          console.log('Tabs Layout - No user found in storage');
        }
      } catch (error) {
        console.error('Error in tabs layout mount:', error);
      }
    };
    
    trackTabsLayoutMount();
    
    return () => {
      console.log('TABS LAYOUT UNMOUNTED');
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#DF0000',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#222',
        },
        headerStyle: {
          backgroundColor: '#000',
        },
        headerTintColor: '#fff',
        tabBarButton: (props) => <HapticTab {...props} />,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color }) => <Ionicons name="wallet-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="graphs"
        options={{
          title: 'Graphs',
          tabBarIcon: ({ color }) => <Ionicons name="bar-chart-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
