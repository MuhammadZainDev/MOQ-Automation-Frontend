import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AdminLayout from '../../src/components/AdminLayout';
import { adminService } from '../../src/services/adminApi';
import ConfirmationModal from '../../src/components/ConfirmationModal';
import Toast from 'react-native-toast-message';

// Define the user type
type PendingUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export default function ApprovalsScreen() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const router = useRouter();

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPendingApprovals();
      if (response.success) {
        setPendingUsers(response.data.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: new Date(user.createdAt).toLocaleDateString()
        })));
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch pending users. Please try again.',
        position: 'bottom'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = (userId: string) => {
    setSelectedUserId(userId);
    setConfirmModalVisible(true);
  };

  const confirmApprove = async () => {
    if (!selectedUserId) return;
    
    try {
      setLoading(true);
      const response = await adminService.approveUser(selectedUserId);
      if (response.success) {
        // Remove the approved user from the list
        setPendingUsers(prev => prev.filter(user => user.id !== selectedUserId));
        
        // Show success toast
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'User has been approved and notification email sent.',
          position: 'bottom'
        });
      }
    } catch (error) {
      console.error('Error approving user:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to approve user. Please try again.',
        position: 'bottom'
      });
    } finally {
      setLoading(false);
      setSelectedUserId(null);
      setConfirmModalVisible(false);
    }
  };

  const handleRefresh = () => {
    fetchPendingUsers();
  };

  const filteredUsers = pendingUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find the selected user for the confirmation modal
  const selectedUser = selectedUserId 
    ? pendingUsers.find(user => user.id === selectedUserId) 
    : null;

  return (
    <AdminLayout>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>User Approvals</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          {loading ? (
            <ActivityIndicator color="#DF0000" size="small" />
          ) : (
            <Ionicons name="refresh-outline" size={24} color="#DF0000" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#777"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DF0000" />
        </View>
      ) : (
        <>
          <View style={styles.countsContainer}>
            <Text style={styles.countsText}>
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} pending approval
            </Text>
          </View>

          <ScrollView style={styles.usersContainer}>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <View style={styles.avatarContainer}>
                      <Text style={styles.avatarText}>
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userEmail} numberOfLines={1} ellipsizeMode="tail">{user.email}</Text>
                      <Text style={styles.userDate}>Joined: {user.createdAt}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.approveButton}
                    onPress={() => handleApprove(user.id)}
                  >
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle" size={60} color="#2ecc71" />
                <Text style={styles.emptyTitle}>All Caught Up!</Text>
                <Text style={styles.emptyText}>
                  There are no pending approvals matching your search.
                </Text>
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModalVisible && (
        <ConfirmationModal
          visible={confirmModalVisible}
          onClose={() => setConfirmModalVisible(false)}
          onConfirm={confirmApprove}
          title="Confirm Approval"
          message={selectedUser ? 
            `Are you sure you want to approve "${selectedUser.name}"? An email notification will be sent to ${selectedUser.email} informing them of their approval.` : 
            'Are you sure you want to approve this user? They will receive an email notification about their approval.'}
          confirmText="Approve"
          cancelText="Cancel"
        />
      )}
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(223, 0, 0, 0.1)',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
  },
  countsContainer: {
    marginBottom: 15,
  },
  countsText: {
    color: '#aaa',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  usersContainer: {
    flex: 1,
  },
  userCard: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(223, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#DF0000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  userEmail: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 3,
  },
  userDate: {
    color: '#777',
    fontSize: 12,
  },
  approveButton: {
    backgroundColor: '#DF0000',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  approveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
}); 