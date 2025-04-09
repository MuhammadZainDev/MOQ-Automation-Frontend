import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Switch,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminLayout from '../../src/components/AdminLayout';

// Mock data for users
const MOCK_USERS = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com', role: 'user', isActive: true, createdAt: '2023-10-05' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'user', isActive: true, createdAt: '2023-10-06' },
  { id: '3', name: 'Mike Johnson', email: 'mike.j@example.com', role: 'admin', isActive: true, createdAt: '2023-09-15' },
  { id: '4', name: 'Sarah Williams', email: 'sarah.w@example.com', role: 'user', isActive: false, createdAt: '2023-10-10' },
  { id: '5', name: 'David Brown', email: 'david.b@example.com', role: 'user', isActive: true, createdAt: '2023-09-18' },
  { id: '6', name: 'Emily Davis', email: 'emily.d@example.com', role: 'user', isActive: false, createdAt: '2023-10-01' },
  { id: '7', name: 'Alex Turner', email: 'alex.t@example.com', role: 'user', isActive: true, createdAt: '2023-09-25' },
  { id: '8', name: 'Olivia Wilson', email: 'olivia.w@example.com', role: 'user', isActive: true, createdAt: '2023-09-12' },
];

export default function UsersScreen() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'inactive'

  // Simulate loading on mount
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleToggleActive = (userId: string, newStatus: boolean) => {
    // In a real app, this would call an API to update the user status
    Alert.alert(
      newStatus ? "Activate User" : "Deactivate User",
      `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this user?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: () => {
            setLoading(true);
            // Simulate API call
            setTimeout(() => {
              setUsers(users.map(user => 
                user.id === userId ? {...user, isActive: newStatus} : user
              ));
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

  // Filter users based on search query and active filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'active') return matchesSearch && user.isActive;
    if (activeFilter === 'inactive') return matchesSearch && !user.isActive;
    return matchesSearch;
  });

  return (
    <AdminLayout>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Users Management</Text>
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

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'all' && styles.activeFilterButton]} 
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'active' && styles.activeFilterButton]} 
          onPress={() => setActiveFilter('active')}
        >
          <Text style={[styles.filterText, activeFilter === 'active' && styles.activeFilterText]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'inactive' && styles.activeFilterButton]} 
          onPress={() => setActiveFilter('inactive')}
        >
          <Text style={[styles.filterText, activeFilter === 'inactive' && styles.activeFilterText]}>Inactive</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DF0000" />
        </View>
      ) : (
        <>
          <View style={styles.countsContainer}>
            <Text style={styles.countsText}>
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
            </Text>
          </View>

          <ScrollView style={styles.usersContainer}>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <View style={[
                      styles.avatarContainer, 
                      user.role === 'admin' && styles.adminAvatarContainer
                    ]}>
                      <Text style={[
                        styles.avatarText,
                        user.role === 'admin' && styles.adminAvatarText
                      ]}>
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <View style={styles.userDetails}>
                      <View style={styles.userNameRow}>
                        <Text style={styles.userName}>{user.name}</Text>
                        {user.role === 'admin' && (
                          <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>Admin</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.userEmail}>{user.email}</Text>
                      <Text style={styles.userDate}>Joined: {user.createdAt}</Text>
                    </View>
                  </View>
                  <View style={styles.userActions}>
                    <Text style={styles.statusText}>{user.isActive ? 'Active' : 'Inactive'}</Text>
                    <Switch
                      value={user.isActive}
                      onValueChange={(newValue) => handleToggleActive(user.id, newValue)}
                      trackColor={{ false: '#444', true: 'rgba(223, 0, 0, 0.5)' }}
                      thumbColor={user.isActive ? '#DF0000' : '#777'}
                    />
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="people" size={60} color="#777" />
                <Text style={styles.emptyTitle}>No Users Found</Text>
                <Text style={styles.emptyText}>
                  No users match your current search and filters.
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
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#222',
    borderRadius: 8,
    marginRight: 10,
  },
  activeFilterButton: {
    backgroundColor: 'rgba(223, 0, 0, 0.2)',
  },
  filterText: {
    color: '#aaa',
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#DF0000',
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
  adminAvatarContainer: {
    backgroundColor: 'rgba(44, 130, 201, 0.2)',
  },
  avatarText: {
    color: '#DF0000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  adminAvatarText: {
    color: '#2c82c9',
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  adminBadge: {
    backgroundColor: 'rgba(44, 130, 201, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    color: '#2c82c9',
    fontSize: 12,
    fontWeight: 'bold',
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
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#aaa',
    marginRight: 10,
    fontSize: 13,
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