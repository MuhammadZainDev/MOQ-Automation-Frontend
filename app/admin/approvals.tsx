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

// Mock data for pending users
const MOCK_PENDING_USERS = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com', createdAt: '2023-10-15' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', createdAt: '2023-10-14' },
  { id: '3', name: 'Mike Johnson', email: 'mike.j@example.com', createdAt: '2023-10-12' },
  { id: '4', name: 'Sarah Williams', email: 'sarah.w@example.com', createdAt: '2023-10-10' },
  { id: '5', name: 'David Brown', email: 'david.b@example.com', createdAt: '2023-10-08' },
  { id: '6', name: 'Emily Davis', email: 'emily.d@example.com', createdAt: '2023-10-05' },
];

export default function ApprovalsScreen() {
  const [pendingUsers, setPendingUsers] = useState(MOCK_PENDING_USERS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Simulate loading on mount
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleApprove = (userId: string) => {
    // In a real app, this would call an API to approve the user
    Alert.alert(
      "Confirm Approval",
      "Are you sure you want to approve this user?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Approve", 
          onPress: () => {
            setLoading(true);
            // Simulate API call
            setTimeout(() => {
              setPendingUsers(pendingUsers.filter(user => user.id !== userId));
              setLoading(false);
            }, 1000);
          } 
        }
      ]
    );
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const filteredUsers = pendingUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                      <Text style={styles.userEmail}>{user.email}</Text>
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