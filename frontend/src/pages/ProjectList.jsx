import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Button from '../components/Button'
import { projectService } from '../services/projectService'
import { PageShimmer } from '../components/Shimmer'
import { isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'
import confirmationService from '../services/confirmationService.jsx'

export default function ProjectList() {
  const [userData, setUserData] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    ispending: '',
    isactive: '',
    iscompleted: '',
    page: 1,
    limit: 12
  })
  const [pagination, setPagination] = useState({})
  const [message, setMessage] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      console.log('ProjectList: useEffect running (first time)')
      
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
      console.log('ProjectList: Skipping duplicate initialization due to StrictMode')
    }
  }, [])

  useEffect(() => {
    if (!pageLoading) {
      loadProjects()
    }
  }, [pageLoading, filters])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const response = await projectService.getClientProjects()
      if (response.status) {
        setProjects(response.data || [])
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to load projects' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to load projects' })
    } finally {
      setLoading(false)
    }
  }

  // Update pagination when filters or projects change
  useEffect(() => {
    if (projects.length > 0) {
      const filtered = getFilteredProjects()
      setPagination({
        total: filtered.length,
        limit: filters.limit,
        page: filters.page,
        totalPages: Math.ceil(filtered.length / filters.limit)
      })
    }
  }, [projects, filters])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }))
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }))
  }

  const handleDeleteProject = async (projectId) => {
    const confirmed = await confirmationService.confirm(
      'Are you sure you want to delete this project?',
      'Delete Project'
    )
    if (!confirmed) return
    
    try {
      const response = await projectService.deleteProject(projectId)
      if (response.status) {
        setMessage({ type: 'success', text: 'Project deleted successfully' })
        loadProjects() // Reload projects
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to delete project' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete project' })
    }
  }

  const handleCompleteProject = async (projectId) => {
    const confirmed = await confirmationService.confirm(
      'Are you sure you want to mark this project as completed?',
      'Complete Project'
    )
    if (!confirmed) return
    
    try {
      const response = await projectService.completeProject(projectId)
      if (response.status) {
        setMessage({ type: 'success', text: 'Project marked as completed' })
        loadProjects() // Reload projects
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to complete project' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to complete project' })
    }
  }

  const getFilteredProjects = () => {
    let filtered = projects

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(project => {
        if (filters.status === 'open') return project.isactive === 1 && project.iscompleted === 0
        if (filters.status === 'in_progress') return project.isactive === 1 && project.ispending === 1
        if (filters.status === 'completed') return project.iscompleted === 1
        return true
      })
    }

    // Apply pending filter
    if (filters.ispending !== '') {
      filtered = filtered.filter(project => project.ispending === parseInt(filters.ispending))
    }

    // Apply active filter
    if (filters.isactive !== '') {
      filtered = filtered.filter(project => project.isactive === parseInt(filters.isactive))
    }

    // Apply completed filter
    if (filters.iscompleted !== '') {
      filtered = filtered.filter(project => project.iscompleted === parseInt(filters.iscompleted))
    }

    return filtered
  }

  const getPaginatedProjects = () => {
    const filtered = getFilteredProjects()
    const startIndex = (filters.page - 1) * filters.limit
    const endIndex = startIndex + filters.limit
    return filtered.slice(startIndex, endIndex)
  }

  const getStatusBadge = (project) => {
    if (project.iscompleted === 1) {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Completed</span>
    } else if (project.isactive === 1) {
      return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Active</span>
    } else if (project.ispending === 1) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
    } else {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Open</span>
    }
  }

  if (pageLoading) {
    return <PageShimmer />
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-gradient text-white">
      <Header userType={userData?.user_type} userData={userData} onLogout={clearAuth} />
      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Projects</h1>
            <p className="text-white/80 mt-1">
              {loading ? 'Loading projects...' : `${getFilteredProjects().length} project${getFilteredProjects().length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link to="/project/create">
              <Button>Create New Project</Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Filters</h2>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-white text-white hover:bg-white hover:text-graphite"
            >
              <svg className={`w-5 h-5 mr-2 transition-transform duration-300 ${showFilters ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
          
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showFilters 
              ? 'max-h-[300px] opacity-100 mb-6' 
              : 'max-h-0 opacity-0 mb-0'
          }`}>
            <div className="card p-6 bg-white/95 backdrop-blur-sm">
              <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 transition-all duration-500 delay-100 ${
                showFilters ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Type</label>
              <select
                value={filters.ispending}
                onChange={(e) => handleFilterChange('ispending', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet"
              >
                <option value="">All Types</option>
                <option value="1">Pending</option>
                <option value="0">Not Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Active</label>
              <select
                value={filters.isactive}
                onChange={(e) => handleFilterChange('isactive', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet"
              >
                <option value="">All</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Completed</label>
              <select
                value={filters.iscompleted}
                onChange={(e) => handleFilterChange('iscompleted', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet"
              >
                <option value="">All</option>
                <option value="1">Completed</option>
                <option value="0">Not Completed</option>
              </select>
            </div>
              </div>
            </div>
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

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="card p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : getPaginatedProjects().length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getPaginatedProjects().map((project) => (
              <div key={project._id} className="card p-6 hover:shadow-lg transition-shadow bg-white/95 backdrop-blur-sm">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-graphite line-clamp-2">
                    {project.title}
                  </h3>
                  {getStatusBadge(project)}
                </div>
                
                <p className="text-coolgray text-sm mb-4 line-clamp-3">
                  {project.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-coolgray">Budget:</span>
                    <span className="font-medium text-graphite">${project.budget}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-coolgray">Duration:</span>
                    <span className="font-medium text-graphite">{project.duration} days</span>
                  </div>
                  {project.skills_required && project.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.skills_required.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-violet/10 text-violet rounded"
                        >
                          {skill.skill}
                        </span>
                      ))}
                      {project.skills_required.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          +{project.skills_required.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/project/${project._id}`}
                    className="flex-1 text-center px-3 py-2 text-sm bg-violet/10 text-violet rounded-md hover:bg-violet/20 transition-colors"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/project/edit/${project._id}`}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </Link>
                  {project.isactive === 1 && project.iscompleted === 0 && (
                    <button
                      onClick={() => handleCompleteProject(project._id)}
                      className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                    >
                      Complete
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteProject(project._id)}
                    className="px-3 py-2 text-sm bg-coral/10 text-coral rounded-md hover:bg-coral/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-graphite mb-2">No projects found</h3>
            <p className="text-coolgray mb-6">
              {getFilteredProjects().length === 0 && projects.length > 0
                ? "Try adjusting your filters to see more projects"
                : "Create a new project to get started"
              }
            </p>
            <Link to="/project/create">
              <Button>Create Your First Project</Button>
            </Link>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-8 space-y-4 sm:space-y-0">
            {/* Pagination Info */}
            <div className="text-white/80 text-sm">
              Showing {((filters.page - 1) * pagination.limit) + 1} to {Math.min(filters.page * pagination.limit, pagination.total)} of {pagination.total} projects
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page <= 1}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              
              <div className="flex space-x-1">
                {/* First page */}
                {filters.page > 3 && (
                  <>
                    <button
                      onClick={() => handlePageChange(1)}
                      className="px-3 py-2 text-sm font-medium text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200"
                    >
                      1
                    </button>
                    {filters.page > 4 && (
                      <span className="px-2 py-2 text-white/60">...</span>
                    )}
                  </>
                )}
                
                {/* Page numbers */}
                {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }, (_, i) => i + 1)
                  .slice(Math.max(0, filters.page - 2), Math.min(filters.page + 2, Math.ceil(pagination.total / pagination.limit)))
                  .map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        page === filters.page
                          ? 'bg-mint text-white shadow-lg scale-105'
                          : 'text-white bg-white/10 border border-white/20 hover:bg-white/20'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                
                {/* Last page */}
                {filters.page < Math.ceil(pagination.total / pagination.limit) - 2 && (
                  <>
                    {filters.page < Math.ceil(pagination.total / pagination.limit) - 3 && (
                      <span className="px-2 py-2 text-white/60">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(Math.ceil(pagination.total / pagination.limit))}
                      className="px-3 py-2 text-sm font-medium text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200"
                    >
                      {Math.ceil(pagination.total / pagination.limit)}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page >= Math.ceil(pagination.total / pagination.limit)}
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
    </div>
  )
}
