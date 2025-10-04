import { authenticatedFetch, getCurrentUser, isAuthenticated } from '../utils/api'
import { apiCache } from '../utils/apiCache'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const projectService = {
  // Get projects for public browsing (no authentication required)
  async getBrowseProjects() {
    try {
      console.log('Fetching projects for public browsing...')
      console.log('API URL:', `${API_BASE_URL}/project/browse`)
      
      const requestBody = {
        page: 1,
        limit: 6 // Show only 6 projects on home page
      }
      console.log('Request body:', requestBody)
      
      const response = await fetch(`${API_BASE_URL}/project/browse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch projects'
        try {
          const errorData = await response.json()
          console.log('Error response data:', errorData)
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          console.log('Error parsing response:', parseError)
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Browse projects fetched successfully:', data.data?.length || 0)
      console.log('Response data:', data)
      
      return {
        status: true,
        message: "Browse projects retrieved successfully",
        data: data.data || [],
        pagination: data.pagination
      }
    } catch (error) {
      console.error('Error fetching browse projects:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Get all projects for freelancers (active projects)
  async getAllProjects() {
    try {
      console.log('Fetching active projects from tblprojects...')
      
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'freelancer'
        },
        body: JSON.stringify({
          ispending: 0,  // Not pending (projects that are open for bidding)
          isactive: 1,   // Active projects (open for freelancers to bid)
          iscompleted: 0, // Not completed
          page: 1,
          limit: 50 // Get more projects for better browsing
        })
      }

      // Check cache first
      const cachedData = apiCache.get(`${API_BASE_URL}/project/list`, requestOptions)
      if (cachedData) {
        return cachedData
      }
      
      const response = await authenticatedFetch(`${API_BASE_URL}/project/list`, requestOptions)
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch projects'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()

      console.log('📊 ProjectService: Active projects API response:', data)
      console.log('✅ ProjectService: Active projects fetched successfully:', data.data?.length || 0)
      console.log('📋 ProjectService: Raw project data:', data.data)
      
      const result = {
        status: true,
        message: "Active projects retrieved successfully",
        data: data.data || [],
        pagination: data.pagination
      }

      // Cache the result
      apiCache.set(`${API_BASE_URL}/project/list`, requestOptions, result)
      
      return result
    } catch (error) {
      console.error('Error fetching active projects:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Get all projects for clients (their own projects)
  async getClientProjects() {
    try {
      console.log('Fetching client projects...')
      
      // Check if user is authenticated first
      if (!isAuthenticated()) {
        throw new Error('User not authenticated. Please log in again.')
      }
      
      // Get the current user's ID using the utility function
      const user = getCurrentUser()
      console.log('Current user data:', user)
      let userId = user?._id
      console.log('User ID extracted from user data:', userId)
      
      // Fallback: try to get user ID from auth headers
      if (!userId) {
        try {
          const authHeaders = JSON.parse(localStorage.getItem('authHeaders') || '{}')
          userId = authHeaders._id
          console.log('User ID extracted from auth headers:', userId)
        } catch (error) {
          console.error('Error parsing auth headers:', error)
        }
      }
      
      if (!userId) {
        console.error('No user ID found. User data:', user)
        console.error('Auth headers:', localStorage.getItem('authHeaders'))
        throw new Error('User ID not found. Please log in again.')
      }
      
      const requestPayload = {
        personid: userId, // Filter projects by the current client's ID
        page: 1,
        limit: 50 // Get more projects for better browsing
      }
      
      console.log('🔍 ProjectService: Request payload for client projects:', requestPayload)
      console.log('🔍 ProjectService: API endpoint:', `${API_BASE_URL}/project/list`)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/project/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'client'
        },
        body: JSON.stringify(requestPayload)
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch client projects'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('📊 ProjectService: Client projects API response:', data)
      console.log('✅ ProjectService: Client projects fetched successfully:', data.data?.length || 0)
      
      return {
        status: true,
        message: "Client projects retrieved successfully",
        data: data.data || [],
        pagination: data.pagination
      }
    } catch (error) {
      console.error('Error fetching client projects:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },


  // Search projects (active projects only)
  async searchProjects(query) {
    try {
      console.log('Searching active projects with query:', query)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/project/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'freelancer'
        },
        body: JSON.stringify({
          query: query,
          ispending: 0,  // Not pending (projects that are open for bidding)
          isactive: 1,   // Active projects (open for freelancers to bid)
          iscompleted: 0, // Not completed
          page: 1,
          limit: 50
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to search projects'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Active projects search results:', data.data?.length || 0)
      
      return {
        status: true,
        message: `Found ${data.data?.length || 0} active projects matching "${query}"`,
        data: data.data || [],
        pagination: data.pagination
      }
    } catch (error) {
      console.error('Error searching active projects:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Get project by ID
  async getProjectById(projectId) {
    try {
      console.log('Fetching project by ID:', projectId)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/project/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: projectId
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch project'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Project fetched successfully:', data.data)
      
      return {
        status: true,
        message: "Project retrieved successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Create a new project (client only)
  async createProject(projectData) {
    try {
      console.log('Creating project:', projectData)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/project/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'client'
        },
        body: JSON.stringify(projectData)
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to create project'
        try {
          const errorData = await response.json()
          console.error('❌ Backend error response:', errorData)
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError)
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Project created successfully:', data)
      
      return {
        status: true,
        message: data.message || "Project created successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error creating project:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Update a project (client only)
  async updateProject(projectData) {
    try {
      console.log('Updating project:', projectData)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/project/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'client'
        },
        body: JSON.stringify(projectData)
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
      console.log('Project updated successfully:', data)
      
      return {
        status: true,
        message: data.message || "Project updated successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error updating project:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Delete a project (client only)
  async deleteProject(projectId) {
    try {
      console.log('Deleting project:', projectId)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/project/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'client'
        },
        body: JSON.stringify({
          id: projectId
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete project'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Project deleted successfully:', data)
      
      return {
        status: true,
        message: data.message || "Project deleted successfully"
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Complete a project (client only)
  async completeProject(projectId) {
    try {
      console.log('Completing project:', projectId)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/project/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'client'
        },
        body: JSON.stringify({
          id: projectId
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to complete project'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Project completed successfully:', data)
      
      return {
        status: true,
        message: data.message || "Project completed successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error completing project:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Get project statistics
  async getProjectStats() {
    try {
      console.log('Fetching project statistics')
      
      const response = await authenticatedFetch(`${API_BASE_URL}/project/stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch project statistics'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Project statistics fetched successfully:', data.data)
      
      return {
        status: true,
        message: data.message || "Project statistics fetched successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error fetching project statistics:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Activate a project (move from pending to active)
  async activateProject(projectId) {
    try {
      console.log('Activating project:', projectId)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/project/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'client'
        },
        body: JSON.stringify({
          id: projectId,
          ispending: 0,
          isactive: 1,
          iscompleted: 0,
          status: 'active'
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to activate project'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Project activated successfully:', data)
      
      return {
        status: true,
        message: data.message || "Project activated successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error activating project:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Deactivate a project (move from active to pending)
  async deactivateProject(projectId) {
    try {
      console.log('Deactivating project:', projectId)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/project/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'client'
        },
        body: JSON.stringify({
          id: projectId,
          ispending: 1,
          isactive: 0,
          iscompleted: 0,
          status: 'open'
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to deactivate project'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Project deactivated successfully:', data)
      
      return {
        status: true,
        message: data.message || "Project deactivated successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error deactivating project:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  }
}

export default projectService