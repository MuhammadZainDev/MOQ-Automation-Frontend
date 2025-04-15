import React, { useState, useEffect } from 'react';
import { ScrollView, View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { authService } from '../src/services/api';
import Toast from 'react-native-toast-message';

// Function to show toast using Toast library
const showToast = (message) => {
  Toast.show({
    type: 'info',
    text1: '',
    text2: message,
    visibilityTime: 3000,
    position: 'bottom'
  });
};

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const email = params.email;
  const resetCode = params.resetCode;
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword: contextResetPassword } = useAuth();

  useEffect(() => {
    // Print all received parameters for debugging
    console.log('Reset Password Screen - All params:', params);
    
    if (!email || !resetCode) {
      console.error('Missing required parameters:', { email, resetCode });
      showToast('Missing required information to reset password');
      // Navigate back after showing toast
      setTimeout(() => {
        router.back();
      }, 1000);
    } else {
      console.log('Reset Password Screen - Received valid params:', { 
        email: typeof email === 'string' ? email : String(email),
        resetCode: typeof resetCode === 'string' ? resetCode : String(resetCode),
        emailType: typeof email,
        resetCodeType: typeof resetCode
      });
    }
  }, [email, resetCode, params]);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  const handleResetPassword = async () => {
    // Validate inputs
    if (!password || password.length < 6) {
      showToast('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const emailStr = typeof email === 'string' ? email : String(email);
      const resetCodeStr = typeof resetCode === 'string' ? resetCode : String(resetCode);
      
      console.log('Attempting to reset password with params:', {
        email: emailStr,
        code: resetCodeStr,
        passwordLength: password.length,
      });
      
      if (!emailStr || !resetCodeStr || !password) {
        showToast('Missing required information to reset password');
        setLoading(false);
        return;
      }
      
      // Check if the resetCode contains any problematic characters
      if (!/^\d+$/.test(resetCodeStr)) {
        console.warn('Reset code contains non-digit characters:', resetCodeStr);
      }
      
      try {
        console.log('Using direct authService call to reset password');
        
        // Use the imported authService directly
        const result = await authService.resetPassword(
          emailStr, 
          resetCodeStr, 
          password
        );
        
        console.log('Reset password result:', result);
        
        if (result && result.success) {
          // Show toast notification for success and navigate to login
          showToast('Password successfully changed!');
          
          // Navigate to login after a short delay to allow toast to be seen
          setTimeout(() => {
            router.replace('/login');
          }, 1500);
        } else {
          showToast(result?.message || 'Failed to reset password. Please try again.');
        }
      } catch (error) {
        console.error('Error in resetPassword call:', error);
        
        // Check if the error message indicates same password as current one
        if (error.message && (
          error.message.includes('same as your current password') || 
          error.message.includes('Cannot use the same password')
        )) {
          // Show specific toast for same password error
          showToast('New password cannot be the same as your current password');
        } else {
          showToast(error.message || 'Failed to reset password. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error in handleResetPassword:', error);
      showToast('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Create a new password for your account</Text>
      
      <View style={styles.formContainer}>
        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={22} color="#777" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            placeholderTextColor="#666"
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.visibilityToggle} onPress={togglePasswordVisibility}>
            <Ionicons
              name={passwordVisible ? 'eye-off' : 'eye'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={22} color="#777" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            placeholderTextColor="#666"
            secureTextEntry={!confirmPasswordVisible}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity style={styles.visibilityToggle} onPress={toggleConfirmPasswordVisibility}>
            <Ionicons
              name={confirmPasswordVisible ? 'eye-off' : 'eye'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleResetPassword}
          disabled={loading || !password || !confirmPassword}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Reset Password</Text>
          )}
        </TouchableOpacity>
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
    width: 50,
  },
  input: {
    flex: 1,
    padding: 15,
    paddingLeft: 0,
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#DF0000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    height: 55,
    justifyContent: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  visibilityToggle: {
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 