import { authenticatedFetch } from '../utils/api'

const API_BASE_URL = 'http://localhost:5000/api'

export const reviewService = {
  // Create a new review
  async createReview(reviewData) {
    try {
      console.log('Creating review:', reviewData)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/review/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to create review'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Review created successfully:', data)
      
      return {
        status: true,
        message: data.message || "Review created successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error creating review:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Get reviews for a specific user
  async getUserReviews(userId, userType = null, page = 1, limit = 20) {
    try {
      console.log('Fetching reviews for user:', userId)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/review/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          user_type: userType,
          page: page,
          limit: limit
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch user reviews'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('User reviews fetched successfully:', data.data?.length || 0)
      
      return {
        status: true,
        message: data.message || "Reviews fetched successfully",
        data: data.data || [],
        averageRatings: data.averageRatings,
        pagination: data.pagination
      }
    } catch (error) {
      console.error('Error fetching user reviews:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Get reviews for a specific project
  async getProjectReviews(projectId) {
    try {
      console.log('Fetching reviews for project:', projectId)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/review/project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch project reviews'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Project reviews fetched successfully:', data.data?.length || 0)
      
      return {
        status: true,
        message: data.message || "Project reviews fetched successfully",
        data: data.data || []
      }
    } catch (error) {
      console.error('Error fetching project reviews:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Update a review
  async updateReview(reviewId, updateData) {
    try {
      console.log('Updating review:', reviewId, updateData)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/review/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          review_id: reviewId,
          ...updateData
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to update review'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Review updated successfully:', data)
      
      return {
        status: true,
        message: data.message || "Review updated successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error updating review:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Delete a review
  async deleteReview(reviewId) {
    try {
      console.log('Deleting review:', reviewId)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/review/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          review_id: reviewId
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete review'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Review deleted successfully:', data)
      
      return {
        status: true,
        message: data.message || "Review deleted successfully"
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  }
}

export default reviewService
