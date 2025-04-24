import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { getUserThresholds } from '../../src/services/thresholdApi';
import { useFocusEffect } from '@react-navigation/native';

// Define types
type Threshold = {
  id: string;
  name: string;
  amount: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  current?: number;
  type?: string;
  music_revenue?: number;
  adsense_revenue?: number;
  entries?: Array<{
    id: string;
    amount: number;
    threshold_id: string;
    created_at: string;
    updated_at: string;
    revenue_type?: string;
  }>;
};

// Progress bar component
const ProgressBar: React.FC<{progress: number; color?: string; height?: number}> = ({ 
  progress, 
  color = '#DF0000', 
  height = 8 
}) => {
  // Make sure progress is a valid number
  const validProgress = typeof progress === 'number' && !isNaN(progress) ? progress : 0;
  
  // Cap progress at 100%
  const cappedProgress = validProgress > 100 ? 100 : validProgress;
  
  return (
    <View style={[styles.progressContainer, { height }]}>
      <View 
        style={[
          styles.progressBar, 
          { 
            width: `${cappedProgress}%`,
            backgroundColor: color || '#DF0000' 
          }
        ]} 
      />
    </View>
  );
};

// Threshold card component
const ThresholdCard: React.FC<{
  threshold: Threshold;
}> = ({ 
  threshold
}) => {
  const { name, amount, current = 0, type = 'youtube' } = threshold;
  
  // Choose icon based on type
  const getIconByType = (type: string): string => {
    return 'logo-youtube';
  };

  // Get the revenues directly from the threshold object,
  // exactly like in admin dashboard
  const musicRevenue = typeof threshold.music_revenue === 'number' ? threshold.music_revenue : 0;
  const adsenseRevenue = typeof threshold.adsense_revenue === 'number' ? threshold.adsense_revenue : 0;
  
  // Calculate total revenue - same as admin dashboard
  const totalRevenue = musicRevenue + adsenseRevenue;
  
  // Use total revenue as the current value - same as admin
  const effectiveCurrent = totalRevenue;
  
  // Calculate progress with safe check
  console.log(`Threshold card: name=${name}, amount=${amount}, effectiveCurrent=${effectiveCurrent}`);
  const progress = amount > 0 ? (effectiveCurrent / amount) * 100 : 0;
  
  // Check if threshold is completed (100% or more)
  const isCompleted = progress >= 100;
  
  // Use red color for all progress bars
  const color = '#DF0000'; 
  const iconName = getIconByType(type);
  
  return (
    <View style={[styles.card, isCompleted && styles.completedCard]}>
      <View style={styles.cardHeader}>
        <Ionicons name={iconName as any} size={22} color="#DF0000" />
        <Text style={styles.cardTitle}>{name}</Text>
      </View>
      
      <Text style={styles.amountValue}>${effectiveCurrent.toFixed(2)}</Text>
      
      <View style={styles.progressBarWrapper}>
        <ProgressBar progress={progress} color={color} height={6} />
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressPercentage}>{Math.round(progress)}% complete</Text>
          <Text style={styles.targetValue}>${amount}</Text>
        </View>
      </View>
      
      <View style={styles.revenueBreakdown}>
        <View style={styles.revenueItem}>
          <View style={styles.revenueRow}>
            <View style={[styles.bulletDot, {backgroundColor: '#00D95F'}]} />
            <Text style={styles.revenueLabel}>Music Revenue: ${musicRevenue.toFixed(2)}</Text>
          </View>
        </View>
        
        <View style={styles.revenueItem}>
          <View style={styles.revenueRow}>
            <View style={[styles.bulletDot, {backgroundColor: '#4285F4'}]} />
            <Text style={styles.revenueLabel}>Adsense Revenue: ${adsenseRevenue.toFixed(2)}</Text>
          </View>
        </View>
      </View>
      
      {/* Completed overlay - only shown when 100% complete */}
      {isCompleted && (
        <View style={styles.completedOverlay}>
          <View style={styles.completedContent}>
            <View style={styles.checkmarkCircle}>
              <Ionicons name="checkmark-sharp" size={24} color="#fff" />
            </View>
            <Text style={styles.completedText}>COMPLETED</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const ThresholdScreen: React.FC = () => {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadThresholds = async () => {
    try {
      setLoading(true);
      const response = await getUserThresholds();
      
      if (response.success && response.data) {
        console.log('Thresholds loaded:', response.data);
        setThresholds(response.data);
      } else {
        console.error('Unexpected response format:', response);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load threshold data',
        });
      }
    } catch (error) {
      console.error('Error loading thresholds:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Failed to load threshold data',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadThresholds();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadThresholds();
  };

  useFocusEffect(
    useCallback(() => {
      loadThresholds();
    }, []),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Thresholds</Text>
        <Text style={styles.pageSubtitle}>Your earnings progress thresholds</Text>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DF0000" />
        </View>
      ) : (
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#DF0000"]} />
          }
        >
          {thresholds.length > 0 ? (
            <>
              {thresholds.map((threshold) => (
                <ThresholdCard
                  key={threshold.id}
                  threshold={threshold}
                />
              ))}
              
              <View style={styles.explanationCard}>
                <Text style={styles.explanationText}>
                  A threshold holder is a revenue target. Once the target is met, earnings stop, and the cycle resets for the next one.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-outline" size={64} color="#444" />
              <Text style={styles.emptyText}>No thresholds available</Text>
              <Text style={styles.emptySubtext}>
                Thresholds will appear here when created by an administrator
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    marginTop: Platform.OS === 'ios' ? 10 : 30,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 10,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  amountValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  progressContainer: {
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
  },
  progressBarWrapper: {
    marginBottom: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: '#888',
  },
  targetValue: {
    fontSize: 14,
    color: '#888',
  },
  revenueBreakdown: {
    marginTop: 5,
  },
  revenueItem: {
    marginBottom: 6,
  },
  revenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
    backgroundColor: '#00D95F', // Default color, will be overridden
  },
  revenueLabel: {
    fontSize: 13,
    color: '#888',
  },
  explanationCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  explanationText: {
    fontSize: 14,
    color: '#888',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    height: 300,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  completedCard: {
    borderColor: '#DF0000',
    borderWidth: 2,
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)', // Darker overlay
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    zIndex: 10,
  },
  completedContent: {
    alignItems: 'center',
  },
  checkmarkCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DF0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  completedText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
});

export default ThresholdScreen; 