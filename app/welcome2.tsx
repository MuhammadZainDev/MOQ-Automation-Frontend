import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { router, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function WelcomeScreen2() {
  // Animation values for features
  const fadeAnim1 = React.useRef(new Animated.Value(0)).current;
  const fadeAnim2 = React.useRef(new Animated.Value(0)).current;
  const fadeAnim3 = React.useRef(new Animated.Value(0)).current;
  const fadeAnim4 = React.useRef(new Animated.Value(0)).current;
  const titleAnim = React.useRef(new Animated.Value(0)).current;
  const descAnim = React.useRef(new Animated.Value(0)).current;

  // Start animations on component mount
  useEffect(() => {
    Animated.sequence([
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(descAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.stagger(200, [
        Animated.timing(fadeAnim1, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim2, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim3, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim4, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleContinue = async () => {
    try {
      // Set the hasSeenWelcome flag at the end of the welcome flow
      // This ensures it's only shown on first app install
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
      
      // Navigate to login
      router.push('/login');
    } catch (error) {
      console.error('Error navigating to login screen:', error);
    }
  };

  return (
    <>
      {/* Hide the header */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Logo removed */}
          
          <Animated.Text style={[styles.title, { opacity: titleAnim, transform: [{ translateY: titleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}] }]}>Get Started Today</Animated.Text>
          
          <Animated.Text style={[styles.description, { opacity: descAnim, transform: [{ translateY: descAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}] }]}>
            Take control of your YouTube analytics and grow your channel with our powerful tools
          </Animated.Text>
          
          <View style={styles.featuresGrid}>
            <Animated.View style={[styles.featureBox, { opacity: fadeAnim1, transform: [{ scale: fadeAnim1.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1]
            })}] }]}>
              <Ionicons name="eye-outline" size={32} color="#DF0000" />
              <Text style={styles.featureTitle}>Views</Text>
              <Text style={styles.featureDescription}>Track how many people are watching your content</Text>
            </Animated.View>
            
            <Animated.View style={[styles.featureBox, { opacity: fadeAnim2, transform: [{ scale: fadeAnim2.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1]
            })}] }]}>
              <Ionicons name="stats-chart-outline" size={32} color="#DF0000" />
              <Text style={styles.featureTitle}>Stats</Text>
              <Text style={styles.featureDescription}>Track your overall performance metrics</Text>
            </Animated.View>
            
            <Animated.View style={[styles.featureBox, { opacity: fadeAnim3, transform: [{ scale: fadeAnim3.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1]
            })}] }]}>
              <Ionicons name="ribbon-outline" size={32} color="#DF0000" />
              <Text style={styles.featureTitle}>Premium Views</Text>
              <Text style={styles.featureDescription}>See views from premium countries</Text>
            </Animated.View>
            
            <Animated.View style={[styles.featureBox, { opacity: fadeAnim4, transform: [{ scale: fadeAnim4.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1]
            })}] }]}>
              <Ionicons name="globe-outline" size={32} color="#DF0000" />
              <Text style={styles.featureTitle}>Geography</Text>
              <Text style={styles.featureDescription}>Discover where your audience is located</Text>
            </Animated.View>
          </View>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.pagination}>
            <View style={styles.paginationDot} />
            <View style={styles.paginationDotActive} />
          </View>
          
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  featureBox: {
    width: '48%',
    backgroundColor: 'rgba(223, 0, 0, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  featureTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  featureDescription: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#555',
    marginHorizontal: 5,
  },
  paginationDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DF0000',
    marginHorizontal: 5,
  },
  continueButton: {
    backgroundColor: '#DF0000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 