import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { adminService } from '../../src/services/adminApi';
import { useAuth } from '../../src/context/AuthContext';

const { width } = Dimensions.get('window');

export default function GraphsScreen() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChart, setSelectedChart] = useState('line');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await adminService.getCurrentUserAnalytics();
        if (response.success) {
          setAnalytics(response.data);
        } else {
          setError('Could not fetch analytics data');
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('An error occurred while fetching analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DF0000" />
        <Text style={styles.loadingText}>Loading analytics data...</Text>
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

  // Generate mock data if we don't have enough real data
  const generateMockData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    let viewsData;
    
    if (analytics?.entries && analytics.entries.length >= 6) {
      // Use real data if available
      viewsData = analytics.entries.slice(0, 6).map(entry => entry.views || 0);
    } else {
      // Generate mock data as fallback
      viewsData = [20, 45, 28, 80, 99, 43];
    }
    
    return {
      months,
      viewsData,
      pieData: [
        {
          name: "Views",
          population: analytics?.views || 100,
          color: "#DF0000",
          legendFontColor: "#FFF",
          legendFontSize: 15
        },
        {
          name: "Videos",
          population: analytics?.videos || 25,
          color: "#3498DB",
          legendFontColor: "#FFF",
          legendFontSize: 15
        },
        {
          name: "Premium Views",
          population: analytics?.premium_country_views || 15,
          color: "#F39C12",
          legendFontColor: "#FFF",
          legendFontSize: 15
        }
      ]
    };
  };

  const data = generateMockData();

  const chartConfig = {
    backgroundGradientFrom: "#111",
    backgroundGradientTo: "#111",
    color: (opacity = 1) => `rgba(223, 0, 0, ${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 0,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16
    },
  };

  const lineChartData = {
    labels: data.months,
    datasets: [
      {
        data: data.viewsData,
        color: (opacity = 1) => `rgba(223, 0, 0, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ["Views"]
  };

  const barChartData = {
    labels: data.months,
    datasets: [
      {
        data: data.viewsData
      }
    ]
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics Graphs</Text>
        <Text style={styles.headerSubtitle}>Visualize your channel performance</Text>
      </View>

      <View style={styles.chartTypeSelector}>
        <View style={styles.chartButtons}>
          <View 
            style={[
              styles.chartButton, 
              selectedChart === 'line' && styles.selectedChartButton
            ]}
            onTouchEnd={() => setSelectedChart('line')}
          >
            <Ionicons 
              name="analytics-outline" 
              size={20} 
              color={selectedChart === 'line' ? '#DF0000' : '#777'} 
            />
            <Text style={[
              styles.chartButtonText,
              selectedChart === 'line' && styles.selectedChartButtonText
            ]}>Line</Text>
          </View>
          
          <View 
            style={[
              styles.chartButton, 
              selectedChart === 'bar' && styles.selectedChartButton
            ]}
            onTouchEnd={() => setSelectedChart('bar')}
          >
            <Ionicons 
              name="bar-chart-outline" 
              size={20} 
              color={selectedChart === 'bar' ? '#DF0000' : '#777'} 
            />
            <Text style={[
              styles.chartButtonText,
              selectedChart === 'bar' && styles.selectedChartButtonText
            ]}>Bar</Text>
          </View>
          
          <View 
            style={[
              styles.chartButton, 
              selectedChart === 'pie' && styles.selectedChartButton
            ]}
            onTouchEnd={() => setSelectedChart('pie')}
          >
            <Ionicons 
              name="pie-chart-outline" 
              size={20} 
              color={selectedChart === 'pie' ? '#DF0000' : '#777'} 
            />
            <Text style={[
              styles.chartButtonText,
              selectedChart === 'pie' && styles.selectedChartButtonText
            ]}>Pie</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {selectedChart === 'line' && (
          <>
            <Text style={styles.chartTitle}>Monthly Views</Text>
            <LineChart
              data={lineChartData}
              width={width - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </>
        )}

        {selectedChart === 'bar' && (
          <>
            <Text style={styles.chartTitle}>Monthly Views</Text>
            <BarChart
              data={barChartData}
              width={width - 40}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              yAxisLabel=""
              yAxisSuffix=""
            />
          </>
        )}

        {selectedChart === 'pie' && (
          <>
            <Text style={styles.chartTitle}>Channel Metrics Distribution</Text>
            <PieChart
              data={data.pieData}
              width={width - 40}
              height={220}
              chartConfig={chartConfig}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              style={styles.chart}
            />
          </>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>Current Statistics</Text>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={24} color="#DF0000" />
            <Text style={styles.statValue}>{analytics?.views || 0}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="videocam-outline" size={24} color="#DF0000" />
            <Text style={styles.statValue}>{analytics?.videos || 0}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="globe-outline" size={24} color="#DF0000" />
            <Text style={styles.statValue}>{analytics?.premium_country_views || 0}</Text>
            <Text style={styles.statLabel}>Premium Views</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="stats-chart-outline" size={24} color="#DF0000" />
            <Text style={styles.statValue}>{analytics?.stats || 0}</Text>
            <Text style={styles.statLabel}>Stats</Text>
          </View>
        </View>
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
    paddingBottom: 10,
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
  chartTypeSelector: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  chartButtons: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 5,
  },
  chartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectedChartButton: {
    backgroundColor: 'rgba(223, 0, 0, 0.1)',
  },
  chartButtonText: {
    color: '#777',
    marginLeft: 5,
    fontWeight: '500',
  },
  selectedChartButtonText: {
    color: '#DF0000',
  },
  chartContainer: {
    padding: 20,
    backgroundColor: '#111',
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  chartTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  chart: {
    borderRadius: 10,
    paddingRight: 10,
  },
  statsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: 'rgba(223, 0, 0, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statLabel: {
    color: '#999',
    fontSize: 14,
    marginTop: 5,
  },
}); 