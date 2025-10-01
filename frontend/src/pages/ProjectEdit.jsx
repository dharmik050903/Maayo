import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import ProjectForm from '../components/ProjectForm'
import { projectService } from '../services/projectService'
import { PageShimmer } from '../components/Shimmer'
import { isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'

export default function ProjectEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(true)
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      console.log('ProjectEdit: useEffect running (first time)')
      
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
      console.log('ProjectEdit: Skipping duplicate initialization due to StrictMode')
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
        navigate('/projects')
      }
    } catch (error) {
      console.error('Error loading project:', error)
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = (updatedProject) => {
    // Redirect to project detail page
    navigate(`/project/${id}`)
  }

  const handleCancel = () => {
    // Go back to project detail page
    navigate(`/project/${id}`)
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
          <p className="text-coolgray mb-6">The project you're trying to edit doesn't exist.</p>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-violet text-white rounded-md hover:bg-violet/90"
          >
            Back to Projects
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-gradient text-white">
      <Header userType={userData?.user_type} userData={userData} onLogout={clearAuth} />
      <div className="max-w-4xl mx-auto px-4 py-8 pt-20">
        <ProjectForm
          project={project}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
