import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type ConfirmationModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

const ConfirmationModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel"
}: ConfirmationModalProps) => {
  // Format the message to highlight quoted text
  const formatMessage = (text: string) => {
    if (text.includes('"')) {
      const parts = text.split('"');
      if (parts.length >= 3) {
        return (
          <>
            {parts[0]}
            <Text style={styles.highlightedText}>"{parts[1]}"</Text>
            {parts[2]}
          </>
        );
      }
    }
    return text;
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{title}</Text>
          
          <Text style={styles.modalText}>
            {formatMessage(message)}
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.buttonCancel}
              onPress={onClose}
            >
              <Text style={styles.buttonCancelText}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.buttonConfirm}
              onPress={() => {
                onConfirm();
                onClose();
              }}
            >
              <Text style={styles.buttonConfirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
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
  modalTitle: {
    marginBottom: 15,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#ccc',
    lineHeight: 22,
  },
  highlightedText: {
    fontWeight: 'bold',
    color: '#DF0000',
    fontSize: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  buttonCancel: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    width: '48%',
    elevation: 2,
  },
  buttonConfirm: {
    backgroundColor: '#DF0000',
    borderRadius: 8,
    padding: 12,
    width: '48%',
    elevation: 2,
  },
  buttonCancelText: {
    color: '#ccc',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  buttonConfirmText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default ConfirmationModal; 