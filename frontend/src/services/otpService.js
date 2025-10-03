// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in production (not localhost)
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  if (isProduction) {
    // For production, try multiple possible backend URLs
    const possibleUrls = [
      `${window.location.protocol}//${window.location.hostname}/api`,
      `${window.location.protocol}//api.${window.location.hostname}`,
      `${window.location.protocol}//backend.${window.location.hostname}`,
      'https://api.maayo.com/api', // Replace with your actual backend domain
      'https://backend.maayo.com/api' // Replace with your actual backend domain
    ]
    
    // For now, return the first option (same domain)
    return possibleUrls[0]
  }
  
  // For development, use localhost
  return 'http://localhost:5000/api'
}

const API_BASE_URL = getApiBaseUrl()

// Log the API URL being used for debugging
console.log('🔧 OTP Service: Using API URL:', API_BASE_URL)
console.log('🔧 OTP Service: Current hostname:', window.location.hostname)
console.log('🔧 OTP Service: Environment:', import.meta.env.MODE)

// Make health check available globally for debugging
window.testBackendHealth = async () => {
  const otpService = (await import('./otpService.js')).otpService
  const result = await otpService.checkBackendHealth()
  console.log('🔍 Backend Health Check Result:', result)
  return result
}

export const otpService = {
  // Get all possible API URLs to try
  getPossibleApiUrls() {
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    
    if (import.meta.env.VITE_API_BASE_URL) {
      return [import.meta.env.VITE_API_BASE_URL]
    }
    
    if (isProduction) {
      return [
        'https://maayo-backend.onrender.com/api', // Your actual Render backend
        `${window.location.protocol}//${window.location.hostname}/api`,
        `${window.location.protocol}//api.${window.location.hostname}`,
        `${window.location.protocol}//backend.${window.location.hostname}`,
        'https://api.maayo.com/api',
        'https://backend.maayo.com/api'
      ]
    }
    
    return ['http://localhost:5000/api']
  },

  // Check if backend is available
  async checkBackendHealth() {
    const possibleUrls = this.getPossibleApiUrls()
    
    for (const url of possibleUrls) {
      try {
        console.log('🔍 Checking backend health at:', url)
        
        // Try multiple health check endpoints
        const healthEndpoints = [
          `${url.replace('/api', '')}/health`,
          `${url}/health`,
          `${url}/status`,
          `${url.replace('/api', '')}/status`
        ]
        
        for (const endpoint of healthEndpoints) {
          try {
            const response = await fetch(endpoint, {
              method: 'GET',
              timeout: 3000
            })
            if (response.ok) {
              console.log('✅ Backend is healthy at:', url, 'endpoint:', endpoint)
              return { healthy: true, url }
            }
          } catch (endpointError) {
            console.log('❌ Health endpoint failed:', endpoint, endpointError.message)
          }
        }
        
        // If no health endpoint works, try a simple API call
        try {
          const response = await fetch(`${url}/otp/send-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com' }),
            timeout: 3000
          })
          // Even if it fails with 400/422, it means the server is responding
          if (response.status !== 500 && response.status !== 0) {
            console.log('✅ Backend is responding at:', url, 'status:', response.status)
            return { healthy: true, url }
          }
        } catch (apiError) {
          console.log('❌ API test failed at:', url, apiError.message)
        }
        
      } catch (error) {
        console.log('❌ Backend health check failed at:', url, error.message)
      }
    }
    
    console.log('❌ All backend health checks failed')
    return { healthy: false, url: null }
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

  // Wake up Render backend (ping to prevent cold start)
  async wakeUpRenderBackend(apiUrl) {
    if (apiUrl.includes('onrender.com')) {
      try {
        console.log('🌅 Waking up Render backend...')
        await fetch(`${apiUrl.replace('/api', '')}/health`, {
          method: 'GET',
          timeout: 5000
        })
        console.log('✅ Render backend is awake')
      } catch (error) {
        console.log('⚠️ Render wake-up failed, proceeding anyway:', error.message)
      }
    }
  },

  // Send OTP for password reset
  async sendPasswordResetOTP(email) {
    const possibleUrls = this.getPossibleApiUrls()
    
    for (const apiUrl of possibleUrls) {
      try {
        console.log('🔄 OTP Service: Trying API URL:', apiUrl)
        console.log('🔄 OTP Service: Sending password reset OTP to:', email)
        
        // Wake up Render backend if needed
        await this.wakeUpRenderBackend(apiUrl)
        
        // Create AbortController for timeout (longer timeout for Render cold start)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout for Render
        
        const response = await fetch(`${apiUrl}/otp/send-password-reset`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        console.log('📧 OTP Service: Response status:', response.status, 'from URL:', apiUrl)
        
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
        
        console.log('✅ OTP Service: Successfully sent password reset OTP from:', apiUrl)
        return await response.json()
        
      } catch (error) {
        console.error('❌ OTP Service: Error with URL', apiUrl, ':', error.message)
        
        // If this is the last URL, throw the error
        if (apiUrl === possibleUrls[possibleUrls.length - 1]) {
          if (error.name === 'AbortError') {
            throw new Error('Request timeout - please try again')
          } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('Unable to connect to server. Please check if the backend is running.')
          }
          throw error
        }
        
        // Otherwise, continue to next URL
        console.log('🔄 OTP Service: Trying next API URL...')
        continue
      }
    }
    
    // If we get here, all URLs failed
    throw new Error('All backend servers are unavailable. Please try again later.')
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
