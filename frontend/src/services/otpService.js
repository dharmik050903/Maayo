// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in production (not localhost)
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  if (isProduction) {
    // For production, use the same domain but with /api path
    return `${window.location.protocol}//${window.location.hostname}/api`
  }
  
  // For development, use localhost
  return 'http://localhost:5000/api'
}

const API_BASE_URL = getApiBaseUrl()

// Log the API URL being used for debugging
console.log('🔧 OTP Service: Using API URL:', API_BASE_URL)
console.log('🔧 OTP Service: Current hostname:', window.location.hostname)
console.log('🔧 OTP Service: Environment:', import.meta.env.MODE)

export const otpService = {
  // Check if backend is available
  async checkBackendHealth() {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
        method: 'GET',
        timeout: 3000
      })
      return response.ok
    } catch (error) {
      console.log('🔍 Backend health check failed:', error)
      return false
    }
  },

  // Send OTP for login
  async sendLoginOTP(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/otp/send-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to send OTP'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          // If response is not JSON (like HTML error page), use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error sending login OTP:', error)
      // Check if it's a network error or server not running
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Verify OTP for login
  async verifyLoginOTP(email, otpCode) {
    try {
      const response = await fetch(`${API_BASE_URL}/otp/verify-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp_code: otpCode })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to verify OTP'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error verifying login OTP:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Send OTP for password reset
  async sendPasswordResetOTP(email) {
    try {
      console.log('🔄 OTP Service: Sending password reset OTP to:', email)
      console.log('🔄 OTP Service: API URL:', `${API_BASE_URL}/otp/send-password-reset`)
      
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
      
      const response = await fetch(`${API_BASE_URL}/otp/send-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      console.log('📧 OTP Service: Response status:', response.status)
      
      if (!response.ok) {
        let errorMessage = 'Failed to send password reset OTP'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      return await response.json()
    } catch (error) {
      console.error('❌ OTP Service: Error sending password reset OTP:', error)
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again')
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Verify OTP for password reset
  async verifyPasswordResetOTP(email, otpCode, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/otp/verify-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp_code: otpCode, new_password: newPassword })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to reset password'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error verifying password reset OTP:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  // Resend OTP
  async resendOTP(email, purpose = 'login') {
    try {
      const response = await fetch(`${API_BASE_URL}/otp/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, purpose })
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to resend OTP'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error resending OTP:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  }
}

export default otpService
