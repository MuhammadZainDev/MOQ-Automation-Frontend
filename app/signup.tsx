import React, { useState } from 'react';
import { ScrollView, View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignupScreen() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signup } = useAuth();

  const handleSignup = async () => {
    // Validate inputs
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      console.log('Calling signup with:', { name, email });
      const result = await signup(name, email, password);
      console.log('Signup result:', result);
      
      // If signup was successful, redirect to login and store signup info for the modal
      if (result && result.success) {
        console.log('Signup successful, redirecting to login');
        // Store info for showing modal on login screen
        await AsyncStorage.setItem('show_approval_modal', 'true');
        router.replace('/login');
      }
    } catch (error: any) {
      console.error('Signup error in component:', error);
      Alert.alert('Signup Failed', error.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>MOQ Automation</Text>
      <Text style={styles.subtitle}>Automate Your Business</Text>
      
      <View style={styles.formContainer}>
        <Text style={styles.label}>Name</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={22} color="#777" style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            placeholder="Enter your name" 
            placeholderTextColor="#777"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
          />
        </View>
        
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={22} color="#777" style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            placeholder="Enter your email" 
            placeholderTextColor="#777"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={22} color="#777" style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            placeholder="Enter your password" 
            placeholderTextColor="#777"
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={() => setPasswordVisible(!passwordVisible)}
          >
            <Ionicons 
              name={passwordVisible ? "eye-outline" : "eye-off-outline"}
              size={22} 
              color="#777" 
            />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={22} color="#777" style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            placeholder="Confirm your password" 
            placeholderTextColor="#777"
            secureTextEntry={!confirmPasswordVisible}
            autoCapitalize="none"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
          >
            <Ionicons 
              name={confirmPasswordVisible ? "eye-outline" : "eye-off-outline"}
              size={22} 
              color="#777" 
            />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.signupButton} 
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.signupButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Link href="/login" style={styles.loginText}>Login</Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 80,
    minHeight: '100%',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 40,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    marginBottom: 30,
  },
  label: {
    color: '#aaa',
    marginBottom: 8,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 20,
    height: 55,
    alignItems: 'center',
  },
  inputIcon: {
    paddingLeft: 15,
  },
  input: {
    flex: 1,
    padding: 15,
    paddingLeft: 10,
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupButton: {
    backgroundColor: '#DF0000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    height: 55,
    justifyContent: 'center',
    marginTop: 10,
  },
  signupButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: '#999',
    fontSize: 15,
  },
  loginText: {
    color: '#DF0000',
    marginLeft: 5,
    fontWeight: 'bold',
    fontSize: 15,
  },
}); 