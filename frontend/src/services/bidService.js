import { authenticatedFetch } from '../utils/api'

const API_BASE_URL = 'http://localhost:5000/api'

export const bidService = {
  // Create a new bid
  async createBid(bidData) {
    try {
      console.log('Creating bid:', bidData)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/bid/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'freelancer'
        },
        body: JSON.stringify(bidData)
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to create bid'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Bid created successfully:', data)
      
      return {
        status: true,
        message: data.message || "Bid created successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error creating bid:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Get bids for a specific project
  async getProjectBids(projectId, status = null, page = 1, limit = 20) {
    try {
      console.log('Fetching bids for project:', projectId)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/bid/project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          status: status,
          page: page,
          limit: limit
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch project bids'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Project bids fetched successfully:', data.data?.length || 0)
      
      return {
        status: true,
        message: data.message || "Bids fetched successfully",
        data: data.data || [],
        pagination: data.pagination
      }
    } catch (error) {
      console.error('Error fetching project bids:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Get bids by a specific freelancer
  async getFreelancerBids(freelancerId = null, status = null, page = 1, limit = 20) {
    try {
      console.log('Fetching freelancer bids:', freelancerId)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/bid/freelancer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'freelancer'
        },
        body: JSON.stringify({
          freelancer_id: freelancerId,
          status: status,
          page: page,
          limit: limit
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch freelancer bids'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Freelancer bids fetched successfully:', data.data?.length || 0)
      
      return {
        status: true,
        message: data.message || "Freelancer bids fetched successfully",
        data: data.data || [],
        pagination: data.pagination
      }
    } catch (error) {
      console.error('Error fetching freelancer bids:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Accept a bid (client only)
  async acceptBid(bidId) {
    try {
      console.log('Accepting bid:', bidId)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/bid/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'client'
        },
        body: JSON.stringify({
          bid_id: bidId
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to accept bid'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Bid accepted successfully:', data)
      
      return {
        status: true,
        message: data.message || "Bid accepted successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error accepting bid:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Reject a bid (client only)
  async rejectBid(bidId, clientMessage = '') {
    try {
      console.log('Rejecting bid:', bidId)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/bid/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'client'
        },
        body: JSON.stringify({
          bid_id: bidId,
          client_message: clientMessage
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to reject bid'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Bid rejected successfully:', data)
      
      return {
        status: true,
        message: data.message || "Bid rejected successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error rejecting bid:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Withdraw a bid (freelancer only)
  async withdrawBid(bidId) {
    try {
      console.log('Withdrawing bid:', bidId)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/bid/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'freelancer'
        },
        body: JSON.stringify({
          bid_id: bidId
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to withdraw bid'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Bid withdrawn successfully:', data)
      
      return {
        status: true,
        message: data.message || "Bid withdrawn successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error withdrawing bid:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Update a bid (freelancer only)
  async updateBid(bidId, updateData) {
    try {
      console.log('Updating bid:', bidId, updateData)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/bid/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'freelancer'
        },
        body: JSON.stringify({
          bid_id: bidId,
          ...updateData
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to update bid'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Bid updated successfully:', data)
      
      return {
        status: true,
        message: data.message || "Bid updated successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error updating bid:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  }
}

export default bidService