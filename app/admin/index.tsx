import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AdminLayout from '../../src/components/AdminLayout';
import { adminService } from '../../src/services/adminApi';

// Initial empty stats
const initialStats = {
  totalUsers: 0,
  pendingApprovals: 0,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const hasMounted = useRef(false);
  const renderCount = useRef(0);
  const isStatsDisplayed = useRef(false);

  // Fetch stats from API
  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Get total users
      const usersResponse = await adminService.getAllUsers();
      const totalUsers = usersResponse.count || 0;
      
      // Get pending approvals
      const pendingResponse = await adminService.getPendingApprovals();
      const pendingApprovals = pendingResponse.count || 0;
      
      setStats({
        totalUsers,
        pendingApprovals
      });
      
      isStatsDisplayed.current = true;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      Alert.alert('Error', 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  // Add logging on mount - with check to prevent double mounting
  useEffect(() => {
    // Skip this effect if it has already run
    if (hasMounted.current) {
      console.log('AdminDashboard - Preventing duplicate mount');
      return;
    }
    
    hasMounted.current = true;
    console.log('AdminDashboard component mounted - pathname:', pathname);
    
    // Fetch stats on mount
    fetchStats();

    return () => {
      console.log('AdminDashboard component unmounted');
      // Only reset mounted flag when actually changing routes
      if (pathname !== '/admin/') {
        hasMounted.current = false;
      }
    };
  }, [pathname]);

  const handleRefresh = () => {
    console.log('AdminDashboard refresh triggered');
    fetchStats();
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
            <TouchableOpacity 
              style={styles.statBox}
              onPress={() => router.push('/admin/users')}
            >
              <Ionicons name="people-outline" size={30} color="#3498db" />
              <Text style={styles.statValue}>{stats.totalUsers}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.statBox}
              onPress={goToApprovals}
            >
              <Ionicons name="time-outline" size={30} color="#DF0000" />
              <Text style={styles.statValue}>{stats.pendingApprovals}</Text>
              <Text style={styles.statLabel}>Pending Approvals</Text>
            </TouchableOpacity>
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
    backgroundColor: '#000',
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
    height: 140,
    justifyContent: 'center',
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