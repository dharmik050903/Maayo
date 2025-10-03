import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import Input from '../components/Input'
import Button from '../components/Button'
import GoogleSignIn from '../components/GoogleSignIn'
import { PageShimmer } from '../components/Shimmer'
import PasswordRequirements from '../components/PasswordRequirements'
import { countries } from '../data/countries'
import { dialCodes } from '../data/dialCodes'
import CountrySelect from '../components/CountrySelect'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'

export default function Signup() {
  const { t } = useComprehensiveTranslation()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    contact_number: '',
    country: '',
    user_type: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false)

  // Google OAuth states
  const [selectedRole, setSelectedRole] = useState('')

  useEffect(() => {
    // Simulate page loading time
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
            callback: handleGoogleSignUpCallback,
            auto_select: false,
            cancel_on_tap_outside: true
          })
        }
      }
    }

    loadGoogleScript()

    // Make callback function globally available
    window.handleGoogleSignUpCallback = handleGoogleSignUpCallback

    return () => {
      clearTimeout(timer)
      // Clean up global function
      delete window.handleGoogleSignUpCallback
    }
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    
    // Show password requirements when user starts typing in password field
    if (name === 'password') {
      setShowPasswordRequirements(true)
    }
    
    // if country changed, try to set contact_number prefix based on dial code
    if (name === 'country') {
      const selected = countries.find(c => c.name === value)
      if (selected && dialCodes[selected.code]) {
        const current = form.contact_number || ''
        const nextPrefix = dialCodes[selected.code]
        const stripped = current.replace(/^\+[^\s]*/,'').trim()
        const next = stripped ? `${nextPrefix} ${stripped}` : nextPrefix
        setForm({ ...form, country: value, contact_number: next })
        return
      }
    }
    setForm({ ...form, [name]: value })
  }

  function handleCountryChange(countryName) {
    console.log('handleCountryChange called with:', countryName)
    const selected = countries.find(c => c.name === countryName)
    console.log('Selected country:', selected)
    
    if (selected && dialCodes[selected.code]) {
      const current = form.contact_number || ''
      const nextPrefix = dialCodes[selected.code]
      const stripped = current.replace(/^\+[^\s]*/,'').trim()
      const next = stripped ? `${nextPrefix} ${stripped}` : nextPrefix
      console.log('Updating form with country and phone:', countryName, next)
      setForm(prev => ({ ...prev, country: countryName, contact_number: next }))
    } else {
      console.log('Updating form with country only:', countryName)
      setForm(prev => ({ ...prev, country: countryName }))
    }
  }

  function validatePassword(password) {
    const requirements = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[@$!%*?&]/.test(password)
    ]
    return requirements.every(req => req)
  }

  function validate() {
    const next = {}
    console.log('Form data during validation:', form)
    console.log('Country value:', form.country)
    console.log('Country type:', typeof form.country)
    console.log('Country length:', form.country ? form.country.length : 0)
    
    if (!form.first_name) next.first_name = 'First name is required'
    if (!form.last_name) next.last_name = 'Last name is required'
    if (!form.email) next.email = 'Email is required'
    if (!form.password) {
      next.password = 'Password is required'
    } else if (!validatePassword(form.password)) {
      next.password = 'Password does not meet requirements'
    }
    if (!form.contact_number) next.contact_number = 'Phone is required'
    if (!form.country || form.country.trim() === '') next.country = 'Country is required'
    if (!form.user_type) next.user_type = 'Select a user type'
    
    console.log('Validation errors:', next)
    setErrors(next)
    return Object.keys(next).length === 0
  }

  // Standardized function to store authentication data
  const storeAuthData = (token, user, userRole = null) => {
    // Use userRole if provided (from Google sign-up), otherwise use user.user_type (from backend)
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

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    if (!validate()) return;
    setLoading(true);

    try {
      // This will correctly use your VITE_API_BASE_URL.
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      
      console.log('📤 Signup: Sending form data:', form)
      console.log('📤 Signup: API endpoint:', `${API_BASE_URL}/signup`)
      
      const res = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      console.log('📨 Signup: Response data:', data)
      console.log('📨 Signup: Response status:', res.status)
      setLoading(false);

      if (data.message === "User created successfully") {
        setMessage({ type: 'success', text: 'Account created successfully 🎉' });
        // Redirect to login after successful signup
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        let errorMessage = data.message || 'Failed to create account'
        
        // Provide better user guidance for common errors
        if (data.message === "User already exists") {
          errorMessage = "An account with this email already exists. Please use a different email or try logging in instead."
        } else if (data.message === "Please fill required fields") {
          errorMessage = "Please fill in all required fields."
        } else if (res.status === 409) {
          errorMessage = "This email is already registered. Please use a different email or try logging in."
        }
        
        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (err) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Something went wrong. Try again.' });
    }
  }

  // Initialize Google Sign-Up script when role is selected (but don't trigger sign-up)
  useEffect(() => {
    if (selectedRole && !loading) {
      initializeGoogleSignUp()
    }
  }, [selectedRole, loading])

  // Initialize Google Sign-Up (load script and prepare button, but don't trigger sign-up)
  const initializeGoogleSignUp = async () => {
    try {
      console.log('🔄 Initializing Google Sign-Up for role:', selectedRole)
      
      // Check if Google Client ID is configured
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (!clientId) {
        console.log('❌ Google Client ID not configured')
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
        callback: handleGoogleSignUpCallback,
        auto_select: false,
        cancel_on_tap_outside: true
      })

      console.log('🔄 Rendering Google button...')
      // Render Google's official button
      window.google.accounts.id.renderButton(
        document.getElementById('google-signup-button'),
        {
          theme: 'outline',
          size: 'large',
          text: 'signup_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: '100%'
        }
      )

      // Check if Google button rendered successfully and hide fallback if needed
      const checkGoogleButton = () => {
        const googleButton = document.getElementById('google-signup-button')
        const fallbackButton = document.getElementById('google-signup-fallback-button')
        
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

  // Handle Google Sign Up Fallback (custom button)
  const handleGoogleSignUpFallback = async () => {
    if (!selectedRole) {
      setMessage({ type: 'error', text: 'Please select your role first' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      console.log('🔄 Starting Google sign-up fallback for role:', selectedRole)
      
      // Check if Google Client ID is configured
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (!clientId) {
        setMessage({ type: 'error', text: 'Google Client ID not configured' })
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
        callback: handleGoogleSignUpCallback,
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
      console.error('❌ Google sign-up error:', error)
      setMessage({ type: 'error', text: 'Failed to initialize Google sign-up: ' + error.message })
      setLoading(false)
    }
  }

  // Handle Google callback
  const handleGoogleSignUpCallback = async (response) => {
    try {
      console.log('🔍 Google callback received:', response.credential)
      
      // Send the credential to backend
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const res = await fetch(`${API_BASE_URL}/signup/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_role': selectedRole
        },
        body: JSON.stringify({ 
          token: response.credential
        })
      })

      const data = await res.json()
      setLoading(false)

      if (res.ok) {
        // Store auth data using standardized function
        storeAuthData(data.token, data.user, selectedRole)
        
        setMessage({ type: 'success', text: 'Google sign-up successful! Redirecting...' })
        
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
        setMessage({ type: 'error', text: data.message || 'Google sign-up failed' })
      }
    } catch (error) {
      console.error('❌ Google callback error:', error)
      setMessage({ type: 'error', text: 'Failed to process Google sign-up' })
      setLoading(false)
    }
  }

  if (pageLoading) {
    return <PageShimmer />
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left Side - Brand Section */}
      <div className="hidden md:flex bg-brand-gradient text-white p-10 items-center justify-center">
        <div className="space-y-8 max-w-md text-center">
          <div className="flex justify-center">
            <Logo theme="light" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">Join Maayo</h2>
            <p className="text-xl text-white/90">Start your journey with the world's leading freelance platform</p>
            <p className="text-white/80">Connect with top talent or find amazing projects to work on</p>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex items-center justify-center p-6 md:p-12 bg-base">
        <div className="w-full max-w-md">
          <div className="mb-8 md:hidden text-center">
            <div className="flex justify-center">
              <Logo theme="dark" />
            </div>
          </div>
          
          <div className="card p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold text-graphite">Create your account</h1>
              <p className="text-coolgray mt-1">Join Maayo and get started</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="First name"
                    name="first_name"
                    placeholder="John"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                  />
                  {errors.first_name && <p className="text-coral text-sm">{errors.first_name}</p>}
                </div>
                <div>
                  <Input
                    label="Last name"
                    name="last_name"
                    placeholder="Doe"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                  />
                  {errors.last_name && <p className="text-coral text-sm">{errors.last_name}</p>}
                </div>
              </div>

              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
              {errors.email && <p className="text-coral text-sm">{errors.email}</p>}

              <div>
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                {errors.password && <p className="text-coral text-sm">{errors.password}</p>}
                <PasswordRequirements 
                  password={form.password} 
                  show={showPasswordRequirements} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Contact number"
                    name="contact_number"
                    placeholder="+1 555 123 4567"
                    value={form.contact_number}
                    onChange={handleChange}
                    required
                  />
                  {errors.contact_number && <p className="text-coral text-sm">{errors.contact_number}</p>}
                </div>
                <CountrySelect countries={countries} value={form.country} onChange={handleCountryChange} required />
                {errors.country && <p className="text-coral text-sm">{errors.country}</p>}
              </div>

              <label className="block space-y-1.5">
                <span className="text-sm text-graphite">User type <span className="text-red-500">*</span></span>
                <select name="user_type" value={form.user_type} onChange={handleChange} className="input" required>
                  <option value="">Select type</option>
                  <option value="client">Client</option>
                  <option value="freelancer">Freelancer</option>
                </select>
              </label>
              {errors.user_type && <p className="text-coral text-sm">{errors.user_type}</p>}

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
                <Link to="/login" className="link-accent text-sm">
                  {t('haveAccount')} {t('login')}
                </Link>
                <Button type="submit" loading={loading}>
                  {loading ? t('creating') : t('createAccount')}
                </Button>
              </div>

            </form>

            {/* Google Sign Up with Role Selection */}
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

                {/* Google Sign Up Button */}
                <div className="w-full">
                  {/* Google's official button container */}
                  <div 
                    id="google-signup-button"
                    className={`w-full ${!selectedRole || loading ? 'opacity-50 pointer-events-none' : ''}`}
                  ></div>
                  
                  {/* Fallback custom button if Google button doesn't render */}
                  <button
                    type="button"
                    onClick={handleGoogleSignUpFallback}
                    disabled={!selectedRole || loading}
                    className={`w-full flex items-center justify-center px-4 py-3 border rounded-lg font-medium transition-colors mt-2 hidden ${
                      selectedRole && !loading
                        ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                    id="google-signup-fallback-button"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign up with Google
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
