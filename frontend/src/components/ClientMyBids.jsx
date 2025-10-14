import React, { useState, useEffect, useRef } from 'react'
import { bidService } from '../services/bidService'
import { projectService } from '../services/projectService'
import Button from './Button'
import messagingService from '../services/messagingService'
import ConfirmationModal from './ConfirmationModal'
import NotificationModal from './NotificationModal'
import AcceptBidModal from './AcceptBidModal'
import { useConfirmation, useNotification } from '../hooks/useModal'
import { getSafeUrl } from '../utils/urlValidation'

export default function ClientMyBids() {
  const [bids, setBids] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProject, setSelectedProject] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectSearchQuery, setProjectSearchQuery] = useState('')
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedBid, setSelectedBid] = useState(null)
  const [rejectMessage, setRejectMessage] = useState('')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [bidToAccept, setBidToAccept] = useState(null)
  // Removed local messaging state - using messagingService instead
  const dropdownRef = useRef(null)
  const hasInitialized = useRef(false)
  const isInitializing = useRef(false)
  
  // Modal hooks
  const { confirmation, showConfirmation, hideConfirmation, setLoading: setConfirmationLoading } = useConfirmation()
  const { notification, showNotification, hideNotification } = useNotification()

  useEffect(() => {
    if (!hasInitialized.current && !isInitializing.current) {
      hasInitialized.current = true
      isInitializing.current = true
      
      const initializeData = async () => {
        // Fetch projects first, then use that data to fetch bids
        await fetchProjectsAndBids()
        isInitializing.current = false
      }
      
      initializeData()
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProjectDropdown(false)
        setProjectSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchProjectsAndBids = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch projects first
      const projectsResponse = await projectService.getClientProjects()
      if (projectsResponse.status && projectsResponse.data) {
        const projectsData = projectsResponse.data
        setProjects(projectsData)
        
        // Now fetch bids for all projects
        const projectIds = projectsData.map(project => project._id)
        const allBids = []
        
        console.log('🔄 ClientMyBids: Fetching bids for projects:', projectIds.length, 'projects')
        console.log('📋 ClientMyBids: Project IDs:', projectIds)
        
        for (const projectId of projectIds) {
          try {
            console.log(`🔄 ClientMyBids: Fetching bids for project: ${projectId}`)
            const bidsResponse = await bidService.getProjectBids(projectId)
            if (bidsResponse.status && bidsResponse.data) {
              console.log(`✅ ClientMyBids: Successfully fetched ${bidsResponse.data.length} bids for project ${projectId}`)
              allBids.push(...bidsResponse.data)
            } else {
              console.log(`⚠️ ClientMyBids: No bids data for project ${projectId}:`, bidsResponse)
            }
          } catch (err) {
            console.error(`❌ ClientMyBids: Error fetching bids for project ${projectId}:`, err)
            console.log(`💡 ClientMyBids: Check if this is the same ownership mismatch issue`)
          }
        }
        
        console.log('📊 ClientMyBids: Total bids fetched:', allBids.length)
        
        setBids(allBids)
      } else {
        setProjects([])
        setBids([])
      }
    } catch (error) {
      console.error('ClientMyBids: Error fetching data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const fetchBids = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get all projects first to get their IDs
      const projectsResponse = await projectService.getClientProjects()
      if (projectsResponse.status && projectsResponse.data) {
        const projectIds = projectsResponse.data.map(project => project._id)
        
        // Fetch bids for all client's projects
        const allBids = []
        for (const projectId of projectIds) {
          try {
            const bidsResponse = await bidService.getProjectBids(projectId)
            if (bidsResponse.status && bidsResponse.data) {
              allBids.push(...bidsResponse.data)
            }
          } catch (err) {
            console.error(`Error fetching bids for project ${projectId}:`, err)
          }
        }
        
        setBids(allBids)
      } else {
        setBids([])
      }
    } catch (error) {
      console.error('Error fetching bids:', error)
      setError('Failed to load bids')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await projectService.getClientProjects()
      if (response.status && response.data) {
        setProjects(response.data)
      } else {
        setProjects([])
      }
    } catch (error) {
      console.error('ClientMyBids: Error fetching projects:', error)
      setError('Failed to load projects')
    }
  }

  const getProjectTitle = (projectId) => {
    const project = projects.find(p => p._id === projectId)
    return project ? project.title : 'Unknown Project'
  }

  const getProjectBudget = (projectId) => {
    const project = projects.find(p => p._id === projectId)
    return project ? project.budget : 0
  }

  const getFreelancerName = (bid) => {
    if (bid.freelancer_id) {
      if (typeof bid.freelancer_id === 'object') {
        return `${bid.freelancer_id.first_name || ''} ${bid.freelancer_id.last_name || ''}`.trim() || 'Unknown Freelancer'
      }
      return 'Unknown Freelancer'
    }
    return 'Unknown Freelancer'
  }

  const getFreelancerEmail = (bid) => {
    if (bid.freelancer_id && typeof bid.freelancer_id === 'object') {
      return bid.freelancer_id.email || 'Not provided'
    }
    return 'Not provided'
  }

  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(projectSearchQuery.toLowerCase())
  )

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleAcceptBid = async (bidId) => {
    const bid = bids.find(b => b._id === bidId)
    const project = projects.find(p => p._id === bid?.project_id)
    if (bid && project) {
      setBidToAccept(bid)
      setShowAcceptModal(true)
    }
  }

  const handleAcceptSuccess = () => {
    setShowAcceptModal(false)
    setBidToAccept(null)
    showNotification({
      title: 'Success',
      message: 'Bid accepted and payment completed successfully!',
      type: 'success'
    })
    fetchBids() // Refresh the list
  }

  const handleRejectBid = (bid) => {
    setSelectedBid(bid)
    setRejectMessage('')
    setShowRejectModal(true)
  }

  const handleRejectSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setActionLoading(true)
      const response = await bidService.rejectBid(selectedBid._id, rejectMessage)
      if (response.status) {
        showNotification({
          title: 'Success',
          message: 'Bid rejected successfully!',
          type: 'success'
        })
        setShowRejectModal(false)
        setSelectedBid(null)
        setRejectMessage('')
        fetchBids() // Refresh the list
      } else {
        showNotification({
          title: 'Error',
          message: response.message || 'Failed to reject bid',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error rejecting bid:', error)
      showNotification({
        title: 'Error',
        message: error.message || 'Failed to reject bid',
        type: 'error'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleViewDetails = (bid) => {
    setSelectedBid(bid)
    setShowDetailsModal(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'pending_payment':
        return 'bg-orange-100 text-orange-800'
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const filteredBids = bids.filter(bid => {
    const projectMatch = selectedProject === 'all' || bid.project_id === selectedProject
    const statusMatch = statusFilter === 'all' || bid.status === statusFilter
    return projectMatch && statusMatch
  })

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint mx-auto mb-4"></div>
        <p className="text-white/70">Loading bids...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 max-w-2xl mx-auto">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold">Error loading bids</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchBids}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
            My <span className="text-mint">Bids</span>
          </h2>
          <p className="text-white/80 text-sm sm:text-base">
            {filteredBids.length} bid{filteredBids.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Searchable Project Dropdown */}
          <div className="relative w-full sm:w-auto" ref={dropdownRef}>
            <button
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="px-3 sm:px-4 py-2 bg-white text-graphite rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent border border-gray-300 w-full sm:min-w-[200px] text-left flex items-center justify-between text-sm sm:text-base"
              style={{ color: '#374151' }}
            >
              <span className="truncate">
                {selectedProject === 'all' ? 'All Projects' : getProjectTitle(selectedProject)}
              </span>
              <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showProjectDropdown && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-60 overflow-hidden">
                {/* Search Input */}
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={projectSearchQuery}
                      onChange={(e) => setProjectSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent text-graphite bg-white"
                      style={{ color: '#374151' }}
                      autoFocus
                    />
                  </div>
                </div>
                
                {/* Project List */}
                <div className="max-h-48 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedProject('all')
                      setShowProjectDropdown(false)
                      setProjectSearchQuery('')
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      selectedProject === 'all' ? 'bg-mint/10 text-mint font-medium' : 'text-graphite'
                    }`}
                  >
                    All Projects
                  </button>
                  
                  {filteredProjects.map(project => (
                    <button
                      key={project._id}
                      onClick={() => {
                        setSelectedProject(project._id)
                        setShowProjectDropdown(false)
                        setProjectSearchQuery('')
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                        selectedProject === project._id ? 'bg-mint/10 text-mint font-medium' : 'text-graphite'
                      }`}
                    >
                      {project.title}
                    </button>
                  ))}
                  
                  {filteredProjects.length === 0 && projectSearchQuery && (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No projects found matching "{projectSearchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 sm:px-4 py-2 bg-white text-graphite rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent border border-gray-300 text-sm sm:text-base w-full sm:w-auto"
            style={{ color: '#374151' }}
          >
            <option value="all" style={{ color: '#374151', backgroundColor: 'white' }}>All Status</option>
            <option value="pending" style={{ color: '#374151', backgroundColor: 'white' }}>Pending</option>
            <option value="accepted" style={{ color: '#374151', backgroundColor: 'white' }}>Accepted</option>
            <option value="rejected" style={{ color: '#374151', backgroundColor: 'white' }}>Rejected</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBids}
            className="border-white text-white hover:bg-white hover:text-graphite w-full sm:w-auto text-sm sm:text-base px-3 sm:px-4 py-2"
          >
            Refresh
          </Button>
        </div>
      </div>


      {/* Bids List */}
      {filteredBids.length === 0 ? (
        <div className="text-center py-12 text-white/70">
          <svg className="w-16 h-16 mx-auto mb-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">No Bids Yet</h3>
          <p className="text-white/80 mb-4">You haven't received any bids on your projects yet.</p>
          <p className="text-sm text-white/60 mb-6">Create more projects to attract freelancers!</p>
          {projects.length === 0 && (
            <p className="text-sm text-white/50">No projects found. Create a project first to receive bids.</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBids.map((bid) => (
            <div key={bid._id} className="bg-white/95 rounded-[2rem] p-6 hover:bg-white transition-all duration-300 hover:shadow-xl border border-white/20">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <h4 className="text-xl font-semibold text-graphite">
                      {getProjectTitle(bid.project_id)}
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bid.status)}`}>
                      {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <div>
                        <p className="text-sm text-coolgray">Bid Amount</p>
                        <p className="font-semibold text-graphite">{formatCurrency(bid.bid_amount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-coolgray">Duration</p>
                        <p className="font-semibold text-graphite">{bid.proposed_duration} days</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div>
                        <p className="text-sm text-coolgray">Freelancer</p>
                        <p className="font-semibold text-graphite">{getFreelancerName(bid)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h5 className="font-semibold text-graphite mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Cover Letter
                    </h5>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-coolgray text-sm leading-relaxed line-clamp-3">{bid.cover_letter}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-xs text-coolgray bg-gray-50 p-3 rounded-lg">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Submitted: {formatDate(bid.createdAt)}</span>
                    {bid.availability_hours && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Availability: {bid.availability_hours}h/week</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 min-w-[200px]">
                  {bid.status === 'pending' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 min-w-[120px] border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                        onClick={() => handleAcceptBid(bid._id)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Processing...' : 'Accept Bid'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 min-w-[120px] border-coral text-coral hover:bg-coral hover:text-white"
                        onClick={() => handleRejectBid(bid)}
                        disabled={actionLoading}
                      >
                        Reject Bid
                      </Button>
                    </>
                  )}
                  {bid.status === 'pending_payment' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 min-w-[140px] border-green-500 text-green-500 hover:bg-green-500 hover:text-white font-semibold"
                      onClick={() => handleAcceptBid(bid._id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : '💳 Complete Payment'}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 min-w-[120px] border-violet text-violet hover:bg-violet hover:text-white"
                    onClick={() => handleViewDetails(bid)}
                  >
                    View Details
                  </Button>
                  {bid.status === 'accepted' && (
                    <Button 
                      variant="accent" 
                      size="sm" 
                      className="flex-1 min-w-[120px] bg-mint text-white hover:bg-mint/90"
                      onClick={() => {
                        console.log('ClientMyBids: Message button clicked for bid:', bid)
                        console.log('ClientMyBids: Freelancer info:', {
                          id: bid.freelancer_id?._id || bid.freelancer_id,
                          name: bid.freelancer_name || 'Freelancer'
                        })
                        console.log('ClientMyBids: Project info:', {
                          id: bid.project_id,
                          title: bid.project_title || 'Project'
                        })
                        console.log('ClientMyBids: Bid ID:', bid._id)
                        
                        messagingService.show(
                          {
                            id: bid.freelancer_id?._id || bid.freelancer_id,
                            name: bid.freelancer_name || 'Freelancer'
                          },
                          {
                            id: bid.project_id,
                            title: bid.project_title || 'Project'
                          },
                          bid._id
                        )
                      }}
                    >
                      Message
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Bid Modal */}
      {showRejectModal && selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-graphite">Reject Bid</h3>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedBid(null)
                  setRejectMessage('')
                }}
                className="text-coolgray hover:text-graphite transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-coolgray mb-2">Project: <span className="font-semibold text-graphite">{getProjectTitle(selectedBid.project_id)}</span></p>
              <p className="text-coolgray mb-2">Bid Amount: <span className="font-semibold text-graphite">{formatCurrency(selectedBid.bid_amount)}</span></p>
              <p className="text-coolgray">Freelancer: <span className="font-semibold text-graphite">{getFreelancerName(selectedBid)}</span></p>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-graphite mb-2">
                  Rejection Message (Optional)
                </label>
                <textarea
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                  rows="4"
                  maxLength="500"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-graphite resize-none"
                  placeholder="Provide feedback to help the freelancer improve their future bids..."
                />
                <p className="text-sm text-coolgray mt-1">
                  {rejectMessage.length}/500 characters
                </p>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false)
                    setSelectedBid(null)
                    setRejectMessage('')
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  type="submit"
                  className="border-coral text-coral hover:bg-coral hover:text-white"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Rejecting...' : 'Reject Bid'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-graphite">Bid Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  setSelectedBid(null)
                }}
                className="text-coolgray hover:text-graphite transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Project Info */}
              <div className="bg-gradient-to-r from-violet/5 to-mint/5 p-4 rounded-lg border border-violet/20">
                <h4 className="text-lg font-semibold text-graphite mb-3">Project Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-coolgray">Project Title</p>
                    <p className="font-semibold text-graphite">{getProjectTitle(selectedBid.project_id)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-coolgray">Project Budget</p>
                    <p className="font-semibold text-graphite">{formatCurrency(getProjectBudget(selectedBid.project_id))}</p>
                  </div>
                </div>
              </div>

              {/* Bid Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-coolgray mb-1">Bid Amount</p>
                  <p className="text-2xl font-bold text-mint">{formatCurrency(selectedBid.bid_amount)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-coolgray mb-1">Duration</p>
                  <p className="text-2xl font-bold text-violet">{selectedBid.proposed_duration} days</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-coolgray mb-1">Availability</p>
                  <p className="text-2xl font-bold text-coral">{selectedBid.availability_hours || 40}h/week</p>
                </div>
              </div>

              {/* Freelancer Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-semibold text-graphite mb-3">Freelancer Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-coolgray">Name</p>
                    <p className="font-semibold text-graphite">{getFreelancerName(selectedBid)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-coolgray">Email</p>
                    <p className="font-semibold text-graphite">{getFreelancerEmail(selectedBid)}</p>
                  </div>
                </div>
                
                {/* Resume and Portfolio Links */}
                {selectedBid.freelancer_info && (selectedBid.freelancer_info.resume_link || selectedBid.freelancer_info.github_link) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h6 className="font-semibold text-graphite mb-2">Documents & Links</h6>
                    <div className="space-y-2">
                      {selectedBid.freelancer_info.resume_link && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <a 
                            href={getSafeUrl(selectedBid.freelancer_info.resume_link)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-coral hover:text-coral/80 underline text-sm"
                          >
                            View Resume
                          </a>
                        </div>
                      )}
                      {selectedBid.freelancer_info.github_link && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          <a 
                            href={getSafeUrl(selectedBid.freelancer_info.github_link)} 
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
              </div>

              {/* Cover Letter */}
              <div>
                <h5 className="font-semibold text-graphite mb-3">Cover Letter</h5>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-coolgray leading-relaxed">{selectedBid.cover_letter}</p>
                </div>
              </div>

              {/* Milestones */}
              {selectedBid.milestones && selectedBid.milestones.length > 0 && (
                <div>
                  <h5 className="font-semibold text-graphite mb-3">Proposed Milestones</h5>
                  <div className="space-y-3">
                    {selectedBid.milestones.map((milestone, index) => (
                      <div key={index} className="bg-gradient-to-r from-violet/10 to-mint/10 p-4 rounded-lg border border-violet/20">
                        <div className="flex justify-between items-start">
                          <div>
                            <h6 className="font-semibold text-graphite">{milestone.title}</h6>
                            {milestone.description && (
                              <p className="text-sm text-coolgray mt-1">{milestone.description}</p>
                            )}
                          </div>
                          <span className="font-bold text-mint text-lg">{formatCurrency(milestone.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-semibold text-graphite mb-3">Timeline</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-coolgray">Submitted</p>
                    <p className="font-semibold text-graphite">{formatDate(selectedBid.createdAt)}</p>
                  </div>
                  {selectedBid.start_date && (
                    <div>
                      <p className="text-sm text-coolgray">Proposed Start Date</p>
                      <p className="font-semibold text-graphite">{formatDate(selectedBid.start_date)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-coolgray">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBid.status)}`}>
                    {selectedBid.status.charAt(0).toUpperCase() + selectedBid.status.slice(1)}
                  </span>
                </div>
                {selectedBid.client_decision_date && (
                  <div className="text-right">
                    <p className="text-sm text-coolgray">Decision Date</p>
                    <p className="font-semibold text-graphite">{formatDate(selectedBid.client_decision_date)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messaging handled by messagingService */}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={hideConfirmation}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        type={confirmation.type}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        isLoading={confirmation.isLoading}
      />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={hideNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        autoClose={notification.autoClose}
        autoCloseDelay={notification.autoCloseDelay}
      />

      {/* Accept Bid Modal */}
      {showAcceptModal && bidToAccept && (
        <AcceptBidModal
          bid={bidToAccept}
          project={projects.find(p => p._id === bidToAccept.project_id)}
          onClose={() => {
            setShowAcceptModal(false)
            setBidToAccept(null)
          }}
          onSuccess={handleAcceptSuccess}
        />
      )}
    </div>
  )
}