import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type UserApprovalCardProps = {
  id: number | string;
  name: string;
  email: string;
  isActive: boolean;
  date: string;
  onToggleActive: (id: number | string, isActive: boolean) => void;
};

const UserApprovalCard = ({ 
  id, 
  name, 
  email, 
  isActive, 
  date, 
  onToggleActive 
}: UserApprovalCardProps) => {
  return (
    <View style={[
      styles.container, 
      isActive ? styles.activeContainer : styles.inactiveContainer
    ]}>
      <View style={styles.userInfo}>
        <View style={styles.userIconContainer}>
          <Ionicons name="person" size={26} color="#fff" />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.userEmail}>{email}</Text>
          <Text style={styles.userDate}>Registered: {date}</Text>
          <View style={[
            styles.statusBadge, 
            isActive ? styles.activeBadge : styles.inactiveBadge
          ]}>
            <Text style={styles.statusText}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.actionButton, 
          isActive ? styles.deactivateButton : styles.activateButton
        ]}
        onPress={() => onToggleActive(id, !isActive)}
      >
        <Ionicons 
          name={isActive ? 'close-circle-outline' : 'checkmark-circle-outline'} 
          size={20} 
          color="#fff" 
        />
        <Text style={styles.actionButtonText}>
          {isActive ? 'Deactivate' : 'Activate'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    borderLeftWidth: 4,
  },
  activeContainer: {
    borderLeftColor: '#2ecc71',
  },
  inactiveContainer: {
    borderLeftColor: '#DF0000',
  },
  userInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  userIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  userDate: {
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  activeBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(223, 0, 0, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activateButton: {
    backgroundColor: '#2ecc71',
  },
  deactivateButton: {
    backgroundColor: '#DF0000',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default UserApprovalCard; 