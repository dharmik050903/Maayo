import { authenticatedFetch } from '../utils/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Log the API base URL for debugging
console.log('messageApiService: API_BASE_URL is set to:', API_BASE_URL)

export const messageApiService = {
  // Health check to test backend connection
  async healthCheck() {
    try {
      console.log('messageApiService: Testing backend connection...')
      const response = await fetch(`${API_BASE_URL}/chat/health`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('messageApiService: Backend is healthy:', data)
        return { success: true, data }
      } else {
        console.error('messageApiService: Backend health check failed:', response.status)
        return { success: false, error: `Backend returned status ${response.status}` }
      }
    } catch (error) {
      console.error('messageApiService: Backend health check error:', error)
      return { success: false, error: error.message }
    }
  },
  // Send a message
  async sendMessage(bidId, message) {
    try {
      console.log('messageApiService: Sending message for bid:', bidId, 'message:', message)
      const response = await authenticatedFetch(`${API_BASE_URL}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bid_id: bidId,
          message: message
        })
      })

      console.log('messageApiService: Send message response status:', response.status)

      if (!response.ok) {
        // Check if response is HTML (error page)
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('text/html')) {
          const htmlText = await response.text()
          console.error('messageApiService: Received HTML instead of JSON when sending message:', htmlText.substring(0, 200))
          throw new Error('Server returned an error page. Please check if the backend is running correctly.')
        }
        
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to send message')
      }

      const data = await response.json()
      console.log('messageApiService: Successfully sent message:', data)
      return {
        success: true,
        data: data.data,
        message: data.message
      }
    } catch (error) {
      console.error('messageApiService: Error sending message:', error)
      return {
        success: false,
        error: error.message || 'Failed to send message'
      }
    }
  },

  // Get messages for a bid
  async getMessages(bidId, page = 1, limit = 50) {
    try {
      console.log('messageApiService: Fetching messages for bid:', bidId)
      const response = await authenticatedFetch(`${API_BASE_URL}/chat/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bid_id: bidId,
          page: page,
          limit: limit
        })
      })

      console.log('messageApiService: Response status:', response.status)
      console.log('messageApiService: Response headers:', response.headers)

      if (!response.ok) {
        // Check if response is HTML (error page)
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('text/html')) {
          const htmlText = await response.text()
          console.error('messageApiService: Received HTML instead of JSON:', htmlText.substring(0, 200))
          throw new Error('Server returned an error page. Please check if the backend is running correctly.')
        }
        
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch messages')
      }

      const data = await response.json()
      console.log('messageApiService: Successfully fetched messages:', data)
      return {
        success: true,
        data: data.data || [],
        pagination: data.pagination,
        message: data.message
      }
    } catch (error) {
      console.error('messageApiService: Error fetching messages:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch messages',
        data: []
      }
    }
  },

  // Get conversations (accepted bids with messages)
  async getConversations() {
    try {
      console.log('messageApiService: Fetching conversations from:', `${API_BASE_URL}/chat/conversations`)
      const response = await authenticatedFetch(`${API_BASE_URL}/chat/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      console.log('messageApiService: Conversations response status:', response.status)

      if (!response.ok) {
        // Check if response is HTML (error page)
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('text/html')) {
          const htmlText = await response.text()
          console.error('messageApiService: Received HTML instead of JSON for conversations:', htmlText.substring(0, 200))
          throw new Error('Server returned an error page. Please check if the backend is running correctly.')
        }
        
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch conversations')
      }

      const data = await response.json()
      console.log('messageApiService: Successfully fetched conversations:', data)
      return {
        success: true,
        data: data.data || [],
        message: data.message || 'Conversations fetched successfully'
      }
    } catch (error) {
      console.error('messageApiService: Error fetching conversations:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch conversations',
        data: []
      }
    }
  }
}

export default messageApiService
