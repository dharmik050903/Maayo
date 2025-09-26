import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import RatingComponent from './RatingComponent'
import ConfirmationModal from './ConfirmationModal'
import NotificationModal from './NotificationModal'
import { useConfirmation, useNotification } from '../hooks/useModal'
import { projectService } from '../services/projectService'
import { skillsService } from '../services/skillsService'
import { reviewService } from '../services/reviewService'
import { bidService } from '../services/bidService'
import { getSafeUrl } from '../utils/urlValidation'
import { formatBudget } from '../utils/currency'
import confirmationService from '../services/confirmationService.jsx'

export default function MyProjects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const hasInitialized = useRef(false)
  
  // Modal hooks
  const { confirmation, showConfirmation, hideConfirmation, setLoading: setConfirmationLoading } = useConfirmation()
  const { notification, showNotification, hideNotification } = useNotification()
  const [statusFilter, setStatusFilter] = useState('all')
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    budget: '',
    duration: '',
    start_date: '',
    end_date: '',
    skills_required: []
  })

  // Skills selection state
  const [availableSkills, setAvailableSkills] = useState([])
  const [selectedEditSkills, setSelectedEditSkills] = useState([])
  const [skillSearch, setSkillSearch] = useState('')

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedProjectForReview, setSelectedProjectForReview] = useState(null)
  const [showBidRequest, setShowBidRequest] = useState(false)   
  const [selectedBid, setSelectedBid] = useState(null);
  const [projectBids, setProjectBids] = useState([])
  const [bidsLoading, setBidsLoading] = useState(false)
  const [bidsError, setBidsError] = useState(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [selectedProjectForRating, setSelectedProjectForRating] = useState(null)
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: '',
    project_id: '',
    freelancer_id: ''
  })
  const [hoveredStar, setHoveredStar] = useState(0)

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
    fetchMyProjects()
    loadSkills()
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

  const fetchMyProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      
      // Get projects for the current client
      const response = await projectService.getClientProjects()
      
      if (response.status && response.data) {
        setProjects(response.data)
      } else {
        setProjects([])
      }
    } catch (error) {
      console.error('Error fetching client projects:', error)
      setError(error.message)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  // Function to determine project status based on database fields
  const getProjectStatus = (project) => {
    if (project.iscompleted === 1) return 'completed'
    if (project.isactive === 1) return 'in_progress'
    if (project.ispending === 1) return 'open'
    if (project.status === 'cancelled') return 'cancelled'
    return 'open' // default
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return '🔓'
      case 'in_progress':
        return '⚡'
      case 'completed':
        return '✅'
      case 'cancelled':
        return '❌'
      default:
        return '📋'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const handleCreateProject = () => {
    navigate('/create-project')
  }

  const handleEditProject = (project) => {
    setSelectedProject(project)
    
    // Calculate start and end dates based on duration
    const duration = project.duration || 0
    const today = new Date()
    const startDate = today.toISOString().split('T')[0]
    const endDate = new Date(today.getTime() + (duration * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
    
    const formData = {
      title: project.title || '',
      description: project.description || '',
      budget: project.budget || '',
      duration: project.duration || '',
      start_date: project.start_date || startDate,
      end_date: project.end_date || endDate,
      skills_required: project.skills_required || []
    }
    
    setEditForm(formData)
    setSelectedEditSkills(project.skills_required || [])
    setSkillSearch('')
    setShowEditModal(true)
  }

  const handleUpdateProject = async () => {
    if (!selectedProject) return

    try {
      const updateData = {
        id: selectedProject._id,
        title: editForm.title,
        description: editForm.description,
        budget: Number(editForm.budget),
        duration: Number(editForm.duration),
        skills_required: selectedEditSkills
      }

      await projectService.updateProject(updateData)
      setShowEditModal(false)
      setSelectedProject(null)
      setEditForm({
        title: '',
        description: '',
        budget: '',
        duration: '',
        start_date: '',
        end_date: '',
        skills_required: []
      })
      setSelectedEditSkills([])
      setSkillSearch('')
      await fetchMyProjects() // Refresh the list
    } catch (error) {
      console.error('Error updating project:', error)
      showNotification({
        title: 'Error',
        message: 'Failed to update project. Please try again.',
        type: 'error'
      })
    }
  }

  const handleFormChange = (field, value) => {
    setProjectForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => {
      const newForm = {
        ...prev,
        [field]: value
      }
      
      // Auto-calculate duration when start_date or end_date changes
      if (field === 'start_date' || field === 'end_date') {
        if (newForm.start_date && newForm.end_date) {
          const startDate = new Date(newForm.start_date)
          const endDate = new Date(newForm.end_date)
          const timeDiff = endDate.getTime() - startDate.getTime()
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
          newForm.duration = daysDiff > 0 ? daysDiff : 1
        }
      }
      
      return newForm
    })
  }

  // Skills management functions
  const handleSkillSearch = (e) => {
    setSkillSearch(e.target.value)
  }

  const addEditSkill = (skill) => {
    if (!selectedEditSkills.find(s => s.skill_id === skill._id)) {
      const newSkill = {
        skill: skill.skill, // Use 'skill' field from database
        skill_id: skill._id
      }
      setSelectedEditSkills([...selectedEditSkills, newSkill])
      setSkillSearch('')
    }
  }

  const removeEditSkill = (skillId) => {
    const updatedSkills = selectedEditSkills.filter(s => s.skill_id !== skillId)
    setSelectedEditSkills(updatedSkills)
  }

  const filteredSkills = availableSkills.filter(skill =>
    skill.skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
    !selectedEditSkills.find(s => s.skill_id === skill._id)
  )

  const handleDeleteProject = async (projectId) => {
    showConfirmation({
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          setConfirmationLoading(true)
      await projectService.deleteProject(projectId)
      await fetchMyProjects() // Refresh the list
          hideConfirmation()
          showNotification({
            title: 'Success',
            message: 'Project deleted successfully!',
            type: 'success'
          })
    } catch (error) {
      console.error('Error deleting project:', error)
          showNotification({
            title: 'Error',
            message: 'Failed to delete project. Please try again.',
            type: 'error'
          })
        } finally {
          setConfirmationLoading(false)
        }
      }
    })
  }

  const handleCompleteProject = async (projectId) => {
    showConfirmation({
      title: 'Complete Project',
      message: 'Are you sure you want to mark this project as completed?',
      type: 'warning',
      confirmText: 'Complete',
      onConfirm: async () => {
        try {
          setConfirmationLoading(true)
          await projectService.completeProject(projectId)
      await fetchMyProjects() // Refresh the list
          hideConfirmation()
          showNotification({
            title: 'Success',
            message: 'Project completed successfully!',
            type: 'success'
          })
    } catch (error) {
      console.error('Error completing project:', error)
          showNotification({
            title: 'Error',
            message: 'Failed to complete project. Please try again.',
            type: 'error'
          })
        } finally {
          setConfirmationLoading(false)
        }
      }
    })
  }

  const handleActivateProject = async (projectId) => {
    showConfirmation({
      title: 'Activate Project',
      message: 'Are you sure you want to activate this project?',
      type: 'info',
      confirmText: 'Activate',
      onConfirm: async () => {
        try {
          setConfirmationLoading(true)
        await projectService.activateProject(projectId)
        await fetchMyProjects() // Refresh the list
          hideConfirmation()
          showNotification({
            title: 'Success',
            message: 'Project activated successfully!',
            type: 'success'
          })
      } catch (error) {
        console.error('Error activating project:', error)
          showNotification({
            title: 'Error',
            message: 'Failed to activate project: ' + error.message,
            type: 'error'
          })
        } finally {
          setConfirmationLoading(false)
        }
      }
    })
  }

  const handleDeactivateProject = async (projectId) => {
    showConfirmation({
      title: 'Deactivate Project',
      message: 'Are you sure you want to deactivate this project?',
      type: 'warning',
      confirmText: 'Deactivate',
      onConfirm: async () => {
        try {
          setConfirmationLoading(true)
        await projectService.deactivateProject(projectId)
        await fetchMyProjects() // Refresh the list
          hideConfirmation()
          showNotification({
            title: 'Success',
            message: 'Project deactivated successfully!',
            type: 'success'
          })
      } catch (error) {
        console.error('Error deactivating project:', error)
          showNotification({
            title: 'Error',
            message: 'Failed to deactivate project: ' + error.message,
            type: 'error'
          })
        } finally {
          setConfirmationLoading(false)
        }
      }
    })
  }

  // Rating functions
  const handleRateProject = (project) => {
    setSelectedProjectForRating(project)
    setShowRatingModal(true)
  }

  const handleRatingSubmitted = (ratingData) => {
    setShowRatingModal(false)
    setSelectedProjectForRating(null)
    // Refresh projects to show updated data
    fetchMyProjects()
  }

  // Review functions
  const handleReviewProject = (project) => {
    setSelectedProjectForReview(project)
    setReviewForm({
      rating: 0,
      comment: '',
      project_id: project._id,
      freelancer_id: project.freelancer_id || '' // This should be set when project is completed
    })
    setHoveredStar(0)
    setShowReviewModal(true)
  }

  const handleReviewFormChange = (field, value) => {
    setReviewForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmitReview = async () => {
    if (reviewForm.rating === 0) {
      showNotification({
        title: 'Validation Error',
        message: 'Please select a rating.',
        type: 'warning'
      })
      return
    }

    if (!reviewForm.comment.trim()) {
      showNotification({
        title: 'Validation Error',
        message: 'Please enter a review comment.',
        type: 'warning'
      })
      return
    }


const handleViewBidRequests = async (project) => {
  try {
    setBidsLoading(true)
    setBidsError(null)
    setSelectedBid(project)
    
    const response = await bidService.getProjectBids(project._id)
    
    if (response.status && response.data) {
      setProjectBids(response.data)
    } else {
      setProjectBids([])
    }
    
    setShowBidRequest(true)
  } catch (error) {
    console.error('Error fetching project bids:', error)
    setBidsError(error.message || 'Failed to fetch bids')
    setProjectBids([])
    setShowBidRequest(true)
  } finally {
    setBidsLoading(false)
  }
};

const handleCloseBidRequest = () => {
  setShowBidRequest(false);
  setSelectedBid(null);
  setProjectBids([]);
  setBidsError(null);
};

// Get the freelancer ID from the project data
    let freelancerId = null
    if (selectedProjectForReview?.freelancerid && Array.isArray(selectedProjectForReview.freelancerid) && selectedProjectForReview.freelancerid.length > 0) {
      freelancerId = selectedProjectForReview.freelancerid[0]?.freelancerid
    } else if (selectedProjectForReview?.freelancerid) {
      freelancerId = selectedProjectForReview.freelancerid.freelancerid || selectedProjectForReview.freelancerid
    }

    if (!freelancerId) {
      showNotification({
        title: 'Cannot Submit Review',
        message: 'This project does not have a freelancer assigned yet. Reviews can only be submitted for projects with assigned freelancers.',
        type: 'warning'
      })
      return
    }

    try {
      const reviewData = {
        project_id: reviewForm.project_id,
        reviewee_id: freelancerId,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim()
      }
      
      
      await reviewService.createReview(reviewData)
      setShowReviewModal(false)
      setSelectedProjectForReview(null)
      setReviewForm({
        rating: 0,
        comment: '',
        project_id: '',
        freelancer_id: ''
      })
      setHoveredStar(0)
      showNotification({
        title: 'Success',
        message: 'Review submitted successfully!',
        type: 'success'
      })
    } catch (error) {
      console.error('Error submitting review:', error)
      showNotification({
        title: 'Error',
        message: `Failed to submit review: ${error.message}`,
        type: 'error'
      })
    }
  }

  const filteredProjects = projects.filter(project => {
    if (statusFilter === 'all') return true
    
    // Handle different status filters based on database fields
    switch (statusFilter) {
      case 'open':
        return project.ispending === 1 && project.isactive === 0 && project.iscompleted === 0
      case 'in_progress':
        return project.isactive === 1 && project.iscompleted === 0
      case 'completed':
        const isCompleted = project.iscompleted === 1
        return isCompleted
      case 'cancelled':
        return project.status === 'cancelled'
      default:
        return project.status === statusFilter
    }
  })

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint mx-auto mb-4"></div>
        <p className="text-white/70">Loading your projects...</p>
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
            <p className="font-semibold">Error loading projects</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchMyProjects}
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            My <span className="text-mint">Projects</span>
          </h2>
          <p className="text-white/80">
            {projects.length} project{projects.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white/95 text-graphite rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent border-0"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button
            variant="accent"
            size="sm"
            onClick={handleCreateProject}
            className="px-6"
          >
            Create Project
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMyProjects}
            className="border-white text-white hover:bg-white hover:text-graphite"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-white/70">
          <svg className="w-16 h-16 mx-auto mb-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">No Projects Yet</h3>
          <p className="text-white/80 mb-4">You haven't created any projects yet.</p>
          <p className="text-sm text-white/60 mb-6">Create your first project to get started!</p>
          <Button
            variant="accent"
            onClick={handleCreateProject}
            className="px-8"
          >
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProjects.map((project) => (
            <div key={project._id} className="card p-6 bg-white/95 hover:bg-white transition-colors">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <h4 className="text-xl font-semibold text-graphite">
                      {project.title}
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(getProjectStatus(project))}`}>
                      {getStatusIcon(getProjectStatus(project))} {getProjectStatus(project).charAt(0).toUpperCase() + getProjectStatus(project).slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <div>
                        <p className="text-sm text-coolgray">Budget</p>
                        <p className="font-semibold text-graphite">{formatCurrency(project.budget)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-coolgray">Duration</p>
                        <p className="font-semibold text-graphite">{project.duration} days</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-coolgray">Bids</p>
                        <p className="font-semibold text-graphite">{project.bid_count || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h5 className="font-semibold text-graphite mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Project Description
                    </h5>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-coolgray text-sm leading-relaxed line-clamp-3">{project.description}</p>
                    </div>
                  </div>

                  {project.skills_required && project.skills_required.length > 0 && (
                    <div className="mb-6">
                      <h5 className="font-semibold text-graphite mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Required Skills
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {project.skills_required.map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-violet/10 text-violet rounded-full text-sm">
                            {skill.skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center text-xs text-coolgray bg-gray-50 p-3 rounded-lg">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Created: {formatDate(project.createdAt)}</span>
                    {project.completed_at && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Completed: {formatDate(project.completed_at)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 min-w-[200px]">
                  
                  {/* Always show Edit button for all projects */}
                  <Button variant="accent" size="sm" onClick={() => handleEditProject(project)} className="flex-1 min-w-[120px]">
                    Edit Project
                  </Button>
                  
                  {getProjectStatus(project) === 'open' && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleViewBidRequests(project)} className="flex-1 min-w-[120px] border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
                        View Bids ({project.bid_count || 0})
                      </Button>
                      <Button variant="success" size="sm" onClick={() => handleActivateProject(project._id)} className="flex-1 min-w-[120px]">
                        Activate Project
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteProject(project._id)} className="flex-1 min-w-[120px] border-coral text-coral hover:bg-coral hover:text-white">
                        Delete Project
                      </Button>
                    </>
                  )}
                  {getProjectStatus(project) === 'in_progress' && (
                    <>
                      <Button variant="accent" size="sm" onClick={() => handleCompleteProject(project._id)} className="flex-1 min-w-[120px]">
                        Mark Complete
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeactivateProject(project._id)} className="flex-1 min-w-[120px] border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                        Deactivate Project
                      </Button>
                    </>
                  )}
                  {getProjectStatus(project) === 'completed' && (
                    <div className="flex flex-wrap gap-2 w-full">
                      <div className="bg-gradient-to-r from-green-50 to-mint/10 border border-green-200 rounded-lg p-3 w-full mb-2">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                            <span className="text-green-600 text-sm">🎉</span>
                          </div>
                          <p className="text-green-800 font-semibold text-xs">Project Completed!</p>
                        </div>
                      </div>
                      <Button 
                        variant="accent" 
                        size="sm" 
                        onClick={() => handleRateProject(project)} 
                        className="flex-1 min-w-[120px]"
                      >
                        ⭐ Rate Project
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Edit Project Modal */}
      {showEditModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-graphite">Edit Project</h3>
              <button onClick={() => { setShowEditModal(false); setSelectedProject(null); }} className="text-coolgray hover:text-graphite transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateProject(); }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-graphite mb-2">Project Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => handleEditFormChange('title', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent text-graphite"
                  placeholder="Enter project title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-graphite mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => handleEditFormChange('description', e.target.value)}
                  className="text-graphite w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent h-32 resize-none"
                  placeholder="Describe your project requirements"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Budget ($)</label>
                  <input
                    type="number"
                    value={editForm.budget}
                    onChange={(e) => handleEditFormChange('budget', e.target.value)}
                    className="text-graphite w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent"
                    placeholder="Enter budget"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Project Duration</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={editForm.start_date || ''}
                      onChange={(e) => handleEditFormChange('start_date', e.target.value)}
                      className="text-graphite w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent"
                      placeholder="Start Date"
                    />
                    <span className="flex items-center text-gray-500">to</span>
                    <input
                      type="date"
                      value={editForm.end_date || ''}
                      onChange={(e) => handleEditFormChange('end_date', e.target.value)}
                      className="text-graphite w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent"
                      placeholder="End Date"
                    />
                  </div>
                  <div className="mt-2">
                    <input
                      type="number"
                      value={editForm.duration}
                      onChange={(e) => handleEditFormChange('duration', e.target.value)}
                      className="text-graphite w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent"
                      placeholder="Duration in days (auto-calculated)"
                      min="1"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">Duration will be calculated automatically based on start and end dates</p>
                  </div>
                </div>
              </div>


              <div>
                <label className="block text-sm font-medium text-graphite mb-2">Required Skills</label>
                
                <div className="space-y-3">
                  {/* Selected Skills - Show BEFORE search box */}
                  {selectedEditSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedEditSkills.map(skill => (
                        <span
                          key={skill.skill_id}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-mint/10 text-mint border border-mint/20"
                        >
                          {skill.skill}
                          <button
                            type="button"
                            onClick={() => removeEditSkill(skill.skill_id)}
                            className="ml-2 text-mint/60 hover:text-mint"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Search Box */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search and add skills..."
                      value={skillSearch}
                      onChange={handleSkillSearch}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent text-graphite"
                    />
                    {skillSearch && filteredSkills.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-auto">
                        {filteredSkills.slice(0, 5).map(skill => (
                          <div
                            key={skill._id}
                            onClick={() => addEditSkill(skill)}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm text-graphite"
                          >
                            {skill.skill}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => { setShowEditModal(false); setSelectedProject(null); }} 
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button variant="accent" type="submit" className="px-8">
                  Update Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedProjectForReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-graphite">Write Review</h3>
              <button 
                onClick={() => { 
                  setShowReviewModal(false); 
                  setSelectedProjectForReview(null); 
                  setHoveredStar(0);
                }} 
                className="text-coolgray hover:text-graphite transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-graphite mb-2">Project</label>
                <p className="text-graphite font-semibold">{selectedProjectForReview.title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-graphite mb-2">
                  Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleReviewFormChange('rating', star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="text-3xl transition-colors p-1"
                    >
                      <span className={`transition-colors ${
                        reviewForm.rating > 0 && star <= reviewForm.rating ? 'text-yellow-400' : 
                        star <= hoveredStar ? 'text-yellow-200' : 'text-gray-300'
                      }`}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {reviewForm.rating === 0 && 'Please select a rating'}
                  {reviewForm.rating === 1 && 'Poor'}
                  {reviewForm.rating === 2 && 'Fair'}
                  {reviewForm.rating === 3 && 'Good'}
                  {reviewForm.rating === 4 && 'Very Good'}
                  {reviewForm.rating === 5 && 'Excellent'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-graphite mb-2">
                  Review Comment <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => handleReviewFormChange('comment', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent text-graphite h-32 resize-none"
                  placeholder="Share your experience with this project..."
                  required
                />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => { 
                    setShowReviewModal(false); 
                    setSelectedProjectForReview(null); 
                    setHoveredStar(0);
                  }} 
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  variant="accent" 
                  onClick={handleSubmitReview}
                  className="px-8"
                >
                  Submit Review
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bid Request Modal */}
      {showBidRequest && selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-graphite">Bid Requests for "{selectedBid.title}"</h3>
              <button 
                onClick={handleCloseBidRequest}
                className="text-coolgray hover:text-graphite transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Project Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-graphite mb-2">{selectedBid.title}</h4>
                <p className="text-coolgray text-sm mb-3">{selectedBid.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-mint font-medium">Budget: {formatBudget(selectedBid.budget)}</span>
                  <span className="text-violet font-medium">Duration: {selectedBid.duration} days</span>
                  <span className="text-coral font-medium">Bids: {projectBids.length}</span>
                </div>
              </div>

              {/* Loading State */}
              {bidsLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint mx-auto mb-4"></div>
                  <p className="text-coolgray">Loading bids...</p>
                  </div>
              )}

              {/* Error State */}
              {bidsError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-semibold">Error loading bids</p>
                      <p className="text-sm">{bidsError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* No Bids State */}
              {!bidsLoading && !bidsError && projectBids.length === 0 && (
                <div className="text-center py-12 text-coolgray">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-graphite mb-2">No Bids Yet</h3>
                  <p className="text-coolgray">This project hasn't received any bids yet.</p>
                </div>
              )}

              {/* Bids List */}
              {!bidsLoading && !bidsError && projectBids.length > 0 && (
                <div className="space-y-4">
                  <h5 className="text-lg font-semibold text-graphite">Received Bids ({projectBids.length})</h5>
                  {projectBids.map((bid) => (
                    <div key={bid._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                            <h6 className="text-lg font-semibold text-graphite">
                              {bid.freelancer_id?.first_name && bid.freelancer_id?.last_name 
                                ? `${bid.freelancer_id.first_name} ${bid.freelancer_id.last_name}`
                                : 'Unknown Freelancer'
                              }
                            </h6>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              bid.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                              {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                      </span>
                  </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              <div>
                                <p className="text-sm text-coolgray">Bid Amount</p>
                                <p className="font-semibold text-mint">{formatBudget(bid.bid_amount)}</p>
                </div>
              </div>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                <div>
                                <p className="text-sm text-coolgray">Duration</p>
                                <p className="font-semibold text-violet">{bid.proposed_duration} days</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <div>
                                <p className="text-sm text-coolgray">Availability</p>
                                <p className="font-semibold text-coral">{bid.availability_hours || 40}h/week</p>
                              </div>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h6 className="font-semibold text-graphite mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-2 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Cover Letter
                            </h6>
                  <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-coolgray text-sm leading-relaxed line-clamp-3">{bid.cover_letter}</p>
                            </div>
                          </div>

                          {/* Resume and Portfolio Links */}
                          {bid.freelancer_info && (bid.freelancer_info.resume_link || bid.freelancer_info.github_link) && (
                            <div className="mb-4">
                              <h6 className="font-semibold text-graphite mb-2 flex items-center">
                                <svg className="w-4 h-4 mr-2 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                Documents & Links
                              </h6>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="space-y-2">
                                  {bid.freelancer_info.resume_link && (
                                    <div className="flex items-center">
                                      <svg className="w-4 h-4 mr-2 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <a 
                                        href={getSafeUrl(bid.freelancer_info.resume_link)} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-coral hover:text-coral/80 underline text-sm"
                                      >
                                        View Resume
                                      </a>
                                    </div>
                                  )}
                                  {bid.freelancer_info.github_link && (
                                    <div className="flex items-center">
                                      <svg className="w-4 h-4 mr-2 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                      </svg>
                                      <a 
                                        href={getSafeUrl(bid.freelancer_info.github_link)} 
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
                </div>
              )}

                          <div className="flex items-center text-xs text-coolgray bg-gray-50 p-3 rounded-lg">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Submitted: {new Date(bid.createdAt).toLocaleDateString()}</span>
                            {bid.freelancer_id?.email && (
                              <>
                                <span className="mx-2">•</span>
                                <span>Email: {bid.freelancer_id.email}</span>
                              </>
                            )}
                          </div>
                        </div>

              {/* Action Buttons */}
                        {bid.status === 'pending' && (
                          <div className="flex flex-col gap-2 min-w-[200px]">
                    <Button 
                      variant="success" 
                              size="sm" 
                              onClick={async () => {
                                try {
                                  const response = await bidService.acceptBid(bid._id);
                                  if (response.status) {
                                    showNotification({
                                      title: 'Success',
                                      message: 'Bid accepted successfully!',
                                      type: 'success'
                                    });
                                    // Refresh the bids list
                                    handleViewBidRequests(selectedBid);
                                  } else {
                                    showNotification({
                                      title: 'Error',
                                      message: response.message || 'Failed to accept bid',
                                      type: 'error'
                                    });
                                  }
                                } catch (error) {
                                  console.error('Error accepting bid:', error);
                                  showNotification({
                                    title: 'Error',
                                    message: 'Failed to accept bid: ' + error.message,
                                    type: 'error'
                                  });
                                }
                              }}
                              className="w-full"
                    >
                      Accept Bid
                    </Button>
                    <Button 
                      variant="outline" 
                              size="sm" 
                              onClick={async () => {
                                try {
                                  const rejectMessage = prompt('Enter rejection reason (optional):');
                                  const response = await bidService.rejectBid(bid._id, rejectMessage || '');
                                  if (response.status) {
                                    showNotification({
                                      title: 'Success',
                                      message: 'Bid rejected successfully!',
                                      type: 'success'
                                    });
                                    // Refresh the bids list
                                    handleViewBidRequests(selectedBid);
                                  } else {
                                    showNotification({
                                      title: 'Error',
                                      message: response.message || 'Failed to reject bid',
                                      type: 'error'
                                    });
                                  }
                                } catch (error) {
                                  console.error('Error rejecting bid:', error);
                                  showNotification({
                                    title: 'Error',
                                    message: 'Failed to reject bid: ' + error.message,
                                    type: 'error'
                                  });
                                }
                              }}
                              className="w-full border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Reject Bid
                    </Button>
                          </div>
                )}
              </div>
            </div>
                  ))}
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleCloseBidRequest}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      <RatingComponent
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        projectId={selectedProjectForRating?._id}
        freelancerId={selectedProjectForRating?.freelancerid}
        onRatingSubmitted={handleRatingSubmitted}
      />

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
    </div>
  )
}