import API from './api';

// Admin API services
export const adminService = {
  // Get user statistics
  getUserStats: async () => {
    try {
      const response = await API.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  },

  // Get pending approval users (users with isActive=false)
  getPendingApprovals: async () => {
    try {
      // Since the admin routes aren't properly registered, use the auth API to get users
      const response = await API.get('/auth/users?isActive=false');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      throw error;
    }
  },

  // Approve a user
  approveUser: async (userId) => {
    try {
      const response = await API.post('/auth/toggle-active', {
        userId: parseInt(userId, 10),
        isActive: true
      });
      return response.data;
    } catch (error) {
      console.error('Error approving user:', error);
      throw error;
    }
  },

  // Deactivate a user
  deactivateUser: async (userId) => {
    try {
      const response = await API.post('/auth/toggle-active', {
        userId: parseInt(userId, 10),
        isActive: false
      });
      return response.data;
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  },

  // Get all users
  getAllUsers: async () => {
    try {
      const response = await API.get('/auth/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
};

export default adminService; 