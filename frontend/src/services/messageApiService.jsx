import { authenticatedFetch } from '../utils/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const messageApiService = {
  // Send a message
  async sendMessage(bidId, message) {
    try {
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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to send message')
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data,
        message: data.message
      }
    } catch (error) {
      console.error('Error sending message:', error)
      return {
        success: false,
        error: error.message || 'Failed to send message'
      }
    }
  },

  // Get messages for a bid
  async getMessages(bidId, page = 1, limit = 50) {
    try {
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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch messages')
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || [],
        pagination: data.pagination,
        message: data.message
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
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
      // First get all accepted bids for the current user
      const bidsResponse = await authenticatedFetch(`${API_BASE_URL}/bid/freelancer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'accepted'
        })
      })

      if (!bidsResponse.ok) {
        throw new Error('Failed to fetch accepted bids')
      }

      const bidsData = await bidsResponse.json()
      const acceptedBids = bidsData.data || []

      // Get conversations for each accepted bid
      const conversations = []
      
      for (const bid of acceptedBids) {
        try {
          const messagesResponse = await this.getMessages(bid._id, 1, 1) // Get only the latest message
          if (messagesResponse.success && messagesResponse.data.length > 0) {
            const latestMessage = messagesResponse.data[0]
            conversations.push({
              bid_id: bid._id,
              project_id: bid.project_id,
              project_title: bid.project_title || 'Project',
              freelancer_id: bid.freelancer_id,
              freelancer_name: bid.freelancer_name || 'Freelancer',
              client_id: bid.client_id,
              client_name: bid.client_name || 'Client',
              latest_message: latestMessage.message,
              latest_message_time: latestMessage.sent_at,
              status: bid.status
            })
          }
        } catch (error) {
          console.error(`Error fetching messages for bid ${bid._id}:`, error)
        }
      }

      return {
        success: true,
        data: conversations,
        message: 'Conversations fetched successfully'
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch conversations',
        data: []
      }
    }
  }
}

export default messageApiService
