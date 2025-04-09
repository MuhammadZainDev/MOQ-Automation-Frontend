import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminLayout from '../../src/components/AdminLayout';
import StatCard from '../../src/components/admin/StatCard';
import { adminService } from '../../src/services/adminApi';

// Mock data for stats until the backend endpoints are ready
const MOCK_STATS = {
  totalUsers: 42,
  activeUsers: 36,
  pendingApprovals: 6,
  admins: 2
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(MOCK_STATS);
  const [loading, setLoading] = useState(true);

  // Fetch stats on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Uncomment once backend endpoint is ready
        // const response = await adminService.getUserStats();
        // setStats(response.data);
        
        // For now, use mock data with slight delay to simulate loading
        setTimeout(() => {
          setStats(MOCK_STATS);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1000);
          }}
        >
          {loading ? (
            <ActivityIndicator color="#DF0000" size="small" />
          ) : (
            <Ionicons name="refresh-outline" size={24} color="#DF0000" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        <Text style={styles.sectionTitle}>Overview</Text>
        
        <View style={styles.statsContainer}>
          <StatCard 
            title="Total Users" 
            value={stats.totalUsers} 
            icon="people-outline" 
            color="#3498db" 
          />
          <StatCard 
            title="Active Users" 
            value={stats.activeUsers} 
            icon="checkmark-circle-outline" 
            color="#2ecc71" 
          />
          <StatCard 
            title="Pending Approvals" 
            value={stats.pendingApprovals} 
            icon="time-outline" 
            color="#DF0000" 
          />
          <StatCard 
            title="Administrators" 
            value={stats.admins} 
            icon="shield-checkmark-outline" 
            color="#9b59b6" 
          />
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityContainer}>
          <View style={styles.activityItem}>
            <View style={styles.activityIconContainer}>
              <Ionicons name="person-add-outline" size={24} color="#DF0000" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>
                <Text style={styles.highlight}>John Doe</Text> registered a new account
              </Text>
              <Text style={styles.activityTime}>5 minutes ago</Text>
            </View>
          </View>
          
          <View style={styles.activityItem}>
            <View style={styles.activityIconContainer}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#2ecc71" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>
                <Text style={styles.highlight}>Admin</Text> approved <Text style={styles.highlight}>Jane Smith</Text>'s account
              </Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
          </View>
          
          <View style={styles.activityItem}>
            <View style={styles.activityIconContainer}>
              <Ionicons name="close-circle-outline" size={24} color="#e74c3c" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>
                <Text style={styles.highlight}>Admin</Text> deactivated <Text style={styles.highlight}>Mike Johnson</Text>'s account
              </Text>
              <Text style={styles.activityTime}>1 day ago</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    marginTop: 25,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  activityContainer: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  highlight: {
    color: '#fff',
    fontWeight: 'bold',
  },
  activityTime: {
    color: '#777',
    fontSize: 12,
    marginTop: 5,
  },
}); 