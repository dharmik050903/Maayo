import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const GoogleSignIn = ({ onSuccess, onError, loading, disabled, buttonText = "Continue with Google" }) => {
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Load Google Identity Services script
    const loadGoogleScript = () => {
      return new Promise((resolve, reject) => {
        if (window.google && window.google.accounts) {
          setIsGoogleLoaded(true)
          resolve()
          return
        }

        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => {
          setIsGoogleLoaded(true)
          resolve()
        }
        script.onerror = () => {
          reject(new Error('Failed to load Google script'))
        }
        document.head.appendChild(script)
      })
    }

    loadGoogleScript().catch((error) => {
      console.error('Error loading Google script:', error)
      if (onError) onError('Failed to load Google services')
    })
  }, [onError])

  const handleGoogleSignIn = async () => {
    if (!isGoogleLoaded || !window.google?.accounts) {
      if (onError) onError('Google services not loaded')
      return
    }

    try {
      // Get Google Client ID from environment
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

      
      if (!clientId || clientId === 'your-google-client-id' || clientId === 'your-google-client-id-here') {
        console.error('Google Client ID not found or is placeholder')
        if (onError) onError('Google Client ID not configured')
        return
      }

      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback
      })

      // Show the Google sign-in popup
      window.google.accounts.id.prompt()
    } catch (error) {
      console.error('Google sign-in error:', error)
      if (onError) onError('Failed to initialize Google sign-in')
    }
  }

  const handleGoogleCallback = async (response) => {
    try {
      // Send the credential to backend
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const res = await fetch(`${API_BASE_URL}/signup/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: response.credential })
      })

      const data = await res.json()

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

        // Redirect based on user type
        setTimeout(() => {
          if (data.user.user_type === 'freelancer') {
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
      if (onError) onError('Failed to process Google sign-in')
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading || disabled || !isGoogleLoaded}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span className="text-gray-700 font-medium">
        {loading ? 'Signing in...' : buttonText}
      </span>
    </button>
  )
}

export default GoogleSignIn
