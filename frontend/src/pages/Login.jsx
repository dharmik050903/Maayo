import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import Input from '../components/Input'
import Button from '../components/Button'
import GoogleSignIn from '../components/GoogleSignIn'
import { PageShimmer } from '../components/Shimmer'
import { authenticatedFetch } from '../utils/api'
import { otpService } from '../services/otpService'

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: false })
    }
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
    
    // Store authentication data
    localStorage.setItem("authToken", token)
    localStorage.setItem("userData", JSON.stringify(user))
    localStorage.setItem("authHeaders", JSON.stringify({
      token: token,
      _id: user._id,
      userRole: user.user_type,
      userEmail: user.email
    }))

    console.log('📝 Stored auth data in localStorage')
    console.log('👤 User type:', user.user_type)
    console.log('🆔 User ID:', user._id)

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
      setMessage({ type: 'error', text: 'Please enter your email address' })
      return
    }

    setOtpLoading(true)
    setMessage(null)

    try {
      const response = await otpService.sendPasswordResetOTP(form.email)
      if (response.status) {
        setShowPasswordReset(true)
        setMessage({ type: 'success', text: 'Password reset OTP sent to your email' })
        startResendTimer()
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to send password reset OTP' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to send password reset OTP' })
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
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userData", JSON.stringify(data.user));
        
        localStorage.setItem("authHeaders", JSON.stringify({
          token: data.token,
          _id: data.user._id,
          userRole: data.user.user_type,
          userEmail: data.user.email
        }));
        
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
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex bg-brand-gradient text-white p-10 items-center justify-center">
        <div className="space-y-8 max-w-md text-center">
          <div className="flex justify-center">
            <Logo theme="light" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">Welcome back</h2>
            <p className="text-xl text-white/90">Login to continue your journey with Maayo</p>
            <p className="text-white/80">Connect with talented professionals and grow your business</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12 bg-base">
        <div className="w-full max-w-md">
          <div className="mb-8 md:hidden text-center">
            <div className="flex justify-center">
              <Logo theme="dark" />
            </div>
          </div>
          
          <div className="card p-8">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-semibold text-graphite">Welcome back</h1>
              <p className="text-coolgray mt-1">Login to continue to your dashboard</p>
              
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
                  OTP Login
                </button>
              </div>
            </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
               <div>
                 <label className="block text-sm font-medium text-graphite mb-1">Email <span className="text-red-500">*</span></label>
                 <input
                   type="email"
          name="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          required
                   className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet ${
                     fieldErrors.email ? "border-red-500" : "border-gray-300"
                   }`}
                 />
                 {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
               </div>

               {loginMethod === 'password' ? (
                 <div>
                   <label className="block text-sm font-medium text-graphite mb-1">Password <span className="text-red-500">*</span></label>
                   <input
                     type="password"
            name="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            required
                     className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet ${
                       fieldErrors.password ? "border-red-500" : "border-gray-300"
                     }`}
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
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-sm text-coral hover:text-coral/80 transition-colors"
              >
                Forgot password?
              </button>
            )}
            {loginMethod === 'password' && (
              <Button type="submit" variant="accent" loading={loading}>
                {loading ? 'Signing in...' : 'Login'}
              </Button>
            )}
          </div>
        </div>

      </form>

      {/* Google Sign In Button */}
      <div className="pt-4">
        <GoogleSignIn
          onSuccess={(data) => {
            setMessage({ type: "success", text: "Google login successful 🎉" })
          }}
          onError={(error) => {
            setMessage({ type: "error", text: error })
          }}
          loading={loading}
          disabled={otpLoading}
          buttonText="Continue with Google"
        />
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
