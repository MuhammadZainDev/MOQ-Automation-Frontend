import React, { useState } from 'react';
import { ScrollView, View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const handleResetPassword = () => {
    // Reset password and navigate to login
    router.push('/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Create a new strong password</Text>
      
      <View style={styles.formContainer}>
        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={22} color="#777" style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            placeholder="Enter new password" 
            placeholderTextColor="#777"
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
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
        
        <Text style={styles.label}>Confirm New Password</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={22} color="#777" style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            placeholder="Confirm new password" 
            placeholderTextColor="#777"
            secureTextEntry={!confirmPasswordVisible}
            autoCapitalize="none"
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
        
        <TouchableOpacity style={styles.submitButton} onPress={handleResetPassword}>
          <Text style={styles.submitButtonText}>Reset Password</Text>
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
  submitButton: {
    backgroundColor: '#DF0000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    height: 55,
    justifyContent: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 