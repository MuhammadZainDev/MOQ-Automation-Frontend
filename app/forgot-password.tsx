import React from 'react';
import { ScrollView, View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const handleSendCode = () => {
    // Navigate to verification code screen
    router.push('/verification-code');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your email address to reset your password</Text>
      
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
          />
        </View>
        
        <TouchableOpacity style={styles.submitButton} onPress={handleSendCode}>
          <Text style={styles.submitButtonText}>Send Code</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Remember your password?</Text>
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