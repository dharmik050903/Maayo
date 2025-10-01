import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Button from '../components/Button'
import UpgradeBanner from '../components/UpgradeBanner'
import AnimatedCounter from '../components/AnimatedCounter'
import { isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'
import { projectService } from '../services/projectService'
import { skillsService } from '../services/skillsService'
import { formatBudget, formatHourlyRate } from '../utils/currency'
import { needsUpgrade } from '../utils/subscription'
import MyBids from '../components/MyBids'
import BidForm from '../components/BidForm'
import confirmationService from '../services/confirmationService.jsx'
// Escrow components
import BankDetailsList from '../components/BankDetailsList'
import EscrowStatus from '../components/EscrowStatus'
import MilestoneManagement from '../components/MilestoneManagement'

export default function FreelancerHome() {
  const [userData, setUserData] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [projects, setProjects] = useState([])
  const [projectSearchTerm, setProjectSearchTerm] = useState('')
  const [activeView, setActiveView] = useState(null) // New state variable
  const [showBidForm, setShowBidForm] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [showProjectDetail, setShowProjectDetail] = useState(false)
  const [selectedProjectDetail, setSelectedProjectDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Filter states
  const [selectedSkills, setSelectedSkills] = useState([])
  const [maxBudget, setMaxBudget] = useState('')
  const [availableSkills, setAvailableSkills] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [skillSearchTerm, setSkillSearchTerm] = useState('')
  const hasInitialized = useRef(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5) // Show 5 projects per page
  
  // Track submitted bids
  const [submittedBids, setSubmittedBids] = useState(new Set())

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      console.log('FreelancerHome: useEffect running (first time)')
      
      if (!isAuthenticated()) {
        window.location.href = '/login'
        return
      }
      
      // Get user data
      const user = getCurrentUser()
      if (user) {
        setUserData(user)
      }
      
      const savedProfile = localStorage.getItem('freelancer_profile_data')
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile))
      }
      
      fetchAvailableProjects()
      loadSkills()
      loadUserBids()
    } else {
      console.log('FreelancerHome: Skipping duplicate initialization due to StrictMode')
    }
  }, [])

  const loadSkills = async () => {
    try {
      const response = await skillsService.getSkills()
      if (response.data && Array.isArray(response.data)) {
        setAvailableSkills(response.data)
      }
    } catch (error) {
      console.error('Error loading skills:', error)
    }
  }

  const loadUserBids = async () => {
    try {
      const { bidService } = await import('../services/bidService')
      const response = await bidService.getMyBids()
      
      if (response.status && response.data) {
        const bidProjectIds = response.data.map(bid => bid.project_id)
        setSubmittedBids(new Set(bidProjectIds))
        console.log('Loaded user bids for projects:', bidProjectIds)
      }
    } catch (error) {
      console.error('Error loading user bids:', error)
    }
  }

  const fetchAvailableProjects = async () => {
    try {
      console.log('Fetching active projects from tblprojects...')
      setLoading(true)
      setError(null)
      
      const response = await projectService.getAllProjects()
      
      if (response.status && response.data) {
        const transformedProjects = response.data.map(project => {
          const clientData = project.personid || {}
          const skills = project.skills_required ? project.skills_required.map(s => s.skill || s.skill_id?.skill || 'Unknown') : []
          
          return {
            _id: project._id,
            title: project.title || 'Untitled Project',
            description: project.description || 'No description available',
            budget: project.budget || 0,
            duration: project.duration || 0,
            status: project.ispending ? 'open' : project.isactive ? 'active' : project.iscompleted ? 'completed' : 'unknown',
            skills_required: skills.length > 0 ? skills : ['General Services'],
            client_name: clientData.personName || `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim() || 'Unknown Client',
            createdAt: project.createdAt || new Date().toISOString(),
            proposals_count: project.proposals_count || 0,
            location: project.location || 'Remote',
            project_type: project.project_type || 'Fixed Price',
            experience_level: project.experience_level || 'Any',
            // Debug information
            ispending: project.ispending,
            isactive: project.isactive,
            iscompleted: project.iscompleted,
            // Source information
            source: 'tblprojects'
          }
        })
        
        setProjects(transformedProjects)
        console.log('Active projects fetched successfully:', transformedProjects.length)
        console.log('Project status details:', transformedProjects.map(p => ({
          title: p.title,
          ispending: p.ispending,
          isactive: p.isactive,
          iscompleted: p.iscompleted,
          status: p.status
        })))
      } else {
        console.log('No active projects found in database')
      setProjects([])
      }
    } catch (error) {
      console.error('Error fetching active projects:', error)
      setError(error.message)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }


  const handleProjectSearch = async () => {
    resetPagination() // Reset to first page when searching
    if (!projectSearchTerm.trim()) {
      fetchAvailableProjects()
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('Searching projects with term:', projectSearchTerm)
      
      const response = await projectService.searchProjects(projectSearchTerm)
      
      if (response.status && response.data) {
        const transformedProjects = response.data.map(project => {
          const clientData = project.personid || {}
          const skills = project.skills_required ? project.skills_required.map(s => s.skill || s.skill_id?.skill || 'Unknown') : []
          
          return {
            _id: project._id,
            title: project.title || 'Untitled Project',
            description: project.description || 'No description available',
            budget: project.budget || 0,
            duration: project.duration || 0,
            status: project.ispending ? 'open' : project.isactive ? 'active' : project.iscompleted ? 'completed' : 'unknown',
            skills_required: skills.length > 0 ? skills : ['General Services'],
            client_name: clientData.personName || `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim() || 'Unknown Client',
            createdAt: project.createdAt || new Date().toISOString(),
            proposals_count: project.proposals_count || 0,
            location: project.location || 'Remote',
            project_type: project.project_type || 'Fixed Price',
            experience_level: project.experience_level || 'Any',
            source: 'tblprojects'
          }
        })
        
        setProjects(transformedProjects)
        console.log('Search results:', transformedProjects.length)
      } else {
        setProjects([])
        console.log('No search results found')
      }
    } catch (error) {
      console.error('Error searching projects:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitBid = (project) => {
    setSelectedProject(project)
    setShowBidForm(true)
  }

  const handleBidSubmitted = async (bidData) => {
    console.log('Bid submitted successfully:', bidData)
    setShowBidForm(false)
    
    if (selectedProject) {
      markBidAsSubmitted(selectedProject._id)
    }
    
    setSelectedProject(null)
    
    loadUserBids()
    
    await confirmationService.alert(
      'Bid submitted successfully! You can view it in "My Bids" section.',
      'Success'
    )
  }

  const handleBidFormCancel = () => {
    setShowBidForm(false)
    setSelectedProject(null)
  }

  const handleProjectTitleClick = (project) => {
    setSelectedProjectDetail(project)
    setShowProjectDetail(true)
  }

  const handleProjectDetailClose = () => {
    setShowProjectDetail(false)
    setSelectedProjectDetail(null)
  }

  const handleSubmitBidFromDetail = (project) => {
    setShowProjectDetail(false)
    setSelectedProject(project)
    setShowBidForm(true)
  }


  // Filter functions
  const handleSkillToggle = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
    resetPagination() // Reset to first page when changing skills filter
  }

  const handleMaxBudgetChange = (value) => {
    setMaxBudget(value)
    resetPagination() // Reset to first page when changing budget filter
  }

  const clearFilters = () => {
    setSelectedSkills([])
    setMaxBudget('')
    setProjectSearchTerm('')
    setSkillSearchTerm('')
    resetPagination() // Reset to first page when clearing filters
  }

  const getFilteredSkills = () => {
    if (!skillSearchTerm.trim()) {
      return availableSkills
    }
    return availableSkills.filter(skill => 
      skill.skill.toLowerCase().includes(skillSearchTerm.toLowerCase())
    )
  }

  const getFilteredProjects = () => {
    return projects.filter(project => {
      // Text search filter
      const matchesSearch = !projectSearchTerm || 
        project.title.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
        project.client_name.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
        project.skills_required.some(skill => 
          skill.toLowerCase().includes(projectSearchTerm.toLowerCase())
        )

      // Skills filter
      const matchesSkills = selectedSkills.length === 0 || 
        selectedSkills.some(selectedSkill => 
          project.skills_required.some(projectSkill => 
            projectSkill.toLowerCase().includes(selectedSkill.toLowerCase())
          )
        )

      // Budget filter
      const matchesBudget = !maxBudget || project.budget <= parseFloat(maxBudget)

      return matchesSearch && matchesSkills && matchesBudget
    })
  }

  // Pagination logic
  const getPaginatedProjects = () => {
    const filtered = getFilteredProjects()
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filtered.slice(startIndex, endIndex)
  }

  const getTotalPages = () => {
    const filtered = getFilteredProjects()
    return Math.ceil(filtered.length / itemsPerPage)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    // Scroll to top of projects section
    const projectsSection = document.getElementById('projects-section')
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const resetPagination = () => {
    setCurrentPage(1)
  }

  const hasUserSubmittedBid = (projectId) => {
    return submittedBids.has(projectId)
  }

  const markBidAsSubmitted = (projectId) => {
    setSubmittedBids(prev => new Set([...prev, projectId]))
  }

  const handleLogout = () => {
    clearAuth()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-gradient text-white page-transition">
      <Header 
        userType="freelancer" 
        onLogout={handleLogout} 
        userData={userData}
      />
      
      {/* Upgrade Banner - Show only if user doesn't have active subscription */}
      {userData && needsUpgrade(userData) && (
        <div className="px-6 pt-20">
          <UpgradeBanner userType="freelancer" />
        </div>
      )}
      
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-6xl mx-auto text-center">
          {/* Personalized Welcome */}
          {userData && (
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
                Welcome back, <span className="text-mint">{userData.first_name}!</span>
              </h1>
              <p className="text-lg text-white/80 mb-6">
                {profileData ?` Ready to find your next exciting project?` : 'Ready to find your next exciting project?'}
              </p>
            </div>
          )}
          
          <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
            Find Your Next <span className="text-mint">Project</span>
          </h2>
          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto">
            Connect with clients worldwide and build your freelance career with Maayo
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/freelancer-dashboard">
              <Button variant="accent" size="lg" className="px-8 py-4 text-lg">
                Manage Profile
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-graphite"
              onClick={() => setActiveView(activeView === 'projects' ? null : 'projects')}
            >
              {activeView === 'projects' ? 'Hide Projects' : 'Browse Projects'}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-graphite"
              onClick={() => setActiveView(activeView === 'bids' ? null : 'bids')}
            >
              {activeView === 'bids' ? 'Hide My Bids' : 'My Bids'}
            </Button>
          </div>

          {/* Profile Quick Stats */}
          {profileData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
              <div className="card p-6 bg-white/95 text-center">
                <div className="text-2xl font-bold text-mint mb-1">{formatHourlyRate(profileData.hourly_rate || 0, false)}</div>
                <div className="text-sm text-coolgray">Hourly Rate</div>
              </div>
              <div className="card p-6 bg-white/95 text-center">
                <div className="text-2xl font-bold text-coral mb-1">{profileData.skills?.length || 0}</div>
                <div className="text-sm text-coolgray">Skills</div>
              </div>
              <div className="card p-6 bg-white/95 text-center">
                <div className="text-2xl font-bold text-violet mb-1">{profileData.certification?.length || 0}</div>
                <div className="text-sm text-coolgray">Certifications</div>
              </div>
              <div className="card p-6 bg-white/95 text-center">
                <div className="text-2xl font-bold text-mint mb-1 capitalize">{profileData.availability || 'Not Set'}</div>
                <div className="text-sm text-coolgray">Availability</div>
              </div>
            </div>
          )}

          {/* Bank Details Section */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="card p-6 bg-white/95 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-graphite mb-4">Payment Setup</h3>
              <p className="text-coolgray mb-4">Manage your bank details to receive payments from completed projects</p>
              <BankDetailsList />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <AnimatedCounter 
                end={10000} 
                suffix="+" 
                className="text-4xl font-bold text-mint mb-2"
                duration={2500}
                delay={200}
              />
              <div className="text-white/70">Active Projects</div>
            </div>
            <div className="text-center">
              <AnimatedCounter 
                end={20000000} 
                prefix="₹" 
                // suffix=" Cr+" 
                className="text-4xl font-bold text-coral mb-2"
                duration={3000}
                delay={400}
              />
              <div className="text-white/70">Earned by Freelancers</div>
            </div>
            <div className="text-center">
              <AnimatedCounter 
                end={5000} 
                suffix="+" 
                className="text-4xl font-bold text-violet mb-2"
                duration={2000}
                delay={600}
              />
              <div className="text-white/70">Happy Clients</div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Search Section */}
      {activeView === 'projects' && (
        <section className="py-16 px-6 bg-white/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">
              Active <span className="text-mint">Projects</span>
            </h2>
            
            {/* Project Search Input */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row gap-4 items-center max-w-2xl mx-auto">
                <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search projects by title, description, skills, or client..."
                value={projectSearchTerm}
                onChange={(e) => {
                  setProjectSearchTerm(e.target.value)
                  resetPagination() // Reset to first page when typing
                }}
                    onKeyPress={(e) => e.key === 'Enter' && handleProjectSearch()}
                    className="w-full px-4 py-3 border border-white/20 rounded-lg text-graphite bg-white/95 focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-mint"
              />
            </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleProjectSearch}
                    disabled={loading}
                    className="px-6 py-3 bg-mint text-white rounded-lg hover:bg-mint/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                  <button
                    onClick={() => {
                      setProjectSearchTerm('')
                      fetchAvailableProjects()
                    }}
                    className="px-6 py-3 bg-coral text-white rounded-lg hover:bg-coral/90"
                  >
                    Show All
                  </button>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-6 py-3 bg-violet text-white rounded-lg hover:bg-violet/90"
                  >
                    {showFilters ? 'Hide Filters' : 'Filters'}
                  </button>
                </div>
              </div>
            </div>

            {/* Filters Section */}
            {showFilters && (
              <div className="mb-8 bg-white/10 rounded-lg p-6 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Skills Filter */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-white font-semibold">Filter by Skills</label>
                      <span className="text-white/70 text-xs">
                        {skillSearchTerm ? `${getFilteredSkills().length} of ${availableSkills.length}` : `${availableSkills.length}`} skills
                      </span>
                    </div>
                    
                    {/* Skills Search Bar */}
                    <div className="mb-3 relative">
                      <input
                        type="text"
                        placeholder="Search skills..."
                        value={skillSearchTerm}
                        onChange={(e) => setSkillSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 pr-8 border border-white/20 rounded-lg text-graphite bg-white/95 focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-mint text-sm"
                      />
                      {skillSearchTerm && (
                        <button
                          onClick={() => setSkillSearchTerm('')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {getFilteredSkills().length > 0 ? (
                        <>
                          {skillSearchTerm && getFilteredSkills().length > 1 && (
                            <label className="flex items-center space-x-2 cursor-pointer border-b border-white/20 pb-2 mb-2">
                              <input
                                type="checkbox"
                                checked={getFilteredSkills().every(skill => selectedSkills.includes(skill.skill))}
                                onChange={() => {
                                  const filteredSkillNames = getFilteredSkills().map(s => s.skill)
                                  const allSelected = filteredSkillNames.every(skill => selectedSkills.includes(skill))
                                  if (allSelected) {
                                    // Remove all filtered skills
                                    setSelectedSkills(prev => prev.filter(skill => !filteredSkillNames.includes(skill)))
                                  } else {
                                    // Add all filtered skills
                                    setSelectedSkills(prev => [...new Set([...prev, ...filteredSkillNames])])
                                  }
                                }}
                                className="w-4 h-4 text-mint bg-white border-gray-300 rounded focus:ring-mint focus:ring-2"
                              />
                              <span className="text-white/90 text-sm font-medium">Select All Filtered</span>
                            </label>
                          )}
                          
                          {getFilteredSkills().map((skill) => (
                            <label key={skill._id} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedSkills.includes(skill.skill)}
                                onChange={() => handleSkillToggle(skill.skill)}
                                className="w-4 h-4 text-mint bg-white border-gray-300 rounded focus:ring-mint focus:ring-2"
                              />
                              <span className="text-white/90 text-sm">{skill.skill}</span>
                            </label>
                          ))}
                        </>
                      ) : (
                        <div className="text-white/70 text-sm text-center py-4">
                          {skillSearchTerm ? 'No skills found matching your search' : 'No skills available'}
                        </div>
                      )}
                    </div>
                    {selectedSkills.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {selectedSkills.map((skill) => (
                            <span
                              key={skill}
                              className="px-3 py-1 bg-mint/20 text-mint rounded-full text-sm flex items-center gap-1"
                            >
                              {skill}
                              <button
                                onClick={() => handleSkillToggle(skill)}
                                className="ml-1 text-mint hover:text-mint/70"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Budget Filter */}
                  <div>
                    <label className="block text-white font-semibold mb-3">Maximum Budget</label>
                    <div className="space-y-3">
                      <input
                        type="number"
                        placeholder="Enter max budget (e.g., 5000)"
                        value={maxBudget}
                        onChange={(e) => handleMaxBudgetChange(e.target.value)}
                        className="w-full px-4 py-2 border border-white/20 rounded-lg text-graphite bg-white/95 focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-mint"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setMaxBudget('1000')}
                          className="px-3 py-1 bg-white/20 text-white rounded text-sm hover:bg-white/30"
                        >
                          Under ₹1K
                        </button>
                        <button
                          onClick={() => setMaxBudget('5000')}
                          className="px-3 py-1 bg-white/20 text-white rounded text-sm hover:bg-white/30"
                        >
                          Under ₹5K
                        </button>
                        <button
                          onClick={() => setMaxBudget('10000')}
                          className="px-3 py-1 bg-white/20 text-white rounded text-sm hover:bg-white/30"
                        >
                          Under ₹10K
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/20">
                  <div className="text-white/70 text-sm">
                    {getFilteredProjects().length} projects found
                  </div>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 text-sm"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 max-w-2xl mx-auto">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold">Error loading projects</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint mx-auto mb-4"></div>
                <p className="text-white/70">Loading projects...</p>
              </div>
            )}

            {/* Active Filters Summary */}
            {!loading && (selectedSkills.length > 0 || maxBudget) && (
              <div className="mb-6 bg-white/5 rounded-lg p-4 max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-white font-semibold">Active Filters:</span>
                    {selectedSkills.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/70 text-sm">Skills:</span>
                        <div className="flex gap-1">
                          {selectedSkills.map((skill) => (
                            <span key={skill} className="px-2 py-1 bg-mint/20 text-mint rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {maxBudget && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/70 text-sm">Max Budget:</span>
                        <span className="px-2 py-1 bg-violet/20 text-violet rounded text-xs">
                          {formatBudget(parseFloat(maxBudget), false)}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-white/70 hover:text-white text-sm underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}

            {/* Projects List */}
            {!loading && (
            <div id="projects-section" className="space-y-6">
              {getPaginatedProjects().map((project, index) => (
                <div key={project._id} className="card p-6 bg-white/95 hover:bg-white transition-colors slide-in-up" style={{animationDelay: `{index * 0.1}s`}}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 
                        className="text-xl font-semibold text-graphite mb-2 cursor-pointer hover:text-violet transition-colors"
                        onClick={() => handleProjectTitleClick(project)}
                      >
                        {project.title}
                      </h3>
                      <p className="text-coolgray mb-3 project-description">
                        {project.description.length > 100 
                          ? `${project.description.substring(0, 100)}...` 
                          : project.description
                        }
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.skills_required.slice(0, 4).map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-mint/10 text-mint rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                        {project.skills_required.length > 4 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                            +{project.skills_required.length - 4} more
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-coolgray">
                        <div className="flex space-x-6">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            {formatBudget(project.budget, false)}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {project.duration} days
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {project.client_name}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-6 text-right">
                      <div className="mb-2">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </div>
                      <div className="text-sm text-coolgray mb-3">
                        {project.proposals_count} proposals
                      </div>
                      {hasUserSubmittedBid(project._id) ? (
                        <div className="px-6 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium text-center">
                          ✓ Submitted
                        </div>
                      ) : (
                        <Button 
                          variant="accent" 
                          size="sm" 
                          className="px-6 py-2"
                          onClick={() => handleSubmitBid(project)}
                        >
                          Submit Bid
                        </Button>
                      )}
                      <div className="text-xs text-coolgray mt-2">
                        Posted: {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {getFilteredProjects().length === 0 && (projectSearchTerm || selectedSkills.length > 0 || maxBudget) && (
                <div className="text-center py-12 text-white/70">
                  <svg className="w-16 h-16 mx-auto mb-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-lg">No projects found matching your criteria</p>
                  <p className="text-sm mt-2">Try adjusting your filters or search terms</p>
                </div>
              )}
              
                {projects.length === 0 && !error && (
                <div className="text-center py-12 text-white/70">
                  <svg className="w-16 h-16 mx-auto mb-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg">No projects available at the moment</p>
                  <p className="text-sm mt-2">Check back later for new opportunities</p>
                    <button 
                      onClick={fetchAvailableProjects}
                      className="mt-4 px-6 py-2 bg-mint text-white rounded-lg hover:bg-mint/90"
                    >
                      Refresh
                    </button>
                </div>
              )}

              {/* Pagination */}
              {getFilteredProjects().length > itemsPerPage && (
                <div className="flex justify-center items-center mt-8 space-x-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ←
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-mint text-white'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === getTotalPages()}
                    className="px-3 py-2 text-sm bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    →
                  </button>
                </div>
              )}

              {/* Pagination Info */}
              {getFilteredProjects().length > 0 && (
                <div className="text-center text-white/70 text-sm mt-4">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, getFilteredProjects().length)} of {getFilteredProjects().length} projects
                </div>
              )}
            </div>
            )}
          </div>
        </section>
      )}

      {/* My Bids Section */}
      {activeView === 'bids' && (
        <section className="py-16 px-6 bg-white/5">
          <div className="max-w-6xl mx-auto">
            <MyBids />
          </div>
        </section>
      )}

      {/* Quick Actions Section */}
      <section className="py-16 px-6 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Quick <span className="text-mint">Actions</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/freelancer-dashboard" className="card p-6 bg-white/95 hover:bg-white transition-colors group">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-mint/20 rounded-lg flex items-center justify-center group-hover:bg-mint/30 transition-colors">
                  <svg className="w-6 h-6 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-graphite">Update Profile</h3>
                  <p className="text-sm text-coolgray">Manage your skills and rates</p>
                </div>
              </div>
            </Link>
            
            <div 
              className="card p-6 bg-white/95 hover:bg-white transition-colors group cursor-pointer"
              onClick={() => setActiveView(activeView === 'projects' ? null : 'projects')}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-coral/20 rounded-lg flex items-center justify-center group-hover:bg-coral/30 transition-colors">
                  <svg className="w-6 h-6 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-graphite">Find Projects</h3>
                  <p className="text-sm text-coolgray">Browse available opportunities</p>
                </div>
              </div>
            </div>
            
            <div className="card p-6 bg-white/95 hover:bg-white transition-colors group cursor-pointer"
             onClick={() => setActiveView(activeView === 'bids' ? null : 'bids')}
             >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-violet/20 rounded-lg flex items-center justify-center group-hover:bg-violet/30 transition-colors">
                  <svg className="w-6 h-6 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-graphite">View Analytics</h3>
                  <p className="text-sm text-coolgray">Track your performance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Why Choose <span className="text-mint">Maayo</span>?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card p-8 bg-white/95 text-center">
              <div className="w-16 h-16 bg-mint/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-graphite mb-4">Smart Matching</h3>
              <p className="text-coolgray">
                Our AI-powered system matches you with projects that fit your skills and preferences perfectly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card p-8 bg-white/95 text-center">
              <div className="w-16 h-16 bg-coral/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-graphite mb-4">Secure Payments</h3>
              <p className="text-coolgray">
                Get paid securely with milestone-based payments and escrow protection for every project.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card p-8 bg-white/95 text-center">
              <div className="w-16 h-16 bg-violet/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-graphite mb-4">AI Tools</h3>
              <p className="text-coolgray">
                Access AI-powered proposal writing, project management, and productivity tools to boost your success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            How It <span className="text-mint">Works</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-mint rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Create Profile</h3>
              <p className="text-white/70 text-sm">Set up your profile with skills, portfolio, and rates</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-coral rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Find Projects</h3>
              <p className="text-white/70 text-sm">Browse and apply to projects that match your expertise</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-violet rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Get Hired</h3>
              <p className="text-white/70 text-sm">Submit proposals and get selected by clients</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-mint rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                4
              </div>
              <h3 className="text-lg font-semibold mb-2">Get Paid</h3>
              <p className="text-white/70 text-sm">Complete work and receive secure milestone payments</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Your <span className="text-mint">Freelance Journey</span>?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of successful freelancers on Maayo and take control of your career.
          </p>
          <Link to="/freelancer-dashboard">
            <Button variant="accent" size="lg" className="px-12 py-4 text-xl">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Bid Form Modal */}
      {showBidForm && selectedProject && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl">
            <BidForm 
              project={selectedProject}
              onBidSubmitted={handleBidSubmitted}
              onCancel={handleBidFormCancel}
            />
          </div>
        </div>
      )}

      {/* Compact Project Detail Modal */}
      {showProjectDetail && selectedProjectDetail && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="max-w-3xl w-full max-h-[85vh] overflow-y-auto bg-white rounded-lg shadow-xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-graphite">Project Details</h2>
                <button
                  onClick={handleProjectDetailClose}
                  className="text-coolgray hover:text-graphite transition-colors p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Project Content */}
              <div className="space-y-6">
                {/* Title and Status */}
                <div className="flex items-start justify-between">
                  <h3 className="text-2xl font-bold text-graphite pr-4">{selectedProjectDetail.title}</h3>
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {selectedProjectDetail.status.charAt(0).toUpperCase() + selectedProjectDetail.status.slice(1)}
                    </span>
                    <span className="text-sm text-coolgray">
                      {selectedProjectDetail.proposals_count} proposals
                    </span>
                  </div>
                </div>

                {/* Client Info */}
                <div className="flex items-center space-x-2 text-coolgray text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Posted by {selectedProjectDetail.client_name}</span>
                  <span>•</span>
                  <span>Posted: {new Date(selectedProjectDetail.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Project Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-coolgray mb-1">Budget</p>
                    <p className="text-xl font-bold text-mint">{formatBudget(selectedProjectDetail.budget)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-coolgray mb-1">Duration</p>
                    <p className="text-xl font-bold text-violet">{selectedProjectDetail.duration} days</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-coolgray mb-1">Proposals</p>
                    <p className="text-xl font-bold text-coral">{selectedProjectDetail.proposals_count}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-lg font-semibold text-graphite mb-3">Description</h4>
                  <p className="text-coolgray leading-relaxed whitespace-pre-wrap">{selectedProjectDetail.description}</p>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="text-lg font-semibold text-graphite mb-3">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProjectDetail.skills_required.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-mint/10 text-mint rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="text-sm text-coolgray">
                    {hasUserSubmittedBid(selectedProjectDetail._id) 
                      ? "You have already submitted a bid for this project"
                      : "Ready to submit your proposal?"
                    }
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={handleProjectDetailClose}
                      className="px-6 py-2"
                    >
                      Close
                    </Button>
                    {hasUserSubmittedBid(selectedProjectDetail._id) ? (
                      <div className="px-6 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                        ✓ Bid Submitted
                      </div>
                    ) : (
                      <Button
                        variant="accent"
                        onClick={() => handleSubmitBidFromDetail(selectedProjectDetail)}
                        className="px-6 py-2"
                      >
                        Submit Bid
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}