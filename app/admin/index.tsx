import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AdminLayout from '../../src/components/AdminLayout';

// Mock data for stats
const MOCK_STATS = {
  totalUsers: 42,
  activeUsers: 36,
  pendingApprovals: 6,
  admins: 2
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(MOCK_STATS);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const hasMounted = useRef(false);
  const renderCount = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoaded = useRef(false);
  const isStatsDisplayed = useRef(false);

  // Add logging on mount - with check to prevent double mounting
  useEffect(() => {
    // Skip this effect if it has already run
    if (hasMounted.current) {
      console.log('AdminDashboard - Preventing duplicate mount');
      return;
    }
    
    hasMounted.current = true;
    console.log('AdminDashboard component mounted - pathname:', pathname);
    
    // Simulate loading on mount - but only once
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      
      // Clear any existing timers
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Set new timer
      timerRef.current = setTimeout(() => {
        // Only update state if component is still mounted
        if (hasMounted.current && !isStatsDisplayed.current) {
          isStatsDisplayed.current = true;
          setLoading(false);
          console.log('AdminDashboard loaded - displaying stats');
        }
        timerRef.current = null;
      }, 1000);
    }

    return () => {
      console.log('AdminDashboard component unmounted');
      // Only reset mounted flag when actually changing routes
      if (pathname !== '/admin/') {
        hasMounted.current = false;
      }
      
      // Clear timer on unmount
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [pathname]);

  // Use useEffect for state updates to prevent multiple renders
  useEffect(() => {
    // This runs when loading state changes
    if (!loading && isStatsDisplayed.current) {
      console.log('Stats display confirmed');
    }
  }, [loading]);

  const handleRefresh = () => {
    console.log('AdminDashboard refresh triggered');
    setLoading(true);
    isStatsDisplayed.current = false;
    
    // Clear any existing timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set new timer
    timerRef.current = setTimeout(() => {
      // Only update state if component is still mounted
      if (hasMounted.current && !isStatsDisplayed.current) {
        isStatsDisplayed.current = true;
        setLoading(false);
        console.log('AdminDashboard refreshed - displaying stats');
      }
      timerRef.current = null;
    }, 1000);
  };

  const goToApprovals = () => {
    router.push('/admin/approvals');
  };

  // Control render logging to reduce noise
  renderCount.current += 1;
  if (renderCount.current <= 2) {
    console.log(`Rendering AdminDashboard (render #${renderCount.current}) with stats:`, stats);
  }

  return (
    <AdminLayout>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            {loading ? (
              <ActivityIndicator color="#DF0000" size="small" />
            ) : (
              <Ionicons name="refresh-outline" size={24} color="#DF0000" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Simple Stat Boxes */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Ionicons name="people-outline" size={30} color="#3498db" />
              <Text style={styles.statValue}>{stats.totalUsers}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="checkmark-circle-outline" size={30} color="#2ecc71" />
              <Text style={styles.statValue}>{stats.activeUsers}</Text>
              <Text style={styles.statLabel}>Active Users</Text>
            </View>

            <TouchableOpacity 
              style={[styles.statBox, styles.pendingBox]}
              onPress={goToApprovals}
            >
              <Ionicons name="time-outline" size={30} color="#DF0000" />
              <Text style={styles.statValue}>{stats.pendingApprovals}</Text>
              <Text style={styles.statLabel}>Pending Approvals</Text>
              <View style={styles.manageButton}>
                <Text style={styles.manageText}>Manage</Text>
                <Ionicons name="arrow-forward-outline" size={14} color="#fff" />
              </View>
            </TouchableOpacity>

            <View style={styles.statBox}>
              <Ionicons name="shield-checkmark-outline" size={30} color="#9b59b6" />
              <Text style={styles.statValue}>{stats.admins}</Text>
              <Text style={styles.statLabel}>Administrators</Text>
            </View>
          </View>
          
          {/* Add Last Login Information for consistency with (tabs) dashboard */}
          <View style={styles.lastLoginContainer}>
            <Ionicons name="time-outline" size={20} color="#DF0000" />
            <Text style={styles.lastLoginText}>Last login: {new Date().toLocaleString()}</Text>
          </View>
        </ScrollView>
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(223, 0, 0, 0.1)',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  pendingBox: {
    borderWidth: 1,
    borderColor: '#DF0000',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DF0000',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  manageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 5,
  },
  lastLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
  lastLoginText: {
    color: '#aaa',
    marginLeft: 10,
    fontSize: 14,
  },
}); 