import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Button from '../components/Button'
import { projectService } from '../services/projectService'
import { skillsService } from '../services/skillsService'
import { getCurrentUser } from '../utils/api'
import { formatBudget } from '../utils/currency'
import BidForm from '../components/BidForm'
import confirmationService from '../services/confirmationService.jsx'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'

export default function FindWork() {
  const { t } = useComprehensiveTranslation()
  const userData = getCurrentUser()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSkills, setSelectedSkills] = useState([])
  const [maxBudget, setMaxBudget] = useState('')
  const [availableSkills, setAvailableSkills] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [skillSearchTerm, setSkillSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  const [showProjectDetail, setShowProjectDetail] = useState(false)
  const [selectedProjectDetail, setSelectedProjectDetail] = useState(null)
  const [showBidForm, setShowBidForm] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [submittedBids, setSubmittedBids] = useState(new Set())
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      console.log('FindWork: useEffect running (first time)')
    fetchProjects()
    loadSkills()
    } else {
      console.log('FindWork: Skipping duplicate initialization due to StrictMode')
    }
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await projectService.getAllProjects()
      if (response.status) {
        setProjects(response.data || [])
      } else {
        setError(response.message || 'Failed to fetch projects')
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setError(error.message || 'Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

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

  const handleSkillToggle = (skill) => {
    setSelectedSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill)
      } else {
        return [...prev, skill]
      }
    })
  }

  const handleMaxBudgetChange = (value) => {
    setMaxBudget(value)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedSkills([])
    setMaxBudget('')
    setSkillSearchTerm('')
  }

  const getFilteredSkills = () => {
    if (!skillSearchTerm) return availableSkills
    return availableSkills.filter(skill => 
      skill.skill.toLowerCase().includes(skillSearchTerm.toLowerCase())
    )
  }

  const getFilteredProjects = () => {
    let filtered = projects

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Skills filter
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(project =>
        project.skills_required.some(projectSkill =>
          selectedSkills.some(selectedSkill => 
            projectSkill.skill === selectedSkill.skill
          )
        )
      )
    }

    // Budget filter
    if (maxBudget) {
      const budget = parseFloat(maxBudget)
      filtered = filtered.filter(project => project.budget <= budget)
    }

    return filtered
  }

  const getPaginatedProjects = () => {
    const filtered = getFilteredProjects()
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filtered.slice(startIndex, endIndex)
  }

  const totalPages = Math.ceil(getFilteredProjects().length / itemsPerPage)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleProjectTitleClick = (project) => {
    setSelectedProjectDetail(project)
    setShowProjectDetail(true)
  }

  const handleProjectDetailClose = () => {
    setShowProjectDetail(false)
    setSelectedProjectDetail(null)
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
    
    await confirmationService.alert(
      'Bid submitted successfully! You can view it in "My Bids" section.',
      'Success'
    )
  }

  const handleBidFormCancel = () => {
    setShowBidForm(false)
    setSelectedProject(null)
  }

  const markBidAsSubmitted = (projectId) => {
    setSubmittedBids(prev => new Set([...prev, projectId]))
  }

  const hasUserSubmittedBid = (projectId) => {
    return submittedBids.has(projectId)
  }

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-gradient text-white">
        <Header 
          userType="freelancer" 
          userData={userData}
          onLogout={handleLogout}
        />
        <div className="pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint mx-auto mb-4"></div>
              <p className="text-white/70">Loading projects...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-gradient text-white">
        <Header 
          userType="freelancer" 
          userData={userData}
          onLogout={handleLogout}
        />
        <div className="pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <button
                onClick={fetchProjects}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const filteredProjects = getFilteredProjects()
  const paginatedProjects = getPaginatedProjects()

  return (
    <div className="min-h-screen bg-brand-gradient text-white">
      <Header 
        userType="freelancer" 
        userData={userData}
        onLogout={handleLogout}
      />

      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Find <span className="text-mint">Work</span>
            </h1>
            <p className="text-white/80 text-lg">
              Discover projects that match your skills and interests
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-12 bg-white/95 text-graphite rounded-xl focus:ring-2 focus:ring-violet focus:border-transparent border-0 text-sm sm:text-base"
                  />
                  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-coolgray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="border-violet text-violet hover:bg-violet hover:text-white transition-all duration-200 px-6 py-3 font-semibold w-full sm:w-auto"
              >
                <svg className={`w-5 h-5 mr-2 transition-transform duration-300 ${showFilters ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filters
              </Button>
            </div>

            {/* Filters Panel */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showFilters 
                ? 'max-h-[800px] opacity-100 mb-6' 
                : 'max-h-0 opacity-0 mb-0'
            }`}>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-500 delay-100 ${
                  showFilters ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}>
                  {/* Skills Filter */}
                  <div className="transition-all duration-500 delay-200">
                    <h3 className="text-lg font-semibold text-white mb-4">Filter by Skills</h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Search skills..."
                        value={skillSearchTerm}
                        onChange={(e) => setSkillSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 bg-white/95 text-graphite rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent border-0"
                      />
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {getFilteredSkills().map((skill) => (
                          <label key={skill._id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedSkills.some(s => s.skill === skill.skill)}
                              onChange={() => handleSkillToggle(skill)}
                              className="w-4 h-4 text-mint bg-white/95 border-gray-300 rounded focus:ring-mint focus:ring-2"
                            />
                            <span className="text-white/90 text-sm">{skill.skill}</span>
                          </label>
                        ))}
                      </div>
                      {selectedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedSkills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-mint/20 text-mint rounded-full text-sm flex items-center gap-2 animate-in slide-in-from-left-2 duration-300"
                              style={{ animationDelay: `${index * 100}ms` }}
                            >
                              {skill.skill}
                              <button
                                onClick={() => handleSkillToggle(skill)}
                                className="text-mint hover:text-white"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Budget Filter */}
                  <div className="transition-all duration-500 delay-300">
                    <h3 className="text-lg font-semibold text-white mb-4">Max Budget</h3>
                    <div className="space-y-4">
                      <input
                        type="number"
                        placeholder="Enter max budget..."
                        value={maxBudget}
                        onChange={(e) => handleMaxBudgetChange(e.target.value)}
                        className="w-full px-4 py-2 bg-white/95 text-graphite rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent border-0"
                      />
                      <div className="flex gap-2">
                        {[1000, 5000, 10000, 25000].map((amount) => (
                          <button
                            key={amount}
                            onClick={() => handleMaxBudgetChange(amount.toString())}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                              maxBudget === amount.toString()
                                ? 'bg-mint text-white'
                                : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                          >
                            {formatBudget(amount, false)}+
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Filters Summary */}
                {(selectedSkills.length > 0 || maxBudget) && (
                  <div className={`mt-4 pt-4 border-t border-white/20 transition-all duration-500 delay-400 ${
                    showFilters ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-white/80 text-sm">Active filters:</span>
                        {selectedSkills.length > 0 && (
                          <span className="px-2 py-1 bg-mint/20 text-mint rounded text-sm">
                            {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {maxBudget && (
                          <span className="px-2 py-1 bg-mint/20 text-mint rounded text-sm">
                            Max {formatBudget(parseFloat(maxBudget), false)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={clearFilters}
                        className="text-white/80 hover:text-white text-sm underline"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedProjects.length === 0 ? (
              <div className="col-span-full text-center py-12 text-white/70">
                <svg className="w-16 h-16 mx-auto mb-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-2">No Projects Found</h3>
                <p className="text-white/80 mb-4">
                  {searchTerm || selectedSkills.length > 0 || maxBudget
                    ? "Try adjusting your search criteria or filters"
                    : "No projects are available at the moment"
                  }
                </p>
                {(searchTerm || selectedSkills.length > 0 || maxBudget) && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-mint text-white rounded-lg hover:bg-mint/80 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              paginatedProjects.map((project) => (
                <div key={project._id} className="card p-6 bg-white/95 hover:bg-white transition-colors">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <h3 
                        className="text-xl font-semibold text-graphite mb-2 line-clamp-2 cursor-pointer hover:text-violet transition-colors"
                        onClick={() => handleProjectTitleClick(project)}
                      >
                        {project.title}
                      </h3>
                      <p className="text-coolgray text-sm mb-4 line-clamp-3">
                        {project.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-coolgray">Budget</p>
                          <p className="font-semibold text-mint">{formatBudget(project.budget)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-coolgray">Duration</p>
                          <p className="font-semibold text-coral">{project.duration} days</p>
                        </div>
                      </div>

                      {project.skills_required && project.skills_required.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-coolgray mb-2">Skills Required</p>
                          <div className="flex flex-wrap gap-1">
                            {project.skills_required.slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-violet/10 text-violet rounded text-xs"
                              >
                                {skill.skill}
                              </span>
                            ))}
                            {project.skills_required.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-coolgray rounded text-xs">
                                +{project.skills_required.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-coolgray bg-gray-50 p-2 rounded">
                        Posted: {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {hasUserSubmittedBid(project._id) ? (
                        <div className="w-full px-4 py-2 bg-green-100 text-green-800 rounded-lg text-center text-sm font-medium">
                          ✓ Bid Submitted
                        </div>
                      ) : (
                        <Button
                          variant="accent"
                          size="sm"
                          className="w-full px-4 py-2 bg-violet text-white hover:bg-violet/90 font-semibold transition-all duration-200"
                          onClick={() => handleSubmitBid(project)}
                        >
                          Submit Bid
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-8 space-y-4 sm:space-y-0">
              {/* Pagination Info */}
              <div className="text-white/80 text-sm">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProjects.length)} of {filteredProjects.length} projects
              </div>
              
              {/* Pagination Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className="px-3 py-2 text-sm font-medium text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200"
                      >
                        1
                      </button>
                      {currentPage > 4 && (
                        <span className="px-2 py-2 text-white/60">...</span>
                      )}
                    </>
                  )}
                  
                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .slice(Math.max(0, currentPage - 2), Math.min(currentPage + 2, totalPages))
                    .map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          page === currentPage
                            ? 'bg-mint text-white shadow-lg scale-105'
                            : 'text-white bg-white/10 border border-white/20 hover:bg-white/20'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  
                  {/* Last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && (
                        <span className="px-2 py-2 text-white/60">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="px-3 py-2 text-sm font-medium text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Project Detail Modal */}
      {showProjectDetail && selectedProjectDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-graphite">Project Details</h2>
              <button
                onClick={handleProjectDetailClose}
                className="text-coolgray hover:text-graphite transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Project Header */}
              <div className="bg-gradient-to-r from-violet/5 to-mint/5 p-6 rounded-xl border border-violet/20">
                <h3 className="text-2xl font-bold text-graphite mb-4">{selectedProjectDetail.title}</h3>
                <div className="flex items-center gap-4 text-sm text-coolgray">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Posted: {new Date(selectedProjectDetail.createdAt).toLocaleDateString()}
                  </span>
                  <span className="px-3 py-1 bg-mint/20 text-mint rounded-full text-xs font-medium">
                    Active
                  </span>
                </div>
              </div>

              {/* Project Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-mint/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-coolgray">Budget</p>
                      <p className="text-2xl font-bold text-mint">{formatBudget(selectedProjectDetail.budget)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-coral/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-coolgray">Duration</p>
                      <p className="text-2xl font-bold text-coral">{selectedProjectDetail.duration} days</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-violet/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-coolgray">Client</p>
                      <p className="text-lg font-semibold text-violet">{selectedProjectDetail.client_name || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-lg font-semibold text-graphite mb-3">Project Description</h4>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <p className="text-coolgray leading-relaxed whitespace-pre-wrap">{selectedProjectDetail.description}</p>
                </div>
              </div>

              {/* Skills Required */}
              {selectedProjectDetail.skills_required && selectedProjectDetail.skills_required.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-graphite mb-3">Skills Required</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProjectDetail.skills_required.map((skill, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-violet/10 text-violet rounded-full text-sm font-medium"
                      >
                        {skill.skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Project Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedProjectDetail.location && (
                  <div>
                    <h5 className="font-semibold text-graphite mb-2">Location</h5>
                    <p className="text-coolgray">{selectedProjectDetail.location}</p>
                  </div>
                )}
                
                {selectedProjectDetail.project_type && (
                  <div>
                    <h5 className="font-semibold text-graphite mb-2">Project Type</h5>
                    <p className="text-coolgray">{selectedProjectDetail.project_type}</p>
                  </div>
                )}

                {selectedProjectDetail.experience_level && (
                  <div>
                    <h5 className="font-semibold text-graphite mb-2">Experience Level</h5>
                    <p className="text-coolgray">{selectedProjectDetail.experience_level}</p>
                  </div>
                )}

                {selectedProjectDetail.start_date && (
                  <div>
                    <h5 className="font-semibold text-graphite mb-2">Start Date</h5>
                    <p className="text-coolgray">{new Date(selectedProjectDetail.start_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={handleProjectDetailClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
                {hasUserSubmittedBid(selectedProjectDetail._id) ? (
                  <div className="flex-1 px-6 py-3 bg-green-100 text-green-800 rounded-xl text-center font-medium">
                    ✓ Bid Submitted
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      handleProjectDetailClose()
                      handleSubmitBid(selectedProjectDetail)
                    }}
                    className="flex-1 px-6 py-3 bg-violet text-white rounded-xl hover:bg-violet/90 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    Submit Bid
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bid Form Modal */}
      {showBidForm && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100] p-2 sm:p-4">
          <div className="max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-2xl">
            <div className="flex-1 overflow-y-auto rounded-2xl">
              <BidForm 
                project={selectedProject}
                onBidSubmitted={handleBidSubmitted}
                onCancel={handleBidFormCancel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
