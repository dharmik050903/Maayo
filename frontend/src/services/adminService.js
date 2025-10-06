const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const adminService = {
  // Auth Methods
  async adminLogin(email, password) {
    try {
      console.log('Admin login attempt:', email)
      
      const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      
      if (!response.ok) {
        let errorMessage = 'Admin login failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Admin login successful:', data.admin?.name)
      
      // Store admin token and data
      if (data.token) {
        localStorage.setItem('adminToken', data.token)
        localStorage.setItem('adminData', JSON.stringify(data.admin))
      }
      
      return {
        status: true,
        message: data.message,
        token: data.token,
        admin: data.admin
      }
    } catch (error) {
      console.error('Error during admin login:', error)
      throw error
    }
  },

  async setupSuperAdmin(name, email, password) {
    try {
      console.log('Setting up super admin:', email)
      
      const response = await fetch(`${API_BASE_URL}/admin/auth/setup-super-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      })
      
      if (!response.ok) {
        let errorMessage = 'Super admin setup failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Super admin setup successful')
      
      return {
        status: true,
        message: data.message,
        data: data.data
      }
    } catch (error) {
      console.error('Error setting up super admin:', error)
      throw error
    }
  },

  async changePassword(currentPassword, newPassword) {
    try {
      const token = this.getAdminToken()
      
      const response = await fetch(`${API_BASE_URL}/admin/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      
      if (!response.ok) {
        let errorMessage = 'Password change failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message
      }
    } catch (error) {
      console.error('Error changing admin password:', error)
      throw error
    }
  },

  async getAdminProfile() {
    try {
      const token = this.getAdminToken()
      
      const response = await fetch(`${API_BASE_URL}/admin/auth/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to get admin profile'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message,
        data: data.data
      }
    } catch (error) {
      console.error('Error getting admin profile:', error)
      throw error
    }
  },

  async updateAdminProfile(profileData) {
    try {
      const token = this.getAdminToken()
      
      const response = await fetch(`${API_BASE_URL}/admin/auth/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to update admin profile'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      
      // Update stored admin data
      if (data.data) {
        const currentAdminData = this.getAdminData()
        const updatedAdminData = { ...currentAdminData, ...data.data }
        localStorage.setItem('adminData', JSON.stringify(updatedAdminData))
      }
      
      return {
        status: true,
        message: data.message,
        data: data.data
      }
    } catch (error) {
      console.error('Error updating admin profile:', error)
      throw error
    }
  },

  async adminLogout() {
    try {
      const token = this.getAdminToken()
      
      // Call logout endpoint for logging
      await fetch(`${API_BASE_URL}/admin/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      // Clear local storage
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminData')
      
      return {
        status: true,
        message: 'Admin logged out successfully'
      }
    } catch (error) {
      console.error('Error during admin logout:', error)
      // Still clear local storage even if API call fails
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminData')
      throw error
    }
  },

  // Dashboard Methods
  async getDashboardStats() {
    try {
      const token = this.getAdminToken()
      
      const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to get dashboard stats'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
          
          // Check if this is an admin token issue - force re-login
          if (errorMessage.includes('Admin privileges required') && response.status === 401) {
            console.warn('⚠️ Admin token appears to be invalid or outdated. Please login again.')
            this.clearAdminAuth()
            // Redirect to login
            if (window.location.pathname.includes('/admin/')) {
              window.location.href = '/admin/login'
              return
            }
          }
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message,
        data: data.data
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      throw error
    }
  },

  // User Management Methods
  async getUsers(filters = {}) {
    try {
      const token = this.getAdminToken()
      const { page = 1, limit = 10, search = '', status = 'all', user_type = 'all' } = filters
      
      const response = await fetch(`${API_BASE_URL}/admin/users/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ page, limit, search, status, user_type })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to get users'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message,
        data: data.data,
        pagination: data.pagination
      }
    } catch (error) {
      console.error('Error getting users:', error)
      throw error
    }
  },

  async suspendUser(userId, reason, duration) {
    try {
      const token = this.getAdminToken()
      
      const response = await fetch(`${API_BASE_URL}/admin/users/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, reason, duration })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to suspend user'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message
      }
    } catch (error) {
      console.error('Error suspending user:', error)
      throw error
    }
  },

  async activateUser(userId) {
    try {
      const token = this.getAdminToken()
      
      const response = await fetch(`${API_BASE_URL}/admin/users/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to activate user'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message
      }
    } catch (error) {
      console.error('Error activating user:', error)
      throw error
    }
  },

  async deleteUser(userId, reason) {
    try {
      const token = this.getAdminToken()
      
      const response = await fetch(`${API_BASE_URL}/admin/users/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, reason })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete user'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  },

  // Freelancer Management Methods
  async getFreelancers(filters = {}) {
    try {
      const token = this.getAdminToken()
      const { page = 1, limit = 10, search = '', approval = 'all' } = filters
      
      const response = await fetch(`${API_BASE_URL}/admin/freelancers/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ page, limit, search, approval })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to get freelancers'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message,
        data: data.data,
        pagination: data.pagination
      }
    } catch (error) {
      console.error('Error getting freelancers:', error)
      throw error
    }
  },

  async approveFreelancer(freelancerId, status, reason) {
    try {
      const token = this.getAdminToken()
      
      const response = await fetch(`${API_BASE_URL}/admin/freelancers/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ freelancerId, status, reason })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to approve freelancer'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message
      }
    } catch (error) {
      console.error('Error approving freelancer:', error)
      throw error
    }
  },

  // Project Management Methods
  async getProjects(filters = {}) {
    try {
      const token = this.getAdminToken()
      const { page = 1, limit = 10, search = '', status = 'all', category = 'all' } = filters
      
      const response = await fetch(`${API_BASE_URL}/admin/projects/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ page, limit, search, status, category })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to get projects'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message,
        data: data.data,
        pagination: data.pagination
      }
    } catch (error) {
      console.error('Error getting projects:', error)
      throw error
    }
  },

  async deleteProject(projectId, reason) {
    try {
      console.log('🔄 AdminService: Starting delete project request')
      console.log('📋 Project ID:', projectId)
      console.log('📝 Reason:', reason)
      
      const token = this.getAdminToken()
      console.log('🔑 Token present:', !!token)
      
      const requestBody = { projectId, reason }
      console.log('📦 Request body:', requestBody)
      
      const response = await fetch(`${API_BASE_URL}/admin/projects/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete project'
        try {
          const errorData = await response.json()
          console.log('❌ Error response data:', errorData)
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          console.log('❌ Failed to parse error response:', parseError)
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('✅ Success response data:', data)
      
      return {
        status: true,
        message: data.message
      }
    } catch (error) {
      console.error('❌ AdminService deleteProject error:', error)
      throw error
    }
  },

  // Bid Management Methods
  async getBids(filters = {}) {
    try {
      const token = this.getAdminToken()
      const { page = 1, limit = 10, search = '', status = 'all' } = filters
      
      const response = await fetch(`${API_BASE_URL}/admin/bids/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ page, limit, search, status })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to get bids'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message,
        data: data.data,
        pagination: data.pagination
      }
    } catch (error) {
      console.error('Error getting bids:', error)
      throw error
    }
  },

  // Admin Management Methods (Super Admin only)
  async getAdmins() {
    try {
      const token = this.getAdminToken()
      
      const response = await fetch(`${API_BASE_URL}/admin/admins/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to get admins'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message,
        data: data.data
      }
    } catch (error) {
      console.error('Error getting admins:', error)
      throw error
    }
  },

  async createAdmin(adminData) {
    try {
      const token = this.getAdminToken()
      
      const response = await fetch(`${API_BASE_URL}/admin/admins/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(adminData)
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to create admin'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message,
        data: data.data
      }
    } catch (error) {
      console.error('Error creating admin:', error)
      throw error
    }
  },

  // Utility Methods
  getAdminToken() {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      throw new Error('Admin not authenticated. Please login.')
    }
    
    // Quick check for token format - if it's an old token, clear it
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role === 'admin' && !payload.admin_role) {
        console.warn('⚠️ Detected old admin token format. Clearing token to force re-login.')
        this.clearAdminAuth()
        throw new Error('Admin token outdated. Please login again.')
      }
    } catch (e) {
      // If we can't decode the token, it's probably invalid anyway
    }
    
    return token
  },

  getAdminData() {
    const adminData = localStorage.getItem('adminData')
    if (!adminData) {
      return null
    }
    try {
      return JSON.parse(adminData)
    } catch (error) {
      console.error('Error parsing admin data:', error)
      return null
    }
  },

  isAdminAuthenticated() {
    const token = localStorage.getItem('adminToken')
    const adminData = localStorage.getItem('adminData')
    return !!(token && adminData)
  },

  clearAdminAuth() {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
  },

  // Additional CRUD Methods
  async deleteBid(bidId, reason) {
    try {
      console.log('🔄 AdminService: Starting delete bid request')
      console.log('📋 Bid ID:', bidId)
      console.log('📝 Reason:', reason)
      
      const token = this.getAdminToken()
      console.log('🔑 Token present:', !!token)
      
      const requestBody = { bidId, reason }
      console.log('📦 Request body:', requestBody)
      
      const response = await fetch(`${API_BASE_URL}/admin/bids/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete bid'
        try {
          const errorData = await response.json()
          console.log('❌ Error response data:', errorData)
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          console.log('❌ Could not parse error response:', parseError)
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('✅ Delete bid API success response:', data)
      
      return {
        status: true,
        message: data.message,
        data: data.data
      }
    } catch (error) {
      console.error('❌ AdminService deleteBid error:', error)
      throw error
    }
  },

  async updateUser(userId, updates) {
    try {
      const token = this.getAdminToken()
      
      const response = await fetch(`${API_BASE_URL}/admin/users/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, updates })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to update user'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message,
        data: data.data
      }
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  },

  async updateProject(projectId, updates) {
    try {
      const token = this.getAdminToken()
      
      const response = await fetch(`${API_BASE_URL}/admin/projects/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ projectId, updates })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to update project'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message,
        data: data.data
      }
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  },

  // Permission Request Methods
  async submitPermissionRequest(requestData) {
    try {
      const token = this.getAdminToken()
      if (!token) throw new Error('No authentication token')
      
      const response = await fetch(`${API_BASE_URL}/admin/permission-requests/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: requestData.type,
          resource: requestData.resource,
          reason: requestData.reason,
          urgency: requestData.urgency || 'medium'
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to submit permission request'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message,
        data: data.data
      }
    } catch (error) {
      console.error('Error submitting permission request:', error)
      throw error
    }
  },

  async getPermissionRequests() {
    try {
      const token = this.getAdminToken()
      
      const response = await fetch(`${API_BASE_URL}/admin/permission-requests/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to get permission requests'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message,
        data: data.data
      }
    } catch (error) {
      console.error('Error getting permission requests:', error)
      throw error
    }
  },

  // Get Permission Requests (Super Admin only)
  async getPermissionRequests(filters = {}) {
    try {
      const token = this.getAdminToken()
      if (!token) throw new Error('No authentication token')
      
      const queryParams = new URLSearchParams(filters).toString()
      const response = await fetch(`${API_BASE_URL}/admin/permission-requests/list?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch permission requests'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching permission requests:', error)
      throw error
    }
  },

  // Handle Permission Request (Approve/Reject)
  async handlePermissionRequest(requestId, action, reviewNotes = '') {
    try {
      const token = this.getAdminToken()
      if (!token) throw new Error('No authentication token')
      
      const response = await fetch(`${API_BASE_URL}/admin/permission-requests/${requestId}/handle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          reviewNotes
        })
      })
      
      if (!response.ok) {
        let errorMessage = `Failed to ${action} permission request`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`Error ${action} permission request:`, error)
      throw error
    }
  },

  // Job Management Methods
  async getJobs(filters = {}) {
    try {
      const token = this.getAdminToken()
      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        status = 'all', 
        company_name = '',
        job_type = 'all',
        work_mode = 'all',
        location = '',
        is_active,
        date_from = '',
        date_to = ''
      } = filters
      
      const response = await fetch(`${API_BASE_URL}/admin/jobs/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          page, 
          limit, 
          search, 
          status: status !== 'all' ? status : undefined, 
          company_name,
          job_type: job_type !== 'all' ? job_type : undefined,
          work_mode: work_mode !== 'all' ? work_mode : undefined,
          location,
          is_active,
          date_from,
          date_to
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to get jobs'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message,
        data: data.data.jobs,
        pagination: data.data.pagination
      }
    } catch (error) {
      console.error('Error getting jobs:', error)
      throw error
    }
  },

  async getJobById(jobId) {
    try {
      const token = this.getAdminToken()
      
      const response = await fetch(`${API_BASE_URL}/admin/jobs/detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ job_id: jobId })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to get job details'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message,
        data: data.data
      }
    } catch (error) {
      console.error('Error getting job details:', error)
      throw error
    }
  },

  async updateJob(jobId, updates) {
    try {
      const token = this.getAdminToken()
      
      const response = await fetch(`${API_BASE_URL}/admin/jobs/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ job_id: jobId, ...updates })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to update job'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message,
        data: data.data
      }
    } catch (error) {
      console.error('Error updating job:', error)
      throw error
    }
  },

  async toggleJobBlock(jobId, blockReason = '') {
    try {
      const token = this.getAdminToken()
      
      const response = await fetch(`${API_BASE_URL}/admin/jobs/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ job_id: jobId, block_reason: blockReason })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to toggle job block status'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message,
        data: data.data
      }
    } catch (error) {
      console.error('Error toggling job block:', error)
      throw error
    }
  },

  async deleteJob(jobId, deleteReason = '') {
    try {
      console.log('🔄 AdminService: Starting delete job request')
      console.log('📋 Job ID:', jobId)
      console.log('📝 Reason:', deleteReason)
      
      const token = this.getAdminToken()
      console.log('🔑 Token present:', !!token)
      
      const requestBody = { job_id: jobId, delete_reason: deleteReason }
      console.log('📦 Request body:', requestBody)
      
      const response = await fetch(`${API_BASE_URL}/admin/jobs/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete job'
        try {
          const errorData = await response.json()
          console.log('❌ Error response data:', errorData)
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          console.log('❌ Failed to parse error response:', parseError)
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('✅ Success response data:', data)
      
      return {
        status: true,
        message: data.message,
        data: data.data
      }
    } catch (error) {
      console.error('❌ AdminService deleteJob error:', error)
      throw error
    }
  },

  async getJobApplications(jobId, filters = {}) {
    try {
      const token = this.getAdminToken()
      const { page = 1, limit = 20, status } = filters
      
      const response = await fetch(`${API_BASE_URL}/admin/jobs/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ job_id: jobId, page, limit, status })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to get job applications'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message,
        data: data.data
      }
    } catch (error) {
      console.error('Error getting job applications:', error)
      throw error
    }
  },

  async getJobDashboardStats() {
    try {
      const token = this.getAdminToken()
      
      const response = await fetch(`${API_BASE_URL}/admin/jobs/stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to get job dashboard stats'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message,
        data: data.data
      }
    } catch (error) {
      console.error('Error getting job dashboard stats:', error)
      throw error
    }
  },

  // Migration method for job permissions
  async migrateJobPermissions() {
    try {
      const token = this.getAdminToken()
      
      const response = await fetch(`${API_BASE_URL}/admin/migrate/job-permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to migrate job permissions'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return {
        status: true,
        message: data.message,
        data: data.data
      }
    } catch (error) {
      console.error('Error migrating job permissions:', error)
      throw error
    }
  }
}

export default adminService