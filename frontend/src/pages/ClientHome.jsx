import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Button from '../components/Button'
import UpgradeBanner from '../components/UpgradeBanner'
import AnimatedCounter from '../components/AnimatedCounter'
import { isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'
import { getFreelancers } from '../utils/api'
import { formatHourlyRate } from '../utils/currency'
import { needsUpgrade } from '../utils/subscription'
import { getSafeUrl } from '../utils/urlValidation'
import confirmationService from '../services/confirmationService.jsx'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
// Escrow components
import BankDetailsList from '../components/BankDetailsList'
import CreateEscrowPayment from '../components/CreateEscrowPayment'
import EscrowStatus from '../components/EscrowStatus'
import MilestoneManagement from '../components/MilestoneManagement'
import ProjectPriceUpdate from '../components/ProjectPriceUpdate'
import ClientMilestoneReview from '../components/ClientMilestoneReview'
import ActiveEscrowProjects from '../components/ActiveEscrowProjects'

export default function ClientHome() {
  const { t } = useComprehensiveTranslation()
  const [userData, setUserData] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [freelancers, setFreelancers] = useState([])
  const [freelancerSearchTerm, setFreelancerSearchTerm] = useState('')
  const [showFreelancerSearch, setShowFreelancerSearch] = useState(false)
  const [selectedFreelancer, setSelectedFreelancer] = useState(null)
  const [showFreelancerModal, setShowFreelancerModal] = useState(false)
  // Escrow management state
  const [activeTab, setActiveTab] = useState('freelancers') // 'freelancers' or 'escrow'
  const [selectedProject, setSelectedProject] = useState(null)
  const [showEscrowModal, setShowEscrowModal] = useState(false)
  const [filters, setFilters] = useState({
    experience_level: '',
    years_experience_min: '',
    years_experience_max: '',
    availability: '',
    hourly_rate_min: '',
    hourly_rate_max: '',
    skills: []
  })
  const [sortBy, setSortBy] = useState('rating')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      console.log('ClientHome: useEffect running (first time)')
    
    // Check if user is authenticated
    const authStatus = isAuthenticated()
    console.log('ClientHome: Authentication status:', authStatus)
    
    if (!authStatus) {
      console.log('ClientHome: Not authenticated, redirecting to login')
      window.location.href = '/login'
      return
    }
    
    // Get user data
    const user = getCurrentUser()
    console.log('ClientHome: User data:', user)
    
    if (user) {
      setUserData(user)
    }
    
    // Get profile data from localStorage
    const savedProfile = localStorage.getItem('client_profile_data')
    console.log('ClientHome: Saved profile:', savedProfile)
    
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile))
    }
    
    // Set loading to false after initialization
    setLoading(false)
    } else {
      console.log('ClientHome: Skipping duplicate initialization due to StrictMode')
    }
  }, [])

  const fetchAvailableFreelancers = async () => {
    try {
      console.log('🔄 ClientHome: Fetching freelancers from backend API...')
      console.log('🔍 ClientHome: User authenticated:', isAuthenticated())
      console.log('🔍 ClientHome: Current user:', getCurrentUser())
      console.log('🔍 ClientHome: API Base URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api')
      setLoading(true)
      
      const { response, data } = await getFreelancers({ 
        limit: 50,  // Request more freelancers per page
        page: 1     // Start from first page
      })
      console.log('📊 ClientHome: Freelancer API response:', { status: response.status, data })
      console.log('🔍 ClientHome: Data structure check:', {
        dataExists: !!data,
        dataStatus: data?.status,
        dataDataExists: !!data?.data,
        dataDataLength: data?.data?.length,
        dataDataType: typeof data?.data,
        dataDataSample: data?.data?.[0],
        pagination: data?.pagination,
        totalCount: data?.pagination?.total_count
      })
      
      if (response.ok && data && data.status && data.data && Array.isArray(data.data) && data.data.length > 0) {
        console.log('✅ ClientHome: Found freelancers from backend:', data.data.length)
        
        // Transform the data from backend API to match the expected format
        console.log('🔍 ClientHome: Sample freelancer data:', data.data[0])
        const transformedFreelancers = data.data.map(freelancer => {
          console.log('🔍 ClientHome: Processing freelancer:', freelancer._id, freelancer)
          const personData = freelancer.personId || {}
          const skills = freelancer.skills ? freelancer.skills.map(s => s.skill || s) : []
          
          return {
            _id: freelancer._id,
            name: freelancer.name || `${personData.first_name || ''} ${personData.last_name || ''}`.trim() || 'Unknown',
            title: freelancer.title || 'Freelancer',
            overview: freelancer.overview || freelancer.bio || 'Professional freelancer available for projects.',
            hourly_rate: freelancer.hourly_rate || 50,
            experience_level: freelancer.experience_level || 'Intermediate',
            availability: freelancer.availability || 'available',
            skills: skills.length > 0 ? skills : ['General Services'],
            location: personData.country || 'Location not specified',
            rating: Math.floor(4 + Math.random() * 2), // Default rating between 4-5 (whole numbers)
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
            // Calculate years of experience based on account creation or use a default
            years_experience: freelancer.createdAt ? 
              Math.floor((new Date() - new Date(freelancer.createdAt)) / (1000 * 60 * 60 * 24 * 365)) : 
              Math.floor(Math.random() * 8) + 1, // Random 1-8 years if no creation date
            // Additional fields from backend
            highest_education: freelancer.highest_education,
            certification: freelancer.certification || [],
            employement_history: freelancer.employement_history || [],
            // Source information
            source: 'backend_api'
          }
        })
        
        setFreelancers(transformedFreelancers)
        console.log('✅ ClientHome: Successfully loaded freelancers from backend API')
        console.log('✅ ClientHome: Transformed freelancers count:', transformedFreelancers.length)
        console.log('✅ ClientHome: Sample transformed freelancer:', transformedFreelancers[0])
      } else {
        console.log('⚠️ ClientHome: No freelancers found or invalid response format')
        console.log('🔍 ClientHome: Response details:', {
          responseOk: response.ok,
          dataStatus: data?.status,
          dataDataLength: data?.data?.length,
          dataMessage: data?.message
        })
        setFreelancers([])
        // Set a helpful error message for the user
        if (data && data.message) {
          setError(data.message)
        } else if (data && data.data && data.data.length === 0) {
          setError('No freelancers found in the database')
        } else {
          setError('Failed to load freelancers')
        }
      }
      
    } catch (error) {
      console.error('❌ ClientHome: Error fetching freelancers from backend:', error)
      console.error('❌ ClientHome: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      setError(error.message)
      setFreelancers([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearAuth()
    window.location.href = '/'
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      experience_level: '',
      years_experience_min: '',
      years_experience_max: '',
      availability: '',
      hourly_rate_min: '',
      hourly_rate_max: '',
      skills: []
    })
  }

  const handleFreelancerClick = (freelancer) => {
    setSelectedFreelancer(freelancer)
    setShowFreelancerModal(true)
  }

  const closeFreelancerModal = () => {
    setShowFreelancerModal(false)
    setSelectedFreelancer(null)
  }

  const handleContactFreelancer = async (freelancer) => {
    // In a real app, this would open a contact form or messaging system
    await confirmationService.alert(
      `Contact form for ${freelancer.name} would open here. This would integrate with your messaging system.`,
      'Contact Freelancer'
    )
  }

  const getFilteredAndSortedFreelancers = () => {
    console.log('🔍 ClientHome: Filtering freelancers with search term:', freelancerSearchTerm)
    console.log('🔍 ClientHome: Current filters:', filters)
    console.log('🔍 ClientHome: Sort by:', sortBy)
    console.log('🔍 ClientHome: Total freelancers before filtering:', freelancers.length)
    console.log('🔍 ClientHome: Sample freelancer for filtering:', freelancers[0])
    
    let filtered = freelancers.filter(freelancer => {
      // Search filter - matches name, title, overview, location, or skills
      const matchesSearch = !freelancerSearchTerm || 
        freelancer.name.toLowerCase().includes(freelancerSearchTerm.toLowerCase()) ||
        freelancer.title.toLowerCase().includes(freelancerSearchTerm.toLowerCase()) ||
        freelancer.overview.toLowerCase().includes(freelancerSearchTerm.toLowerCase()) ||
        freelancer.location.toLowerCase().includes(freelancerSearchTerm.toLowerCase()) ||
        freelancer.skills.some(skill => 
          skill.toLowerCase().includes(freelancerSearchTerm.toLowerCase())
        )

      // Experience level filter
      const matchesExperience = !filters.experience_level || 
        freelancer.experience_level === filters.experience_level

      // Years of experience filter
      const matchesYearsExperience = (!filters.years_experience_min || freelancer.years_experience >= Number(filters.years_experience_min)) &&
                                   (!filters.years_experience_max || freelancer.years_experience <= Number(filters.years_experience_max))

      // Availability filter
      const matchesAvailability = !filters.availability || 
        freelancer.availability === filters.availability

      // Hourly rate filter
      const matchesRate = (!filters.hourly_rate_min || freelancer.hourly_rate >= Number(filters.hourly_rate_min)) &&
                         (!filters.hourly_rate_max || freelancer.hourly_rate <= Number(filters.hourly_rate_max))

      // Skills filter
      const matchesSkills = filters.skills.length === 0 || 
        filters.skills.some(skill => 
          freelancer.skills.some(freelancerSkill => 
            freelancerSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )

      return matchesSearch && matchesExperience && matchesYearsExperience && matchesAvailability && matchesRate && matchesSkills
    })

    // Sort freelancers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'rate_low':
          return a.hourly_rate - b.hourly_rate
        case 'rate_high':
          return b.hourly_rate - a.hourly_rate
        case 'projects':
          return b.completed_projects - a.completed_projects
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    console.log('Filtered results:', filtered.length)
    return filtered
  }

  // Handle search with backend API
  const handleSearch = async () => {
    if (!freelancerSearchTerm.trim()) {
      // If search is empty, show all freelancers
      fetchAvailableFreelancers()
      return
    }

    try {
      setLoading(true)
      console.log('Searching freelancers with term:', freelancerSearchTerm)
      
      const { response, data } = await getFreelancers({ 
        search: freelancerSearchTerm,
        limit: 50,  // Request more freelancers per page
        page: 1     // Start from first page
      })
      
      if (response.ok && data && data.data && Array.isArray(data.data)) {
        // Transform the data from backend API to match the expected format
        const transformedFreelancers = data.data.map(freelancer => {
          const personData = freelancer.personId || {}
          const skills = freelancer.skills ? freelancer.skills.map(s => s.skill || s) : []
          
          return {
            _id: freelancer._id,
            name: freelancer.name || `${personData.first_name || ''} ${personData.last_name || ''}`.trim() || 'Unknown',
            title: freelancer.title || 'Freelancer',
            overview: freelancer.overview || freelancer.bio || 'Professional freelancer available for projects.',
            hourly_rate: freelancer.hourly_rate || 50,
            experience_level: freelancer.experience_level || 'Intermediate',
            availability: freelancer.availability || 'available',
            skills: skills.length > 0 ? skills : ['General Services'],
            location: personData.country || 'Location not specified',
            rating: Math.floor(4 + Math.random() * 2), // Default rating between 4-5 (whole numbers)
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
            highest_education: freelancer.highest_education,
            certification: freelancer.certification || [],
            employement_history: freelancer.employement_history || [],
            source: 'backend_api'
          }
        })
        
        setFreelancers(transformedFreelancers)
        console.log('Search results from backend:', transformedFreelancers.length)
      } else {
        setFreelancers([])
        console.log('No search results found')
      }
    } catch (error) {
      console.error('Error searching freelancers:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Load freelancers when search section is opened
  const handleShowFreelancerSearch = () => {
    setShowFreelancerSearch(!showFreelancerSearch)
    if (!showFreelancerSearch && freelancers.length === 0) {
      fetchAvailableFreelancers()
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gradient text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gradient text-white">
        <div className="text-center">
          <p className="text-xl text-red-300 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-white text-graphite rounded-lg hover:bg-gray-100"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-gradient text-white page-transition">
      <Header 
        userType="client" 
        onLogout={handleLogout} 
        userData={userData}
      />
      
      {/* Upgrade Banner - Show only if user doesn't have active subscription */}
      {userData && needsUpgrade(userData) && (
        <div className="px-6 pt-20">
          <UpgradeBanner userType="client" />
        </div>
      )}
      
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Find the Perfect <span className="text-coral">Freelancer</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto">
            {t('connectWithTalent')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/client-dashboard">
              <Button variant="accent" size="lg" className="px-8 py-4 text-lg">
                Go to Dashboard
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-graphite"
              onClick={() => setActiveTab('freelancers')}
            >
              Find Freelancers
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-graphite"
              onClick={() => setActiveTab('escrow')}
            >
                {t('escrowManagement')}
            </Button>
            <Link to="/create-project">
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-graphite">
                {t('postAProject')}
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <AnimatedCounter 
                end={15000} 
                suffix="+" 
                className="text-4xl font-bold text-coral mb-2"
                duration={2500}
                delay={200}
              />
              <div className="text-white/70">Expert Freelancers</div>
            </div>
            <div className="text-center">
              <AnimatedCounter 
                end={50000} 
                suffix="+" 
                className="text-4xl font-bold text-mint mb-2"
                duration={3000}
                delay={400}
              />
              <div className="text-white/70">Projects Completed</div>
            </div>
            <div className="text-center">
              <AnimatedCounter 
                end={98} 
                suffix="%" 
                className="text-4xl font-bold text-violet mb-2"
                duration={2000}
                delay={600}
              />
              <div className="text-white/70">Client Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="py-8 px-6 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center space-x-1 bg-white/10 p-1 rounded-lg w-fit mx-auto">
            <button
              onClick={() => setActiveTab('freelancers')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'freelancers'
                  ? 'bg-white text-graphite shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Find Freelancers</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('escrow')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'escrow'
                  ? 'bg-white text-graphite shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>{t('escrowManagement')}</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Freelancer Search Section */}
      {activeTab === 'freelancers' && (
        <section className="py-16 px-6 bg-white/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">
              Available <span className="text-coral">Freelancers</span>
            </h2>
            
            
            {/* Search and Filter Controls */}
            <div className="mb-8 space-y-4">
              {/* Search Input */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search freelancers by name, skills, location, or expertise..."
                    value={freelancerSearchTerm}
                    onChange={(e) => setFreelancerSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full px-4 py-3 border border-white/20 rounded-lg text-graphite bg-white/95 focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <button
                      onClick={handleSearch}
                      className="px-3 py-1 bg-coral text-white rounded text-sm hover:bg-coral/90"
                    >
                      Search
                    </button>
                    <button
                      onClick={() => {
                        setFreelancerSearchTerm('')
                        fetchAvailableFreelancers()
                      }}
                      className="px-3 py-1 bg-mint text-white rounded text-sm hover:bg-mint/90"
                    >
                      Show All
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="border-white text-white hover:bg-white hover:text-graphite"
                  >
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                  </Button>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 border border-white/20 rounded-lg text-graphite bg-white/95 focus:outline-none focus:ring-2 focus:ring-coral/50"
                  >
                    <option value="rating">Sort by Rating</option>
                    <option value="rate_low">Sort by Rate (Low to High)</option>
                    <option value="rate_high">Sort by Rate (High to Low)</option>
                    <option value="projects">Sort by Projects</option>
                    <option value="name">Sort by Name</option>
                  </select>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="bg-white/10 p-6 rounded-lg border border-white/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">Experience Level</label>
                      <select
                        value={filters.experience_level}
                        onChange={(e) => handleFilterChange('experience_level', e.target.value)}
                        className="w-full px-3 py-2 border border-white/20 rounded-lg text-graphite bg-white/95 focus:outline-none focus:ring-2 focus:ring-coral/50"
                      >
                        <option value="">{t('allLevels')}</option>
                        <option value="Beginner">{t('beginner')}</option>
                        <option value="Intermediate">{t('intermediate')}</option>
                        <option value="Expert">{t('expert')}</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">Min Years Experience</label>
                      <input
                        type="number"
                        placeholder="Min years"
                        value={filters.years_experience_min}
                        onChange={(e) => handleFilterChange('years_experience_min', e.target.value)}
                        className="w-full px-3 py-2 border border-white/20 rounded-lg text-graphite bg-white/95 focus:outline-none focus:ring-2 focus:ring-coral/50"
                        min="0"
                        max="50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">Max Years Experience</label>
                      <input
                        type="number"
                        placeholder="Max years"
                        value={filters.years_experience_max}
                        onChange={(e) => handleFilterChange('years_experience_max', e.target.value)}
                        className="w-full px-3 py-2 border border-white/20 rounded-lg text-graphite bg-white/95 focus:outline-none focus:ring-2 focus:ring-coral/50"
                        min="0"
                        max="50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">Availability</label>
                      <select
                        value={filters.availability}
                        onChange={(e) => handleFilterChange('availability', e.target.value)}
                        className="w-full px-3 py-2 border border-white/20 rounded-lg text-graphite bg-white/95 focus:outline-none focus:ring-2 focus:ring-coral/50"
                      >
                        <option value="">All Availability</option>
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">Min Rate ($/hr)</label>
                      <input
                        type="number"
                        placeholder="Min rate"
                        value={filters.hourly_rate_min}
                        onChange={(e) => handleFilterChange('hourly_rate_min', e.target.value)}
                        className="w-full px-3 py-2 border border-white/20 rounded-lg text-graphite bg-white/95 focus:outline-none focus:ring-2 focus:ring-coral/50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">Max Rate ($/hr)</label>
                      <input
                        type="number"
                        placeholder="Max rate"
                        value={filters.hourly_rate_max}
                        onChange={(e) => handleFilterChange('hourly_rate_max', e.target.value)}
                        className="w-full px-3 py-2 border border-white/20 rounded-lg text-graphite bg-white/95 focus:outline-none focus:ring-2 focus:ring-coral/50"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/70">
                      {getFilteredAndSortedFreelancers().length} freelancers found
                    </span>
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="border-white/50 text-white/80 hover:bg-white/10 text-sm"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Freelancers List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredAndSortedFreelancers().map((freelancer, index) => (
                <div key={freelancer._id} className="card p-6 bg-white/95 hover:bg-white transition-all duration-300 hover:shadow-lg cursor-pointer slide-in-up" style={{animationDelay: `${index * 0.1}s`}} onClick={() => handleFreelancerClick(freelancer)}>
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="w-16 h-16 bg-coral/20 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-graphite">{freelancer.name}</h3>
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
                      <span className="font-semibold text-graphite">{formatHourlyRate(freelancer.hourly_rate)}</span>
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
                        className="px-3 py-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFreelancerClick(freelancer)
                        }}
                      >
                        {t('viewProfile')}
                      </Button>
                      <Button 
                        variant="accent" 
                        size="sm" 
                        className="px-3 py-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleContactFreelancer(freelancer)
                        }}
                      >
                        Contact
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {getFilteredAndSortedFreelancers().length === 0 && (
                <div className="col-span-full text-center py-12 text-white/70">
                  <svg className="w-16 h-16 mx-auto mb-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-lg">No freelancers available yet</p>
                  <p className="text-sm mt-2 mb-6">
                    {freelancers.length === 0 
                      ? error 
                        ? error
                        : "No freelancers found in the database. Freelancers need to create their profiles first!"
                      : "No freelancers found matching your search. Try adjusting your filters or search terms."
                    }
                  </p>
                  {freelancers.length === 0 ? (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/create-project">
                      <Button variant="accent" className="px-6 py-3">
                        Post Your Project Instead
                      </Button>
                    </Link>
                      {error && (
                    <Button 
                      variant="outline" 
                          onClick={() => {
                            setError(null)
                            fetchAvailableFreelancers()
                          }}
                      className="px-6 py-3 border-white text-white hover:bg-white hover:text-graphite"
                    >
                          Try Again
                    </Button>
                  )}
                </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                      className="px-6 py-3 border-white text-white hover:bg-white hover:text-graphite"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Escrow Management Section */}
      {activeTab === 'escrow' && (
        <section className="py-16 px-6 bg-white/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">
              <span className="text-mint">{t('escrowManagement')}</span>
            </h2>
            
            <div className="space-y-8">
              {/* Bank Details Management */}
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-xl font-semibold text-graphite mb-4">Bank Details</h3>
                <BankDetailsList />
              </div>

              {/* Project Selection for Escrow */}
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-xl font-semibold text-graphite mb-4">{t('projectEscrowManagement')}</h3>
                <p className="text-coolgray mb-4">Select a project to manage escrow payments and milestones</p>
                
                {/* Active Projects with Milestones for Payment */}
                <ActiveEscrowProjects />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Escrow Modal */}
      {showEscrowModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-graphite">{t('escrowManagement')} - {selectedProject.title}</h3>
              <button 
                onClick={() => {
                  setShowEscrowModal(false);
                  setSelectedProject(null);
                }}
                className="text-coolgray hover:text-graphite transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Project Price Update */}
              <ProjectPriceUpdate 
                projectId={selectedProject.id}
                currentAmount={selectedProject.amount}
                onSuccess={(data) => {
                  setSelectedProject(prev => ({ ...prev, amount: data.final_amount }));
                }}
              />

              {/* Create Escrow Payment */}
              <CreateEscrowPayment 
                projectId={selectedProject.id}
                onSuccess={() => {
                  // Refresh escrow status
                }}
              />

              {/* Escrow Status */}
              <EscrowStatus projectId={selectedProject.id} />

              {/* Milestone Management */}
              <MilestoneManagement 
                projectId={selectedProject.id}
                userRole="client"
              />
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-200">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setShowEscrowModal(false);
                  setSelectedProject(null);
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Why Choose <span className="text-coral">Maayo</span>?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card p-8 bg-white/95 text-center">
              <div className="w-16 h-16 bg-coral/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-graphite mb-4">Smart Matching</h3>
              <p className="text-coolgray">
                Our AI finds the perfect freelancer for your project based on skills, experience, and budget.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card p-8 bg-white/95 text-center">
              <div className="w-16 h-16 bg-mint/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-graphite mb-4">Quality Assurance</h3>
              <p className="text-coolgray">
                All freelancers are vetted and verified. Get high-quality work with milestone-based payments.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card p-8 bg-white/95 text-center">
              <div className="w-16 h-16 bg-violet/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-graphite mb-4">AI Project Management</h3>
              <p className="text-coolgray">
                Streamline your workflow with AI-powered project management and communication tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            How It <span className="text-coral">Works</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-coral rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Post Your Project</h3>
              <p className="text-white/70 text-sm">Describe your project, set budget, and define requirements</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-mint rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Review Proposals</h3>
              <p className="text-white/70 text-sm">Compare proposals from qualified freelancers</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-violet rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Choose Freelancer</h3>
              <p className="text-white/70 text-sm">Select the best freelancer for your project</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-coral rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                4
              </div>
              <h3 className="text-lg font-semibold mb-2">Get Results</h3>
              <p className="text-white/70 text-sm">Collaborate and receive high-quality deliverables</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            {t('readyToStartProject')} <span className="text-coral">{t('nextProject')}</span>?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            {t('joinThousandsClients')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/create-project">
              <Button variant="accent" size="lg" className="px-12 py-4 text-xl">
                Post a Project
              </Button>
            </Link>
            <Link to="/client-dashboard">
              <Button variant="outline" size="lg" className="px-12 py-4 text-xl border-white text-white hover:bg-white hover:text-graphite">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Freelancer Profile Modal */}
      {showFreelancerModal && selectedFreelancer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 bg-coral/20 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-graphite">{selectedFreelancer.name}</h2>
                    <p className="text-coral font-medium text-lg">{selectedFreelancer.title}</p>
                    <p className="text-coolgray">{selectedFreelancer.location}</p>
                    <p className="text-sm text-coolgray">{selectedFreelancer.years_experience} years experience</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedFreelancer.experience_level === 'Expert' ? 'bg-green-100 text-green-800' :
                        selectedFreelancer.experience_level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedFreelancer.experience_level}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedFreelancer.availability === 'full-time' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {selectedFreelancer.availability}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeFreelancerModal}
                  className="text-coolgray hover:text-graphite transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Rating and Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-mint/10 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-5 h-5 ${i < selectedFreelancer.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-2xl font-bold text-graphite">{selectedFreelancer.rating}/5</p>
                  <p className="text-sm text-coolgray">Rating</p>
                </div>
                <div className="text-center p-4 bg-violet/10 rounded-lg">
                  <p className="text-2xl font-bold text-graphite">{selectedFreelancer.completed_projects}</p>
                  <p className="text-sm text-coolgray">Projects Completed</p>
                </div>
                <div className="text-center p-4 bg-coral/10 rounded-lg">
                  <p className="text-2xl font-bold text-graphite">{formatHourlyRate(selectedFreelancer.hourly_rate, false)}</p>
                  <p className="text-sm text-coolgray">Per Hour</p>
                </div>
              </div>

              {/* About Section */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-graphite mb-3">About</h3>
                <p className="text-coolgray leading-relaxed">{selectedFreelancer.bio || selectedFreelancer.overview}</p>
              </div>

              {/* Skills Section */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-graphite mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedFreelancer.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-coral/10 text-coral rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-graphite mb-2">Response Time</h4>
                  <p className="text-coolgray">{selectedFreelancer.response_time}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-graphite mb-2">English Level</h4>
                  <p className="text-coolgray capitalize">{selectedFreelancer.english_level}</p>
                </div>
                {selectedFreelancer.highest_education && (
                  <div>
                    <h4 className="font-semibold text-graphite mb-2">Education</h4>
                    <p className="text-coolgray">{selectedFreelancer.highest_education}</p>
                  </div>
                )}
                {selectedFreelancer.certification && selectedFreelancer.certification.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-graphite mb-2">Certifications</h4>
                    <div className="space-y-1">
                      {selectedFreelancer.certification.map((cert, index) => (
                        <p key={index} className="text-coolgray text-sm">• {cert}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Resume and Portfolio Links */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-graphite mb-3">Documents & Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedFreelancer.resume_link && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-graphite mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Resume
                      </h4>
                      <a 
                        href={getSafeUrl(selectedFreelancer.resume_link)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-coral hover:text-coral/80 underline text-sm break-all"
                      >
                        View Resume
                      </a>
                    </div>
                  )}
                  {selectedFreelancer.github_link && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-graphite mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        GitHub
                      </h4>
                      <a 
                        href={getSafeUrl(selectedFreelancer.github_link)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-800 hover:text-gray-600 underline text-sm break-all"
                      >
                        View GitHub Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={closeFreelancerModal}
                  className="px-6 py-2"
                >
                  Close
                </Button>
                <Button
                  variant="accent"
                  onClick={() => {
                    closeFreelancerModal()
                    handleContactFreelancer(selectedFreelancer)
                  }}
                  className="px-6 py-2"
                >
                  Contact Freelancer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}