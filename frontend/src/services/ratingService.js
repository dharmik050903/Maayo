import { authenticatedFetch } from '../utils/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const ratingService = {
  // Submit a rating for a project
  async submitRating(ratingData) {
    try {
      console.log('Submitting rating:', ratingData)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/rating/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ratingData)
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to submit rating'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Rating submitted successfully:', data)
      
      return {
        status: true,
        message: data.message || "Rating submitted successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Get ratings for a freelancer
  async getFreelancerRatings(freelancerId) {
    try {
      console.log('Fetching ratings for freelancer:', freelancerId)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/rating/freelancer/${freelancerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch ratings'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Freelancer ratings fetched successfully:', data.data?.length || 0)
      
      return {
        status: true,
        message: data.message || "Ratings fetched successfully",
        data: data.data || []
      }
    } catch (error) {
      console.error('Error fetching freelancer ratings:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  }
}