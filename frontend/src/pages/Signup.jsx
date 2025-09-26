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

export default function Signup() {
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


  // async function handleSubmit(e) {
  //   e.preventDefault()
  //   setMessage(null)
  //   if (!validate()) return
  //   setLoading(true)

  //   try {
  //     let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  //     if(API_BASE_URL && import.meta.env.VITE_API_BASE_URL ){
  //       API_BASE_URL = "https://maayo-backend.onrender.com"
  //       console.log(API_BASE_URL)
  //     }
  //     const res = await fetch(`${API_BASE_URL}/signup`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(form),
  //     })

  //     const data = await res.json()
  //     setLoading(false)

  //     if (data.message === "User created successfully") {
  //       setMessage({ type: 'success', text: 'Account created successfully 🎉' })
  //       // Redirect to login after successful signup
  //       setTimeout(() => {
  //         window.location.href = "/login"
  //       }, 2000)
  //     } else {
  //       setMessage({ type: 'error', text: data.message || 'Failed to create account' })
  //     }
  //   } catch (err) {
  //     setLoading(false)
  //     setMessage({ type: 'error', text: 'Something went wrong. Try again.' })
  //   }
  // }
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    if (!validate()) return;
    setLoading(true);

    try {
      // This will correctly use your VITE_API_BASE_URL.
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      
      const res = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setLoading(false);

      if (data.message === "User created successfully") {
        setMessage({ type: 'success', text: 'Account created successfully 🎉' });
        // Redirect to login after successful signup
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create account' });
      }
    } catch (err) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Something went wrong. Try again.' });
    }
  }

  // Handle Google Sign Up
  const handleGoogleSignUp = async () => {
    if (!selectedRole) {
      setMessage({ type: 'error', text: 'Please select your role first' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      console.log('🔄 Starting Google sign-up for role:', selectedRole)
      
      // Check if Google Client ID is configured
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (!clientId) {
        setMessage({ type: 'error', text: 'Google Client ID not configured' })
        setLoading(false)
        return
      }

      console.log('🔍 Google Client ID:', clientId.substring(0, 20) + '...')

      // Load Google Identity Services script
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

      console.log('🔄 Showing Google sign-in prompt...')
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
          'userRole': selectedRole
        },
        body: JSON.stringify({ 
          token: response.credential
        })
      })

      const data = await res.json()
      setLoading(false)

      if (res.ok) {
        // Store auth data
        localStorage.setItem('authHeaders', JSON.stringify({
          token: data.token,
          _id: data.user._id,
          userRole: data.user.user_type,
          userEmail: data.user.email
        }))
        
        localStorage.setItem('current_user_id', data.user._id)
        
        setMessage({ type: 'success', text: 'Google sign-up successful! Redirecting...' })
        
        // Redirect based on user type
        setTimeout(() => {
          if (data.user.user_type === 'freelancer') {
            window.location.href = '/freelancer-dashboard'
          } else {
            window.location.href = '/client-dashboard'
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
                  Have an account? Login
                </Link>
                <Button type="submit" loading={loading}>
                  {loading ? 'Creating...' : 'Create account'}
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
                <div id="g_id_onload"
                     data-client_id={import.meta.env.VITE_GOOGLE_CLIENT_ID}
                     data-callback="handleGoogleSignUpCallback"
                     data-auto_prompt="false">
                </div>
                <div className="g_id_signin"
                     data-type="standard"
                     data-size="large"
                     data-theme="outline"
                     data-text="sign_up_with"
                     data-shape="rectangular"
                     data-logo_alignment="left">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
