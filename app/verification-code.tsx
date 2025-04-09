import React, { useState } from 'react';
import { ScrollView, View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function VerificationCodeScreen() {
  const [code, setCode] = useState(['', '', '', '']);

  const handleCodeChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    
    // Move to next input if current one is filled
    if (text.length === 1 && index < 3) {
      // Focus next input
      // You would need refs to implement this properly
    }
  };

  const handleVerify = () => {
    // Navigate to reset password screen
    router.push('/reset-password');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Verification Code</Text>
      <Text style={styles.subtitle}>Enter the 4-digit code sent to your email</Text>
      
      <View style={styles.formContainer}>
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              style={styles.codeInput}
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
            />
          ))}
        </View>
        
        <TouchableOpacity style={styles.submitButton} onPress={handleVerify}>
          <Text style={styles.submitButtonText}>Verify Code</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive code? </Text>
          <Text style={styles.resendButton}>Resend</Text>
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
    alignItems: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 30,
  },
  codeInput: {
    width: 55,
    height: 55,
    backgroundColor: '#333',
    borderRadius: 8,
    color: '#fff',
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#DF0000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    height: 55,
    justifyContent: 'center',
    marginTop: 10,
    width: '100%',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resendContainer: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'center',
  },
  resendText: {
    color: '#999',
    fontSize: 15,
  },
  resendButton: {
    color: '#DF0000',
    fontSize: 15,
    fontWeight: 'bold',
  },
}); 