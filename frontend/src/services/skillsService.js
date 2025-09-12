import { authenticatedFetch } from '../utils/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const skillsService = {
  // Get all skills
  async getSkills() {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/skills`, {
        method: 'POST',
        body: JSON.stringify({})
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch skills')
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching skills:', error)
      throw error
    }
  }
}

export default skillsService
