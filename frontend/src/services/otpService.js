// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in production (not localhost)
  const isProduction = window.location.hostname !== 'localhost' && 
                      window.location.hostname !== '127.0.0.1' &&
                      !window.location.hostname.includes('localhost') &&
                      window.location.hostname !== ''
  
  console.log('🔧 Environment check:', {
    hostname: window.location.hostname,
    href: window.location.href,
    isProduction,
    viteApiUrl: import.meta.env.VITE_API_BASE_URL,
    viteMode: import.meta.env.MODE,
    viteDev: import.meta.env.DEV,
    viteProd: import.meta.env.PROD
  })
  
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('✅ Using VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
    return import.meta.env.VITE_API_BASE_URL
  }
  
  if (isProduction) {
    // For production, use the Render backend directly
    const renderBackend = 'https://maayo-backend.onrender.com/api'
    console.log('✅ Using Render backend for production:', renderBackend)
    console.log('🌐 Current domain:', window.location.hostname)
    console.log('🔗 Full URL:', window.location.href)
    return renderBackend
  }
  
  // For development, use localhost
  const localhostBackend = 'http://localhost:5000/api'
  console.log('✅ Using localhost backend for development:', localhostBackend)
  return localhostBackend
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

// Make API URL test available globally for debugging
window.testApiConnection = async () => {
  const testUrl = 'https://maayo-backend.onrender.com/api/otp/send-password-reset'
  console.log('🔍 Testing direct API connection to:', testUrl)
  
  try {
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com' })
    })
    
    console.log('📊 Direct API test response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })
    
    return { success: true, status: response.status }
  } catch (error) {
    console.error('❌ Direct API test failed:', error)
    return { success: false, error: error.message }
  }
}

export const otpService = {
  // Get all possible API URLs to try
  getPossibleApiUrls() {
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    
    console.log('🔧 Getting possible API URLs:', { isProduction, hostname: window.location.hostname })
    
    if (import.meta.env.VITE_API_BASE_URL) {
      console.log('✅ Using VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
      return [import.meta.env.VITE_API_BASE_URL]
    }
    
    if (isProduction) {
      const urls = [
        'https://maayo-backend.onrender.com/api', // Your actual Render backend
        `${window.location.protocol}//${window.location.hostname}/api`,
        `${window.location.protocol}//api.${window.location.hostname}`,
        `${window.location.protocol}//backend.${window.location.hostname}`,
        'https://api.maayo.com/api',
        'https://backend.maayo.com/api'
      ]
      console.log('✅ Production URLs:', urls)
      return urls
    }
    
    const localhostUrl = 'http://localhost:5000/api'
    console.log('✅ Development URL:', localhostUrl)
    return [localhostUrl]
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
        
        // Try multiple wake-up attempts with increasing delays
        const wakeUpAttempts = [
          { url: `${apiUrl.replace('/api', '')}/health`, delay: 0 },
          { url: `${apiUrl}/health`, delay: 2000 },
          { url: `${apiUrl.replace('/api', '')}/status`, delay: 4000 }
        ]
        
        for (const attempt of wakeUpAttempts) {
          try {
            if (attempt.delay > 0) {
              console.log(`⏳ Waiting ${attempt.delay}ms before next wake-up attempt...`)
              await new Promise(resolve => setTimeout(resolve, attempt.delay))
            }
            
            const response = await fetch(attempt.url, {
              method: 'GET',
              timeout: 10000
            })
            
            if (response.ok) {
              console.log('✅ Render backend is awake at:', attempt.url)
              return true
            }
          } catch (error) {
            console.log(`⚠️ Wake-up attempt failed for ${attempt.url}:`, error.message)
          }
        }
        
        console.log('⚠️ All wake-up attempts failed, proceeding anyway')
        return false
      } catch (error) {
        console.log('⚠️ Render wake-up failed, proceeding anyway:', error.message)
        return false
      }
    }
    return true
  },

  // Send OTP for password reset
  async sendPasswordResetOTP(email) {
    const possibleUrls = this.getPossibleApiUrls()
    
    for (let i = 0; i < possibleUrls.length; i++) {
      const apiUrl = possibleUrls[i]
      try {
        console.log(`🔄 OTP Service: Attempt ${i + 1}/${possibleUrls.length} - Trying API URL:`, apiUrl)
        console.log('🔄 OTP Service: Sending password reset OTP to:', email)
        
        // Wake up Render backend if needed
        const wakeUpSuccess = await this.wakeUpRenderBackend(apiUrl)
        
        // If wake-up failed and this is a Render URL, add extra delay
        if (!wakeUpSuccess && apiUrl.includes('onrender.com')) {
          console.log('⏳ Adding extra delay for Render cold start...')
          await new Promise(resolve => setTimeout(resolve, 5000)) // 5 second delay
        }
        
        // Create AbortController for timeout (longer timeout for Render cold start)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 second timeout for Render
        
        // Try the request with retries
        let response
        let lastError
        
        for (let retry = 0; retry < 3; retry++) {
          try {
            console.log(`📧 OTP Service: Attempt ${retry + 1}/3 for password reset`)
            
            response = await fetch(`${apiUrl}/otp/send-password-reset`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email }),
              signal: controller.signal
            })
            
            console.log('📧 OTP Service: Response status:', response.status, 'from URL:', apiUrl)
            break // Success, exit retry loop
            
          } catch (error) {
            lastError = error
            console.log(`❌ OTP Service: Attempt ${retry + 1} failed:`, error.message)
            
            if (retry < 2) { // Don't delay on last attempt
              const delay = (retry + 1) * 3000 // 3s, 6s delays
              console.log(`⏳ Waiting ${delay}ms before retry...`)
              await new Promise(resolve => setTimeout(resolve, delay))
            }
          }
        }
        
        clearTimeout(timeoutId)
        
        if (!response) {
          throw lastError || new Error('All retry attempts failed')
        }
        
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
