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
    const confirmed = await confirmationService.danger(
      'Are you sure you want to delete this project? This action cannot be undone.',
      'Delete Project'
    )
    if (!confirmed) return
    
    try {
      const response = await projectService.deleteProject(id)
      if (response.status) {
        setMessage({ type: 'success', text: 'Project deleted successfully' })
        setTimeout(() => {
          navigate('/projects')
        }, 1500)
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to delete project' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete project' })
    }
  }

  const handleCompleteProject = async () => {
    const confirmed = await confirmationService.confirm(
      'Are you sure you want to mark this project as completed?',
      'Complete Project'
    )
    if (!confirmed) return
    
    try {
      const response = await projectService.completeProject(id)
      if (response.status) {
        setMessage({ type: 'success', text: 'Project marked as completed' })
        loadProject() // Reload project data
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to complete project' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to complete project' })
    }
  }

  const getStatusBadge = (project) => {
    if (project.iscompleted === 1) {
      return <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">Completed</span>
    } else if (project.isactive === 1) {
      return <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">Active</span>
    } else if (project.ispending === 1) {
      return <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
    } else {
      return <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">Open</span>
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
              <Link to="/projects" className="text-white/80 hover:text-white">
                ← Back to Projects
              </Link>
              {getStatusBadge(project)}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{project.title}</h1>
            <p className="text-white/80">Created by {project.personid?.first_name} {project.personid?.last_name}</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Link to={`/project/edit/${project._id}`}>
              <Button variant="secondary">{t('editProject')}</Button>
            </Link>
            {project.isactive === 1 && project.iscompleted === 0 && (
              <Button onClick={handleCompleteProject} variant="accent">
                Mark Complete
              </Button>
            )}
            <Button onClick={handleDeleteProject} variant="danger">
              Delete
            </Button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.type === 'success' 
              ? 'bg-mint/20 text-mint border border-mint/30' 
              : 'bg-coral/20 text-coral border border-coral/30'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="card p-6 bg-white/95 backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-graphite mb-4">Project Description</h2>
              <p className="text-coolgray leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </div>

            {/* Skills Required */}
            {project.skills_required && project.skills_required.length > 0 && (
              <div className="card p-6 bg-white/95 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-graphite mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {project.skills_required.map((skill, index) => (
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

            {/* Assigned Freelancers */}
            {project.freelancerid && project.freelancerid.length > 0 && (
              <div className="card p-6 bg-white/95 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-graphite mb-4">Assigned Freelancers</h2>
                <div className="space-y-3">
                  {project.freelancerid.map((freelancer, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-violet/10 rounded-full flex items-center justify-center">
                        <span className="text-violet font-semibold">
                          {freelancer.freelancername?.charAt(0) || 'F'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-graphite">{freelancer.freelancername || 'Unknown'}</p>
                        <p className="text-sm text-coolgray">Freelancer</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Escrow Status */}
            {project.isactive === 1 && (
              <div className="card p-6 bg-white/95 backdrop-blur-sm">
                <EscrowStatus projectId={project._id} />
              </div>
            )}

            {/* Milestone Management */}
            {project.isactive === 1 && (
              <div className="card p-6 bg-white/95 backdrop-blur-sm">
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
            <div className="card p-6 bg-white/95 backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-graphite mb-4">Project Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-coolgray">Budget</label>
                  <p className="text-lg font-semibold text-graphite">{formatBudget(project.budget)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-coolgray">Duration</label>
                  <p className="text-lg font-semibold text-graphite">{project.duration} days</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-coolgray">Status</label>
                  <p className="text-lg font-semibold text-graphite">{project.status}</p>
                </div>
                {project.bid_deadline && (
                  <div>
                    <label className="text-sm font-medium text-coolgray">Bid Deadline</label>
                    <p className="text-lg font-semibold text-graphite">{formatDate(project.bid_deadline)}</p>
                  </div>
                )}
                {project.min_bid_amount && (
                  <div>
                    <label className="text-sm font-medium text-coolgray">Min Bid Amount</label>
                    <p className="text-lg font-semibold text-graphite">{formatBudget(project.min_bid_amount)}</p>
                  </div>
                )}
                {project.max_bid_amount && (
                  <div>
                    <label className="text-sm font-medium text-coolgray">Max Bid Amount</label>
                    <p className="text-lg font-semibold text-graphite">{formatBudget(project.max_bid_amount)}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-coolgray">Created</label>
                  <p className="text-lg font-semibold text-graphite">{formatDate(project.createdAt)}</p>
                </div>
                {project.completed_at && (
                  <div>
                    <label className="text-sm font-medium text-coolgray">Completed</label>
                    <p className="text-lg font-semibold text-graphite">{formatDate(project.completed_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Escrow Management */}
            {project.isactive === 1 && (
              <div className="card p-6 bg-white/95 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-graphite mb-4">Escrow Management</h2>
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
            <div className="card p-6 bg-white/95 backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-graphite mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link to={`/project/edit/${project._id}`} className="block">
                  <Button variant="secondary" className="w-full">{t('editProject')}</Button>
                </Link>
                {project.isactive === 1 && project.iscompleted === 0 && (
                  <Button onClick={handleCompleteProject} variant="accent" className="w-full">
                    {t('markComplete')}
                  </Button>
                )}
                <Button onClick={handleDeleteProject} variant="danger" className="w-full">
                  {t('deleteProject')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
