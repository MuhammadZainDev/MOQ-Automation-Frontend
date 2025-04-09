import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

type AdminProtectedRouteProps = {
  children: React.ReactNode;
};

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // If not loading and user exists, check role
        if (!isLoading) {
          if (!user) {
            // Not authenticated, redirect to login
            console.log('AdminProtectedRoute - Not authenticated, redirecting to login');
            router.replace('/login');
          } else if (!user.role || user.role.toUpperCase() !== 'ADMIN') {
            // Not an admin or role is missing, redirect to home
            console.log('AdminProtectedRoute - Not admin, redirecting to home');
            console.log('User role:', user.role);
            router.replace('/(tabs)');
          }
          setCheckingAdmin(false);
        }
      } catch (error) {
        console.log('AdminProtectedRoute - Check error:', error);
        router.replace('/login');
      }
    };
    
    checkAdminStatus();
  }, [user, isLoading, router]);

  if (isLoading || checkingAdmin) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DF0000" />
        <Text style={styles.loadingText}>Checking admin privileges...</Text>
      </View>
    );
  }

  // Only if user exists and is admin
  if (user && user.role && user.role.toUpperCase() === 'ADMIN') {
    return <>{children}</>;
  }

  // This should not be reached but for safety
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