import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user, isLoading, logout } = useAuth();

  // Debugging - add console logs
  console.log('Home Screen - isLoading:', isLoading);
  console.log('Home Screen - Current User:', user);
  console.log('Home Screen - Logout Function:', logout ? 'Available' : 'Not Available');

  // If still checking authentication, show loading indicator
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DF0000" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If no user is found after loading completes, redirect to login
  if (!user) {
    console.log('Home Screen - No user found, user object is null or undefined');
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.message}>Not logged in</Text>
      </View>
    );
  }

  // User is available, log detailed info
  console.log('Home Screen - User found:', {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });

  const handleLogout = () => {
    console.log('Logout button pressed');
    try {
      if (logout) {
        console.log('Calling logout function');
        logout();
      } else {
        console.error('Logout function is not available');
        Alert.alert('Error', 'Could not logout. Please try again later.');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'An error occurred during logout');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.nameText}>{user.name}</Text>
            </View>
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.dashboardCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="stats-chart" size={24} color="#DF0000" />
            <Text style={styles.cardTitle}>Dashboard</Text>
          </View>
          <Text style={styles.cardDescription}>
            This is your MOQ Automation dashboard. You can view your business stats and automation tasks here.
          </Text>
        </View>
        
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Features</Text>
          
          <View style={styles.featureRow}>
            <View style={styles.featureCard}>
              <Ionicons name="analytics-outline" size={30} color="#DF0000" style={styles.featureIcon} />
              <Text style={styles.featureTitle}>Analytics</Text>
            </View>
            
            <View style={styles.featureCard}>
              <Ionicons name="cart-outline" size={30} color="#DF0000" style={styles.featureIcon} />
              <Text style={styles.featureTitle}>Orders</Text>
            </View>
          </View>
          
          <View style={styles.featureRow}>
            <View style={styles.featureCard}>
              <Ionicons name="cube-outline" size={30} color="#DF0000" style={styles.featureIcon} />
              <Text style={styles.featureTitle}>Products</Text>
            </View>
            
            <View style={styles.featureCard}>
              <Ionicons name="settings-outline" size={30} color="#DF0000" style={styles.featureIcon} />
              <Text style={styles.featureTitle}>Settings</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.statusItem}>
            <View style={styles.statusIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.statusText}>All systems operational</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={styles.statusIcon}>
              <Ionicons name="time-outline" size={20} color="#DF0000" />
            </View>
            <Text style={styles.statusText}>Last login: {new Date().toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: '#999',
  },
  nameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DF0000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  dashboardCard: {
    backgroundColor: '#111',
    margin: 15,
    borderRadius: 10,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  cardDescription: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
  },
  featuresSection: {
    padding: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  featureCard: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 15,
    flex: 0.48,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  featureIcon: {
    marginBottom: 10,
  },
  featureTitle: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statusSection: {
    padding: 15,
    marginBottom: 30,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  statusIcon: {
    marginRight: 10,
  },
  statusText: {
    color: '#fff',
  },
});
