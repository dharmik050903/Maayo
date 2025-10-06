import { authenticatedFetch } from '../utils/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const jobService = {
  // Create a new job posting (Client only)
  createJob: async (jobData) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/job/create`, {
        method: 'POST',
        body: JSON.stringify(jobData)
      })
      return await response.json()
    } catch (error) {
      console.error('Error creating job:', error)
      throw error
    }
  },

  // Get all jobs with filters (Public access)
  getJobs: async (filters = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}/job/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      })
      return await response.json()
    } catch (error) {
      console.error('Error fetching jobs:', error)
      throw error
    }
  },

  // Get job details by ID (Public access)
  getJobById: async (jobId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/job/detail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId })
      })
      return await response.json()
    } catch (error) {
      console.error('Error fetching job details:', error)
      throw error
    }
  },

  // Update job posting (Client only)
  updateJob: async (jobId, jobData) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/job/update`, {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId, ...jobData })
      })
      return await response.json()
    } catch (error) {
      console.error('Error updating job:', error)
      throw error
    }
  },

  // Delete job posting (Client only)
  deleteJob: async (jobId) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/job/delete`, {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId })
      })
      return await response.json()
    } catch (error) {
      console.error('Error deleting job:', error)
      throw error
    }
  },

  // Close job posting (Client only)
  closeJob: async (jobId) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/job/close`, {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId })
      })
      return await response.json()
    } catch (error) {
      console.error('Error closing job:', error)
      throw error
    }
  },

  // Get client's job listings
  getClientJobs: async (filters = {}) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/job/client-jobs`, {
        method: 'POST',
        body: JSON.stringify(filters)
      })
      return await response.json()
    } catch (error) {
      console.error('Error fetching client jobs:', error)
      throw error
    }
  },

  // Get job statistics
  getJobStats: async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/job/stats`, {
        method: 'POST'
      })
      return await response.json()
    } catch (error) {
      console.error('Error fetching job stats:', error)
      throw error
    }
  }
}
