import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminLayout from '../../src/components/AdminLayout';
import { adminService } from '../../src/services/adminApi';
import Toast from 'react-native-toast-message';

// Define user type
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'inactive'

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllUsers();
      
      if (response.success) {
        // Format dates and ensure correct data types
        const formattedUsers = response.data.map((user: any) => ({
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role.toLowerCase(),
          isActive: Boolean(user.isActive),
          createdAt: new Date(user.createdAt).toLocaleDateString()
        }));
        
        setUsers(formattedUsers);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load users. Please try again.',
          position: 'bottom'
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load users. Please try again.',
        position: 'bottom'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRefresh = () => {
    fetchUsers();
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
                  {/* Admin Badge - Moved to top right */}
                  {user.role === 'admin' && (
                    <View style={styles.adminBadgeTopRight}>
                      <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                  )}
                  
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
                      </View>
                      <Text style={styles.userDate}>Joined: {user.createdAt}</Text>
                      <Text style={styles.statusIndicator}>
                        Status: <Text style={user.isActive ? styles.activeStatus : styles.inactiveStatus}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </Text>
                    </View>
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
  adminBadgeTopRight: {
    position: 'absolute',
    right: 15,
    top: 15,
    backgroundColor: 'rgba(44, 130, 201, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  adminBadgeText: {
    color: '#2c82c9',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userDate: {
    color: '#777',
    fontSize: 12,
  },
  statusIndicator: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 3,
  },
  activeStatus: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  inactiveStatus: {
    color: '#E57373',
    fontWeight: 'bold',
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