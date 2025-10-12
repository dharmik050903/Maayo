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
        <div className="space-y-6">
          {activeProjects.map((project, index) => (
            <div 
              key={project._id} 
              className="group relative overflow-hidden bg-white/95 hover:bg-white transition-all duration-500 cursor-pointer rounded-3xl shadow-xl hover:shadow-2xl transform hover:-translate-y-3 border border-white/20 backdrop-blur-sm w-full"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => handleProjectClick(project)}
            >
              {/* Enhanced gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet/5 via-purple/5 to-mint/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Status indicator bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600"></div>
              
              <div className="relative z-10 p-6 md:p-8">
                {/* Horizontal Layout */}
                <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
                  {/* Left Side - Project Info */}
                  <div className="flex-1 lg:max-w-sm xl:max-w-md">
                    {/* Enhanced Header - Mobile Optimized */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-violet to-mint rounded-2xl flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-graphite mb-1 group-hover:text-violet transition-colors duration-300">
                            {project.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Accepted {new Date(project.accepted_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-2xl text-xs font-semibold whitespace-nowrap shadow-sm flex items-center gap-1 sm:gap-1.5 self-start sm:self-auto">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Active
                      </span>
                    </div>

                    {/* Enhanced Project Info Cards - Mobile Optimized */}
                    <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                      <div className="flex items-center text-gray-700 bg-gradient-to-r from-green-50 to-mint/10 p-2 sm:p-3 rounded-xl border border-green-100">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-100 to-green-200 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shadow-sm">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Budget</p>
                          <p className="font-bold text-sm sm:text-base text-gray-800">{formatCurrency(project.budget)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-gray-700 bg-gradient-to-r from-blue-50 to-violet/10 p-2 sm:p-3 rounded-xl border border-blue-100">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shadow-sm">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Freelancer</p>
                          <p className="font-semibold text-sm sm:text-base text-gray-800">{project.freelancer_name}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Mobile Optimized */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 border-2 border-violet text-violet hover:bg-violet hover:text-white rounded-xl font-semibold py-2 transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleProjectClick(project)
                        }}
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Review Milestones
                      </Button>
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleProjectClick(project)
                        }}
                        className="flex-1 border-2 border-mint text-mint hover:bg-mint hover:text-white rounded-xl font-semibold py-2 transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Pay Now
                      </Button>
                    </div>
                  </div>

                  {/* Right Side - Milestone Progress - Mobile Optimized */}
                  <div className="flex-1 lg:min-w-[400px] xl:min-w-[500px]">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-6 border border-gray-200 h-full">
                      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h5 className="text-base sm:text-lg font-bold text-gray-800">Milestone Progress</h5>
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        <ClientMilestoneReview 
                          projectId={project._id}
                          projectTitle={project.title}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Project Detail Modal */}
      {showProjectDetail && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={closeProjectDetail}></div>
          <div className="relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-violet to-purple rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-graphite">
                    Milestone Payment - {selectedProject.title}
                  </h2>
                  <p className="text-sm text-gray-500">Manage payments and milestones for this project</p>
                </div>
              </div>
              <button
                onClick={closeProjectDetail}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center transition-colors duration-200"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6 sm:space-y-8">
              {/* Enhanced Project Summary */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
                <h3 className="text-lg sm:text-xl font-bold text-graphite mb-4">Project Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="flex items-center p-3 sm:p-4 rounded-xl bg-white border border-gray-200">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Total Budget</p>
                      <p className="font-bold text-lg sm:text-xl text-green-700">{formatCurrency(selectedProject.budget)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 sm:p-4 rounded-xl bg-white border border-gray-200">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Freelancer</p>
                      <p className="font-bold text-lg sm:text-xl text-gray-800">{selectedProject.freelancer_name}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Milestone Section */}
              <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg sm:text-xl font-bold text-graphite">Milestone Payments</h3>
                </div>
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
