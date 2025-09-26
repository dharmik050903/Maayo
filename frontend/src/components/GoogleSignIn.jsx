import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const GoogleSignIn = ({ onSuccess, onError, loading, disabled, buttonText = "Continue with Google" }) => {
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Load Google Identity Services script with better error handling
    const loadGoogleScript = () => {
      return new Promise((resolve, reject) => {
        if (window.google && window.google.accounts) {
          console.log('✅ Google services already loaded')
          setIsGoogleLoaded(true)
          resolve()
          return
        }

        console.log('🔄 Loading Google Identity Services script...')
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => {
          console.log('✅ Google script loaded successfully')
          setIsGoogleLoaded(true)
          resolve()
        }
        script.onerror = (error) => {
          console.error('❌ Failed to load Google script:', error)
          reject(new Error('Failed to load Google script'))
        }
        document.head.appendChild(script)
      })
    }

    loadGoogleScript().catch((error) => {
      console.error('❌ Error loading Google script:', error)
      if (onError) onError('Failed to load Google services')
    })
  }, [onError])

  const handleGoogleSignIn = async () => {
    if (!selectedRole) {
      if (onError) onError('Please select a user type first')
      return
    }
    
    // Proceed with Google sign-in
    await proceedWithGoogleSignIn(selectedRole)
  }

  const handleRoleChange = (role) => {
    setSelectedRole(role)
  }

  const proceedWithGoogleSignIn = async (role) => {
    setIsAuthenticating(true)

    try {
      console.log('🔄 Starting Google OAuth flow for role:', role)

      // Get OAuth URL from backend
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const response = await fetch(`${API_BASE_URL}/auth/google/flow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      })

      const data = await response.json()
      
      if (!response.ok) {
        console.error('❌ Failed to get OAuth URL:', data)
        setIsAuthenticating(false)
        if (onError) onError(data.message || 'Failed to initialize Google sign-in')
        return
      }

      console.log('✅ OAuth URL received:', data.authUrl)
      
      // Redirect to Google OAuth URL
      window.location.href = data.authUrl

    } catch (error) {
      console.error('❌ Google sign-in error:', error)
      setIsAuthenticating(false)
      if (onError) onError('Failed to initialize Google sign-in')
    }
  }



  const handleGoogleCallback = async (response, selectedRole) => {
    try {
      console.log('🔍 Google callback - Selected role:', selectedRole)
      
      // Send the credential to backend with selected role in headers
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const res = await fetch(`${API_BASE_URL}/signup/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'userRole': selectedRole // Send role in headers as expected by backend (camelCase)
        },
        body: JSON.stringify({ 
          token: response.credential
        })
      })

      console.log('📡 Response status:', res.status)
      const data = await res.json()
      console.log('📡 Response data:', data)

      setIsAuthenticating(false)

      if (res.status === 403 && data.suspended) {
        // Handle user suspension
        if (onError) onError(`🚫 Account Suspended: ${data.message || 'Your account has been suspended. Please contact support.'}`)
        return
      }

      if (res.status === 403) {
        // Handle other 403 errors
        console.error('❌ 403 Error:', data)
        if (onError) onError(data.message || 'Access denied. Please try again.')
        return
      }

      if (data.token) {
        // Store authentication data
        localStorage.setItem("authToken", data.token)
        localStorage.setItem("userData", JSON.stringify(data.user))
        localStorage.setItem("authHeaders", JSON.stringify({
          token: data.token,
          _id: data.user._id,
          userRole: data.user.user_type,
          userEmail: data.user.email
        }))

        // Call success callback
        if (onSuccess) {
          onSuccess(data)
        }

        // Redirect based on selected role
        setTimeout(() => {
          if (selectedRole === 'freelancer') {
            navigate('/freelancer-dashboard')
          } else {
            navigate('/client-dashboard')
          }
        }, 1000)
      } else {
        if (onError) onError(data.message || 'Google sign-in failed')
      }
    } catch (error) {
      console.error('Google callback error:', error)
      setIsAuthenticating(false)
      if (onError) onError('Failed to process Google sign-in')
    }
  }

  return (
    <div className="space-y-4">
      {/* User Type Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-graphite">
          Select your role <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="userType"
              value="client"
              checked={selectedRole === 'client'}
              onChange={() => handleRoleChange('client')}
              className="w-4 h-4 text-violet focus:ring-violet border-gray-300"
            />
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">Client</span>
                <p className="text-xs text-gray-500">I want to hire freelancers</p>
              </div>
            </div>
          </label>
          
          <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="userType"
              value="freelancer"
              checked={selectedRole === 'freelancer'}
              onChange={() => handleRoleChange('freelancer')}
              className="w-4 h-4 text-violet focus:ring-violet border-gray-300"
            />
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6z" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">Freelancer</span>
                <p className="text-xs text-gray-500">I want to find work</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Google Sign-in Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || disabled || !isGoogleLoaded || isAuthenticating || !selectedRole}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span className="text-gray-700 font-medium">
          {isAuthenticating ? 'Opening Google...' : loading ? 'Signing in...' : buttonText}
        </span>
      </button>

      {/* Show authentication status when authenticating */}
      {isAuthenticating && (
        <div className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md bg-gray-50">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700 font-medium">Authenticating with Google...</span>
        </div>
      )}
    </div>
  )
}

export default GoogleSignIn
