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

  // Get pending approval users
  getPendingApprovals: async () => {
    try {
      const response = await API.get('/admin/pending-approvals');
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
        userId,
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
        userId,
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
      const response = await API.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
};

export default adminService; 