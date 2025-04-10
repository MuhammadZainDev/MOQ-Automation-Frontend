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
  },
  
  // Get user details by ID
  getUserById: async (userId) => {
    try {
      // Using the existing getAllUsers endpoint instead of a specific endpoint
      const response = await API.get('/auth/users');
      
      if (response.data.success) {
        const user = response.data.data.find(u => u.id.toString() === userId.toString());
        
        if (user) {
          return {
            success: true,
            data: {
              id: user.id.toString(),
              name: user.name,
              email: user.email,
              role: user.role.toLowerCase(),
              isActive: Boolean(user.isActive),
              createdAt: new Date(user.createdAt).toLocaleDateString()
            }
          };
        } else {
          return {
            success: false,
            message: 'User not found'
          };
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  },
  
  // Get user analytics
  getUserAnalytics: async (userId) => {
    try {
      console.log('Fetching analytics for user:', userId);
      
      // Change to auth endpoint to match existing pattern
      const response = await API.get(`/auth/users/${userId}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      // Return default data structure with empty strings
      return {
        success: true,
        data: {
          stats: '',
          views: '',
          videos: '',
          watch_hours: '',
          premium_country_views: ''
        }
      };
    }
  },
  
  // Update user analytics
  updateUserAnalytics: async (userId, analyticsData) => {
    try {
      console.log('Updating analytics for user:', userId, analyticsData);
      
      // Change to auth endpoint to match existing pattern
      const response = await API.patch(`/auth/users/${userId}/analytics`, analyticsData);
      return response.data;
    } catch (error) {
      console.error('Error updating user analytics:', error);
      throw error;
    }
  }
};

export default adminService; 