import { checkClientProfileExists, checkFreelancerProfileExists, getCurrentUser } from '../utils/api'

export const roleService = {
  /**
   * Check if user has any existing profiles
   * @returns {Promise<Object>} Role detection result
   */
  async detectUserRole() {
    try {
      const user = getCurrentUser()
      if (!user || !user._id) {
        return {
          hasRole: false,
          role: null,
          message: 'User not authenticated'
        }
      }

      // Check if user already has a role set
      if (user.user_type) {
        return {
          hasRole: true,
          role: user.user_type,
          message: `User is already a ${user.user_type}`
        }
      }

      // Check for existing profiles
      const [hasClientProfile, hasFreelancerProfile] = await Promise.all([
        checkClientProfileExists(user._id),
        checkFreelancerProfileExists(user._id)
      ])

      if (hasClientProfile && hasFreelancerProfile) {
        return {
          hasRole: true,
          role: 'both',
          message: 'User has both client and freelancer profiles'
        }
      } else if (hasClientProfile) {
        return {
          hasRole: true,
          role: 'client',
          message: 'User has client profile'
        }
      } else if (hasFreelancerProfile) {
        return {
          hasRole: true,
          role: 'freelancer',
          message: 'User has freelancer profile'
        }
      } else {
        return {
          hasRole: false,
          role: null,
          message: 'No existing profiles found'
        }
      }
    } catch (error) {
      console.error('Error detecting user role:', error)
      return {
        hasRole: false,
        role: null,
        message: 'Error checking user profiles',
        error: error.message
      }
    }
  },

  /**
   * Update user role in localStorage
   * @param {string} role - New role ('client' or 'freelancer')
   */
  updateUserRole(role) {
    try {
      const user = getCurrentUser()
      if (!user) return false

      // Update user data
      const updatedUser = { ...user, user_type: role }
      localStorage.setItem('userData', JSON.stringify(updatedUser))

      // Update auth headers
      const authHeaders = JSON.parse(localStorage.getItem('authHeaders') || '{}')
      authHeaders.userRole = role
      localStorage.setItem('authHeaders', JSON.stringify(authHeaders))

      return true
    } catch (error) {
      console.error('Error updating user role:', error)
      return false
    }
  },

  /**
   * Get user's current role
   * @returns {string|null} Current role or null
   */
  getCurrentRole() {
    const user = getCurrentUser()
    return user ? user.user_type : null
  },

  /**
   * Check if user needs role selection
   * @returns {Promise<boolean>} True if role selection is needed
   */
  async needsRoleSelection() {
    const roleDetection = await this.detectUserRole()
    return !roleDetection.hasRole
  }
}

export default roleService
