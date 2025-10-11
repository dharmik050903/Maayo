import React, { useState, useEffect } from 'react'
import { getFreelancerBidsCached } from '../services/cachedApiService'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
import Button from './Button'
import ClientMilestoneReview from './ClientMilestoneReview'
import FreelancerMilestoneTracker from './FreelancerMilestoneTracker'

export default function FreelancerProjects() {
  const { t } = useComprehensiveTranslation()
  const [acceptedProjects, setAcceptedProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [showProjectDetail, setShowProjectDetail] = useState(false)

  useEffect(() => {
    fetchAcceptedProjects()
  }, [])

  const fetchAcceptedProjects = async () => {
    try {
      console.log('🔄 FreelancerProjects: Fetching accepted projects...')
      console.log('🔍 FreelancerProjects: Checking authentication...')
      
      // Check authentication before making API call
      const authHeaders = JSON.parse(localStorage.getItem('authHeaders') || '{}')
      console.log('🔍 FreelancerProjects: Auth headers:', {
        hasToken: !!authHeaders.token,
        userId: authHeaders._id,
        userRole: authHeaders.userRole,
        userEmail: authHeaders.userEmail
      })
      
      if (!authHeaders.token) {
        throw new Error('No authentication found. Please log in again.')
      }
      
      setLoading(true)
      setError(null)
      
      const response = await getFreelancerBidsCached()
      console.log('📊 FreelancerProjects: Bids response:', response)
      
      if (response.status && response.data) {
        // Filter only accepted bids (projects the freelancer is working on)
        const acceptedBids = response.data.filter(bid => 
          bid.status === 'accepted' || bid.status === 'acceptedbid' 
        )
        
        const projects = acceptedBids.map(bid => ({
          _id: bid.project_id?._id || bid.project_id,
          bidId: bid._id,
          title: bid.project_id?.title || bid.project_title || 'Untitled Project',
          budget: bid.project_id?.budget || bid.bid_amount || 0,
          client_name: bid.client_name || 'Unknown Client',
          status: 'active',
          milestones: bid.milestones || [],
          accepted_at: bid.updatedAt || bid.createdAt,
          isactive: bid.project_id?.isactive || true
        }))
        
        console.log('✅ FreelancerProjects: Accepted projects found:', projects.length)
        setAcceptedProjects(projects)
      } else {
        console.log('⚠️ FreelancerProjects: No accepted bids found')
        setAcceptedProjects([])
      }
    } catch (error) {
      console.error('❌ FreelancerProjects: Error fetching accepted projects:', error)
      setError(error.message)
      setAcceptedProjects([])
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
    console.log('FreelancerProjects: Opening project details for:', project.title)
    setSelectedProject(project)
    setShowProjectDetail(true)
  }

  const closeProjectDetail = () => {
    setShowProjectDetail(false)
    setSelectedProject(null)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint mx-auto mb-4"></div>
        <p className="text-white/70">Loading your accepted projects...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 max-w-2xl mx-auto">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1  1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold">Error loading projects</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchAcceptedProjects}
          className="mt-3 px-6 py-3 bg-violet text-white rounded-[1.5rem] hover:bg-violet/90 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet/20 via-purple/20 to-mint/20 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-violet/10 to-mint/10 opacity-50"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-violet to-mint rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">
                    My <span className="text-transparent bg-clip-text bg-gradient-to-r from-mint to-violet">Projects</span>
                  </h2>
                  <p className="text-white/90 text-lg">
                    Track your accepted projects and milestone progress
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-semibold">{acceptedProjects.length} Active Projects</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Real-time Updates</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={fetchAcceptedProjects}
                disabled={loading}
                className="px-8 py-4 border-2 border-white/30 bg-white/10 text-white hover:bg-white hover:text-violet hover:border-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 backdrop-blur-sm"
              >
                <svg 
                  className={`w-5 h-5 mr-2 transition-transform duration-300 ${loading ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Empty State */}
      {acceptedProjects.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-12 text-center border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-violet/5 to-mint/5"></div>
          <div className="relative z-10">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-violet/20 to-mint/20 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">No Accepted Projects Yet</h3>
            <p className="text-gray-600 mb-6 text-lg max-w-md mx-auto">You haven't been accepted for any projects yet. Keep bidding on projects to get accepted!</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="accent" className="px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse Projects
              </Button>
              <Button variant="outline" className="px-8 py-4 border-2 border-violet text-violet hover:bg-violet hover:text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Submit New Bid
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {acceptedProjects.map((project) => (
            <div key={project._id} className="group relative overflow-hidden bg-white/95 hover:bg-white transition-all duration-500 cursor-pointer rounded-3xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 border border-white/20 backdrop-blur-sm">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet/5 to-mint/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10 p-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1 mr-4">
                    <h4 className="text-2xl font-bold text-graphite mb-2 group-hover:text-violet transition-colors duration-300">
                      {project.title}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Accepted {new Date(project.accepted_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-4 py-2 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-2xl text-sm font-semibold whitespace-nowrap shadow-sm flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Active
                    </span>
                  </div>
                </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center text-gray-700 bg-gradient-to-r from-green-50 to-mint/10 p-3 rounded-2xl">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Budget</p>
                    <p className="font-bold text-lg text-gray-800">{formatCurrency(project.budget)}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-700 bg-gradient-to-r from-blue-50 to-violet/10 p-3 rounded-2xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7h.01M20 7h.01m.01 0v6l-8-3.5L4 13V7h.01z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Client</p>
                    <p className="font-semibold text-gray-800">{project.client_name}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-700 bg-gradient-to-r from-purple-50 to-coral/10 p-3 rounded-2xl">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 0h4m-4 0H8m4 0h4m-4 8v4m0-8v8" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Milestones</p>
                    <p className="font-semibold text-gray-800">{project.milestones?.length || 0} milestones</p>
                  </div>
                </div>
              </div>

              {/* Quick Milestone Preview */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <FreelancerMilestoneTracker 
                  projectId={project._id}
                  projectTitle={project.title}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 px-6 py-4 border-2 border-mint text-mint hover:bg-mint hover:text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  onClick={() => handleProjectClick(project)}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.269-2.943-9.542-7z" />
                  </svg>
                  View Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleProjectClick(project)}
                  className="px-6 py-4 border-2 border-violet text-violet hover:bg-violet hover:text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Update Progress
                </Button>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Detail Modal */}
      {showProjectDetail && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50 bg-blur-sm" onClick={closeProjectDetail}></div>
          <div className="relative bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-graphite">
                {selectedProject.title}
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
                  <span className="font-semibold text-coolgray">Budget:</span>
                  <span className="ml-2 font-bold text-graphite">{formatCurrency(selectedProject.budget)}</span>
                </div>
                <div>
                  <span className="font-semibold text-coolgray">Client:</span>
                  <span className="ml-2 font-bold text-graphite">{selectedProject.client_name}</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-graphite mb-3">Milestone Progress</h3>
                <FreelancerMilestoneTracker 
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
