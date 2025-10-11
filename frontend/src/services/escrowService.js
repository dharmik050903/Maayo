import { authenticatedFetch } from '../utils/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const escrowService = {
  /**
   * Add bank details for a user
   * @param {Object} bankData - Bank details data
   * @returns {Promise<Object>} Response data
   */
  async addBankDetails(bankData) {
    try {
      console.log('Adding bank details:', bankData)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/bank-details/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bankData)
      })

      if (!response.ok) {
        let errorMessage = 'Failed to add bank details'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Bank details added successfully:', data)
      
      return {
        status: true,
        message: "Bank details added successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error adding bank details:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  /**
   * Update bank details for a user
   * @param {Object} bankData - Updated bank details data
   * @returns {Promise<Object>} Response data
   */
  async updateBankDetails(bankData) {
    try {
      console.log('Updating bank details:', bankData)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/bank-details/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bankData)
      })

      if (!response.ok) {
        let errorMessage = 'Failed to update bank details'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Bank details updated successfully:', data)
      
      return {
        status: true,
        message: "Bank details updated successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error updating bank details:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  /**
   * Get user's bank details list
   * @returns {Promise<Object>} Bank details list
   */
  async getBankDetailsList() {
    try {
      console.log('Fetching bank details list')
      
      const response = await authenticatedFetch(`${API_BASE_URL}/bank-details/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        let errorMessage = 'Failed to fetch bank details'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Bank details fetched successfully:', data)
      
      return {
        status: true,
        message: "Bank details retrieved successfully",
        data: data.data || []
      }
    } catch (error) {
      console.error('Error fetching bank details:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  /**
   * Set primary bank account
   * @param {string} bankDetailsId - Bank details ID
   * @returns {Promise<Object>} Response data
   */
  async setPrimaryBankDetails(bankDetailsId) {
    try {
      console.log('Setting primary bank details:', bankDetailsId)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/bank-details/set-primary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bank_details_id: bankDetailsId })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to set primary bank details'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Primary bank details set successfully:', data)
      
      return {
        status: true,
        message: "Primary bank details set successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error setting primary bank details:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  /**
   * Delete bank details
   * @param {string} bankDetailsId - Bank details ID
   * @returns {Promise<Object>} Response data
   */
  async deleteBankDetails(bankDetailsId) {
    try {
      console.log('Deleting bank details:', bankDetailsId)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/bank-details/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bank_details_id: bankDetailsId })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to delete bank details'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Bank details deleted successfully:', data)
      
      return {
        status: true,
        message: "Bank details deleted successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error deleting bank details:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  /**
   * Create escrow payment
   * @param {string} projectId - Project ID
   * @param {number} finalAmount - Final project amount
   * @returns {Promise<Object>} Escrow creation response
   */
  async createEscrowPayment(projectId, finalAmount) {
    try {
      console.log('Creating escrow payment:', { projectId, finalAmount })
      
      // Validate inputs
      if (!projectId) {
        throw new Error('Project ID is required')
      }
      
      const amount = parseFloat(finalAmount)
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Valid amount is required')
      }
      
      // Backend will handle escrow existence check
      
      // Get current user data for additional context
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const authHeaders = JSON.parse(localStorage.getItem('authHeaders') || '{}')
      
      const requestBody = {
        project_id: projectId,
        final_amount: amount,
        user_id: authHeaders._id || userData._id,
        user_role: authHeaders.userRole || userData.userRole
      }
      
      console.log('Escrow request body:', requestBody)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/escrow/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        let errorMessage = 'Failed to create escrow payment'
        let errorDetails = null
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
          errorDetails = errorData
          console.error('Escrow creation error details:', errorData)
          
          // Handle specific error cases
          if (errorMessage.includes('already exists')) {
            errorMessage = 'An escrow payment already exists for this project. Please check the escrow management section or contact support if you believe this is an error.'
          } else if (errorMessage.includes('duplicate')) {
            errorMessage = 'Duplicate escrow payment detected. Please refresh the page and try again.'
          }
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
          console.error('Failed to parse error response:', parseError)
        }
        
        // Log detailed error information
        console.error('Escrow creation failed:', {
          status: response.status,
          statusText: response.statusText,
          errorMessage,
          errorDetails,
          requestBody
        })
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Escrow payment created successfully:', data)
      
      return {
        status: true,
        message: "Escrow payment created successfully",
        data: {
          order_id: data.data.order_id,
          amount: data.data.amount,
          currency: data.data.currency,
          project_id: data.data.project_id
        }
      }
    } catch (error) {
      console.error('Error creating escrow payment:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  /**
   * Cancel existing escrow payment
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Cancellation response
   */
  async cancelEscrowPayment(projectId) {
    try {
      console.log('Cancelling escrow payment for project:', projectId)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/escrow/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ project_id: projectId })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to cancel escrow payment'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Escrow payment cancelled successfully:', data)
      
      return {
        status: true,
        message: "Escrow payment cancelled successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error cancelling escrow payment:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  /**
   * Verify escrow payment
   * @param {string} projectId - Project ID
   * @param {string} paymentId - Razorpay payment ID
   * @param {string} signature - Razorpay signature
   * @returns {Promise<Object>} Verification response
   */
  async verifyEscrowPayment(projectId, paymentId, signature) {
    try {
      console.log('Verifying escrow payment:', { projectId, paymentId, signature })
      
      const response = await authenticatedFetch(`${API_BASE_URL}/escrow/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          payment_id: paymentId,
          signature: signature
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to verify escrow payment'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Escrow payment verified successfully:', data)
      
      return {
        status: true,
        message: "Escrow payment verified successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error verifying escrow payment:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  /**
   * Release milestone payment
   * @param {string} projectId - Project ID
   * @param {number} milestoneIndex - Milestone index
   * @returns {Promise<Object>} Release response
   */
  async releaseMilestonePayment(projectId, milestoneIndex) {
    try {
      console.log('Releasing milestone payment:', { projectId, milestoneIndex })
      
      const response = await authenticatedFetch(`${API_BASE_URL}/escrow/release-milestone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          milestone_index: milestoneIndex
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to release milestone payment'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Milestone payment released successfully:', data)
      
      return {
        status: true,
        message: "Milestone payment released successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error releasing milestone payment:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  /**
   * Get escrow status
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Escrow status data
   */
  async getEscrowStatus(projectId) {
    try {
      console.log('Fetching escrow status:', projectId)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/escrow/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ project_id: projectId })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to fetch escrow status'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Escrow status fetched successfully:', data)
      
      return {
        status: true,
        message: "Escrow status retrieved successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error fetching escrow status:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  /**
   * Complete milestone
   * @param {string} projectId - Project ID
   * @param {number} milestoneIndex - Milestone index
   * @param {string} completionNotes - Completion notes
   * @param {string} evidence - Evidence/proof of completion
   * @returns {Promise<Object>} Completion response
   */
  async completeMilestone(projectId, milestoneIndex, completionNotes = '', evidence = '') {
    try {
      console.log('Completing milestone:', { projectId, milestoneIndex, completionNotes, evidence })
      
      const response = await authenticatedFetch(`${API_BASE_URL}/milestone/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          milestone_index: milestoneIndex,
          completion_notes: completionNotes
          // Note: evidence field not supported by backend yet
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to complete milestone'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Milestone completed successfully:', data)
      
      return {
        status: true,
        message: "Milestone completed successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error completing milestone:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  /**
   * Modify milestone
   * @param {string} projectId - Project ID
   * @param {number} milestoneIndex - Milestone index
   * @param {Object} milestoneData - Updated milestone data
   * @returns {Promise<Object>} Modification response
   */
  async modifyMilestone(projectId, milestoneIndex, milestoneData) {
    try {
      console.log('Modifying milestone:', { projectId, milestoneIndex, milestoneData })
      
      const response = await authenticatedFetch(`${API_BASE_URL}/milestone/modify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          milestone_index: milestoneIndex,
          ...milestoneData
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to modify milestone'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Milestone modified successfully:', data)
      
      return {
        status: true,
        message: "Milestone modified successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error modifying milestone:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  /**
   * Add new milestone
   * @param {string} projectId - Project ID
   * @param {Object} milestoneData - Milestone data
   * @returns {Promise<Object>} Addition response
   */
  async addMilestone(projectId, milestoneData) {
    try {
      console.log('Adding milestone:', { projectId, milestoneData })
      
      const response = await authenticatedFetch(`${API_BASE_URL}/milestone/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          ...milestoneData
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to add milestone'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Milestone added successfully:', data)
      
      return {
        status: true,
        message: "Milestone added successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error adding milestone:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  /**
   * Remove milestone
   * @param {string} projectId - Project ID
   * @param {number} milestoneIndex - Milestone index
   * @returns {Promise<Object>} Removal response
   */
  async removeMilestone(projectId, milestoneIndex) {
    try {
      console.log('Removing milestone:', { projectId, milestoneIndex })
      
      const response = await authenticatedFetch(`${API_BASE_URL}/milestone/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          milestone_index: milestoneIndex
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to remove milestone'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Milestone removed successfully:', data)
      
      return {
        status: true,
        message: "Milestone removed successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error removing milestone:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  /**
   * Get project milestones
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Milestones list
   */
  async getMilestones(projectId) {
    try {
      console.log('Fetching milestones:', projectId)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/milestone/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ project_id: projectId })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to fetch milestones'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Milestones fetched successfully:', data)
      
      return {
        status: true,
        message: "Milestones retrieved successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error fetching milestones:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  /**
   * Update project price after bid acceptance
   * @param {string} projectId - Project ID
   * @param {number} finalAmount - Final project amount
   * @returns {Promise<Object>} Update response
   */
  async updateProjectPrice(projectId, finalAmount) {
    try {
      console.log('Updating project price:', { projectId, finalAmount })
      
      const response = await authenticatedFetch(`${API_BASE_URL}/bid/update-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          final_amount: parseFloat(finalAmount)
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to update project price'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Project price updated successfully:', data)
      
      return {
        status: true,
        message: "Project price updated successfully",
        data: data.data
      }
    } catch (error) {
      console.error('Error updating project price:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  }
}

export default escrowService

