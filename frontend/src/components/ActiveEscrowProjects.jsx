import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { projectService } from '../services/projectService'
import { bidService } from '../services/bidService'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
import Button from './Button'
import ClientMilestoneReview from './ClientMilestoneReview'

const ActiveEscrowProjects = () => {
  const { t } = useComprehensiveTranslation()
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
              // Check if this project has any accepted bids
              const acceptedBid = bidsResponse.data.find(bid => 
                bid.status === 'accepted' || bid.status === 'acceptedbid'
              )
              
              if (acceptedBid && project.isactive === 1) {
                projectsWithAcceptedBids.push({
                  _id: project._id,
                  title: project.title,
                  budget: project.budget,
                  description: project.description,
                  client_name: acceptedBid.client_name || 'You',
                  freelancer_name: acceptedBid.freelancer_name || 'Unknown Freelancer',
                  acceptedBid: acceptedBid,
                  accepted_at: acceptedBid.updatedAt || acceptedBid.createdAt,
                  isactive: project.isactive
                })
              }
            }
          } catch (bidError) {
            console.log(`⚠️ ActiveEscrowProjects: Could not fetch bids for project ${project._id}:`, bidError.message)
          }
        }
        
        console.log('✅ ActiveEscrowProjects: Active escrow projects found:', projectsWithAcceptedBids.length)
        setActiveProjects(projectsWithAcceptedBids)
        
        if (projectsWithAcceptedBids.length === 0) {
          setError('No active projects with accepted bids found')
        }
      } else {
        console.log('⚠️ ActiveEscrowProjects: No client projects found')
        setError('No projects found')
      }
    } catch (error) {
      console.error('❌ ActiveEscrowProjects: Error fetching escrow projects:', error)
      setError(error.message)
      setActiveProjects([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const handleProjectClick = (project) => {
    console.log('ActiveEscrowProjects: Opening milestone review for:', project.title)
    setSelectedProject(project)
    setShowProjectDetail(true)
  }

  const closeProjectDetail = () => {
    setShowProjectDetail(false)
    setSelectedProject(null)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint mx-auto mb-4"></div>
        <p className="text-sm text-coolgray">Loading active projects...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-yellow-600 font-medium">{error}</p>
        </div>
        <div className="text-sm text-yellow-700 mb-4">
          {error.includes('No active projects') ? (
            <>
              Projects will appear here when freelancers submit bids and you accept them.
              <div className="mt-2">
                <Button variant="outline" size="sm" className="mx-2">
                  <Link to="/my-projects">View All Projects</Link>
                </Button>
                <Button variant="accent" size="sm" className="mx-2">
                  <Link to="/project/create">Create New Project</Link>
                </Button>
              </div>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={fetchActiveEscrowProjects} className="mt-2">
              Try Again
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {activeProjects.length === 0 ? (
        <div className="text-center py-8 text-coolgray">
          <svg className="w-12 h-12 mx-auto mb-4 text-coolgray/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinesap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2-2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-semibold text-graphite mb-2">No Active Escrow Projects</h3>
          <p className="text-sm mb-4">
            Your projects with accepted freelancer bids will appear here for milestone payment management.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeProjects.map((project) => (
            <div key={project._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                 onClick={() => handleProjectClick(project)}>
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-graphite flex-1 mr-2">
                  {project.title}
                </h4>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Active
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm text-coolgray line-clamp-2">
                  {project.description || 'No description available'}
                </p>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-coolgray">Freelancer:</span>
                  <span className="font-medium text-graphite">{project.freelancer_name}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-coolgray text-sm">Total Budget:</span>
                  <span className="font-bold text-mint">{formatCurrency(project.budget)}</span>
                </div>
              </div>

              {/* Quick Preview of Milestones */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <ClientMilestoneReview 
                  projectId={project._id}
                  projectTitle={project.title}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="accent"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleProjectClick(project)}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.269-2.943-9.542-7z" />
                  </svg>
                  Review Milestones
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3 border-mint text-mint hover:bg-mint hover:text-white"
                  onClick={() => handleProjectClick(project)}
                >
                  Pay Now
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Detail Modal */}
      {showProjectDetail && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50 bg-blur-sm" onClick={closeProjectDetail}></div>
          <div className="relative bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-graphite">
                Milestone Payment - {selectedProject.title}
              </h2>
              <button
                onClick={closeProjectDetail}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-coolgray">Total Budget:</span>
                  <span className="ml-2 font-bold text-graphite">{formatCurrency(selectedProject.budget)}</span>
                </div>
                <div>
                  <span className="font-semibold text-coolgray">Freelancer:</span>
                  <span className="ml-2 font-bold text-graphite">{selectedProject.freelancer_name}</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-graphite mb-3">Milestone Payments</h3>
                <ClientMilestoneReview 
                  projectId={selectedProject._id}
                  projectTitle={selectedProject.title}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ActiveEscrowProjects
