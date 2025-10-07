import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import Input from '../components/Input'
import Button from '../components/Button'
import GoogleSignIn from '../components/GoogleSignIn'
import { PageShimmer } from '../components/Shimmer'
import { authenticatedFetch } from '../utils/api'
import { otpService } from '../services/otpService'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'

// Function to check if freelancer profile exists in database
const checkFreelancerProfileExists = async (userId) => {
  try {
    console.log('🔍 Checking freelancer profile for userId:', userId)
    
    // Store user _id in localStorage
    localStorage.setItem('current_user_id', userId)
    console.log('📝 Stored user _id:', userId)
    
    // First check localStorage for quick response
    const profileCompleted = localStorage.getItem('freelancer_profile_completed')
    const profileData = localStorage.getItem('freelancer_profile_data')
    
    console.log('📝 localStorage check:', {
      profileCompleted,
      profileData: profileData ? 'exists' : 'null'
    })
    
    // If profile is completed and we have data, profile exists
    if (profileCompleted === 'true' && profileData) {
      console.log('✅ Profile exists in localStorage - returning true')
      return true
    }
    
    // Check database directly for profile existence
    console.log('🔍 Checking database for freelancer profile...')
    try {
      // Get auth headers from localStorage
      const authHeaders = JSON.parse(localStorage.getItem('authHeaders') || '{}')
      
      console.log('🔍 Making API call to check profile existence:', {
        url: 'http://localhost:5000/api/freelancer/info/list',
        userId,
        headers: {
          'token': authHeaders.token,
          '_id': authHeaders._id,
          'user_role': authHeaders.userRole,
          'user_email': authHeaders.userEmail
        }
      })
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const response = await fetch(`${API_BASE_URL}/freelancer/info/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': authHeaders.token,
          '_id': authHeaders._id,
          'user_role': authHeaders.userRole,
          'user_email': authHeaders.userEmail
        },
        body: JSON.stringify({ 
          id: userId,
          user_role: "freelancer"
        })
      })
      
      console.log('🔍 API response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Profile exists in database:', data)
        
        // Store profile data in localStorage for future quick access
        localStorage.setItem('freelancer_profile_completed', 'true')
        localStorage.setItem('freelancer_profile_data', JSON.stringify(data.data))
        if (data.data && data.data._id) {
          localStorage.setItem('freelancer_profile_id', data.data._id)
        }
        
        return true
      } else {
        const errorData = await response.json()
        console.log('❌ Profile not found in database:', {
          status: response.status,
          error: errorData
        })
        return false
      }
    } catch (verifyError) {
      console.log('❌ Error checking profile in database:', verifyError)
      return false
    }
  } catch (error) {
    console.error('❌ Error checking freelancer profile:', error)
    return false
  }
}

// Function to check if client profile exists in database
const checkClientProfileExists = async (userId) => {
  try {
    console.log('🔍 Checking client profile for userId:', userId)
    
    // First check localStorage for quick response
    const profileCompleted = localStorage.getItem('client_profile_completed')
    const profileData = localStorage.getItem('client_profile_data')
    
    console.log('📝 localStorage check:', {
      profileCompleted,
      profileData: profileData ? 'exists' : 'null'
    })
    
    // If profile is completed and we have data, profile exists
    if (profileCompleted === 'true' && profileData) {
      console.log('✅ Client profile exists in localStorage - returning true')
      return true
    }
    
    // Check database directly for profile existence
    console.log('🔍 Checking database for client profile...')
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/client/info/update`, {
        method: 'POST',
        body: JSON.stringify({ personId: userId })
      })
      
      console.log('📡 Client response status:', response.status)
      console.log('📡 Client response ok:', response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Client update successful - profile exists:', data)
        
        // Store profile data in localStorage for future quick access
        localStorage.setItem('client_profile_completed', 'true')
        localStorage.setItem('client_profile_data', JSON.stringify(data.data))
        if (data.data && data.data._id) {
          localStorage.setItem('client_profile_id', data.data._id)
        }
        
        return true
      } else {
        const errorData = await response.json()
        console.log('📊 Client error response:', errorData)
        
        // If it's a 404, profile doesn't exist
        if (response.status === 404) {
          console.log('❌ Client profile not found (404)')
          return false
        } else {
          console.log('❌ Client other error, assuming profile does not exist')
          return false
        }
      }
    } catch (verifyError) {
      console.log('❌ Error checking client profile in database:', verifyError)
      return false
    }
  } catch (error) {
    console.error('❌ Error checking client profile:', error)
    return false
  }
}

