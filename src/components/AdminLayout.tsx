import React, { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

type AdminLayoutProps = {
  children: React.ReactNode;
};

// Use memo to prevent unnecessary re-renders
const AdminLayout = memo(function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const hasMounted = useRef(false);
  const renderCount = useRef(0);

  // Add logging to track component lifecycle
  useEffect(() => {
    // Skip if already mounted
    if (hasMounted.current) {
      return;
    }
    
    hasMounted.current = true;
    console.log('AdminLayout mounted');
    
    return () => {
      console.log('AdminLayout unmounted');
      hasMounted.current = false;
    };
  }, []);

  // Control render logging
  renderCount.current += 1;
  if (renderCount.current <= 2) {
    console.log(`AdminLayout rendering with children (render #${renderCount.current})`);
  }

  const handleLogout = async () => {
    console.log('AdminLayout - Logout button pressed');
    await logout();
  };

  // Create a stable header section that doesn't re-render with children
  const header = (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>MOQ Admin</Text>
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={22} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      {header}

      {/* Main Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#111',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
});

export default AdminLayout; 