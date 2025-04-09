import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type InactiveAccountModalProps = {
  visible: boolean;
  onClose: () => void;
  email: string;
};

const InactiveAccountModal = ({ visible, onClose, email }: InactiveAccountModalProps) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#DF0000" />
          </View>
          
          <Text style={styles.modalTitle}>Account Not Active</Text>
          
          <Text style={styles.modalText}>
            Your account <Text style={styles.emailText}>{email}</Text> is pending administrator approval.
          </Text>
          
          <Text style={styles.modalInstructions}>
            You will receive an email notification once your account has been activated.
            Please check your email inbox (and spam folder) regularly.
          </Text>
          
          <TouchableOpacity
            style={styles.buttonClose}
            onPress={onClose}
          >
            <Text style={styles.textStyle}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalView: {
    margin: 20,
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%',
  },
  iconContainer: {
    backgroundColor: 'rgba(223, 0, 0, 0.1)',
    borderRadius: 50,
    padding: 15,
    marginBottom: 15,
  },
  modalTitle: {
    marginBottom: 15,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
    color: '#ccc',
    lineHeight: 22,
  },
  emailText: {
    fontWeight: 'bold',
    color: '#DF0000',
  },
  modalInstructions: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 15,
    color: '#aaa',
    lineHeight: 20,
  },
  buttonClose: {
    backgroundColor: '#DF0000',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    elevation: 2,
    marginTop: 10,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default InactiveAccountModal; 