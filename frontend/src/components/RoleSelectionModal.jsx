import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkClientProfileExists, checkFreelancerProfileExists, createClientProfile, createFreelancerProfile, getCurrentUser } from '../utils/api'

const RoleSelectionModal = ({ isOpen, onClose, onRoleSelected, userData }) => {
  const [selectedRole, setSelectedRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRoleSelection = async (role) => {
    if (loading) return
    
    setLoading(true)
    setError('')
    
    try {
      // If onRoleSelected is provided (for Google sign-in flow), use it
      if (onRoleSelected) {
        await onRoleSelected(role)
        return
      }

      // Original flow for existing users (when userData is provided)
      const user = getCurrentUser()
      if (!user || !user._id) {
        throw new Error('User data not found. Please try signing in again.')
      }

      let profileData
      let response

      if (role === 'client') {
        // Create basic client profile
        profileData = {
          personId: user._id,
          name: userData.name || user.name,
          email: userData.email || user.email,
          profilePicture: userData.picture || user.profilePicture,
          companyName: '',
          phoneNumber: '',
          location: '',
          bio: '',
          website: '',
          linkedin: '',
          twitter: '',
          instagram: ''
        }
        
        response = await createClientProfile(profileData)
      } else if (role === 'freelancer') {
        // Create basic freelancer profile
        profileData = {
          personId: user._id,
          name: userData.name || user.name,
          email: userData.email || user.email,
          profilePicture: userData.picture || user.profilePicture,
          title: '',
          bio: '',
          skills: [],
          hourlyRate: '',
          location: '',
          phoneNumber: '',
          website: '',
          linkedin: '',
          twitter: '',
          instagram: '',
          experience: '',
          education: '',
          languages: [],
          availability: 'available'
        }
        
        response = await createFreelancerProfile(profileData)
      }

      if (response.response.ok) {
        // Update user data with selected role
        const updatedUser = { ...user, user_type: role }
        localStorage.setItem('userData', JSON.stringify(updatedUser))
        
        // Update auth headers with new role
        const authHeaders = JSON.parse(localStorage.getItem('authHeaders') || '{}')
        authHeaders.userRole = role
        localStorage.setItem('authHeaders', JSON.stringify(authHeaders))

        // Close modal and redirect
        onClose()
        
        // Redirect based on selected role
        setTimeout(() => {
          if (role === 'client') {
            navigate('/client-dashboard')
          } else {
            navigate('/freelancer-dashboard')
          }
        }, 500)
      } else {
        throw new Error(response.data?.message || `Failed to create ${role} profile`)
      }
    } catch (error) {
      console.error('Error creating profile:', error)
      setError(error.message || `Failed to create ${role} profile. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1100] flex justify-center p-4 pt-8">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-mint/20 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Choose Your Role</h2>
                <p className="text-sm text-gray-600">How would you like to use Maayo?</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="space-y-4">
            {/* Client Option */}
            <button
              onClick={() => handleRoleSelection('client')}
              disabled={loading}
              className={`w-full p-6 border-2 rounded-xl text-left transition-all duration-200 ${
                selectedRole === 'client'
                  ? 'border-mint bg-mint/5'
                  : 'border-gray-200 hover:border-mint/50 hover:bg-gray-50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">I'm a Client</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    I want to hire freelancers for my projects and get work done.
                  </p>
                  <div className="text-xs text-gray-500">
                    ✓ Post projects and get bids<br/>
                    ✓ Hire talented freelancers<br/>
                    ✓ Manage project workflow
                  </div>
                </div>
              </div>
            </button>

            {/* Freelancer Option */}
            <button
              onClick={() => handleRoleSelection('freelancer')}
              disabled={loading}
              className={`w-full p-6 border-2 rounded-xl text-left transition-all duration-200 ${
                selectedRole === 'freelancer'
                  ? 'border-mint bg-mint/5'
                  : 'border-gray-200 hover:border-mint/50 hover:bg-gray-50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">I'm a Freelancer</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    I want to find work, showcase my skills, and earn money.
                  </p>
                  <div className="text-xs text-gray-500">
                    ✓ Browse and apply for projects<br/>
                    ✓ Showcase your portfolio<br/>
                    ✓ Build your freelance career
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-coral/20 text-coral border border-coral/30 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="mt-4 flex items-center justify-center space-x-2 text-mint">
              <div className="w-4 h-4 border-2 border-mint border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Creating your profile...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 rounded-b-xl">
          <p className="text-xs text-gray-500 text-center">
            Don't worry, you can always update your profile later in settings.
          </p>
        </div>
      </div>
    </div>
  )
}

export default RoleSelectionModal
