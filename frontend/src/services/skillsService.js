import { authenticatedFetch } from '../utils/api'
import { apiCache } from '../utils/apiCache'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const skillsService = {
  // Get all skills
  async getSkills() {
    try {
      console.log('🔄 Fetching skills from API...')
      
      const requestOptions = {
        method: 'POST',
        body: JSON.stringify({})
      }

      // Check cache first
      const cachedData = apiCache.get(`${API_BASE_URL}/skills`, requestOptions)
      if (cachedData) {
        return cachedData
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/skills`, requestOptions)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch skills' }))
        console.error('❌ Skills API error:', errorData)
        throw new Error(errorData.message || 'Failed to fetch skills')
      }
      
      const data = await response.json()
      console.log('✅ Skills fetched successfully:', data)
      
      // Return in consistent format
      const result = {
        success: true,
        message: data.message || 'Skills fetched successfully',
        data: data.data || []
      }

      // Cache the result
      apiCache.set(`${API_BASE_URL}/skills`, requestOptions, result)
      
      return result
    } catch (error) {
      console.error('❌ Error fetching skills:', error)
      
      // Return fallback skills if API fails
      console.log('🔄 Using fallback skills...')
      return {
        success: false,
        message: error.message || 'Failed to fetch skills from server',
        error: error.message,
        data: getFallbackSkills()
      }
    }
  },

  // Search skills (for autocomplete)
  async searchSkills(query) {
    try {
      const allSkills = await this.getSkills()
      if (allSkills.data) {
        const filtered = allSkills.data.filter(skill => 
          skill.skill.toLowerCase().includes(query.toLowerCase())
        )
        return {
          success: true,
          data: filtered
        }
      }
      return { success: false, data: [] }
    } catch (error) {
      console.error('Error searching skills:', error)
      return { success: false, data: [], error: error.message }
    }
  }
}

// Fallback skills if API fails
function getFallbackSkills() {
  return [
    { _id: 'fallback-1', skill: 'JavaScript', category: 'Programming Language' },
    { _id: 'fallback-2', skill: 'Python', category: 'Programming Language' },
    { _id: 'fallback-3', skill: 'React', category: 'Frontend Framework' },
    { _id: 'fallback-4', skill: 'Node.js', category: 'Backend Framework' },
    { _id: 'fallback-5', skill: 'HTML/CSS', category: 'Frontend' },
    { _id: 'fallback-6', skill: 'UI/UX Design', category: 'Design' },
    { _id: 'fallback-7', skill: 'Content Writing', category: 'Writing' },
    { _id: 'fallback-8', skill: 'SEO', category: 'Digital Marketing' },
    { _id: 'fallback-9', skill: 'WordPress', category: 'CMS' },
    { _id: 'fallback-10', skill: 'Mobile App Development', category: 'Mobile Development' },
    { _id: 'fallback-11', skill: 'Data Analysis', category: 'Data Science' },
    { _id: 'fallback-12', skill: 'Graphic Design', category: 'Design' },
    { _id: 'fallback-13', skill: 'PHP', category: 'Programming Language' },
    { _id: 'fallback-14', skill: 'MongoDB', category: 'Database' },
    { _id: 'fallback-15', skill: 'AWS', category: 'Cloud Platform' }
  ]
}

export default skillsService
