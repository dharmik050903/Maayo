import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Logo from './Logo'
import Button from './Button'
import { projectService } from '../services/projectService'
import { getFreelancersCached } from '../services/cachedApiService'
import { formatBudget, formatHourlyRate } from '../utils/currency'
import { getSafeUrl } from '../utils/urlValidation'
import messagingService from '../services/messagingService.jsx'
import { messageApiService } from '../services/messageApiService.jsx'
import { bidService } from '../services/bidService.js'
import ConversationsModal from './ConversationsModal'
import PaymentHistory from './PaymentHistory'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'

export default function Header({ userType, onLogout, userData }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useComprehensiveTranslation()
  const isAuthenticated = !!userData
  const actualUserType = userType || 'client' // Default to 'client' if userType is undefined
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState({ projects: [], freelancers: [] })
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [projects, setProjects] = useState([])
  const [freelancers, setFreelancers] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedFreelancer, setSelectedFreelancer] = useState(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showFreelancerModal, setShowFreelancerModal] = useState(false)
  const [showConversationsModal, setShowConversationsModal] = useState(false)
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)
  const [notificationCounts, setNotificationCounts] = useState({
    messages: 0,
    bidRequests: 0,
    bidResponses: 0,
    total: 0
  })
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const hasFetchedData = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 50)
      
      // Force header to stay fixed
      const header = document.querySelector('header')
      if (header) {
        header.style.position = 'fixed'
        header.style.top = '0px'
        header.style.left = '0px'
        header.style.right = '0px'
        header.style.zIndex = '1000'
      }
    }
    
    // Set initial position
    const header = document.querySelector('header')
    if (header) {
      header.style.position = 'fixed'
      header.style.top = '0px'
      header.style.left = '0px'
      header.style.right = '0px'
      header.style.zIndex = '1000'
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Set placeholder color based on scroll state
  useEffect(() => {
    const searchInput = document.querySelector('.search-input')
    if (searchInput) {
      searchInput.style.setProperty('--placeholder-color', isScrolled ? '#9CA3AF' : 'rgba(252, 251, 253, 0.7)')
    }
  }, [isScrolled])

  // Fetch initial data for search
  useEffect(() => {
    if (!hasFetchedData.current) {
      hasFetchedData.current = true
      console.log('Header: Fetching initial data (first time)')
      
    const fetchInitialData = async () => {
      try {
        // Only fetch freelancers if user is authenticated (for search functionality)
        if (isAuthenticated) {
          try {
            const freelancersResponse = await getFreelancersCached({})
            if (freelancersResponse.response.ok && freelancersResponse.data.status) {
              setFreelancers(freelancersResponse.data.data || [])
            }
          } catch (freelancerErr) {
            console.error('Error fetching freelancers:', freelancerErr)
            // Don't redirect on freelancer fetch error, just log it
          }
        }
        // Don't fetch projects automatically - only fetch when user searches
      } catch (err) {
        console.error('Error fetching data for search:', err)
      }
    }

    fetchInitialData()
    } else {
      console.log('Header: Skipping duplicate data fetch due to StrictMode')
    }
  }, [])

  // Set current user for messaging service
  useEffect(() => {
    if (userData) {
      messagingService.setCurrentUser(userData)
    }
  }, [userData])

  // Fetch notification counts on mount and periodically
  useEffect(() => {
    if (isAuthenticated) {
      // Fetch immediately
      fetchNotificationCounts()
      
      // Set up periodic refresh every 5 minutes (reduced frequency)
      const interval = setInterval(fetchNotificationCounts, 300000)
      
      return () => clearInterval(interval)
    }
  }, []) // Remove dependencies to prevent re-creation of intervals


  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearchResults && !event.target.closest('.search-container')) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSearchResults])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setIsSearching(true)
      setShowSearchResults(true)
      
      // Fetch projects only when user searches
      let filteredProjects = []
      try {
        const projectsResponse = await projectService.getBrowseProjects()
        const allProjects = projectsResponse.data || []
        
        // Filter projects
        filteredProjects = allProjects.filter(project =>
          project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (project.skills_required && project.skills_required.some(skill =>
            skill.skill?.toLowerCase().includes(searchQuery.toLowerCase())
          ))
        )
      } catch (error) {
        console.error('Error fetching projects for search:', error)
        filteredProjects = []
      }
      
      // Filter freelancers
      const filteredFreelancers = freelancers.filter(freelancer =>
        freelancer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        freelancer.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        freelancer.overview?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        freelancer.skills?.some(skill =>
          skill.skill?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      
      setSearchResults({
        projects: filteredProjects,
        freelancers: filteredFreelancers
      })
      setIsSearching(false)
    } else {
      setShowSearchResults(false)
      setSearchResults({ projects: [], freelancers: [] })
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setShowSearchResults(false)
    setSearchResults({ projects: [], freelancers: [] })
  }

  const handleProjectClick = (project) => {
    console.log('Project clicked:', project)
    setSelectedProject(project)
    setShowSearchResults(false)
    setShowProjectModal(true)
  }

  const handleFreelancerClick = (freelancer) => {
    console.log('Freelancer clicked:', freelancer)
    setSelectedFreelancer(freelancer)
    setShowSearchResults(false)
    setShowFreelancerModal(true)
  }

  const handleMessagesClick = () => {
    console.log('Header: Messages button clicked')
    console.log('Header: Current user:', userData)
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login')
      return
    }
    
    setShowConversationsModal(true)
  }

  const handleProfileClick = (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login')
      return
    }
    // If authenticated, navigate to the appropriate dashboard
    navigate(`/${actualUserType}-dashboard`)
  }

  const closeConversationsModal = () => {
    setShowConversationsModal(false)
  }

  const handlePaymentHistoryClick = () => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login')
      return
    }
    setShowPaymentHistory(true)
  }

  const closePaymentHistory = () => {
    setShowPaymentHistory(false)
  }

  // Fetch notification counts
  const fetchNotificationCounts = async () => {
    if (!isAuthenticated || isLoadingNotifications) return
    
    setIsLoadingNotifications(true)
    try {
      console.log('Header: Fetching notification counts')
      
      let messageCount = 0
      let bidRequestCount = 0
      let bidResponseCount = 0
      
      // Check if we have cached conversations data (cache for 2 minutes)
      const cachedConversations = localStorage.getItem('cached_conversations')
      const cacheTime = localStorage.getItem('cached_conversations_time')
      const now = Date.now()
      const cacheValid = cacheTime && (now - parseInt(cacheTime)) < 120000 // 2 minutes
      
      if (cacheValid && cachedConversations) {
        // Use cached data
        const conversations = JSON.parse(cachedConversations)
        messageCount = conversations.filter(conv => 
          conv.unread_count && conv.unread_count > 0
        ).reduce((total, conv) => total + (conv.unread_count || 0), 0)
        console.log('Header: Using cached conversations data')
      } else {
        // Fetch conversations to count unread messages
        try {
          const conversationsResult = await messageApiService.getConversations()
          if (conversationsResult.success && conversationsResult.data) {
            // Cache the conversations data
            localStorage.setItem('cached_conversations', JSON.stringify(conversationsResult.data))
            localStorage.setItem('cached_conversations_time', now.toString())
            
            // Count conversations with unread messages
            messageCount = conversationsResult.data.filter(conv => 
              conv.unread_count && conv.unread_count > 0
            ).reduce((total, conv) => total + (conv.unread_count || 0), 0)
          }
        } catch (error) {
          console.error('Header: Error fetching conversations:', error)
        }
      }
      
      // Fetch bids to count pending requests/responses
      try {
        if (actualUserType === 'client') {
          // For clients: we'll skip bid counting for now since getBidsByClient doesn't exist
          // TODO: Implement client bid counting when the backend endpoint is available
          console.log('⚠️ Skipping client bid counting - getBidsByClient not implemented')
          bidRequestCount = 0
        } else {
          // For freelancers: use getFreelancerBids instead
          const bidsResult = await bidService.getFreelancerBids()
          if (bidsResult.status && bidsResult.data) {
            bidResponseCount = bidsResult.data.filter(bid => 
              bid.status === 'accepted' || bid.status === 'rejected'
            ).length
          }
        }
      } catch (error) {
        console.error('Header: Error fetching bids:', error)
      }
      
      const totalCount = messageCount + bidRequestCount + bidResponseCount
      
      setNotificationCounts({
        messages: messageCount,
        bidRequests: bidRequestCount,
        bidResponses: bidResponseCount,
        total: totalCount
      })
      
      console.log('Header: Notification counts updated:', {
        messages: messageCount,
        bidRequests: bidRequestCount,
        bidResponses: bidResponseCount,
        total: totalCount
      })
      
      // Show breakdown in console for debugging
      if (totalCount > 0) {
        console.log('Header: Notification breakdown:', {
          'Unread Messages': messageCount,
          'Bid Requests': bidRequestCount,
          'Bid Responses': bidResponseCount,
          'Total Notifications': totalCount
        })
      }
      
    } catch (error) {
      console.error('Header: Error fetching notification counts:', error)
    } finally {
      setIsLoadingNotifications(false)
    }
  }

  const handleStartChat = (user, project = null) => {
    messagingService.show(user, project)
  }

  const closeProjectModal = () => {
    setShowProjectModal(false)
    setSelectedProject(null)
  }

  const closeFreelancerModal = () => {
    setShowFreelancerModal(false)
    setSelectedFreelancer(null)
  }



  // Helper function to check if a link is active
  const isActiveLink = (path) => {
    const currentPath = location.pathname
    
    if (path === '/') {
      return currentPath === '/'
    }
    
    // Special handling for job-related routes to prevent multiple highlights
    if (path === '/client/jobs') {
      // Only highlight if it's exactly /client/jobs or /client/jobs/create
      return currentPath === '/client/jobs' || currentPath === '/client/jobs/create'
    }
    
    if (path === '/client/jobs/stats') {
      return currentPath === '/client/jobs/stats'
    }
    
    if (path === '/freelancer/jobs') {
      // Only highlight if it's exactly /freelancer/jobs (not job detail pages)
      return currentPath === '/freelancer/jobs'
    }
    
    if (path === '/freelancer/applications') {
      return currentPath === '/freelancer/applications'
    }
    
    if (path === '/freelancer/saved-jobs') {
      return currentPath === '/freelancer/saved-jobs'
    }
    
    if (path === '/freelancer/application-stats') {
      return currentPath === '/freelancer/application-stats'
    }
    
    // For other routes, use exact match or parent path logic
    if (currentPath === path) {
      return true
    }
    
    // For parent paths, check if current path starts with path + '/'
    if (currentPath.startsWith(path + '/')) {
      return true
    }
    
    return false
  }

  // Helper function to get link classes with active state
  const getLinkClasses = (path) => {
    const baseClasses = "px-3 py-2 rounded-lg transition-all duration-300 whitespace-nowrap flex items-center text-sm font-semibold"
    const isActive = isActiveLink(path)
    
    if (isActive) {
      return `${baseClasses} text-mint bg-mint/10 border-b-2 border-mint shadow-sm`
    }
    return `${baseClasses} hover:text-mint hover:bg-white/10 text-graphite`
  }

  // Helper function to get mobile-specific link classes
  const getMobileLinkClasses = (path) => {
    const baseClasses = "px-6 py-3 rounded-lg transition-all duration-300 mobile-nav-link text-center font-semibold"
    const isActive = isActiveLink(path)
    
    if (isActive) {
      return `${baseClasses} text-mint bg-mint/10 border-b-2 border-mint`
    }
    return `${baseClasses} hover:text-mint hover:bg-gray-50 text-graphite`
  }

  // Helper function to get mobile button styles
  const getMobileButtonStyles = () => {
    return {
      fontWeight: '700 !important',
      textAlign: 'center'
    }
  }

  // Helper function to get mobile link styles
  const getMobileLinkStyles = (isActive) => {
    return {
      fontWeight: '700 !important',
      textAlign: 'center'
    }
  }

  const navLinks = isAuthenticated ? (
    <>
      <Link to={`/${actualUserType}-home`} className={getLinkClasses(`/${actualUserType}-home`)}>
        {t('home')}
      </Link>
      {actualUserType === 'freelancer' ? (
        <Link to="/find-work" className={getLinkClasses('/find-work')}>
          {t('findWork')}
        </Link>
      ) : (
        <Link to="/project/create" className={getLinkClasses('/project/create')}>
          {t('postProject')}
          </Link>
      )}
      
      {/* My Projects Link */}
      <Link to="/my-projects" className={getLinkClasses('/my-projects')}>
        {t('myProjects')}
      </Link>
      
      {/* Job-related navigation */}
      {actualUserType === 'freelancer' ? (
        <>
          <Link to="/freelancer/jobs" className={getLinkClasses('/freelancer/jobs')}>
            Browse Jobs
          </Link>
          <Link to="/freelancer/applications" className={getLinkClasses('/freelancer/applications')}>
            Applications
          </Link>
        </>
      ) : (
        <>
          <Link to="/client/jobs" className={getLinkClasses('/client/jobs')}>
            My Jobs
          </Link>
          <Link to="/client/jobs/stats" className={getLinkClasses('/client/jobs/stats')}>
            Job Statistics
          </Link>
        </>
      )}
      
      <button 
        onClick={handleMessagesClick}
        className="hover:text-mint px-3 py-2 rounded-lg transition-all duration-300 text-graphite whitespace-nowrap flex items-center relative text-sm font-semibold hover:bg-white/10"
      >
        {t('messages')}
        {isLoadingNotifications ? (
          <span className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            ...
          </span>
        ) : notificationCounts.total > 0 ? (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {notificationCounts.total > 99 ? '99+' : notificationCounts.total}
          </span>
        ) : null}
      </button>
      <button 
        onClick={handlePaymentHistoryClick}
        className="hover:text-mint px-3 py-2 rounded-lg transition-all duration-300 text-graphite whitespace-nowrap flex items-center text-sm font-semibold hover:bg-white/10"
      >
        {t('payments')}
      </button>
      <button 
        onClick={handleProfileClick}
        className="hover:text-mint px-3 py-2 rounded-lg transition-all duration-300 text-graphite whitespace-nowrap flex items-center text-sm font-semibold hover:bg-white/10"
      >
        {t('profile')}
      </button>
      <Link to="/pricing" className={getLinkClasses('/pricing')}>
        {t('pricing')}
      </Link>
    </>
  ) : (
    <>
      <Link to="/" className={getLinkClasses('/')}>
        {t('home')}
      </Link>
      <Link to="/browse" className={getLinkClasses('/browse')}>
        {t('findWork')}
      </Link>
      <Link to="/project/create" className={getLinkClasses('/project/create')}>
        {t('postProject')}
      </Link>
      <Link to="/pricing" className={getLinkClasses('/pricing')}>
        {t('pricing')}
      </Link>
      <Link to="/about" className={getLinkClasses('/about')}>
        {t('about')}
      </Link>
    </>
  )

  // Mobile-specific navigation links with proper text colors
  const mobileNavLinks = isAuthenticated ? (
    <>
      <Link to={`/${actualUserType}-home`} className={getMobileLinkClasses(`/${actualUserType}-home`)} style={getMobileLinkStyles()}>
        {t('home')}
      </Link>
      {actualUserType === 'freelancer' ? (
        <Link to="/find-work" className={getMobileLinkClasses('/find-work')} style={getMobileLinkStyles()}>
          {t('findWork')}
        </Link>
      ) : (
        <Link to="/project/create" className={getMobileLinkClasses('/project/create')} style={getMobileLinkStyles()}>
          {t('postProject')}
          </Link>
      )}
      
      {/* My Projects Link */}
      <Link to="/my-projects" className={getMobileLinkClasses('/my-projects')} style={getMobileLinkStyles()}>
        {t('myProjects')}
      </Link>
      
      {/* Job-related navigation */}
      {actualUserType === 'freelancer' ? (
        <>
          <Link to="/freelancer/jobs" className={getMobileLinkClasses('/freelancer/jobs')} style={getMobileLinkStyles()}>
            Browse Jobs
          </Link>
          <Link to="/freelancer/applications" className={getMobileLinkClasses('/freelancer/applications')} style={getMobileLinkStyles()}>
            My Applications
          </Link>
        </>
      ) : (
        <>
          <Link to="/client/jobs" className={getMobileLinkClasses('/client/jobs')} style={getMobileLinkStyles()}>
            My Jobs
          </Link>
          <Link to="/client/jobs/create" className={getMobileLinkClasses('/client/jobs/create')} style={getMobileLinkStyles()}>
            Post Job
          </Link>
          <Link to="/client/jobs/stats" className={getMobileLinkClasses('/client/jobs/stats')} style={getMobileLinkStyles()}>
            Job Statistics
          </Link>
        </>
      )}
      
      <button 
        onClick={handleMessagesClick}
        className="hover:text-mint px-6 py-3 rounded-lg transition-all duration-300 text-center text-graphite font-semibold hover:bg-gray-50"
        style={getMobileButtonStyles()}
      >
        {t('messages')}
        {isLoadingNotifications ? (
          <span className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
            ...
          </span>
        ) : notificationCounts.total > 0 ? (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
            {notificationCounts.total > 99 ? '99+' : notificationCounts.total}
          </span>
        ) : null}
      </button>
      <button 
        onClick={handlePaymentHistoryClick}
        className="hover:text-mint px-6 py-3 rounded-lg transition-all duration-300 text-center text-graphite font-semibold hover:bg-gray-50"
        style={getMobileButtonStyles()}
      >
        {t('payments')}
      </button>
      <button 
        onClick={handleProfileClick}
        className="hover:text-mint px-6 py-3 rounded-lg transition-all duration-300 text-center text-graphite font-semibold hover:bg-gray-50"
        style={getMobileButtonStyles()}
      >
        {t('profile')}
      </button>
      <Link to="/pricing" className={getMobileLinkClasses('/pricing')} style={getMobileLinkStyles()}>
        {t('pricing')}
      </Link>
    </>
  ) : (
    <>
      <Link to="/" className={getMobileLinkClasses('/')} style={getMobileLinkStyles()}>
        {t('home')}
      </Link>
      <Link to="/browse" className={getMobileLinkClasses('/browse')} style={getMobileLinkStyles()}>
        {t('findWork')}
      </Link>
      <Link to="/project/create" className={getMobileLinkClasses('/project/create')} style={getMobileLinkStyles()}>
        {t('postProject')}
      </Link>
      <Link to="/pricing" className={getMobileLinkClasses('/pricing')} style={getMobileLinkStyles()}>
        {t('pricing')}
      </Link>
      <Link to="/about" className={getMobileLinkClasses('/about')} style={getMobileLinkStyles()}>
        {t('about')}
      </Link>
    </>
  )

  return (
    <>
    {createPortal(
      <header className={`w-full border-b transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md border-gray-100 shadow-xl' : 'bg-white/10 border-white/20'
      }`} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        width: '100vw',
        transform: 'translateZ(0)',
        willChange: 'transform',
        isolation: 'isolate'
      }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-2 py-2 md:px-6 md:py-4">
        <Link to={isAuthenticated ? `/${actualUserType}-home` : "/"} className="logo-link flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <Logo theme={isScrolled ? "dark" : "light"} />
        </Link>

        {/* Global Search Bar */}
        <div className={`flex-1 max-w-full mx-1 md:mx-2 relative search-container ${isScrolled ? 'scrolled' : ''}`} style={{ zIndex: 1000000 }}>
          <form onSubmit={handleSearch} className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  className="search-input"
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: isScrolled ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
                    fontSize: '14px',
                    fontWeight: 'normal',
                    color: isScrolled ? '#000000' : '#ffffff',
                    backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.15)',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxShadow: isScrolled ? '0 4px 8px rgba(0, 0, 0, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    transform: 'none !important',
                    zIndex: '1',
                    opacity: '1',
                    textShadow: 'none',
                    fontFamily: 'Arial, sans-serif',
                    lineHeight: '1.5',
                    textAlign: 'left',
                    verticalAlign: 'middle',
                    display: 'block',
                    position: 'relative',
                    visibility: 'visible',
                    clip: 'auto',
                    clipPath: 'none',
                    WebkitTextFillColor: isScrolled ? '#000000' : '#ffffff',
                    WebkitTextStroke: 'none',
                    height: '40px'
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = isScrolled ? '0 4px 8px rgba(35, 209, 164, 0.5)' : '0 0 0 2px rgba(35, 209, 164, 0.5)';
                    e.target.style.borderColor = isScrolled ? '#23D1A4' : 'rgba(35, 209, 164, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = isScrolled ? '0 4px 8px rgba(35, 209, 164, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)';
                    e.target.style.borderColor = isScrolled ? '#23D1A4' : 'rgba(255, 255, 255, 0.3)';
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className={`px-3 py-1.5 md:px-5 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-300 h-10 ${
                  isScrolled 
                    ? 'bg-mint text-white hover:bg-mint/90 shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
                    : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/30 hover:border-white/50'
                } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              >
                {isSearching ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Searching...</span>
                  </div>
                ) : (
                  t('search')
                )}
              </button>
            </div>
          </form>

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[1100] max-h-96 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-graphite">
                    Found {searchResults.projects.length} projects and {searchResults.freelancers.length} freelancers
                  </p>
                  <button
                    onClick={clearSearch}
                    className="text-xs text-gray-500 hover:text-graphite px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    Clear all
                  </button>
                </div>

                {/* Projects Results */}
                {searchResults.projects.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2 text-graphite">
                      Projects ({searchResults.projects.length})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {searchResults.projects.slice(0, 3).map((project) => (
                        <div 
                          key={project._id} 
                          className="p-2 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleProjectClick(project)}
                        >
                          <h5 className="text-sm font-medium line-clamp-1 text-graphite hover:text-mint transition-colors">
                            {project.title}
                          </h5>
                          <p className="text-xs line-clamp-1 text-gray-600 mt-1">
                            {project.description}
                          </p>
                          <p className="text-xs text-mint font-medium mt-1">
                            {formatBudget(project.budget)} • {project.duration} days
                          </p>
                        </div>
                      ))}
                      {searchResults.projects.length > 3 && (
                        <p className="text-xs text-center text-gray-500">
                          +{searchResults.projects.length - 3} more projects
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Freelancers Results */}
                {searchResults.freelancers.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2 text-graphite">
                      Freelancers ({searchResults.freelancers.length})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {searchResults.freelancers.slice(0, 3).map((freelancer) => (
                        <div 
                          key={freelancer._id} 
                          className="p-2 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleFreelancerClick(freelancer)}
                        >
                          <h5 className="text-sm font-medium line-clamp-1 text-graphite hover:text-mint transition-colors">
                            {freelancer.name || 'Freelancer'}
                          </h5>
                          <p className="text-xs line-clamp-1 text-gray-600 mt-1">
                            {freelancer.title && freelancer.title !== freelancer.name ? freelancer.title : 'Professional'} • {freelancer.experience_level || 'Experienced'}
                          </p>
                          <p className="text-xs text-mint font-medium mt-1">
                            {formatHourlyRate(freelancer.hourly_rate || 0)} • {freelancer.total_projects || 0} projects
                          </p>
                        </div>
                      ))}
                      {searchResults.freelancers.length > 3 && (
                        <p className="text-xs text-center text-gray-500">
                          +{searchResults.freelancers.length - 3} more freelancers
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {searchResults.projects.length === 0 && searchResults.freelancers.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">
                      No results found for "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className={`hidden lg:flex gap-1 font-medium transition-colors duration-300 ${
          isScrolled ? 'text-graphite' : 'text-white/90'
        }`}>
          {navLinks}
        </nav>

        {/* Mobile Hamburger Menu Button */}
        <div className="lg:hidden flex items-center gap-2">
          {/* Mobile Logout Button - Only for authenticated users */}
          {isAuthenticated && (
            <button 
              onClick={onLogout} 
              className={`px-3 py-2 rounded-lg transition-all duration-300 text-sm font-medium ${
                isScrolled 
                  ? 'bg-violet/10 border border-violet/30 text-violet hover:bg-violet/20' 
                  : 'bg-white/20 border border-white/30 text-white hover:bg-white/30'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
          
          <button onClick={toggleMobileMenu} className={`text-2xl ${isScrolled ? 'text-graphite' : 'text-white'}`}>
            ☰
          </button>
        </div>

        {/* Desktop Action Buttons - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <button onClick={onLogout} className="group relative px-4 py-2.5 bg-violet/10 border border-violet/30 text-violet rounded-lg hover:bg-violet/20 hover:border-violet/50 transition-all duration-300 text-base font-medium">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className={`font-medium transition-colors duration-300 ${isScrolled ? 'text-graphite' : 'text-white'}`}>{t('logout')}</span>
              </div>
            </button>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" className="border-violet text-violet hover:bg-violet hover:text-white font-medium px-5 py-2.5 shadow-lg text-base">
                  {t('login')}
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="outline" className="border-violet text-violet hover:bg-violet hover:text-white font-medium px-5 py-2.5 shadow-lg text-base">
                  {t('signup')}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <nav className={`lg:hidden bg-white/95 border-t border-white/20 shadow-lg transition-all duration-300`}>
          <div className="flex flex-col gap-4 p-6">
            {/* Navigation Links */}
            <div className="flex flex-col gap-3">
            {mobileNavLinks}
            </div>
            
            {/* Action Buttons */}
            <div className="border-t border-gray-200 pt-6">
              {isAuthenticated ? (
                <button 
                  onClick={onLogout} 
                  className="w-full px-6 py-4 rounded-xl transition-all duration-300 text-center text-graphite font-semibold bg-violet/10 border border-violet/30 hover:bg-violet/20 hover:border-violet/50"
                >
                  {t('logout')}
                </button>
              ) : (
                <div className="flex flex-col gap-4">
                  <Link 
                    to="/login" 
                    className="w-full px-6 py-4 rounded-xl transition-all duration-300 text-center text-graphite font-semibold border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  >
                    {t('login')}
                  </Link>
                  <Link 
                    to="/signup" 
                    className="w-full px-6 py-4 rounded-xl transition-all duration-300 text-center text-white font-semibold bg-mint hover:bg-mint/90 shadow-lg"
                  >
                    {t('signup')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>,
    document.body
    )}

      {/* Project Detail Modal */}
      {showProjectModal && selectedProject && createPortal(
        <div 
          className="modal-overlay fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-[1100] p-4"
          onClick={closeProjectModal}
        >
          <div 
            className="max-w-2xl w-full max-h-[85vh] overflow-y-auto bg-white rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-graphite">Project Details</h2>
                <button
                  onClick={closeProjectModal}
                  className="text-coolgray hover:text-graphite transition-colors p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Project Content */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-graphite mb-2">{selectedProject.title}</h3>
                  <p className="text-coolgray">{selectedProject.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-coolgray">Budget</p>
                    <p className="text-lg font-semibold text-mint">{formatBudget(selectedProject.budget)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-coolgray">Duration</p>
                    <p className="text-lg font-semibold text-coral">{selectedProject.duration} days</p>
                  </div>
                </div>

                {/* Skills */}
                {selectedProject.skills_required && selectedProject.skills_required.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-coolgray mb-2">Skills Required</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.skills_required.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-violet/10 text-violet rounded-full text-sm font-medium"
                        >
                          {skill.skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Project Details */}
                <div className="space-y-2 text-sm">
                  {selectedProject.location && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-coolgray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-coolgray">{selectedProject.location}</span>
                    </div>
                  )}
                  
                  {selectedProject.project_type && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-coolgray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="text-coolgray">{selectedProject.project_type}</span>
                    </div>
                  )}

                  {selectedProject.experience_level && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-coolgray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <span className="text-coolgray">{selectedProject.experience_level}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-coolgray mb-4">
                    Posted {new Date(selectedProject.createdAt).toLocaleDateString()}
                  </p>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="accent"
                      onClick={() => {
                        closeProjectModal()
                        // For projects, we need to find the client who posted it
                        // This is a placeholder - in a real app, you'd have the client info
                        handleStartChat({
                          id: selectedProject.personid || 'unknown',
                          name: 'Project Owner'
                        }, selectedProject)
                      }}
                      className="flex-1"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Contact Client
                    </Button>
                    <Button
                      variant="outline"
                      onClick={closeProjectModal}
                      className="px-6"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        , document.body
      )}

      {/* Freelancer Profile Modal */}
      {showFreelancerModal && selectedFreelancer && createPortal(
        <div 
          className="modal-overlay fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-[1100] p-4"
          onClick={closeFreelancerModal}
        >
          <div 
            className="max-w-2xl w-full max-h-[85vh] overflow-y-auto bg-white rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-graphite">Freelancer Profile</h2>
                <button
                  onClick={closeFreelancerModal}
                  className="text-coolgray hover:text-graphite transition-colors p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Freelancer Content */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-mint/20 rounded-full flex items-center justify-center">
                    <span className="text-mint font-bold text-2xl">
                      {selectedFreelancer.name?.[0] || 'F'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-graphite">{selectedFreelancer.name || 'Freelancer'}</h3>
                    <p className="text-coolgray">{selectedFreelancer.title || 'Professional'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-coolgray">Hourly Rate</p>
                    <p className="text-lg font-semibold text-mint">{formatHourlyRate(selectedFreelancer.hourly_rate || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-coolgray">Projects Completed</p>
                    <p className="text-lg font-semibold text-coral">{selectedFreelancer.total_projects || 0}</p>
                  </div>
                </div>

                {/* Overview */}
                {selectedFreelancer.overview && (
                  <div>
                    <p className="text-sm font-medium text-coolgray mb-2">Overview</p>
                    <p className="text-coolgray">{selectedFreelancer.overview}</p>
                  </div>
                )}

                {/* Experience Level */}
                {selectedFreelancer.experience_level && (
                  <div>
                    <p className="text-sm font-medium text-coolgray mb-2">Experience Level</p>
                    <p className="text-graphite font-medium">{selectedFreelancer.experience_level}</p>
                  </div>
                )}

                {/* Skills */}
                {selectedFreelancer.skills && selectedFreelancer.skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-coolgray mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedFreelancer.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-violet/10 text-violet rounded-full text-sm font-medium"
                        >
                          {skill.skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Availability */}
                {selectedFreelancer.availability && (
                  <div>
                    <p className="text-sm font-medium text-coolgray mb-2">Availability</p>
                    <p className="text-graphite">{selectedFreelancer.availability}</p>
                  </div>
                )}

                {/* Resume and Portfolio Links */}
                {(selectedFreelancer.resume_link || selectedFreelancer.github_link) && (
                  <div>
                    <p className="text-sm font-medium text-coolgray mb-2">Documents & Links</p>
                    <div className="space-y-2">
                      {selectedFreelancer.resume_link && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <a 
                            href={getSafeUrl(selectedFreelancer.resume_link)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-coral hover:text-coral/80 underline text-sm"
                          >
                            View Resume
                          </a>
                        </div>
                      )}
                      {selectedFreelancer.github_link && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          <a 
                            href={getSafeUrl(selectedFreelancer.github_link)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-800 hover:text-gray-600 underline text-sm"
                          >
                            View GitHub Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex gap-3">
                    <Button
                      variant="accent"
                      onClick={() => {
                        closeFreelancerModal()
                        handleStartChat({
                          id: selectedFreelancer._id,
                          name: selectedFreelancer.name || 'Freelancer'
                        })
                      }}
                      className="flex-1"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Start Chat
                    </Button>
                    <Button
                      variant="outline"
                      onClick={closeFreelancerModal}
                      className="px-6"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        , document.body
      )}

      {/* Conversations Modal */}
      <ConversationsModal
        isOpen={showConversationsModal}
        onClose={closeConversationsModal}
        currentUser={userData}
      />

      {/* Payment History Modal */}
      <PaymentHistory
        isOpen={showPaymentHistory}
        onClose={closePaymentHistory}
      />
    </>
  )
}