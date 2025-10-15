import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Button from '../components/Button'
import { projectService } from '../services/projectService'
import { PageShimmer } from '../components/Shimmer'
import { isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'
import { formatBudget } from '../utils/currency'
import confirmationService from '../services/confirmationService.jsx'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
// Escrow components
import CreateEscrowPayment from '../components/CreateEscrowPayment'
import EscrowStatus from '../components/EscrowStatus'
import MilestoneManagement from '../components/MilestoneManagement'
import FreelancerMilestoneTracker from '../components/FreelancerMilestoneTracker'
import ProjectPriceUpdate from '../components/ProjectPriceUpdate'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useComprehensiveTranslation()
  const [userData, setUserData] = useState(null)
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      console.log('ProjectDetail: useEffect running (first time)')
      
      // Check if user is authenticated
      if (!isAuthenticated()) {
        window.location.href = '/login'
        return
      }
      
      // Get user data
      const user = getCurrentUser()
      if (user) {
        setUserData(user)
      }
      
      // Simulate page loading
      const timer = setTimeout(() => {
        setPageLoading(false)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      console.log('ProjectDetail: Skipping duplicate initialization due to StrictMode')
    }
  }, [])

  useEffect(() => {
    if (!pageLoading && id) {
      loadProject()
    }
  }, [pageLoading, id])

  const loadProject = async () => {
    setLoading(true)
    try {
      const response = await projectService.getProjectById(id)
      if (response.status) {
        setProject(response.data)
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to load project' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to load project' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    try {
      // Try confirmation service, fallback to browser confirm if it fails
      let confirmed = false
      try {
        confirmed = await confirmationService.danger(
          'Are you sure you want to delete this project? This action cannot be undone.',
          'Delete Project'
        )
      } catch (confirmError) {
        console.warn('Confirmation service failed, using browser confirm:', confirmError)
        confirmed = window.confirm('Are you sure you want to delete this project? This action cannot be undone.')
      }
      
      if (!confirmed) return
      
      console.log('🗑️ ProjectDetail: Deleting project:', id)
      setIsDeleting(true)   
      setMessage({ type: 'info', text: 'Deleting project...' })
      
      const response = await projectService.deleteProject(id)
      console.log('🗑️ ProjectDetail: Delete response:', response)
      
      if (response.status) {
        setMessage({ type: 'success', text: 'Project deleted successfully' })
        setTimeout(() => {
          navigate('/client/my-projects')
        }, 1500)
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to delete project' })
      }
    } catch (error) {
      console.error('❌ ProjectDetail: Error deleting project:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to delete project' })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCompleteProject = async () => {
    try {
      // Try confirmation service, fallback to browser confirm if it fails
      let confirmed = false
      try {
        confirmed = await confirmationService.confirm(
          'Are you sure you want to mark this project as completed?',
          'Complete Project'
        )
      } catch (confirmError) {
        console.warn('Confirmation service failed, using browser confirm:', confirmError)
        confirmed = window.confirm('Are you sure you want to mark this project as completed?')
      }
      
      if (!confirmed) return
      
      console.log('✅ ProjectDetail: Completing project:', id)
      setIsCompleting(true)
      setMessage({ type: 'info', text: 'Marking project as completed...' })
      
      const response = await projectService.completeProject(id)
      console.log('✅ ProjectDetail: Complete response:', response)
      
      if (response.status) {
        setMessage({ type: 'success', text: 'Project marked as completed' })
        loadProject() // Reload project data
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to complete project' })
      }
    } catch (error) {
      console.error('❌ ProjectDetail: Error completing project:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to complete project' })
    } finally {
      setIsCompleting(false)
    }
  }

  const getStatusBadge = (project) => {
    if (project.iscompleted === 1) {
      return <span className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-lg">✅ Completed</span>
    } else if (project.isactive === 1) {
      return <span className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg">⚡ Active</span>
    } else if (project.ispending === 1) {
      return <span className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-2xl shadow-lg">⏳ Pending</span>
    } else {
      return <span className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-2xl shadow-lg">🔓 Open</span>
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (pageLoading) {
    return <PageShimmer />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet mx-auto mb-4"></div>
          <p className="text-coolgray">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-graphite mb-2">Project Not Found</h2>
          <p className="text-coolgray mb-6">The project you're looking for doesn't exist or has been deleted.</p>
          <Link to="/projects">
            <Button>{t('backToProjects')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-gradient text-white">
      <Header userType={userData?.user_type} userData={userData} onLogout={clearAuth} />
      <div className="max-w-4xl mx-auto px-4 py-8 pt-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Link to="/projects" className="text-white/80 hover:text-white transition-colors duration-300 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Projects
              </Link>
              {getStatusBadge(project)}
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">{project.title}</h1>
            <p className="text-white/80 text-lg">Created by {project.personid?.first_name} {project.personid?.last_name}</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Link to={`/project/edit/${project._id}`}>
              <button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t('editProject')}
              </button>
            </Link>
            {project.isactive === 1 && project.iscompleted === 0 && (
              <button 
                onClick={handleCompleteProject} 
                disabled={isCompleting}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCompleting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                Mark Complete
              </button>
            )}
            <button 
              onClick={handleDeleteProject} 
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              Delete
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.type === 'success' 
              ? 'bg-mint/20 text-mint border border-mint/30' 
              : message.type === 'info'
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-coral/20 text-coral border border-coral/30'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' && <span className="mr-2">✅</span>}
              {message.type === 'info' && <span className="mr-2">⏳</span>}
              {message.type === 'error' && <span className="mr-2">❌</span>}
              {message.text}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-graphite">Project Description</h2>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6">
                <p className="text-coolgray leading-relaxed whitespace-pre-wrap text-lg">{project.description}</p>
              </div>
            </div>

            {/* Skills Required */}
            {project.skills_required && project.skills_required.length > 0 && (
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-graphite">Required Skills</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {project.skills_required.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      {skill.skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Assigned Freelancers */}
            {project.freelancerid && project.freelancerid.length > 0 && (
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-graphite">Assigned Freelancers</h2>
                </div>
                <div className="space-y-4">
                  {project.freelancerid.map((freelancer, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {freelancer.freelancername?.charAt(0) || 'F'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-graphite text-lg">{freelancer.freelancername || 'Unknown'}</p>
                        <p className="text-sm text-coolgray">Freelancer</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Escrow Status */}
            {project.isactive === 1 && (
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <EscrowStatus projectId={project._id} />
              </div>
            )}

            {/* Milestone Management */}
            {project.isactive === 1 && (
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                {userData?.user_type === 'freelancer' ? (
                  <FreelancerMilestoneTracker 
                    projectId={project._id}
                    projectTitle={project.title}
                  />
                ) : (
                  <MilestoneManagement 
                    projectId={project._id}
                    userRole={userData?.user_type || 'client'}
                  />
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Details */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-graphite">Project Details</h2>
              </div>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4">
                  <label className="text-sm font-semibold text-green-600 uppercase tracking-wide">Budget</label>
                  <p className="text-2xl font-bold text-green-700 mt-1">{formatBudget(project.budget)}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4">
                  <label className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Duration</label>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{project.duration} days</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl p-4">
                  <label className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Status</label>
                  <p className="text-2xl font-bold text-purple-700 mt-1 capitalize">{project.status}</p>
                </div>
                {project.bid_deadline && (
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4">
                    <label className="text-sm font-semibold text-orange-600 uppercase tracking-wide">Bid Deadline</label>
                    <p className="text-lg font-bold text-orange-700 mt-1">{formatDate(project.bid_deadline)}</p>
                  </div>
                )}
                {project.min_bid_amount && (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-4">
                    <label className="text-sm font-semibold text-yellow-600 uppercase tracking-wide">Min Bid Amount</label>
                    <p className="text-lg font-bold text-yellow-700 mt-1">{formatBudget(project.min_bid_amount)}</p>
                  </div>
                )}
                {project.max_bid_amount && (
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-4">
                    <label className="text-sm font-semibold text-pink-600 uppercase tracking-wide">Max Bid Amount</label>
                    <p className="text-lg font-bold text-pink-700 mt-1">{formatBudget(project.max_bid_amount)}</p>
                  </div>
                )}
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-4">
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Created</label>
                  <p className="text-lg font-bold text-gray-700 mt-1">{formatDate(project.createdAt)}</p>
                </div>
                {project.completed_at && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-4">
                    <label className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Completed</label>
                    <p className="text-lg font-bold text-emerald-700 mt-1">{formatDate(project.completed_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Escrow Management */}
            {project.isactive === 1 && (
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-graphite">Escrow Management</h2>
                </div>
                <div className="space-y-4">
                  <ProjectPriceUpdate 
                    projectId={project._id}
                    currentAmount={project.budget}
                    onSuccess={(data) => {
                      setProject(prev => ({ ...prev, budget: data.final_amount }));
                    }}
                  />
                  <CreateEscrowPayment 
                    projectId={project._id}
                    onSuccess={() => {
                      // Refresh project data
                      loadProject();
                    }}
                  />
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-graphite">Quick Actions</h2>
              </div>
              <div className="space-y-4">
                <Link to={`/project/edit/${project._id}`} className="block">
                  <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform">
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {t('editProject')}
                    </div>
                  </button>
                </Link>
                {project.isactive === 1 && project.iscompleted === 0 && (
                  <button 
                    onClick={handleCompleteProject} 
                    disabled={isCompleting}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center">
                      {isCompleting ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      ) : (
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {t('markComplete')}
                    </div>
                  </button>
                )}
                <button 
                  onClick={handleDeleteProject} 
                  disabled={isDeleting}
                  className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform disabled:scale-100 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center">
                    {isDeleting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                    {t('deleteProject')}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
