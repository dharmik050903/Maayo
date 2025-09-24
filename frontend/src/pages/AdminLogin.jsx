import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import adminService from '../services/adminService'

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect if already logged in
    if (adminService.isAdminAuthenticated()) {
      navigate('/admin/dashboard')
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setFieldErrors({})

    try {
      const { email, password } = formData
      
      if (!email || !password) {
        throw new Error('Please fill in all fields')
      }

      await adminService.adminLogin(email, password)
      navigate('/admin/dashboard')
    } catch (error) {
      console.error('Admin login error:', error)
      setError(error.message || 'Login failed')
      
      // Set field errors for styling
      if (error.message?.includes('email') || error.message?.includes('credentials')) {
        setFieldErrors({ email: true, password: true })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (error) {
      setError('')
      setFieldErrors({})
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-base">
      {/* Left side - Branding */}
      <div className="hidden md:flex bg-brand-gradient text-white p-10 items-center justify-center">
        <div className="space-y-8 max-w-md text-center">
          <div className="flex justify-center">
            <Logo theme="light" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">Admin Access</h2>
            <p className="text-xl text-white/90">Secure dashboard management</p>
            <p className="text-white/80">Monitor and manage your Maayo platform with advanced administrative tools</p>
          </div>
          
          {/* Decorative elements */}
          <div className="relative">
            <div className="absolute -top-20 -left-10 w-20 h-20 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-10 -right-5 w-16 h-16 bg-white/5 rounded-full"></div>
            <div className="absolute top-5 right-10 w-8 h-8 bg-white/20 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 md:hidden text-center">
            <div className="flex justify-center mb-4">
              <Logo theme="dark" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-graphite">Admin Access</h1>
              <p className="text-coolgray">Secure dashboard management</p>
            </div>
          </div>
          
          {/* Main card */}
          <div className="card p-8">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-semibold text-graphite hidden md:block">Admin Login</h1>
              <p className="text-coolgray mt-1">Sign in to access the admin dashboard</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-3 rounded-lg text-sm bg-coral/20 text-coral border border-coral/30 animate-shake">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email field */}
              <div>
                <label className="block text-sm font-semibold text-graphite mb-2">
                  Email Address <span className="text-coral">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className={`w-5 h-5 transition-colors ${fieldErrors.email ? 'text-coral' : 'text-coolgray'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-white placeholder-coolgray text-graphite focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.email 
                        ? 'border-coral focus:ring-coral/20 focus:border-coral' 
                        : 'border-[#E3E8EF] focus:ring-violet/20 focus:border-violet'
                    } ${loading ? 'opacity-50' : 'hover:border-coolgray/40'}`}
                    placeholder="admin@maayo.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-sm font-semibold text-graphite mb-2">
                  Password <span className="text-coral">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className={`w-5 h-5 transition-colors ${fieldErrors.password ? 'text-coral' : 'text-coolgray'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className={`w-full pl-10 pr-12 py-3 rounded-lg border bg-white placeholder-coolgray text-graphite focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.password 
                        ? 'border-coral focus:ring-coral/20 focus:border-coral' 
                        : 'border-[#E3E8EF] focus:ring-violet/20 focus:border-violet'
                    } ${loading ? 'opacity-50' : 'hover:border-coolgray/40'}`}
                    placeholder="••••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5 text-coolgray hover:text-graphite transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-coolgray hover:text-graphite transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-accent disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-transform"
                >
                  <div className="flex items-center justify-center">
                    {loading && (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    <span>{loading ? 'Signing In...' : 'Sign In to Dashboard'}</span>
                  </div>
                </button>
              </div>
            </form>

            {/* Footer info */}
            <div className="mt-8 pt-6 border-t border-[#E9ECF2] text-center">
              <div className="flex items-center justify-center text-coolgray text-xs">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622C17.176 19.29 21 14.591 21 9a12.02 12.02 0 00-.382-2.016z" />
                </svg>
                <span>Secure admin access • Protected by advanced encryption</span>
              </div>
              <p className="text-coolgray text-xs mt-2">
                Unauthorized access is prohibited and monitored
              </p>
            </div>
          </div>

          {/* Back to main site */}
          <div className="text-center mt-6">
            <a
              href="/"
              className="text-sm text-coolgray hover:text-violet transition-colors inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Maayo
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin