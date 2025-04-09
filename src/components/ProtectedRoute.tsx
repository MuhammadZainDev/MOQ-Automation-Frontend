import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter, usePathname } from 'expo-router';
import { authService } from '../services/api';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, checkTokenExpiry } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/verification-code', '/reset-password'];

  useEffect(() => {
    // Only check on initial mount to avoid loops
    const checkAuthStatus = async () => {
      try {
        console.log('ProtectedRoute - Initial auth check on path:', pathname);
        
        // Check if token is expired - this will automatically redirect to login if needed
        const tokenValid = await checkTokenExpiry();
        const isAuth = await authService.isAuthenticated();
        
        console.log('ProtectedRoute - Auth status:', { tokenValid, isAuth });
        
        // Only redirect if we're on the login page and already authenticated with valid token
        if (isAuth && tokenValid && pathname === '/login') {
          console.log('ProtectedRoute - Already authenticated, redirecting to home');
          router.replace('/(tabs)');
        }
        
        // Only redirect if we're on a protected route and not authenticated or token expired
        if ((!isAuth || !tokenValid) && !publicRoutes.includes(pathname)) {
          console.log('ProtectedRoute - Not authenticated for protected route, redirecting to login');
          router.replace('/login');
        }
      } catch (error) {
        console.log('ProtectedRoute - Auth check error:', error);
        
        // If there's an error, redirect to login for protected routes
        if (!publicRoutes.includes(pathname)) {
          router.replace('/login');
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuthStatus();
  }, []); // Empty dependency array - only run on mount
  
  // Handle manual navigation between routes based on auth state changes
  useEffect(() => {
    const checkRouteAccess = async () => {
      if (!isCheckingAuth) {
        // Check token expiry on each route change for protected routes
        if (!publicRoutes.includes(pathname)) {
          const tokenValid = await checkTokenExpiry();
          
          if (!tokenValid) {
            console.log('ProtectedRoute - Token expired during navigation, redirecting to login');
            router.replace('/login');
            return;
          }
        }
        
        // Regular route protection logic
        if (user && pathname === '/login') {
          router.replace('/(tabs)');
        } else if (!user && !publicRoutes.includes(pathname)) {
          router.replace('/login');
        }
      }
    };
    
    checkRouteAccess();
  }, [user, pathname, isCheckingAuth]);

  // Show loading indicator only during initial check
  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DF0000" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
}); 