import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

type AdminLayoutProps = {
  children: ReactNode;
};

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled by AuthContext
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MOQ Admin</Text>
        
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <TouchableOpacity 
            style={[styles.navItem, styles.activeNavItem]}
            onPress={() => router.push('/admin')}
          >
            <Ionicons name="grid-outline" size={24} color="#DF0000" />
            <Text style={styles.activeNavText}>Dashboard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/admin/users')}
          >
            <Ionicons name="people-outline" size={24} color="#aaa" />
            <Text style={styles.navText}>Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/admin/approvals')}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#aaa" />
            <Text style={styles.navText}>Approvals</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/admin/settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#aaa" />
            <Text style={styles.navText}>Settings</Text>
          </TouchableOpacity>
        </View>
        
        {/* Main Content */}
        <View style={styles.mainContent}>
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 220,
    backgroundColor: '#111',
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 6,
  },
  activeNavItem: {
    backgroundColor: 'rgba(223, 0, 0, 0.1)',
  },
  navText: {
    color: '#aaa',
    marginLeft: 12,
    fontSize: 16,
  },
  activeNavText: {
    color: '#DF0000',
    marginLeft: 12,
    fontSize: 16,
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0d0d0d',
  },
});

export default AdminLayout; 