export default function Login() {
  const { t } = useComprehensiveTranslation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [pageLoading, setPageLoading] = useState(true)
  
  // OTP states
  const [loginMethod, setLoginMethod] = useState('password') // 'password' or 'otp'
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [isWakingUpBackend, setIsWakingUpBackend] = useState(false)

  // Google OAuth states
  const [selectedRole, setSelectedRole] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false)
    }, 1000)

    // Load Google Identity Services script
    const loadGoogleScript = () => {
      if (!window.google) {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        document.head.appendChild(script)
        
        script.onload = () => {
          console.log('✅ Google Identity Services loaded')
          // Initialize Google Identity Services
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: handleGoogleSignInCallback,
            auto_select: false,
            cancel_on_tap_outside: true
          })
        }
      }
    }

    loadGoogleScript()

    // Make callback function globally available
    window.handleGoogleSignInCallback = handleGoogleSignInCallback

    return () => {
      clearTimeout(timer)
      // Clean up global function
      delete window.handleGoogleSignInCallback
    }
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: false })
    }
  }

  // Standardized function to store authentication data
  const storeAuthData = (token, user, userRole = null) => {
    // Use userRole if provided (from Google sign-in), otherwise use user.user_type (from backend)
    const finalUserRole = userRole || user.user_type
    
    // Store individual items
    localStorage.setItem('authToken', token)
    
    // Update userData to use the final user role
    const updatedUserData = { ...user, user_type: finalUserRole }
    localStorage.setItem('userData', JSON.stringify(updatedUserData))
    
    // Store auth headers for API calls
    localStorage.setItem('authHeaders', JSON.stringify({
      token: token,
      _id: user._id,
      userRole: finalUserRole,
      userEmail: user.email
    }))
    
    localStorage.setItem('current_user_id', user._id)
    
    console.log('📝 Stored auth data in localStorage')
    console.log('👤 User type:', finalUserRole)
    console.log('🆔 User ID:', user._id)
  }

  // OTP Functions
  const handleSendOTP = async () => {
    if (!form.email) {
      setMessage({ type: 'error', text: 'Please enter your email address' })
      return
    }

    setOtpLoading(true)
    setMessage(null)

    try {
      const response = await otpService.sendLoginOTP(form.email)
      if (response.status) {
        setOtpSent(true)
        setMessage({ type: 'success', text: 'OTP sent to your email address' })
        startResendTimer()
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to send OTP' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to send OTP' })
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otpCode) {
      setMessage({ type: 'error', text: 'Please enter the OTP code' })
      return
    }

    setOtpLoading(true)
    setMessage(null)

    try {
      const response = await otpService.verifyLoginOTP(form.email, otpCode)
      console.log('🔍 OTP Verification Response:', response)
      
      if (response.status) {
        handleOTPLoginSuccess(response)
      } else {
        setMessage({ type: 'error', text: response.message || 'Invalid OTP code' })
      }
    } catch (error) {
      console.error('❌ OTP Verification Error:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to verify OTP' })
    } finally {
      setOtpLoading(false)
    }
  }

  const handleOTPLoginSuccess = async (response) => {
    console.log('🎉 OTP Login Success - Full Response:', response)
    
    const { token, user } = response
    
    console.log('🔑 Token:', token ? 'Present' : 'Missing')
    console.log('👤 User:', user)
    
    if (!token || !user) {
      console.error('❌ Missing token or user data in response')
      setMessage({ type: 'error', text: 'Invalid response from server' })
      return
    }
    
    // Store authentication data using standardized function
    storeAuthData(token, user)

    setMessage({ type: "success", text: "Login successful 🎉" })

    setTimeout(async () => {
      console.log('⏰ Starting redirection logic...')
      try {
        if (user.user_type === 'freelancer') {
          console.log('🔍 Checking freelancer profile...')
          const profileExists = await checkFreelancerProfileExists(user._id)
          console.log('📋 Freelancer profile exists:', profileExists)
          if (profileExists) {
            console.log('✅ Redirecting to freelancer-home')
            window.location.href = "/freelancer-home"
          } else {
            console.log('✅ Redirecting to freelancer-dashboard')
            window.location.href = "/freelancer-dashboard"
          }
        } else if (user.user_type === 'client') {
          console.log('🔍 Checking client profile...')
          const profileExists = await checkClientProfileExists(user._id)
          console.log('📋 Client profile exists:', profileExists)
          if (profileExists) {
            console.log('✅ Redirecting to client-home')
            window.location.href = "/client-home"
          } else {
            console.log('✅ Redirecting to client-dashboard')
            window.location.href = "/client-dashboard"
          }
        }
      } catch (error) {
        console.error('❌ Error checking profile existence:', error)
        console.log('🔄 Using fallback redirect...')
        // Fallback redirect
        if (user.user_type === 'freelancer') {
          console.log('✅ Fallback: Redirecting to freelancer-dashboard')
          window.location.href = "/freelancer-dashboard"
        } else {
          console.log('✅ Fallback: Redirecting to client-dashboard')
          window.location.href = "/client-dashboard"
        }
      }
    }, 1500)
  }

  const handleResendOTP = async () => {
    if (resendTimer > 0) return

    setOtpLoading(true)
    setMessage(null)

    try {
      const response = await otpService.resendOTP(form.email, 'login')
      if (response.status) {
        setMessage({ type: 'success', text: 'OTP resent successfully' })
        startResendTimer()
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to resend OTP' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to resend OTP' })
    } finally {
      setOtpLoading(false)
    }
  }

  const startResendTimer = () => {
    setResendTimer(60)
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handlePasswordReset = async () => {
    if (!form.email) {
      setMessage({ type: 'error', text: 'Please enter your email address first' })
      // Focus on email input
      const emailInput = document.querySelector('input[type="email"]')
      if (emailInput) {
        emailInput.focus()
      }
      return
    }

    setOtpLoading(true)
    setMessage(null)

    try {
      console.log('🔄 Sending password reset OTP to:', form.email)
      
      // Check backend health first (with timeout)
      console.log('🔍 Checking backend health...')
      try {
        const healthCheckPromise = otpService.checkBackendHealth()
        const healthCheckTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Health check timeout')), 10000) // 10 second timeout for health check
        })
        
        const healthCheck = await Promise.race([healthCheckPromise, healthCheckTimeout])
        if (!healthCheck.healthy) {
          console.log('⚠️ Backend health check failed, proceeding with wake-up attempts')
        } else {
          console.log('✅ Backend is healthy at:', healthCheck.url)
        }
      } catch (healthError) {
        console.log('⚠️ Health check failed or timed out, proceeding anyway:', healthError.message)
        // Continue with the request even if health check fails
      }
      
      // Add timeout to prevent hanging (longer for Render cold start)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - please try again')), 60000) // 60 second timeout for Render
      })
      
      const responsePromise = otpService.sendPasswordResetOTP(form.email)
      const response = await Promise.race([responsePromise, timeoutPromise])
      
      console.log('📧 Password reset OTP response:', response)
      
      if (response.status) {
        setShowPasswordReset(true)
        setMessage({ type: 'success', text: 'Password reset OTP sent to your email' })
        startResendTimer()
        setRetryCount(0) // Reset retry count on success
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to send password reset OTP' })
      }
    } catch (error) {
      console.error('❌ Error sending password reset OTP:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to send password reset OTP'
      if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out due to server cold start. Render free tier servers sleep after inactivity and take 30-60 seconds to wake up. Please wait 30 seconds and try again - the second attempt should work much faster.'
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to server. Please check if the backend is running.'
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your internet connection.'
      } else if (error.message.includes('All backend servers are unavailable')) {
        errorMessage = 'Backend server is currently unavailable. Please try again in a few moments.'
      } else {
        errorMessage = error.message || 'Failed to send password reset OTP'
      }
      
      // Increment retry count
      setRetryCount(prev => prev + 1)
      
      // Add retry suggestion if retry count is low
      if (retryCount < 2) {
        errorMessage += ' Click "Forgot password?" again to retry.'
      }
      
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyPasswordReset = async () => {
    if (!otpCode || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    setOtpLoading(true)
    setMessage(null)

    try {
      const response = await otpService.verifyPasswordResetOTP(form.email, otpCode, newPassword)
      if (response.status) {
        setMessage({ type: 'success', text: 'Password reset successfully! You can now login with your new password.' })
        setShowPasswordReset(false)
        setOtpCode('')
        setNewPassword('')
        setConfirmPassword('')
        setLoginMethod('password')
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to reset password' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to reset password' })
    } finally {
      setOtpLoading(false)
    }
  }

  // Initialize Google Sign-In script when role is selected (but don't trigger sign-in)
  useEffect(() => {
    if (selectedRole && !loading && !otpLoading) {
      initializeGoogleSignIn()
    }
  }, [selectedRole, loading, otpLoading])

  // Initialize Google Sign-In (load script and prepare button, but don't trigger sign-in)
  const initializeGoogleSignIn = async () => {
    try {
      console.log('🔄 Initializing Google Sign-In for role:', selectedRole)
      
      // Check if Google Client ID is configured
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (!clientId || clientId === 'your_google_client_id_here') {
        console.log('❌ Google Client ID not configured')
        setMessage({ type: 'error', text: 'Google Sign-In is not configured. Please contact support.' })
        return
      }

      console.log('🔍 Google Client ID:', clientId.substring(0, 20) + '...')

      // Load Google Identity Services script if not already loaded
      if (!window.google) {
        console.log('🔄 Loading Google Identity Services...')
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        document.head.appendChild(script)
        
        await new Promise((resolve, reject) => {
          script.onload = () => {
            console.log('✅ Google Identity Services loaded')
            resolve()
          }
          script.onerror = () => {
            console.error('❌ Failed to load Google Identity Services')
            reject(new Error('Failed to load Google Identity Services'))
          }
        })
      }

      // Initialize Google Identity Services
      console.log('🔄 Initializing Google Identity Services...')
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleSignInCallback,
        auto_select: false,
        cancel_on_tap_outside: true
      })

      console.log('🔄 Rendering Google button...')
      // Render Google's official button
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: '100%'
        }
      )

      // Check if Google button rendered successfully and hide fallback if needed
      const checkGoogleButton = () => {
        const googleButton = document.getElementById('google-signin-button')
        const fallbackButton = document.getElementById('google-fallback-button')
        
        if (googleButton && googleButton.children.length > 0) {
          // Google button rendered successfully
          if (fallbackButton) {
            fallbackButton.classList.add('hidden')
            console.log('✅ Google button rendered, hiding fallback')
          }
        } else {
          // Google button didn't render, show fallback
          if (fallbackButton) {
            fallbackButton.classList.remove('hidden')
            console.log('⚠️ Google button failed, showing fallback')
          }
        }
      }

      // Check immediately and then again after a short delay
      checkGoogleButton()
      setTimeout(checkGoogleButton, 500)
      setTimeout(checkGoogleButton, 1500)

    } catch (error) {
      console.error('❌ Google initialization error:', error)
    }
  }

  // Handle Google Sign In Fallback (custom button)
  const handleGoogleSignInFallback = async () => {
    if (!selectedRole) {
      setMessage({ type: 'error', text: 'Please select your role first' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      console.log('🔄 Starting Google sign-in fallback for role:', selectedRole)
      
      // Check if Google Client ID is configured
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (!clientId || clientId === 'your_google_client_id_here') {
        setMessage({ type: 'error', text: 'Google Sign-In is not configured. Please contact support.' })
        setLoading(false)
        return
      }

      console.log('🔍 Google Client ID:', clientId.substring(0, 20) + '...')

      // Load Google Identity Services script if not already loaded
      if (!window.google) {
        console.log('🔄 Loading Google Identity Services...')
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        document.head.appendChild(script)
        
        await new Promise((resolve, reject) => {
          script.onload = () => {
            console.log('✅ Google Identity Services loaded')
            resolve()
          }
          script.onerror = () => {
            console.error('❌ Failed to load Google Identity Services')
            reject(new Error('Failed to load Google Identity Services'))
          }
        })
      }

      // Initialize Google Identity Services
      console.log('🔄 Initializing Google Identity Services...')
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleSignInCallback,
        auto_select: false,
        cancel_on_tap_outside: true
      })

      console.log('🔄 Showing Google sign-in popup...')
      // Show the Google sign-in popup
      window.google.accounts.id.prompt((notification) => {
        console.log('🔍 Google prompt notification:', notification)
        if (notification.isNotDisplayed()) {
          console.log('❌ Google sign-in not displayed')
          setLoading(false)
          setMessage({ type: 'error', text: 'Google sign-in popup was blocked. Please allow popups for this site.' })
        } else if (notification.isSkippedMoment()) {
          console.log('❌ Google sign-in skipped')
          setLoading(false)
          setMessage({ type: 'error', text: 'Google sign-in was skipped. Please try again.' })
        }
      })

    } catch (error) {
      console.error('❌ Google sign-in error:', error)
      setMessage({ type: 'error', text: 'Failed to initialize Google sign-in: ' + error.message })
      setLoading(false)
    }
  }

  // Handle Google callback
  const handleGoogleSignInCallback = async (response) => {
    try {
      console.log('🔍 Google callback received:', response.credential)
      
      if (!selectedRole) {
        setMessage({ type: 'error', text: 'Please select your role first' })
        return
      }

      setLoading(true)
      setMessage(null)
      
      // Send the credential to backend
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      console.log('🔄 Sending Google token to backend:', API_BASE_URL)
      
      const res = await fetch(`${API_BASE_URL}/login/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': selectedRole
        },
        body: JSON.stringify({ 
          token: response.credential
        })
      })

      console.log('🔍 Backend response status:', res.status)
      const data = await res.json()
      console.log('🔍 Backend response data:', data)

      if (res.ok) {
        // Store auth data using standardized function
        storeAuthData(data.token, data.user, selectedRole)
        
        setMessage({ type: 'success', text: 'Google login successful! Redirecting...' })
        
        // Redirect based on selected role (not backend response)
        setTimeout(() => {
          if (selectedRole === 'freelancer') {
            window.location.href = '/freelancer-dashboard'
          } else if (selectedRole === 'client') {
            window.location.href = '/client-dashboard'
          } else {
            // Fallback to backend response if selectedRole is not set
            if (data.user.user_type === 'freelancer') {
              window.location.href = '/freelancer-dashboard'
            } else {
              window.location.href = '/client-dashboard'
            }
          }
        }, 1500)
      } else {
        console.error('❌ Backend error:', data)
        setMessage({ type: 'error', text: data.message || 'Google login failed' })
      }
    } catch (error) {
      console.error('❌ Google callback error:', error)
      setMessage({ type: 'error', text: 'Failed to process Google sign-in: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  function validate() {
    const next = {}
    const fieldErrorStates = {}
    
    // Email validation
    if (!form.email) {
      next.email = 'Email is required'
      fieldErrorStates.email = true
    } else if (!form.email.includes('@') || !form.email.includes('.com')) {
      next.email = 'Email must contain @ and .com'
      fieldErrorStates.email = true
    }
    
    // Password validation
    if (!form.password) {
      next.password = 'Password is required'
      fieldErrorStates.password = true
    }
    
    setErrors(next)
    setFieldErrors(fieldErrorStates)
    return Object.keys(next).length === 0
  }

  // async function handleSubmit(e) {
  //   e.preventDefault()
  //   setMessage(null)
    
  //   if (loginMethod === 'otp') {
  //     handleVerifyOTP()
  //     return
  //   }
    
  //   if (!validate()) return
  //   setLoading(true)

  //   try {
  //     if(API_BASE_URL && import.meta.env.VITE_API_BASE_URL){
  //       const tempurl= "https://maayo-backend.onrender.com/"
  //     }
  //     const res = await fetch(`${tempurl}/login`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(form),
  //     })

  //     const data = await res.json()
  //     setLoading(false)

  //     if (data.token) {
  //       localStorage.setItem("authToken", data.token)
  //       localStorage.setItem("userData", JSON.stringify(data.user))
        
  //       localStorage.setItem("authHeaders", JSON.stringify({
  //         token: data.token,
  //         _id: data.user._id,
  //         userRole: data.user.user_type,
  //         userEmail: data.user.email
  //       }))
        
  //       setMessage({ type: "success", text: "Login successful 🎉" })

  //       console.log('=== DEBUG LOCALSTORAGE ===')
  //       console.log('freelancer_profile_id:', localStorage.getItem('freelancer_profile_id'))
  //       console.log('freelancer_personId:', localStorage.getItem('freelancer_personId'))
  //       console.log('freelancer_profile_completed:', localStorage.getItem('freelancer_profile_completed'))
  //       console.log('freelancer_profile_data:', localStorage.getItem('freelancer_profile_data'))
  //       console.log('userType:', data.user.user_type)
  //       console.log('current user _id:', data.user._id)
  //       console.log('========================')



  //       setTimeout(async () => {
  //         try {
  //           console.log('🚀 Login Debug: Starting profile existence check')
  //           console.log('👤 User data:', data.user)
  //           console.log('🆔 User _id:', data.user._id)
  //           console.log('👥 User type:', data.user.user_type)
            
  //           if (data.user.user_type === 'freelancer') {
  //             console.log('🔍 Checking freelancer profile for user:', data.user._id)
  //             console.log('🔍 User data:', data.user)
              
  //             console.log('📝 Pre-check localStorage:')
  //             console.log('  - freelancer_profile_id:', localStorage.getItem('freelancer_profile_id'))
  //             console.log('  - freelancer_profile_completed:', localStorage.getItem('freelancer_profile_completed'))
  //             console.log('  - freelancer_profile_data:', localStorage.getItem('freelancer_profile_data'))
              
  //             const profileExists = await checkFreelancerProfileExists(data.user._id)
  //             console.log('📋 Freelancer profile exists result:', profileExists)
              
  //             if (profileExists) {
  //               console.log('✅ Freelancer profile exists, redirecting to home page')
  //               window.location.href = "/freelancer-home"
  //             } else {
  //               console.log('❌ No freelancer profile, redirecting to dashboard')
  //               window.location.href = "/freelancer-dashboard"
  //             }
  //           } else if (data.user.user_type === 'client') {
  //             console.log('🔍 Checking client profile for user:', data.user._id)
  //             const profileExists = await checkClientProfileExists(data.user._id)
  //             console.log('📋 Client profile exists result:', profileExists)
              
  //             if (profileExists) {
  //               console.log('✅ Client profile exists in database, redirecting to home page')
  //               window.location.href = "/client-home"
  //             } else {
  //               console.log('❌ No client profile in database, redirecting to dashboard')
  //               window.location.href = "/client-dashboard"
  //             }
  //           }
  //         } catch (error) {
  //           console.error('❌ Error checking profile existence:', error)
  //           console.log('🔄 Using fallback logic...')
            
  //           if (data.user.user_type === 'freelancer') {
  //             const profileCompleted = localStorage.getItem('freelancer_profile_completed')
  //             const profileData = localStorage.getItem('freelancer_profile_data')
  //             console.log('📝 Fallback check - profileCompleted:', profileCompleted, 'profileData exists:', !!profileData)
              
  //             if (profileCompleted === 'true' && profileData) {
  //               console.log('✅ Fallback: Profile exists, redirecting to home')
  //               window.location.href = "/freelancer-home"
  //             } else {
  //               console.log('❌ Fallback: No profile, redirecting to dashboard')
  //               window.location.href = "/freelancer-dashboard"
  //             }
  //           } else if (data.user.user_type === 'client') {
  //             const profileCompleted = localStorage.getItem('client_profile_completed')
  //             const profileData = localStorage.getItem('client_profile_data')
  //             console.log('📝 Fallback check - profileCompleted:', profileCompleted, 'profileData exists:', !!profileData)
              
  //             if (profileCompleted === 'true' && profileData) {
  //               console.log('✅ Fallback: Profile exists, redirecting to home')
  //               window.location.href = "/client-home"
  //             } else {
  //               console.log('❌ Fallback: No profile, redirecting to dashboard')
  //               window.location.href = "/client-dashboard"
  //             }
  //           }
  //         }
  //       }, 1500)
  //     } else {
  //       setMessage({ type: "error", text: data.message || "Invalid credentials" })
  //     }
  //   } catch (err) {
  //     setLoading(false)
  //     setMessage({ type: "error", text: "Something went wrong. Try again." })
  //   }
  // }

    async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    
    if (loginMethod === 'otp') {
      handleVerifyOTP();
      return;
    }
    
    if (!validate()) return;
    setLoading(true);

    try {
      // This line will now automatically use your production URL when deployed
      // and your localhost URL during development.
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setLoading(false);

      if (res.status === 403 && data.suspended) {
        // Handle user suspension
        setMessage({ 
          type: "error", 
          text: `🚫 Account Suspended: ${data.message || 'Your account has been suspended. Please contact support.'}`
        });
        return;
      }

      if (data.token) {
        // Store auth data using standardized function
        storeAuthData(data.token, data.user)
        
        setMessage({ type: "success", text: "Login successful 🎉" });

        // (The rest of your redirection logic here is fine)
        setTimeout(async () => {
          try {
            if (data.user.user_type === 'freelancer') {
              const profileExists = await checkFreelancerProfileExists(data.user._id);
              if (profileExists) {
                window.location.href = "/freelancer-home";
              } else {
                window.location.href = "/freelancer-dashboard";
              }
            } else if (data.user.user_type === 'client') {
              const profileExists = await checkClientProfileExists(data.user._id);
              if (profileExists) {
                window.location.href = "/client-home";
              } else {
                window.location.href = "/client-dashboard";
              }
            }
          } catch (error) {
            console.error('Error checking profile, redirecting to dashboard:', error);
            window.location.href = data.user.user_type === 'freelancer' ? "/freelancer-dashboard" : "/client-dashboard";
          }
        }, 1500);

      } else {
        setMessage({ type: "error", text: data.message || "Invalid credentials" });
      }
    } catch (err) {
      setLoading(false);
      setMessage({ type: "error", text: "Something went wrong. Check your connection or if the server is running." });
    }
  }
  if (pageLoading) {
    return <PageShimmer />
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex bg-brand-gradient text-white p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-violet/20"></div>
        <div className="relative z-10 space-y-10 max-w-lg text-center">
          <div className="flex justify-center">
            <Logo theme="light" />
          </div>
          <div className="space-y-6">
            <h2 className="text-5xl font-bold leading-tight">Welcome back</h2>
            <p className="text-2xl text-white/90 leading-relaxed">Login to continue your journey with Maayo</p>
            <p className="text-lg text-white/80 leading-relaxed">Connect with talented professionals and grow your business</p>
          </div>
          <div className="flex justify-center space-x-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-sm text-white/80">Secure</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-sm text-white/80">Fast</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-sm text-white/80">Reliable</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12 bg-base">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden text-center">
            <div className="flex justify-center">
              <Logo theme="dark" />
            </div>
          </div>
          
          <div className="card-elevated p-10">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-graphite mb-2">{t('welcomeBack')}</h1>
              <p className="text-coolgray text-lg">{t('loginToContinue')}</p>
              
              <div className="flex bg-gray-100 rounded-lg p-1 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('password')
                    setOtpSent(false)
                    setOtpCode('')
                    setMessage(null)
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    loginMethod === 'password'
                      ? 'bg-white text-graphite shadow-sm'
                      : 'text-coolgray hover:text-graphite'
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('otp')
                    setOtpSent(false)
                    setOtpCode('')
                    setMessage(null)
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    loginMethod === 'otp'
                      ? 'bg-white text-graphite shadow-sm'
                      : 'text-coolgray hover:text-graphite'
                  }`}
                >
                  {t('otpLogin')}
                </button>
              </div>
            </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <Input
            label={t('email')}
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
            error={fieldErrors.email ? "Please enter a valid email" : null}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            }
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        {loginMethod === 'password' ? (
          <div>
            <Input
              label={t('password')}
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              error={fieldErrors.password ? "Please enter your password" : null}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>
               ) : (
                 <div>
                   {!otpSent ? (
                     <div className="space-y-4">
                       <Button
                         type="button"
                         onClick={handleSendOTP}
                         loading={otpLoading}
                         className="w-full"
                       >
                         {otpLoading ? 'Sending OTP...' : 'Send OTP'}
                       </Button>
                     </div>
                   ) : (
                     <div className="space-y-4">
                       <div>
                         <label className="block text-sm font-medium text-graphite mb-1">OTP Code <span className="text-red-500">*</span></label>
                         <input
                           type="text"
                           placeholder="Enter 6-digit OTP"
                           value={otpCode}
                           onChange={(e) => setOtpCode(e.target.value)}
                           maxLength="6"
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet text-center text-lg tracking-widest"
                         />
                       </div>
                       <div className="flex gap-2">
                         <Button
                           type="submit"
                           loading={otpLoading}
                           className="flex-1"
                         >
                           {otpLoading ? 'Verifying...' : 'Verify OTP'}
                         </Button>
                         <Button
                           type="button"
                           onClick={handleResendOTP}
                           disabled={resendTimer > 0 || otpLoading}
                           variant="secondary"
                           className="flex-1"
                         >
                           {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                         </Button>
                       </div>
                     </div>
                   )}
                 </div>
               )}

        {message && (
                <div className={`p-3 rounded-lg text-sm ${
                  message.type === 'success' 
                    ? 'bg-mint/20 text-mint border border-mint/30' 
                    : 'bg-coral/20 text-coral border border-coral/30'
                }`}>
            {message.text}
                </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <Link to="/signup" className="link-accent text-sm">
            Create account
          </Link>
          <div className="flex flex-col items-end gap-2">
            {/* Forgot Password Link - Exactly Above Login Button */}
            {loginMethod === 'password' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={otpLoading}
                  title="Enter your email first, then click here to reset password"
                  className="text-sm text-coral hover:text-coral/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed underline hover:no-underline"
                >
                  {otpLoading ? 'Sending... (may take up to 60s)' : 'Forgot password?'}
                </button>
                {retryCount > 0 && (
                  <div className="text-xs text-coolgray mt-1">
                    Retry attempts: {retryCount}
                    {retryCount >= 2 && (
                      <div className="text-xs text-coral mt-1">
                        Server may be cold. Try waiting 30 seconds then retry.
                        <br />
                        <button 
                          type="button"
                          onClick={async () => {
                            console.log('🚀 Manual wake-up attempt...')
                            try {
                              const response = await fetch('https://maayo-backend.onrender.com/health', {
                                method: 'GET',
                                timeout: 15000
                              })
                              if (response.ok) {
                                setMessage({ type: 'success', text: 'Server warmed up! Try forgot password again.' })
                              } else {
                                setMessage({ type: 'error', text: 'Wake-up failed. Please try again later.' })
                              }
                            } catch (error) {
                              setMessage({ type: 'error', text: 'Wake-up failed. Please try again later.' })
                            }
                          }}
                          className="text-xs text-violet hover:text-violet/80 underline mt-1"
                        >
                          Warm up server
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {loginMethod === 'password' && (
              <Button 
                type="submit" 
                variant="accent" 
                loading={loading}
                size="lg"
                className="w-full"
              >
                {loading ? 'Signing in...' : 'Login'}
              </Button>
            )}
          </div>
        </div>

      </form>

      {/* Google Sign In with Role Selection */}
      <div className="pt-4">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-graphite">Select your role *</h3>
          
          {/* Role Selection */}
          <div className="space-y-3">
            {/* Client Option */}
            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
              <input
                type="radio"
                name="userRole"
                value="client"
                className="mr-3 text-blue-600 focus:ring-blue-500"
                onChange={(e) => setSelectedRole(e.target.value)}
              />
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h2v2H7V5zm0 4h2v2H7V9zm0 4h2v2H7v-2zm4-8h2v2h-2V5zm0 4h2v2h-2V9zm0 4h2v2h-2v-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-graphite">Client</div>
                  <div className="text-sm text-gray-500">I want to hire freelancers</div>
                </div>
              </div>
            </label>

            {/* Freelancer Option */}
            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-green-300 transition-colors">
              <input
                type="radio"
                name="userRole"
                value="freelancer"
                className="mr-3 text-green-600 focus:ring-green-500"
                onChange={(e) => setSelectedRole(e.target.value)}
              />
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-graphite">Freelancer</div>
                  <div className="text-sm text-gray-500">I want to find work</div>
                </div>
              </div>
            </label>
          </div>

          {/* Google Sign In Button */}
          <div className="w-full">
            {/* Google's official button container */}
            <div 
              id="google-signin-button"
              className={`w-full ${!selectedRole || loading || otpLoading ? 'opacity-50 pointer-events-none' : ''}`}
            ></div>
            
            {/* Fallback custom button if Google button doesn't render */}
            <button
              type="button"
              onClick={handleGoogleSignInFallback}
              disabled={!selectedRole || loading || otpLoading}
              className={`w-full flex items-center justify-center px-4 py-3 border rounded-lg font-medium transition-colors mt-2 ${
                selectedRole && !loading && !otpLoading
                  ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                  : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
              id="google-fallback-button"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>

      {/* Admin Login Button */}
      <div className="pt-4 border-t border-gray-200">
        <Link 
          to="/admin/login" 
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622C17.176 19.29 21 14.591 21 9a12.02 12.02 0 00-.382-2.016z" />
          </svg>
          Admin Login
        </Link>
      </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-graphite mb-2">Reset Password</h2>
              <p className="text-coolgray">Enter the OTP sent to your email and your new password</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleVerifyPasswordReset(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">OTP Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  maxLength="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet text-center text-lg tracking-widest"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-graphite mb-1">New Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Confirm Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowPasswordReset(false)
                    setOtpCode('')
                    setNewPassword('')
                    setConfirmPassword('')
                    setMessage(null)
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={otpLoading}
                  className="flex-1"
                >
                  {otpLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
