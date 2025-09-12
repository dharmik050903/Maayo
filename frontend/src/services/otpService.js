const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const otpService = {
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
      const response = await fetch(`${API_BASE_URL}/otp/send-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })
      
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
      console.error('Error sending password reset OTP:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
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
