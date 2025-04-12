import React, { useEffect, useState, useRef } from 'react';
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
  const hasRedirected = useRef(false);

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/verification-code', '/reset-password'];

  useEffect(() => {
    // Only check on initial mount to avoid loops
    const checkAuthStatus = async () => {
      try {
        console.log('ProtectedRoute - Initial auth check on path:', pathname);
        
        // Prevent multiple redirects
        if (hasRedirected.current) {
          setIsCheckingAuth(false);
          return;
        }
        
        // Check token validity first
        const tokenValid = await checkTokenExpiry();
        const isAuth = await authService.isAuthenticated();
        
        console.log('ProtectedRoute - Auth status:', { tokenValid, isAuth });
        
        // Get current user from storage
        const currentUser = await authService.getCurrentUser();
        console.log('ProtectedRoute - Current User:', currentUser);
        
        // Check if user is on the wrong dashboard after refresh
        if (currentUser && tokenValid && isAuth) {
          const isAdmin = currentUser.role && currentUser.role.toUpperCase() === 'ADMIN';
          
          // If user is admin but on regular dashboard, redirect to admin dashboard
          if (isAdmin && pathname === '/(tabs)') {
            console.log('ProtectedRoute - Admin on user dashboard, redirecting to admin dashboard');
            hasRedirected.current = true;
            router.replace('/admin/');
            return;
          }
          
          // If user is not admin but on admin dashboard, redirect to regular dashboard
          if (!isAdmin && pathname.startsWith('/admin')) {
            console.log('ProtectedRoute - Regular user on admin dashboard, redirecting to user dashboard');
            hasRedirected.current = true;
            router.replace('/(tabs)');
            return;
          }
        }
        
        // Only redirect if we're on the login page and already authenticated with valid token
        if (isAuth && tokenValid && pathname === '/login') {
          console.log('ProtectedRoute - Already authenticated, redirecting based on role');
          hasRedirected.current = true;
          
          if (currentUser && currentUser.role && currentUser.role.toUpperCase() === 'ADMIN') {
            router.replace('/admin/');
          } else {
            router.replace('/(tabs)');
          }
          return;
        }
        
        // Only redirect if we're on a protected route and not authenticated or token expired
        if ((!isAuth || !tokenValid) && !publicRoutes.includes(pathname)) {
          console.log('ProtectedRoute - Not authenticated for protected route, redirecting to login');
          hasRedirected.current = true;
          router.replace('/login');
          return;
        }
        
        setIsCheckingAuth(false);
      } catch (error) {
        console.log('ProtectedRoute - Auth check error:', error);
        
        // If there's an error and we're on a protected route, redirect to login
        if (!publicRoutes.includes(pathname) && !hasRedirected.current) {
          hasRedirected.current = true;
          router.replace('/login');
        } else {
          setIsCheckingAuth(false);
        }
      }
    };
    
    checkAuthStatus();
    
    // Reset the redirection flag when component unmounts
    return () => {
      hasRedirected.current = false;
    };
  }, []); // Empty dependency array - only run on mount
  
  // Handle route access when auth state changes
  useEffect(() => {
    if (!isCheckingAuth && !hasRedirected.current) {
      const handleRouteAccess = async () => {
        // Prevent multiple redirects
        if (hasRedirected.current) return;
        
        try {
          // If user is null (logged out) and on a protected route, navigate to login
          if (!user && !publicRoutes.includes(pathname)) {
            console.log('ProtectedRoute - User logged out, redirecting to login');
            hasRedirected.current = true;
            
            // Use setTimeout to ensure proper navigation
            setTimeout(() => {
              router.replace('/login');
            }, 100);
            return;
          }
          
          // If we're on a protected route, verify token validity
          if (!publicRoutes.includes(pathname)) {
            const tokenValid = await checkTokenExpiry();
            
            if (!tokenValid) {
              console.log('ProtectedRoute - Token expired during navigation, redirecting to login');
              hasRedirected.current = true;
              router.replace('/login');
              return;
            }
            
            // Check if user is on the correct dashboard
            if (user) {
              const isAdmin = user.role && user.role.toUpperCase() === 'ADMIN';
              
              // Admin on wrong dashboard
              if (isAdmin && pathname === '/(tabs)') {
                console.log('ProtectedRoute - Admin on user dashboard, redirecting to admin dashboard');
                hasRedirected.current = true;
                router.replace('/admin/');
                return;
              }
              
              // Regular user on wrong dashboard
              if (!isAdmin && pathname.startsWith('/admin')) {
                console.log('ProtectedRoute - Regular user on admin dashboard, redirecting to user dashboard');
                hasRedirected.current = true;
                router.replace('/(tabs)');
                return;
              }
            }
          }
          
          // Handle auth-based navigation
          if (user && pathname === '/login') {
            hasRedirected.current = true;
            if (user.role && user.role.toUpperCase() === 'ADMIN') {
              router.replace('/admin/');
            } else {
              router.replace('/(tabs)');
            }
          }
        } catch (error) {
          console.log('ProtectedRoute - Route access error:', error);
        }
      };
      
      handleRouteAccess();
    }
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