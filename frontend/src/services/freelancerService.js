import { authenticatedFetch } from '../utils/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const freelancerService = {
  // Get freelancers by name using existing API
  async getFreelancersByName(name) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/freelancer/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'freelancer'
        },
        body: JSON.stringify({
          name: name,
          user_role: 'freelancer'
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch freelancers'
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
      console.error('Error fetching freelancers:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Get a specific freelancer by ID using existing API
  async getFreelancerById(id) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/freelancer/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'freelancer'
        },
        body: JSON.stringify({
          id: id,
          user_role: 'freelancer'
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch freelancer'
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
      console.error('Error fetching freelancer:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Search freelancers using backend API
  async searchFreelancers(query, params = {}) {
    try {
      
      const searchParams = {
        search: query,
        page: params.page || 1,
        limit: params.limit || 50,
        ...params
      }
      
      const result = await this.getAllFreelancers(searchParams)
      
      
      return result
    } catch (error) {
      console.error('Error searching freelancers:', error)
      return {
        status: false,
        message: "Unable to search freelancers. Please try again later.",
        data: []
      }
    }
  },

  // Get all freelancers from backend API
  async getAllFreelancers(params = {}) {
    try {
      console.log('Fetching freelancers from backend API...')
      console.log('API URL:', `${API_BASE_URL}/freelancer/list`)
      console.log('Request params:', params)
      
      // Check if user is authenticated
      const authHeaders = localStorage.getItem('authHeaders')
      console.log('Auth headers available:', !!authHeaders)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/freelancer/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'client'
        },
        body: JSON.stringify({
          page: params.page || 1,
          limit: params.limit || 50,
          ...params
        })
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch freelancers'
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
      
      const result = await response.json()
      console.log('Response data:', result)
      console.log(`Successfully fetched ${result.data?.length || 0} freelancers from backend`)
      
      return result
    } catch (error) {
      console.error('Error getting all freelancers:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Get freelancers by specific name search
  async getFreelancersByName(name) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/freelancer/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'freelancer'
        },
        body: JSON.stringify({
          name: name,
          user_role: 'freelancer'
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch freelancers'
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
      console.error('Error fetching freelancers by name:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  }
}

export default freelancerService