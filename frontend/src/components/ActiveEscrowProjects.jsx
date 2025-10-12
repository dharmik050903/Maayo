import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { projectService } from '../services/projectService'
import { bidService } from '../services/bidService'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
import Button from './Button'
import ClientMilestoneReview from './ClientMilestoneReview'

const ActiveEscrowProjects = ({ searchTerm = '' }) => {
  const { t } = useComprehensiveTranslation()
  const navigate = useNavigate()
  const [activeProjects, setActiveProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [showProjectDetail, setShowProjectDetail] = useState(false)

  useEffect(() => {
    fetchActiveEscrowProjects()
  }, [])

  const fetchActiveEscrowProjects = async () => {
    try {
      console.log('🔄 ActiveEscrowProjects: Fetching active escrow projects...')
      setLoading(true)
      setError(null)
      
      // Get client's projects with accepted bids
      const projectsResponse = await projectService.getClientProjects()
      console.log('📊 ActiveEscrowProjects: Projects response:', projectsResponse)
      
      if (projectsResponse.status && projectsResponse.data) {
        const clientProjects = projectsResponse.data
        
        // Get bids for each project to find accepted ones
        const projectsWithAcceptedBids = []
        
        for (const project of clientProjects) {
          try {
            const bidsResponse = await bidService.getProjectBids(project._id)
            if (bidsResponse.status && bidsResponse.data) {
              console.log(`🔍 ActiveEscrowProjects: Bids for project ${project._id}:`, bidsResponse.data)
              // Check if this project has any accepted bids
              const acceptedBid = bidsResponse.data.find(bid => 
                bid.status === 'accepted' || bid.status === 'acceptedbid'
              )
              console.log(`✅ ActiveEscrowProjects: Accepted bid found:`, acceptedBid)
              
              if (acceptedBid && project.isactive === 1) {
                // Extract freelancer name from populated freelancer_id object
                let freelancerName = 'Freelancer'
                if (acceptedBid.freelancer_id) {
                  if (typeof acceptedBid.freelancer_id === 'object') {
                    const firstName = acceptedBid.freelancer_id.first_name || ''
                    const lastName = acceptedBid.freelancer_id.last_name || ''
                    freelancerName = `${firstName} ${lastName}`.trim() || 'Freelancer'
                  } else {
                    freelancerName = acceptedBid.freelancer_name || 'Freelancer'
                  }
                }

                projectsWithAcceptedBids.push({
                  _id: project._id,
                  title: project.title,
                  budget: project.budget,
                  freelancer_name: freelancerName,
                  freelancer_id: acceptedBid.freelancer_id,
                  accepted_at: acceptedBid.accepted_at || acceptedBid.created_at,
                  status: 'active',
                  description: project.description,
                  skills: project.skills || [],
                  deadline: project.deadline,
                  created_at: project.created_at
                })
              }
            }
          } catch (bidError) {
            console.warn(`⚠️ ActiveEscrowProjects: Could not fetch bids for project ${project._id}:`, bidError)
          }
        }
        
        console.log('✅ ActiveEscrowProjects: Projects with accepted bids:', projectsWithAcceptedBids)
        setActiveProjects(projectsWithAcceptedBids)
      } else {
        console.log('📊 ActiveEscrowProjects: No projects found or error in response')
        setActiveProjects([])
      }
    } catch (error) {
      console.error('❌ ActiveEscrowProjects: Error fetching active escrow projects:', error)
      setError('Failed to load active projects. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleProjectClick = (project) => {
    console.log('🖱️ ActiveEscrowProjects: Project clicked:', project)
    setSelectedProject(project)
    setShowProjectDetail(true)
  }

  const handleCloseModal = () => {
    setShowProjectDetail(false)
    setSelectedProject(null)
  }

  const handleModalClick = () => {
    // Redirect to client dashboard with project focus
    if (selectedProject) {
      console.log('🔄 ActiveEscrowProjects: Redirecting to client dashboard for project:', selectedProject._id)
      navigate(`/client-dashboard?project=${selectedProject._id}`)
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet"></div>
        <span className="ml-3 text-coolgray">{t('loading')}...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <div className="text-red-500 mb-2">{error}</div>
        <Button 
          variant="outline" 
          onClick={fetchActiveEscrowProjects}
          className="text-sm"
        >
          {t('tryAgain')}
            </Button>
      </div>
    )
  }

  // Filter projects based on search term
  const filteredProjects = activeProjects.filter(project => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      (project.title || '').toLowerCase().includes(searchLower) ||
      (project.freelancer_name || '').toLowerCase().includes(searchLower) ||
      (project.status || '').toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-3">
      {filteredProjects.length === 0 ? (
        <div className="text-center py-6 text-coolgray">
          <svg className="w-10 h-10 mx-auto mb-3 text-coolgray/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2-2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-semibold text-graphite mb-2">
            {searchTerm ? 'No Projects Found' : 'No Active Projects'}
          </h3>
          <p className="text-sm text-coolgray">
            {searchTerm 
              ? `No projects match '${searchTerm}'. Try a different search term.`
              : 'Your projects with accepted freelancer bids will appear here for milestone payment management.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProjects.map((project, index) => (
            <div 
              key={project._id} 
              className="group relative overflow-hidden bg-white/95 hover:bg-white transition-all duration-200 cursor-pointer rounded-xl shadow-md hover:shadow-lg border border-white/20 backdrop-blur-sm w-full"
              onClick={() => handleProjectClick(project)}
            >
              {/* Status indicator bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600"></div>
              
              <div className="relative z-10 p-3">
                {/* Compact Single Row Layout */}
                <div className="flex items-center justify-between gap-4">
                  {/* Left Side - Project Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-violet to-mint rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2-2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-graphite group-hover:text-violet transition-colors duration-200 truncate">
                        {project.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="truncate">{project.freelancer_name}</span>
                        <span>•</span>
                        <span>{formatCurrency(project.budget)}</span>
                </div>
                </div>
              </div>

                  {/* Right Side - Status and Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-2 py-1 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-md text-xs font-semibold whitespace-nowrap shadow-sm flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      Active
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleProjectClick(project)
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-violet to-purple text-white rounded-md font-semibold text-xs hover:from-violet/90 hover:to-purple/90 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Manage
                    </button>
                  </div>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Detail Modal */}
      {showProjectDetail && selectedProject && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-start justify-center p-4 pt-8">
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden cursor-pointer hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02]"
            onClick={(e) => {
              console.log('🖱️ ActiveEscrowProjects: Modal clicked!')
              handleModalClick()
            }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-graphite">{selectedProject.title}</h2>
                  <span className="px-2 py-1 bg-gradient-to-r from-violet to-purple text-white rounded-md text-xs font-semibold">
                    Click to Manage Milestones
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCloseModal()
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            
              <div className="space-y-4">
                {/* Project Summary */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3">
                  <h3 className="text-base font-semibold text-graphite mb-2">Project Summary</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Budget</p>
                      <p className="font-semibold text-sm text-graphite">{formatCurrency(selectedProject.budget)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Freelancer</p>
                      <p className="font-semibold text-sm text-graphite">{selectedProject.freelancer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Accepted Date</p>
                      <p className="font-semibold text-sm text-graphite">{formatDate(selectedProject.accepted_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Status</p>
                      <span className="px-2 py-1 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-md text-xs font-semibold">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Milestone Progress */}
                <div>
                  <h3 className="text-base font-semibold text-graphite mb-3">Milestone Progress</h3>
                  <div className="max-h-[300px] overflow-y-auto">
                    <ClientMilestoneReview 
                      projectId={selectedProject._id}
                      projectTitle={selectedProject.title}
                    />
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

export default ActiveEscrowProjects