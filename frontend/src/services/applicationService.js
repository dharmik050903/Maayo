import { authenticatedFetch } from '../utils/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const applicationService = {
  // Apply for a job (Freelancer only)
  applyForJob: async (jobId, applicationData) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/job/apply`, {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId, ...applicationData })
      })
      return await response.json()
    } catch (error) {
      console.error('Error applying for job:', error)
      throw error
    }
  },

  // Get freelancer's applications
  getFreelancerApplications: async (filters = {}) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/job/applications`, {
        method: 'POST',
        body: JSON.stringify(filters)
      })
      return await response.json()
    } catch (error) {
      console.error('Error fetching freelancer applications:', error)
      throw error
    }
  },

  // Get applications for a specific job (Client only)
  getJobApplications: async (jobId, filters = {}) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/job/job-applications`, {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId, ...filters })
      })
      return await response.json()
    } catch (error) {
      console.error('Error fetching job applications:', error)
      throw error
    }
  },

  // Update application status (Client only)
  updateApplicationStatus: async (applicationId, statusData) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/job/application/update-status`, {
        method: 'POST',
        body: JSON.stringify({ application_id: applicationId, ...statusData })
      })
      return await response.json()
    } catch (error) {
      console.error('Error updating application status:', error)
      throw error
    }
  },

  // Save/unsave a job (Freelancer only)
  toggleJobSave: async (jobId) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/job/save`, {
        method: 'POST',
        body: JSON.stringify({ 
          job_id: jobId
          // Let backend handle all the required fields
        })
      })
      return await response.json()
    } catch (error) {
      console.error('Error toggling job save:', error)
      throw error
    }
  },

  // Get saved jobs (Freelancer only)
  getSavedJobs: async (filters = {}) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/job/saved-jobs`, {
        method: 'POST',
        body: JSON.stringify(filters)
      })
      return await response.json()
    } catch (error) {
      console.error('Error fetching saved jobs:', error)
      throw error
    }
  },

  // Get application statistics
  getApplicationStats: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/job/application-stats`, {
        method: 'POST'
      })
      return await response.json()
    } catch (error) {
      console.error('Error fetching application stats:', error)
      throw error
    }
  },

  // Withdraw application (Freelancer only)
  withdrawApplication: async (applicationId) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/job/application/withdraw`, {
        method: 'POST',
        body: JSON.stringify({ application_id: applicationId })
      })
      return await response.json()
    } catch (error) {
      console.error('Error withdrawing application:', error)
      throw error
    }
  }
}
