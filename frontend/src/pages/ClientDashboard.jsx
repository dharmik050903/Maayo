import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Button from '../components/Button'
import AnimatedCounter from '../components/AnimatedCounter'
import MyProjects from '../components/MyProjects'
import FreelancerProfileModal from '../components/FreelancerProfileModal'
import { authenticatedFetch, isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'
import { getFreelancersCached, clearCache } from '../services/cachedApiService'
import { projectService } from '../services/projectService'
import { formatBudget, formatHourlyRate } from '../utils/currency'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'

export default function ClientDashboard() {
  const navigate = useNavigate()
  const { t } = useComprehensiveTranslation()
  const [userData, setUserData] = useState(null)
  const [clientInfo, setClientInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [totalProjects, setTotalProjects] = useState(0)
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [recentProjects, setRecentProjects] = useState([])
  const [recentProjectsLoading, setRecentProjectsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('overview') // 'overview', 'projects', or 'freelancers'
  
  // Freelancer browsing state
  const [freelancers, setFreelancers] = useState([])
  const [freelancerSearchTerm, setFreelancerSearchTerm] = useState('')
  const [freelancersLoading, setFreelancersLoading] = useState(false)
  const [freelancerError, setFreelancerError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalFreelancers, setTotalFreelancers] = useState(0)
  const freelancersPerPage = 12
  
  // Freelancer profile modal state
  const [showFreelancerModal, setShowFreelancerModal] = useState(false)
  const [selectedFreelancer, setSelectedFreelancer] = useState(null)
  
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      console.log('ClientDashboard: useEffect running on page load/refresh (first time)')
      
      // Check if user is authenticated
      if (!isAuthenticated()) {
        console.log('ClientDashboard: User not authenticated, redirecting to login')
        window.location.href = '/login'
        return
      }
      
      // Get user data
      const user = getCurrentUser()
      console.log('ClientDashboard: User data:', user)
      
      if (user) {
        // Check if user should be on this dashboard
        if (user.user_type === 'freelancer') {
          console.log('ClientDashboard: User is freelancer, redirecting to freelancer dashboard')
          window.location.href = '/freelancer-dashboard'
          return
        }
        
        setUserData(user)
        fetchClientInfo()
        fetchTotalProjects()
        fetchRecentProjects()
      } else {
        console.log('ClientDashboard: No user data found')
        setLoading(false)
      }
    } else {
      console.log('ClientDashboard: Skipping duplicate initialization due to StrictMode')
    }
  }, [])

  const fetchClientInfo = async () => {
    try {
      // Try to fetch from database using stored profile ID
      const profileId = localStorage.getItem('client_profile_id')
      
      if (profileId) {
        console.log('Attempting to fetch client profile from database with ID:', profileId)
        
        // Try to fetch from database using update endpoint
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
        const response = await authenticatedFetch(`${API_BASE_URL}/client/info/update`, {
          method: 'POST',
          body: JSON.stringify({ _id: profileId })
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Client profile fetched from database:', data.data)
          
          setClientInfo(data.data)
          
          // Update localStorage with fresh data from database
          localStorage.setItem('client_profile_data', JSON.stringify(data.data))
          localStorage.setItem('client_profile_completed', 'true')
          
          setLoading(false)
          return
        } else {
          console.log('Client profile not found in database, falling back to localStorage')
        }
      }
      
      // Fallback to localStorage if database fetch fails
      const savedProfile = localStorage.getItem('client_profile_data')
      
      if (savedProfile) {
        const profileData = JSON.parse(savedProfile)
        setClientInfo(profileData)
      }
    } catch (error) {
      console.error('Error loading client profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTotalProjects = async () => {
    try {
      console.log('ClientDashboard: fetchTotalProjects started')
      setProjectsLoading(true)
      
      // Use the real project stats API
      const response = await projectService.getProjectStats()
      
      if (response.status && response.data) {
        // For clients, use totalProjects from stats
        const totalCount = response.data.totalProjects || 0
        setTotalProjects(totalCount)
        console.log('ClientDashboard: Total projects count fetched from API:', totalCount)
      } else {
        console.log('ClientDashboard: No project stats data, using fallback')
        setTotalProjects(0)
      }
      
      setProjectsLoading(false)
    } catch (error) {
      console.error('ClientDashboard: Error fetching total projects count:', error)
      // Fallback to 0 if API fails
      setTotalProjects(0)
      setProjectsLoading(false)
    }
  }

  const fetchRecentProjects = async () => {
    try {
      console.log('🔄 ClientDashboard: Fetching recent projects...')
      setRecentProjectsLoading(true)
      
      // Fetch client's projects and get the last 3
      const response = await projectService.getClientProjects()
      
      if (response.status && response.data) {
        // Sort by creation date (newest first) and take last 3
        const sortedProjects = response.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3)
        
        console.log('✅ ClientDashboard: Recent projects fetched:', sortedProjects.length)
        setRecentProjects(sortedProjects)
      } else {
        console.log('⚠️ ClientDashboard: No recent projects found')
        setRecentProjects([])
      }
    } catch (error) {
      console.error('❌ ClientDashboard: Error fetching recent projects:', error)
      setRecentProjects([])
    } finally {
      setRecentProjectsLoading(false)
    }
  }

  // Fetch freelancers for browsing
  const fetchAvailableFreelancers = async (page = 1, searchTerm = '') => {
    try {
      console.log('🔄 ClientDashboard: Fetching freelancers...', { page, searchTerm })
      setFreelancersLoading(true)
      setFreelancerError(null)
      
      const { response, data } = await getFreelancersCached({ 
        limit: freelancersPerPage,
        page: page,
        search: searchTerm
      })
      
      if (response.ok && data && data.status && data.data && Array.isArray(data.data)) {
        console.log('✅ ClientDashboard: Found freelancers:', data.data.length)
        
        // Update pagination info
        if (data.pagination) {
          setTotalPages(Math.ceil(data.pagination.total_count / freelancersPerPage))
          setTotalFreelancers(data.pagination.total_count)
        }
        
        // Transform the data from backend API to match the expected format
        console.log('🔍 ClientDashboard: Sample raw freelancer data:', data.data[0])
        const transformedFreelancers = data.data.map(freelancer => {
          const personData = freelancer.personId || {}
          const skills = freelancer.skills ? freelancer.skills.map(s => s.skill || s) : []
          
          console.log('🔍 ClientDashboard: Processing freelancer:', freelancer._id, {
            personData,
            freelancerName: freelancer.name,
            firstName: personData.first_name,
            lastName: personData.last_name
          })
          
          // Better name handling
          let name = 'Anonymous'
          if (personData.first_name && personData.last_name) {
            name = `${personData.first_name} ${personData.last_name}`.trim()
          } else if (personData.first_name) {
            name = personData.first_name
          } else if (personData.last_name) {
            name = personData.last_name
          } else if (freelancer.name) {
            name = freelancer.name
          }
          
          return {
            _id: freelancer._id,
            name: name,
            title: freelancer.title || 'Freelancer',
            skills: skills,
            hourly_rate: freelancer.hourly_rate || 0,
            location: personData.country || 'Location not specified',
            rating: Math.floor(4 + Math.random() * 2), // Default rating between 4-5
            completed_projects: freelancer.total_projects || 0,
            response_time: ['30 minutes', '1 hour', '2 hours', '3 hours'][Math.floor(Math.random() * 4)],
            profile_image: personData.profile_pic || null,
            bio: freelancer.bio || `Professional freelancer with experience in ${skills.join(', ')}.`,
            english_level: freelancer.english_level || 'Intermediate',
            total_projects: freelancer.total_projects || 0,
            portfolio: freelancer.portfolio || null,
            resume_link: freelancer.resume_link || null,
            github_link: freelancer.github_link || null,
            email: personData.email,
            contact_number: personData.contact_number,
            country: personData.country,
            first_name: personData.first_name,
            last_name: personData.last_name,
            status: personData.status,
            email_verified: personData.email_verified,
            phone_verified: personData.phone_verified,
            createdAt: freelancer.createdAt,
            years_experience: freelancer.createdAt ? 
              Math.floor((new Date() - new Date(freelancer.createdAt)) / (1000 * 60 * 60 * 24 * 365)) : 
              Math.floor(Math.random() * 8) + 1,
            highest_education: freelancer.highest_education,
            certification: freelancer.certification || [],
            employement_history: freelancer.employement_history || [],
            experience_level: freelancer.experience_level || 'Intermediate',
            availability: freelancer.availability || 'part-time',
            overview: freelancer.bio || `Professional freelancer with experience in ${skills.join(', ')}.`,
            source: 'backend_api'
          }
        })
        
        // Remove duplicates based on _id
        const uniqueFreelancers = transformedFreelancers.filter((freelancer, index, self) => 
          index === self.findIndex(f => f._id === freelancer._id)
        )
        
        setFreelancers(uniqueFreelancers)
        setCurrentPage(page)
        console.log('✅ ClientDashboard: Freelancers loaded successfully:', uniqueFreelancers.length)
        console.log('🔍 ClientDashboard: Sample freelancer names:', uniqueFreelancers.map(f => f.name))
      } else {
        console.log('❌ ClientDashboard: No freelancers found or invalid response')
        setFreelancers([])
        setTotalPages(1)
        setTotalFreelancers(0)
        setFreelancerError('No freelancers found')
      }
    } catch (error) {
      console.error('❌ ClientDashboard: Error fetching freelancers:', error)
      setFreelancerError(error.message)
      setFreelancers([])
      setTotalPages(1)
      setTotalFreelancers(0)
    } finally {
      setFreelancersLoading(false)
    }
  }

  // Handle freelancer search
  const handleFreelancerSearch = async () => {
    if (!freelancerSearchTerm.trim()) {
      fetchAvailableFreelancers(1, '')
      return
    }

    try {
      setFreelancersLoading(true)
      setFreelancerError(null)
      
      const { response, data } = await getFreelancersCached({ 
        search: freelancerSearchTerm.trim(),
        limit: freelancersPerPage,
        page: 1
      })
      
      if (response.ok && data && data.data && Array.isArray(data.data)) {
        // Transform and set freelancers (same logic as above)
        const transformedFreelancers = data.data.map(freelancer => {
          const personData = freelancer.personId || {}
          const skills = freelancer.skills ? freelancer.skills.map(s => s.skill || s) : []
          
          // Better name handling
          let name = 'Anonymous'
          if (personData.first_name && personData.last_name) {
            name = `${personData.first_name} ${personData.last_name}`.trim()
          } else if (personData.first_name) {
            name = personData.first_name
          } else if (personData.last_name) {
            name = personData.last_name
          } else if (freelancer.name) {
            name = freelancer.name
          }
          
          return {
            _id: freelancer._id,
            name: name,
            title: freelancer.title || 'Freelancer',
            skills: skills,
            hourly_rate: freelancer.hourly_rate || 0,
            location: personData.country || 'Location not specified',
            rating: Math.floor(4 + Math.random() * 2),
            completed_projects: freelancer.total_projects || 0,
            response_time: ['30 minutes', '1 hour', '2 hours', '3 hours'][Math.floor(Math.random() * 4)],
            profile_image: personData.profile_pic || null,
            bio: freelancer.bio || `Professional freelancer with experience in ${skills.join(', ')}.`,
            english_level: freelancer.english_level || 'Intermediate',
            total_projects: freelancer.total_projects || 0,
            portfolio: freelancer.portfolio || null,
            resume_link: freelancer.resume_link || null,
            github_link: freelancer.github_link || null,
            email: personData.email,
            contact_number: personData.contact_number,
            country: personData.country,
            first_name: personData.first_name,
            last_name: personData.last_name,
            status: personData.status,
            email_verified: personData.email_verified,
            phone_verified: personData.phone_verified,
            createdAt: freelancer.createdAt,
            years_experience: freelancer.createdAt ? 
              Math.floor((new Date() - new Date(freelancer.createdAt)) / (1000 * 60 * 60 * 24 * 365)) : 
              Math.floor(Math.random() * 8) + 1,
            highest_education: freelancer.highest_education,
            certification: freelancer.certification || [],
            employement_history: freelancer.employement_history || [],
            experience_level: freelancer.experience_level || 'Intermediate',
            availability: freelancer.availability || 'part-time',
            overview: freelancer.bio || `Professional freelancer with experience in ${skills.join(', ')}.`,
            source: 'backend_api'
          }
        })
        
        // Remove duplicates based on _id
        const uniqueFreelancers = transformedFreelancers.filter((freelancer, index, self) => 
          index === self.findIndex(f => f._id === freelancer._id)
        )
        
        setFreelancers(uniqueFreelancers)
        setCurrentPage(1)
        
        if (data.pagination) {
          setTotalPages(Math.ceil(data.pagination.total_count / freelancersPerPage))
          setTotalFreelancers(data.pagination.total_count)
        }
        
        console.log('🔍 ClientDashboard: Search results - unique freelancers:', uniqueFreelancers.length)
        console.log('🔍 ClientDashboard: Sample search result names:', uniqueFreelancers.map(f => f.name))
      } else {
        setFreelancers([])
        setFreelancerError('No freelancers found matching your search')
      }
    } catch (error) {
      console.error('Error searching freelancers:', error)
      setFreelancerError(error.message)
      setFreelancers([])
    } finally {
      setFreelancersLoading(false)
    }
  }

  // Auto-load freelancers when freelancer section is opened
  useEffect(() => {
    if (activeSection === 'freelancers' && freelancers.length === 0) {
      console.log('🔄 ClientDashboard: Auto-loading freelancers for freelancer section')
      fetchAvailableFreelancers(1, '')
    }
  }, [activeSection])

  const handleLogout = () => {
    clearAuth()
    window.location.href = '/'
  }

  // Handle freelancer profile view
  const handleViewFreelancerProfile = (freelancer) => {
    console.log('Viewing freelancer profile:', freelancer)
    setSelectedFreelancer(freelancer)
    setShowFreelancerModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-gradient text-white">
      <Header 
        userType="client" 
        onLogout={handleLogout} 
        userData={userData}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 pt-24 sm:pt-28 pb-8">
        {/* Welcome Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 md:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-balance">
                Welcome back, <span className="text-mint">{userData?.first_name}</span>!
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-white/90 mt-2 md:mt-4 max-w-2xl">
                Here's your client dashboard overview - manage your projects and connect with talented freelancers
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/project/create')}
                className="!border-violet !text-violet hover:!bg-violet hover:!text-white w-full sm:w-auto backdrop-blur-sm bg-violet/10 transition-all duration-200"
                size="lg"
              >
                Create Project
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/client/jobs')}
                className="!border-violet !text-violet hover:!bg-violet hover:!text-white w-full sm:w-auto backdrop-blur-sm bg-violet/10 transition-all duration-200"
                size="lg"
              >
                Manage Jobs
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1 bg-white/10 p-1 rounded-lg w-full sm:w-fit">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-md font-medium transition-all duration-300 text-sm ${
                activeSection === 'overview'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveSection('projects')}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-md font-medium transition-all duration-300 text-sm ${
                activeSection === 'projects'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              My Projects
            </button>
            <button
              onClick={() => setActiveSection('freelancers')}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-md font-medium transition-all duration-300 text-sm ${
                activeSection === 'freelancers'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Browse Freelancers
            </button>
          </div>
        </div>

        {/* Content based on active section */}
        {activeSection === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="bg-white/95 rounded-[2rem] p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
                <div className="flex items-center">
                  <div className="p-3 bg-mint/20 rounded-lg">
                    <svg className="w-6 h-6 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-coolgray">Total Spend</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {formatBudget(clientInfo?.total_spend || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/95 rounded-[2rem] p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
                <div className="flex items-center">
                  <div className="p-3 bg-violet/20 rounded-lg">
                    <svg className="w-6 h-6 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-coolgray">Total Projects</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {projectsLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-graphite"></div>
                        </div>
                      ) : (
                        totalProjects || '0'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/95 rounded-[2rem] p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
                <div className="flex items-center">
                  <div className="p-3 bg-coral/20 rounded-lg">
                    <svg className="w-6 h-6 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-coolgray">Completed Projects</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {clientInfo?.completed_project || '0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/95 rounded-[2rem] p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
                <div className="flex items-center">
                  <div className="p-3 bg-primary/20 rounded-lg">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-coolgray">Pending Reviews</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {clientInfo?.pending_reviews || '0'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-white/95 rounded-[2rem] p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-mint/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl font-bold text-mint uppercase">
                        {userData?.first_name?.[0]}{userData?.last_name?.[0]}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 uppercase">
                      {userData?.first_name} {userData?.last_name}
                    </h3>
                    <p className="text-coolgray">{userData?.country}</p>
                    <p className="text-sm text-coolgray mt-2">{userData?.email}</p>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-800">User Type</h4>
                      <p className="text-coolgray capitalize">Client</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Member Since</h4>
                      <p className="text-coolgray">
                        {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Last Login</h4>
                      <p className="text-coolgray">
                        {userData?.last_login ? new Date(userData.last_login).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Quick Actions */}
                <div className="bg-white/95 rounded-[2rem] p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    <Link to="/project/create" className="w-full">
                      <Button variant="outline" className="w-full !border-violet !text-violet hover:!bg-violet hover:!text-white backdrop-blur-sm bg-violet/10 transition-all duration-200">
                        Post a New Project
                      </Button>
                    </Link>
                    <Link to="/client/jobs/create" className="w-full">
                      <Button variant="outline" className="w-full !border-violet !text-violet hover:!bg-violet hover:!text-white backdrop-blur-sm bg-violet/10 transition-all duration-200">
                        Post a New Job
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="w-full !border-violet !text-violet hover:!bg-violet hover:!text-white backdrop-blur-sm bg-violet/10 transition-all duration-200"
                      onClick={() => setActiveSection('freelancers')}
                    >
                      Browse Freelancers
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full !border-violet !text-violet hover:!bg-violet hover:!text-white backdrop-blur-sm bg-violet/10 transition-all duration-200"
                      onClick={() => navigate('/messages')}
                    >
                      View Messages
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full !border-violet !text-violet hover:!bg-violet hover:!text-white backdrop-blur-sm bg-violet/10 transition-all duration-200"
                      onClick={() => setActiveSection('projects')}
                    >
                      Manage Projects
                    </Button>
                    <Link to="/client/jobs">
                      <Button 
                        variant="outline" 
                        className="w-full !border-violet !text-violet hover:!bg-violet hover:!text-white backdrop-blur-sm bg-violet/10 transition-all duration-200"
                      >
                        Manage Jobs
                      </Button>
                    </Link>
                    <Link to="/client/my-projects">
                      <Button 
                        variant="outline" 
                        className="w-full !border-violet !text-violet hover:!bg-violet hover:!text-white backdrop-blur-sm bg-violet/10 transition-all duration-200"
                      >
                        View All Projects
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Project Statistics */}
                <div className="bg-white/95 rounded-[2rem] p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-violet">
                        {projectsLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet"></div>
                          </div>
                        ) : (
                          <AnimatedCounter 
                            end={totalProjects || 0} 
                            className="text-3xl font-bold text-violet"
                            duration={2000}
                            delay={200}
                          />
                        )}
                      </div>
                      <div className="text-sm text-coolgray">Total Projects</div>
                    </div>
                    <div className="text-center">
                      <AnimatedCounter 
                        end={clientInfo?.completed_project || 0} 
                        className="text-3xl font-bold text-mint"
                        duration={2000}
                        delay={400}
                      />
                      <div className="text-sm text-coolgray">Completed</div>
                    </div>
                    <div className="text-center">
                      <AnimatedCounter 
                        end={clientInfo?.pending_reviews || 0} 
                        className="text-3xl font-bold text-coral"
                        duration={2000}
                        delay={600}
                      />
                      <div className="text-sm text-coolgray">Pending Reviews</div>
                    </div>
                  </div>
                </div>

                {/* Recent Projects */}
                <div className="bg-white/95 rounded-[2rem] p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Projects</h3>
                  {recentProjectsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet"></div>
                      <span className="ml-3 text-coolgray">Loading projects...</span>
                    </div>
                  ) : recentProjects.length > 0 ? (
                    <div className="space-y-4">
                      {recentProjects.map((project, index) => {
                        // Determine status and color based on project state
                        const getProjectStatus = (project) => {
                          if (project.iscompleted === 1) return { status: 'Completed', color: 'border-mint' }
                          if (project.isactive === 1) return { status: 'In Progress', color: 'border-violet' }
                          if (project.ispending === 1) return { status: 'Pending Review', color: 'border-coral' }
                          return { status: 'Open', color: 'border-gray-400' }
                        }
                        
                        const { status, color } = getProjectStatus(project)
                        
                        return (
                          <div key={project._id} className={`border-l-4 ${color} pl-4`}>
                            <h4 className="font-medium text-gray-800">{project.title}</h4>
                            <p className="text-sm text-coolgray">
                              Created: {new Date(project.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-coolgray">Status: {status}</p>
                            <p className="text-sm text-coolgray">Budget: {formatBudget(project.budget)}</p>
                            {project.duration && (
                              <p className="text-sm text-coolgray">Duration: {project.duration} days</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-coolgray">
                      <svg className="w-12 h-12 mx-auto mb-3 text-coolgray/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm">No projects yet</p>
                      <p className="text-xs text-coolgray/70 mt-1">Create your first project to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        
        {activeSection === 'projects' && (
          <MyProjects />
        )}

        {activeSection === 'freelancers' && (
          <div className="space-y-8">
            {/* Freelancer Search Section */}
                <div className="bg-white/95 rounded-[2rem] p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">
                Browse <span className="text-coral">Freelancers</span>
              </h2>
              
              {/* Search Input */}
              <div className="mb-4 md:mb-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Search freelancers..."
                    value={freelancerSearchTerm}
                    onChange={(e) => setFreelancerSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleFreelancerSearch()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral text-sm"
                  />
                  <button
                    onClick={handleFreelancerSearch}
                    className="px-4 py-2 bg-coral text-white rounded-lg text-sm hover:bg-coral/90 w-full sm:w-auto"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {freelancersLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
                  <span className="ml-3 text-coolgray">Loading freelancers...</span>
                </div>
              )}

              {/* Error State */}
              {freelancerError && !freelancersLoading && (
                <div className="text-center py-12 text-red-500">
                  <p className="text-lg">{freelancerError}</p>
                  <button 
                    onClick={() => fetchAvailableFreelancers(1, '')}
                    className="mt-4 px-4 py-2 bg-coral text-white rounded hover:bg-coral/90"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Freelancers Grid */}
              {!freelancersLoading && !freelancerError && (
                <>
                  {freelancers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      {freelancers.map((freelancer, index) => (
                        <div key={freelancer._id} className="bg-white rounded-[2rem] p-4 md:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border border-white/20">
                          <div className="flex items-start space-x-4 mb-4">
                            <div className="w-16 h-16 bg-coral/20 rounded-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-800">{freelancer.name}</h3>
                              <p className="text-coral font-medium">{freelancer.title}</p>
                              <p className="text-sm text-coolgray">{freelancer.location}</p>
                              <p className="text-xs text-coolgray">{freelancer.years_experience} years experience</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  freelancer.experience_level === 'Expert' ? 'bg-green-100 text-green-800' :
                                  freelancer.experience_level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {freelancer.experience_level}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  freelancer.availability === 'full-time' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {freelancer.availability}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <p className="text-sm text-coolgray line-clamp-2 mb-3">{freelancer.overview}</p>
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <svg key={i} className={`w-4 h-4 ${i < Math.floor(freelancer.rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-sm text-coolgray">{freelancer.rating}</span>
                              <span className="text-xs text-coolgray">({freelancer.completed_projects} projects)</span>
                            </div>
                            <div className="flex justify-between text-sm text-coolgray">
                              <span className="font-semibold text-gray-800">{formatHourlyRate(freelancer.hourly_rate)}</span>
                              <span>Responds in {freelancer.response_time}</span>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-1">
                              {freelancer.skills.slice(0, 4).map((skill, index) => (
                                <span key={index} className="px-2 py-1 bg-coral/10 text-coral rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                              {freelancer.skills.length > 4 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                  +{freelancer.skills.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-coolgray">
                              <span className="capitalize">{freelancer.english_level} English</span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="px-3 py-1 text-xs !border-violet !text-violet hover:!bg-violet hover:!text-white transition-all duration-200"
                                onClick={() => handleViewFreelancerProfile(freelancer)}
                              >
                                View Profile
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-coolgray">
                      <svg className="w-16 h-16 mx-auto mb-4 text-coolgray/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-lg">No freelancers available yet</p>
                      <p className="text-sm mt-2 mb-6">
                        No freelancers found matching your search. Try adjusting your search terms.
                      </p>
                      <Button 
                        onClick={() => {
                          setFreelancerSearchTerm('')
                          fetchAvailableFreelancers(1, '')
                        }}
                        variant="outline" 
                        className="px-6 py-3"
                      >
                        Show All Freelancers
                      </Button>
                    </div>
                  )}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex justify-center items-center space-x-4">
                      <button
                        onClick={() => {
                          const newPage = currentPage - 1
                          if (newPage >= 1) {
                            fetchAvailableFreelancers(newPage, freelancerSearchTerm)
                          }
                        }}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          currentPage === 1
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-coral text-white hover:bg-coral/90'
                        }`}
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-coolgray">Page</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-lg font-medium">
                          {currentPage} of {totalPages}
                        </span>
                        <span className="text-coolgray">
                          ({totalFreelancers} freelancers total)
                        </span>
                      </div>
                      
                      <button
                        onClick={() => {
                          const newPage = currentPage + 1
                          if (newPage <= totalPages) {
                            fetchAvailableFreelancers(newPage, freelancerSearchTerm)
                          }
                        }}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          currentPage === totalPages
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-coral text-white hover:bg-coral/90'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* Freelancer Profile Modal */}
      <FreelancerProfileModal
        freelancer={selectedFreelancer}
        isOpen={showFreelancerModal}
        onClose={() => {
          setShowFreelancerModal(false)
          setSelectedFreelancer(null)
        }}
      />
    </div>
  )
}