import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../src/services/adminApi';
import { useAuth } from '../../src/context/AuthContext';
import { Colors } from '@/constants/Colors';

export default function EarningsScreen() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        // For now, we're using the analytics data as a placeholder for earnings
        // In a real app, you would have a dedicated earnings endpoint
        const response = await adminService.getCurrentUserAnalytics();
        if (response.success) {
          setEarnings({
            total: response.data.stats * 0.01, // Example calculation
            monthly: response.data.views * 0.005,
            pending: response.data.videos * 1.5,
            lastPayout: 150.75, // Placeholder value
            entries: response.data.entries || []
          });
        } else {
          setError('Could not fetch earnings data');
        }
      } catch (err) {
        console.error('Error fetching earnings:', err);
        setError('An error occurred while fetching earnings data');
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DF0000" />
        <Text style={styles.loadingText}>Loading earnings data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#DF0000" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings Dashboard</Text>
        <Text style={styles.headerSubtitle}>Track your YouTube revenue</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Total Earnings</Text>
          <Text style={styles.statValue}>${earnings?.total.toFixed(2)}</Text>
          <Ionicons name="wallet-outline" size={24} color="#DF0000" style={styles.statIcon} />
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>This Month</Text>
          <Text style={styles.statValue}>${earnings?.monthly.toFixed(2)}</Text>
          <Ionicons name="calendar-outline" size={24} color="#DF0000" style={styles.statIcon} />
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Pending</Text>
          <Text style={styles.statValue}>${earnings?.pending.toFixed(2)}</Text>
          <Ionicons name="hourglass-outline" size={24} color="#DF0000" style={styles.statIcon} />
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Last Payout</Text>
          <Text style={styles.statValue}>${earnings?.lastPayout.toFixed(2)}</Text>
          <Ionicons name="cash-outline" size={24} color="#DF0000" style={styles.statIcon} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Earning History</Text>
        
        {earnings?.entries && earnings.entries.length > 0 ? (
          earnings.entries.map((entry, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyDate}>
                <Text style={styles.historyDateText}>
                  {new Date(entry.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.historyDetails}>
                <Text style={styles.historyTitle}>YouTube Earnings</Text>
                <Text style={styles.historyAmount}>${(entry.views * 0.005).toFixed(2)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#555" />
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#444" />
            <Text style={styles.emptyStateText}>No earnings history yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  header: {
    padding: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#999',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(223, 0, 0, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    position: 'relative',
  },
  statTitle: {
    color: '#999',
    fontSize: 14,
    marginBottom: 5,
  },
  statValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  statIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
    opacity: 0.7,
  },
  section: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  historyDate: {
    backgroundColor: 'rgba(223, 0, 0, 0.2)',
    padding: 8,
    borderRadius: 6,
    marginRight: 15,
  },
  historyDateText: {
    color: '#DF0000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyDetails: {
    flex: 1,
  },
  historyTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 2,
  },
  historyAmount: {
    color: '#DF0000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
    padding: 40,
    borderRadius: 10,
  },
  emptyStateText: {
    color: '#555',
    marginTop: 10,
    fontSize: 16,
  },
}); 