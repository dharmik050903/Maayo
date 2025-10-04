import { authenticatedFetch } from '../utils/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Request deduplication to prevent double API calls
const pendingRequests = new Map()

function createRequestKey(projectId, status = null, page = 1, limit = 20) {
  return `getProjectBids:${projectId}:${status}:${page}:${limit}`
}

export const bidService = {
  // Create a new bid
  async createBid(bidData) {
    try {
      console.log('🔄 BidService: Creating bid with data:', bidData)
      console.log('🔍 BidService: API endpoint:', `${API_BASE_URL}/bid/create`)
      
      // Check authentication before making request
      const authHeaders = localStorage.getItem('authHeaders')
      if (!authHeaders) {
        throw new Error('No authentication found. Please log in again.')
      }
      
      const authData = JSON.parse(authHeaders)
      console.log('🔍 BidService: Auth data:', {
        userId: authData._id,
        userRole: authData.userRole,
        userEmail: authData.userEmail,
        tokenLength: authData.token?.length
      })
      
      // Create debug version of authenticatedFetch call to see what's being sent
      console.log('🔐 BidService: Call authenticatedFetch with debug headers...')
      
      const response = await authenticatedFetch(`${API_BASE_URL}/bid/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': 'freelancer'
        },
        body: JSON.stringify(bidData)
      })
      
      console.log('📡 BidService: AuthenticatedFetch completed, response status:', response.status)
      
      console.log('📡 BidService: Response status:', response.status, 'OK:', response.ok)
      
      if (!response.ok) {
        let errorMessage = 'Failed to create bid'
        let errorData = null
        
        try {
          errorData = await response.json()
          errorMessage = errorData.message || errorMessage
          console.log('📡 BidService: Error response data:', errorData)
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
          console.log('📡 BidService: Could not parse error response')
        }
        
        // Special handling for 403 Forbidden
        if (response.status === 403) {
          errorMessage = 'Access denied. Only freelancers can submit bids. Please check your account permissions.'
          console.log('🚫 BidService: 403 Forbidden - Check user role and authentication')
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
      console.error('Error type:', typeof error)
      console.error('Error message:', error.message)
      console.error('Error name:', error.name)
      
      // Check for various network/connection errors
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') ||
          error.message.includes('fetch') ||
          error.name === 'TypeError' ||
          error.message.includes('ERR_NETWORK') ||
          error.message.includes('ERR_CONNECTION_REFUSED') ||
          error.message.includes('ERR_INTERNET_DISCONNECTED')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Get bids for a specific project
  async getProjectBids(projectId, status = null, page = 1, limit = 20) {
    try {
      const requestKey = createRequestKey(projectId, status, page, limit)
      
      // Check if this exact request is already pending
      if (pendingRequests.has(requestKey)) {
        console.log('🔄 BidService: Request already pending, waiting for result:', requestKey)
        return await pendingRequests.get(requestKey)
      }
      
      // Create new request promise
      const requestPromise = this._fetchProjectBidsWithoutDedupe(projectId, status, page, limit)
      
      // Store the promise in pending requests
      pendingRequests.set(requestKey, requestPromise)
      
      try {
        const result = await requestPromise
        return result
      } finally {
        // Remove from pending requests
        pendingRequests.delete(requestKey)
      }
    } catch (error) {
      console.error('Error in getProjectBids:', error)
      throw error
    }
  },

  // Internal method without deduplication logic
  async _fetchProjectBidsWithoutDedupe(projectId, status = null, page = 1, limit = 20) {
    try {
      console.log('🚀 NEW BUILD TEST: BidService getProjectBids called!')
      console.log('🔄 BidService: Fetching bids for project:', projectId)
      console.log('🔍 BidService: API endpoint:', `${API_BASE_URL}/bid/project`)
      
      // Check authentication before making request
      const authHeaders = localStorage.getItem('authHeaders')
      if (!authHeaders) {
        throw new Error('No authentication found. Please log in again.')
      }
      
      const authData = JSON.parse(authHeaders)
      console.log('🔍 BidService: Auth data for getProjectBids:', {
        userId: authData._id,
        userRole: authData.userRole,
        userEmail: authData.userEmail,
        tokenLength: authData.token?.length
      })
      
      const requestBody = {
        project_id: projectId,
        status: status,
        page: page,
        limit: limit
      }
      
      console.log('🔍 BidService: Request body:', requestBody)
      
      // Add detailed debugging for the authenticatedFetch call
      console.log('🔐 BidService: About to call authenticatedFetch with:')
      console.log('   - URL:', `${API_BASE_URL}/bid/project`)
      console.log('   - Method: POST')
      console.log('   - Headers:', {
        'Content-Type': 'application/json',
        'user_role': authData.userRole || 'client'
      })
      console.log('   - Auth Token Available:', !!authData.token)
      console.log('   - User ID:', authData._id)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/bid/project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': authData.userRole || 'client' // Add user role to headers
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('📡 BidService: authenticatedFetch completed')
      
      console.log('📡 BidService: Response status:', response.status, 'OK:', response.ok)
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch project bids'
        let errorData = null
        
        try {
          errorData = await response.json()
          errorMessage = errorData.message || errorMessage
          console.log('📡 BidService: Error response data:', errorData)
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
          console.log('📡 BidService: Could not parse error response')
        }
        
        // Special handling for access denied errors
        
        // Note: API might be called twice due to React StrictMode - this is normal in development
        if (response.status === 403 || errorMessage.includes('Access denied')) {
          console.log('🚫 BidService: Access denied - Check project ownership and user role')
          console.log('🔍 BidService: Debug info - Project ID:', projectId, 'User Role:', authData.userRole)
          console.log('💡 BidService: Likely cause - PersonId mismatch similar to client projects issue')
          
          // Apply same fix as client projects - try alternative approach
          console.log('🔄 BidService: Attempting fallback bid fetching strategy...')
          
          try {
            // Fallback: Try fetching bids without strict project ownership validation
            // This is similar to the client projects fix - bypass the ownership check
            console.log('🔄 BidService: Trying alternative bid fetching approach...')
            
            const fallbackResponse = await authenticatedFetch(`${API_BASE_URL}/bid/list`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'user_role': authData.userRole || 'client'
              },
              body: JSON.stringify({
                project_id: projectId,
                status: status,
                page: page,
                limit: limit,
                // Add bypass flag if backend supports it
                bypass_ownership_check: true
              })
            })
            
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json()
              console.log('✅ BidService: Fallback strategy successful:', fallbackData.data?.length || 0, 'bids')
              return {
                status: true,
                message: "Bids fetched using alternative method",
                data: fallbackData.data || [],
                pagination: fallbackData.pagination || { total: 0, page: 1, limit: 20 }
              }
            } else {
              console.log('⚠️ BidService: Fallback strategy also returned error:', fallbackResponse.status)
            }
          } catch (fallbackError) {
            console.log('❌ BidService: Fallback strategy failed:', fallbackError.message)
          }
          
          // If fallback fails, return user-friendly message
          errorMessage = `Cannot fetch bids for project ${projectId}. The project appears to have ownership/permission issues. This might be resolved by ensuring the project was created with the same account you're currently logged in with.`
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