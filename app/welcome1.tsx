import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { router, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function WelcomeScreen1() {
  // Animation values
  const fadeAnim1 = React.useRef(new Animated.Value(0)).current;
  const fadeAnim2 = React.useRef(new Animated.Value(0)).current;
  const fadeAnim3 = React.useRef(new Animated.Value(0)).current;
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
      Animated.stagger(300, [
        Animated.timing(fadeAnim1, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim2, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim3, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleNext = async () => {
    try {
      // Just navigate to next screen without setting hasSeenWelcome yet
      router.push('/welcome2');
    } catch (error) {
      console.error('Error navigating to next screen:', error);
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
          })}] }]}>Welcome to MOQ Automation</Animated.Text>
          
          <Animated.Text style={[styles.description, { opacity: descAnim, transform: [{ translateY: descAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}] }]}>
            The easiest way to monitor and grow your YouTube channel analytics
          </Animated.Text>
          
          <View style={styles.featureContainer}>
            <Animated.View style={[styles.featureItem, { opacity: fadeAnim1, transform: [{ translateX: fadeAnim1.interpolate({
              inputRange: [0, 1],
              outputRange: [-50, 0]
            })}] }]}>
              <Ionicons name="analytics-outline" size={30} color="#DF0000" />
              <Text style={styles.featureText}>Track your stats in real-time</Text>
            </Animated.View>
            
            <Animated.View style={[styles.featureItem, { opacity: fadeAnim2, transform: [{ translateX: fadeAnim2.interpolate({
              inputRange: [0, 1],
              outputRange: [-50, 0]
            })}] }]}>
              <Ionicons name="trending-up-outline" size={30} color="#DF0000" />
              <Text style={styles.featureText}>Monitor growth and performance</Text>
            </Animated.View>
            
            <Animated.View style={[styles.featureItem, { opacity: fadeAnim3, transform: [{ translateX: fadeAnim3.interpolate({
              inputRange: [0, 1],
              outputRange: [-50, 0]
            })}] }]}>
              <Ionicons name="cloud-done-outline" size={30} color="#DF0000" />
              <Text style={styles.featureText}>Secure cloud data storage</Text>
            </Animated.View>
          </View>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.pagination}>
            <View style={styles.paginationDotActive} />
            <View style={styles.paginationDot} />
          </View>
          
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
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
  featureContainer: {
    width: '100%',
    marginTop: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(223, 0, 0, 0.1)',
    padding: 15,
    borderRadius: 10,
  },
  featureText: {
    color: '#fff',
    marginLeft: 15,
    fontSize: 16,
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
  nextButton: {
    backgroundColor: '#DF0000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 10,
  },
}); 