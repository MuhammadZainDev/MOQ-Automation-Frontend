import React, { useState, useEffect } from 'react';
import { ScrollView, View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import InactiveAccountModal from '../src/components/InactiveAccountModal';
import ApprovalModal from '../src/components/ApprovalModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [inactiveModalVisible, setInactiveModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  // Check if coming from signup to show approval modal
  useEffect(() => {
    const checkShowApprovalModal = async () => {
      try {
        const shouldShow = await AsyncStorage.getItem('show_approval_modal');
        
        if (shouldShow === 'true') {
          // Clear the flag first
          await AsyncStorage.removeItem('show_approval_modal');
          
          // Show the modal after a 2 second delay
          setTimeout(() => {
            setApprovalModalVisible(true);
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking approval modal flag:', error);
      }
    };
    
    checkShowApprovalModal();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      setLoading(true);
      console.log('Calling login with email:', email);
      const result = await login(email, password);
      console.log('Login result:', result);
      
      if (result.success) {
        // Get the user from AsyncStorage to check role
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          console.log('User role from storage after login:', user.role);
          
          // Redirect based on role
          if (user.role && user.role.toUpperCase() === 'ADMIN') {
            console.log('Redirecting admin to dashboard');
            router.replace('/admin/' as any);
          } else {
            console.log('Redirecting user to home');
            router.replace('/(tabs)');
          }
        }
      }
    } catch (error: any) {
      console.error('Login error in component:', error);
      
      // Check if it's an inactive account error
      if (error.message && error.message.includes('not active')) {
        setInactiveModalVisible(true);
      } else {
        Alert.alert('Login Failed', error.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalModalClose = () => {
    setApprovalModalVisible(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>MOQ Automation</Text>
      <Text style={styles.subtitle}>Automate Your Business</Text>
      
      <View style={styles.formContainer}>
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
        
        <Text style={styles.forgotPassword} onPress={() => router.push('/forgot-password')}>Forgot Password?</Text>
        
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <Link href="/signup" style={styles.signupText}>Sign Up</Link>
      </View>

      {/* Inactive Account Modal */}
      <InactiveAccountModal 
        visible={inactiveModalVisible}
        onClose={() => setInactiveModalVisible(false)}
        email={email}
      />

      {/* Approval Modal - shown after signup */}
      <ApprovalModal 
        visible={approvalModalVisible}
        onClose={handleApprovalModalClose}
      />
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
  forgotPassword: {
    color: '#DF0000',
    textAlign: 'right',
    marginBottom: 25,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#DF0000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    height: 55,
    justifyContent: 'center',
  },
  loginButtonText: {
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
  signupText: {
    color: '#DF0000',
    marginLeft: 5,
    fontWeight: 'bold',
    fontSize: 15,
  },
}); 