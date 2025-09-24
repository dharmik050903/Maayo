import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Logo from './Logo'
import Button from './Button'
import { projectService } from '../services/projectService'
import { getFreelancers } from '../utils/api'
import { formatBudget, formatHourlyRate } from '../utils/currency'
import messagingService from '../services/messagingService.jsx'
import ConversationsModal from './ConversationsModal'
import PaymentHistory from './PaymentHistory'

export default function Header({ userType, onLogout, userData }) {
  const location = useLocation()
  const navigate = useNavigate()
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
  const hasFetchedData = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch initial data for search
  useEffect(() => {
    if (!hasFetchedData.current) {
      hasFetchedData.current = true
      console.log('Header: Fetching initial data (first time)')
      
    const fetchInitialData = async () => {
      try {
        // Always fetch projects (public endpoint)
        const projectsResponse = await projectService.getBrowseProjects()
        setProjects(projectsResponse.data || [])
        
        // Only fetch freelancers if user is authenticated
        if (isAuthenticated) {
          try {
            const freelancersResponse = await getFreelancers({})
            if (freelancersResponse.response.ok && freelancersResponse.data.status) {
              setFreelancers(freelancersResponse.data.data || [])
            }
          } catch (freelancerErr) {
            console.error('Error fetching freelancers:', freelancerErr)
            // Don't redirect on freelancer fetch error, just log it
          }
        }
      } catch (err) {
        console.error('Error fetching data for search:', err)
      }
    }

    fetchInitialData()
    } else {
      console.log('Header: Skipping duplicate data fetch due to StrictMode')
    }
  }, [isAuthenticated])

  // Set current user for messaging service
  useEffect(() => {
    if (userData) {
      messagingService.setCurrentUser(userData)
    }
  }, [userData])


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
      
      // Filter projects
      const filteredProjects = projects.filter(project =>
        project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.skills_required && project.skills_required.some(skill =>
          skill.skill?.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      )
      
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
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  // Helper function to get link classes with active state
  const getLinkClasses = (path) => {
    const baseClasses = "px-4 py-2 rounded-md transition-colors whitespace-nowrap flex items-center"
    const isActive = isActiveLink(path)
    
    if (isActive) {
      return `${baseClasses} text-mint font-semibold bg-mint/10 border-b-2 border-mint`
    }
    return `${baseClasses} hover:text-mint text-graphite`
  }

  // Helper function to get mobile-specific link classes
  const getMobileLinkClasses = (path) => {
    const baseClasses = "px-4 py-2 rounded-md transition-colors mobile-nav-link text-center"
    const isActive = isActiveLink(path)
    
    if (isActive) {
      return `${baseClasses} text-mint !font-bold bg-mint/10 border-b-2 border-mint`
    }
    return `${baseClasses} hover:text-mint text-graphite !font-bold`
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
        Home
      </Link>
      {actualUserType === 'freelancer' ? (
        <Link to="/find-work" className={getLinkClasses('/find-work')}>
          Find Work
        </Link>
      ) : (
        <Link to="/project/create" className={getLinkClasses('/project/create')}>
            Post a Project
          </Link>
      )}
      
      {/* My Projects Link */}
      <Link to="/my-projects" className={getLinkClasses('/my-projects')}>
        My Projects
      </Link>
      
      <button 
        onClick={handleMessagesClick}
        className="hover:text-mint px-4 py-2 rounded-md transition-colors text-graphite whitespace-nowrap flex items-center"
      >
        Messages
      </button>
      <button 
        onClick={handlePaymentHistoryClick}
        className="hover:text-mint px-4 py-2 rounded-md transition-colors text-graphite whitespace-nowrap flex items-center"
      >
        Payments
      </button>
      <button 
        onClick={handleProfileClick}
        className="hover:text-mint px-4 py-2 rounded-md transition-colors text-graphite whitespace-nowrap flex items-center"
      >
        Profile
      </button>
      <Link to="/pricing" className={getLinkClasses('/pricing')}>
        Pricing
      </Link>
    </>
  ) : (
    <>
      <Link to="/" className={getLinkClasses('/')}>
        Home
      </Link>
      <Link to="/browse" className={getLinkClasses('/browse')}>
        Find Work
      </Link>
      <Link to="/project/create" className={getLinkClasses('/project/create')}>
        Post a Project
      </Link>
      <Link to="/pricing" className={getLinkClasses('/pricing')}>
        Pricing
      </Link>
      <Link to="/about" className={getLinkClasses('/about')}>
        About
      </Link>
    </>
  )

  // Mobile-specific navigation links with proper text colors
  const mobileNavLinks = isAuthenticated ? (
    <>
      <Link to={`/${actualUserType}-home`} className={getMobileLinkClasses(`/${actualUserType}-home`)} style={getMobileLinkStyles()}>
        Home
      </Link>
      {actualUserType === 'freelancer' ? (
        <Link to="/find-work" className={getMobileLinkClasses('/find-work')} style={getMobileLinkStyles()}>
          Find Work
        </Link>
      ) : (
        <Link to="/project/create" className={getMobileLinkClasses('/project/create')} style={getMobileLinkStyles()}>
            Post a Project
          </Link>
      )}
      
      {/* My Projects Link */}
      <Link to="/my-projects" className={getMobileLinkClasses('/my-projects')} style={getMobileLinkStyles()}>
        My Projects
      </Link>
      
      <button 
        onClick={handleMessagesClick}
        className="hover:text-mint px-4 py-2 rounded-md transition-colors text-center text-graphite !font-bold"
        style={getMobileButtonStyles()}
      >
        Messages
      </button>
      <button 
        onClick={handlePaymentHistoryClick}
        className="hover:text-mint px-4 py-2 rounded-md transition-colors text-center text-graphite !font-bold"
        style={getMobileButtonStyles()}
      >
        Payments
      </button>
      <button 
        onClick={handleProfileClick}
        className="hover:text-mint px-4 py-2 rounded-md transition-colors text-center text-graphite !font-bold"
        style={getMobileButtonStyles()}
      >
        Profile
      </button>
      <Link to="/pricing" className={getMobileLinkClasses('/pricing')} style={getMobileLinkStyles()}>
        Pricing
      </Link>
    </>
  ) : (
    <>
      <Link to="/" className={getMobileLinkClasses('/')} style={getMobileLinkStyles()}>
        Home
      </Link>
      <Link to="/browse" className={getMobileLinkClasses('/browse')} style={getMobileLinkStyles()}>
        Find Work
      </Link>
      <Link to="/project/create" className={getMobileLinkClasses('/project/create')} style={getMobileLinkStyles()}>
        Post a Project
      </Link>
      <Link to="/pricing" className={getMobileLinkClasses('/pricing')} style={getMobileLinkStyles()}>
        Pricing
      </Link>
      <Link to="/about" className={getMobileLinkClasses('/about')} style={getMobileLinkStyles()}>
        About
      </Link>
    </>
  )

  return (
    <>
    <header className={`w-full fixed top-0 left-0 z-50 backdrop-blur-md border-b transition-all duration-300 ${
      isScrolled ? 'bg-white/95 border-white/30' : 'bg-white/10 border-white/20'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between p-2 md:p-4">
        <Link to={isAuthenticated ? `/${actualUserType}-home` : "/"} className="logo-link flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <Logo theme={isScrolled ? "dark" : "light"} />
        </Link>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-4 relative search-container">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search projects, freelancers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full px-4 py-2 pl-10 pr-4 rounded-lg border transition-colors text-sm ${
                    isScrolled 
                      ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                      : 'border-white/30 bg-white/20 text-white placeholder-white/70'
                  } backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-mint/50`}
                />
                <svg className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  isScrolled ? 'text-gray-400' : 'text-white/60'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isScrolled 
                    ? 'bg-mint text-white hover:bg-mint/90' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSearching ? '...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
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
        <nav className={`hidden md:flex gap-4 font-medium transition-colors duration-300 ${
          isScrolled ? 'text-graphite' : 'text-white/90'
        }`}>
          {navLinks}
        </nav>

        {/* Mobile Hamburger Menu Button */}
        <div className="md:hidden flex items-center gap-3">
          <button onClick={toggleMobileMenu} className={`text-2xl ${isScrolled ? 'text-graphite' : 'text-white'}`}>
            ☰
          </button>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <button onClick={onLogout} className="group relative px-4 py-2 bg-violet/10 border border-violet/30 text-violet rounded-lg hover:bg-violet/20 hover:border-violet/50 transition-all duration-200">
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className={`font-medium transition-colors duration-300 ${isScrolled ? 'text-graphite' : 'text-white'}`}>Logout</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-coral/20 to-mint/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-graphite font-semibold px-6 py-2 shadow-lg">
                  Login
                </Button>
              </Link>
              <Link to="/signup"><Button variant="accent">Sign Up</Button></Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <nav className={`md:hidden bg-white/95 border-t border-white/20 shadow-lg transition-all duration-300`}>
          <div className="flex flex-col gap-2 p-4 text-center">
            {mobileNavLinks}
            <div className="border-t border-gray-200 pt-4 mt-2">
              {isAuthenticated ? (
                <button onClick={onLogout} className="hover:text-mint px-4 py-2 rounded-md transition-colors text-center text-graphite !font-bold bg-violet/10 border border-violet/30" style={getMobileButtonStyles()}>
                  Logout
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link to="/login" className="hover:text-mint px-4 py-2 rounded-md transition-colors text-center text-graphite !font-bold border border-gray-300" style={getMobileButtonStyles()}>Login</Link>
                  <Link to="/signup" className="hover:text-mint px-4 py-2 rounded-md transition-colors text-center text-graphite !font-bold bg-mint text-white" style={getMobileButtonStyles()}>Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>

      {/* Project Detail Modal */}
      {showProjectModal && selectedProject && createPortal(
        <div 
          className="modal-overlay fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4"
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
          className="modal-overlay fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4"
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