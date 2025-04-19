import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator, ToastAndroid, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import Toast from 'react-native-toast-message';

// Function to show toast on both platforms
const showToast = (message) => {
  Toast.show({
    type: 'info',
    text1: '',
    text2: message,
    position: 'bottom'
  });
};

export default function VerificationCodeScreen() {
  const { email } = useLocalSearchParams();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { verifyResetCode, forgotPassword } = useAuth();
  
  // Create an array to store references to each input field
  const inputRefs = useRef([]);
  
  useEffect(() => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Email is missing. Please try again.',
        position: 'bottom'
      });
      router.back();
    }
    
    // Initialize refs array with correct size
    if (inputRefs.current.length !== 6) {
      inputRefs.current = Array(6).fill(null);
    }
  }, [email]);

  const handleCodeChange = (text, index) => {
    // Allow only digits
    if (!/^\d*$/.test(text)) return;
    
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    
    // Auto-advance to next input if current input is filled
    if (text.length === 1 && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };
  
  const handleKeyPress = (e, index) => {
    // Handle backspace for empty boxes to go back
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async (codeString = null) => {
    const resetCode = codeString || code.join('');
    
    if (resetCode.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter the complete 6-digit code',
        position: 'bottom'
      });
      return;
    }
    
    try {
      setLoading(true);
      const emailString = typeof email === 'string' ? email : String(email);
      console.log('Verifying code:', resetCode, 'for email:', emailString);
      
      // Verify the code first - don't proceed if verification fails
      try {
        const result = await verifyResetCode(emailString, resetCode);
        console.log('Verification result:', result);
        
        // Only proceed if verification succeeds
        if (result && result.success) {
          // Navigate to reset password screen with email and code
          router.push({
            pathname: '/reset-password',
            params: { 
              email: emailString, 
              resetCode: resetCode 
            }
          });
        } else {
          // Show error toast if verification fails
          showToast('Invalid or expired verification code. Please try again.');
        }
      } catch (verifyError) {
        console.error('Verification error:', verifyError);
        // Show error but don't navigate
        showToast('Invalid verification code. Please check and try again.');
      }
    } catch (error: any) {
      console.error('Error in verification process:', error);
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: error.message || 'Invalid or expired code',
        position: 'bottom'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      const emailString = typeof email === 'string' ? email : String(email);
      await forgotPassword(emailString);
      
      // Show success message
      showToast('A new verification code has been sent to your email');
      
      // Reset code inputs
      setCode(['', '', '', '', '', '']);
    } catch (error: any) {
      console.error('Error resending code:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to resend code',
        position: 'bottom'
      });
    } finally {
      setResending(false);
    }
  };
  
  // Handle paste from clipboard for the entire code
  const handlePaste = (text, index) => {
    if (text.length > 1) {
      // This might be a paste action
      const digits = text.replace(/\D/g, '').split('').slice(0, 6);
      if (digits.length > 1) {
        const newCode = Array(6).fill('');
        digits.forEach((digit, idx) => {
          if (idx < 6) newCode[idx] = digit;
        });
        setCode(newCode);
        return true;
      }
    }
    return false;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Verification Code</Text>
      <Text style={styles.subtitle}>Enter the 6-digit code sent to your email</Text>
      
      <View style={styles.formContainer}>
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={input => {
                inputRefs.current[index] = input;
              }}
              style={styles.codeInput}
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              selectTextOnFocus
              onChangeText={(text) => {
                if (!handlePaste(text, index)) {
                  handleCodeChange(text, index);
                }
              }}
              onKeyPress={(e) => handleKeyPress(e, index)}
            />
          ))}
        </View>
        
        <TouchableOpacity 
          style={[
            styles.submitButton,
            code.some(digit => !digit) && styles.disabledButton
          ]} 
          onPress={() => handleVerify()}
          disabled={loading || code.some(digit => !digit)}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
          <Text style={styles.submitButtonText}>Verify Code</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive code? </Text>
          <TouchableOpacity onPress={handleResend} disabled={resending}>
            {resending ? (
              <ActivityIndicator size="small" color="#DF0000" />
            ) : (
          <Text style={styles.resendButton}>Resend</Text>
            )}
        </TouchableOpacity>
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
    width: '90%',
    marginBottom: 30,
  },
  codeInput: {
    width: 45,
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
  disabledButton: {
    backgroundColor: '#6c0000',
    opacity: 0.7,
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
    alignItems: 'center',
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