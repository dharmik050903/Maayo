import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { jobService } from '../services/jobService'
import Button from '../components/Button'
import Header from '../components/Header'
import { useAlert } from '../components/Alert'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
import { isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'

export default function ClientJobs() {
  const { t } = useComprehensiveTranslation()
  const { showAlert, AlertComponent } = useAlert()
  const [userData, setUserData] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  })
  const [pagination, setPagination] = useState({})

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      window.location.href = '/login'
      return
    }
    
    const user = getCurrentUser()
    setUserData(user)
    fetchJobs()
  }, [filters])

  const handleLogout = () => {
    clearAuth()
    window.location.href = '/login'
  }

  const fetchJobs = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching client jobs with filters:', filters)
      const response = await jobService.getClientJobs(filters)
      console.log('📋 Client jobs response:', response)
      
      if (response.status) {
        console.log('✅ Jobs data:', response.data)
        // Handle both possible data structures
        const jobsArray = Array.isArray(response.data) ? response.data : (response.data.jobs || [])
        const paginationData = Array.isArray(response.data) ? {} : (response.data.pagination || {})
        
        console.log('📊 Processed jobs:', jobsArray)
        console.log('📊 Processed pagination:', paginationData)
        
        setJobs(jobsArray)
        setPagination(paginationData)
      } else {
        console.log('❌ Jobs error:', response.message)
        setMessage({ type: 'error', text: response.message || 'Failed to fetch jobs' })
      }
    } catch (error) {
      console.error('💥 Error fetching jobs:', error)
      setMessage({ type: 'error', text: 'Failed to fetch jobs. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1
    }))
  }

  const handleDeleteJob = async (jobId) => {
    const confirmed = await showAlert({
      title: 'Delete Job',
      message: 'Are you sure you want to delete this job? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })

    if (!confirmed) return

    try {
      const response = await jobService.deleteJob(jobId)
      if (response.status) {
        setMessage({ type: 'success', text: 'Job deleted successfully!' })
        fetchJobs() // Refresh the list
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to delete job' })
      }
    } catch (error) {
      console.error('Error deleting job:', error)
      setMessage({ type: 'error', text: 'Failed to delete job. Please try again.' })
    }
  }

  const handleActivateJob = async (jobId) => {
    const confirmed = await showAlert({
      title: 'Activate Job',
      message: 'Are you sure you want to activate this job? It will be visible to freelancers.',
      type: 'success',
      confirmText: 'Activate',
      cancelText: 'Cancel'
    })

    if (!confirmed) return

    try {
      const response = await jobService.updateJob(jobId, { status: 'active' })
      if (response.status) {
        setMessage({ type: 'success', text: 'Job activated successfully!' })
        fetchJobs() // Refresh the list
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to activate job' })
      }
    } catch (error) {
      console.error('Error activating job:', error)
      setMessage({ type: 'error', text: 'Failed to activate job. Please try again.' })
    }
  }

  const handleCloseJob = async (jobId) => {
    const confirmed = await showAlert({
      title: 'Close Job',
      message: 'Are you sure you want to close this job? It will no longer accept applications.',
      type: 'warning',
      confirmText: 'Close Job',
      cancelText: 'Cancel'
    })

    if (!confirmed) return

    try {
      const response = await jobService.closeJob(jobId)
      if (response.status) {
        setMessage({ type: 'success', text: 'Job closed successfully!' })
        fetchJobs() // Refresh the list
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to close job' })
      }
    } catch (error) {
      console.error('Error closing job:', error)
      setMessage({ type: 'error', text: 'Failed to close job. Please try again.' })
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'closed': return 'bg-red-100 text-red-800'
      case 'filled': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-gradient text-white">
      <Header 
        userType="client" 
        onLogout={handleLogout} 
        userData={userData}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 pt-24 sm:pt-28 pb-8">
        {/* Header Section */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 md:gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                My <span className="text-mint">Jobs</span>
              </h1>
              <p className="text-base md:text-lg text-white/80 mt-2 md:mt-4">
                Manage your job postings and applications
              </p>
            </div>
            <Link to="/client/jobs/create">
              <Button 
                variant="accent" 
                className="bg-mint text-white hover:bg-mint/90 border-2 border-mint hover:border-mint/80 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 px-6 py-3 font-semibold w-full sm:w-auto"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Post New Job</span>
                </div>
              </Button>
            </Link>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/95 rounded-[2rem] p-4 md:p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-graphite mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
                <option value="filled">Filled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-graphite mb-2">Sort By</label>
              <select
                value={filters.sort_by}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
              >
                <option value="created_at">Date Posted</option>
                <option value="application_deadline">Deadline</option>
                <option value="analytics.total_applications">Applications</option>
                <option value="analytics.total_views">Views</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-graphite mb-2">Order</label>
              <select
                value={filters.sort_order}
                onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button
                onClick={() => setFilters({
                  page: 1,
                  limit: 20,
                  status: '',
                  sort_by: 'created_at',
                  sort_order: 'desc'
                })}
                variant="secondary"
                className="w-full border-gray-300 text-graphite hover:bg-gray-50"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white/95 rounded-[2rem] shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint mx-auto"></div>
              <p className="mt-2 text-coolgray">Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-mint/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-graphite mb-2">No jobs found</h3>
              <p className="text-coolgray mb-6">Start by posting your first job to attract talented freelancers.</p>
              <Link to="/client/jobs/create">
                <Button 
                  variant="accent" 
                  className="bg-mint text-white hover:bg-mint/90 border-2 border-mint hover:border-mint/80 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 px-6 py-3 font-semibold"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Post Your First Job</span>
                  </div>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {jobs.map((job) => (
                <div key={job._id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2 gap-2">
                        <Link
                          to={`/client/jobs/edit/${job._id}`}
                          className="text-base md:text-lg font-semibold text-graphite hover:text-mint transition-colors"
                        >
                          {job.job_title}
                        </Link>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            job.job_type === 'full-time' ? 'bg-green-100 text-green-800' :
                            job.job_type === 'part-time' ? 'bg-yellow-100 text-yellow-800' :
                            job.job_type === 'contract' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {job.job_type}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm text-coolgray mb-3">
                        <span>{job.location.city}, {job.location.country}</span>
                        <span className="mx-2">•</span>
                        <span className="capitalize">{job.work_mode}</span>
                        <span className="mx-2">•</span>
                        <span>Posted {formatDate(job.created_at)}</span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 text-sm text-coolgray gap-2 sm:gap-0">
                        <span>
                          <strong className="text-graphite">{job.analytics.total_applications}</strong> applications
                        </span>
                        <span>
                          <strong className="text-graphite">{job.analytics.total_views}</strong> views
                        </span>
                        <span>
                          <strong className="text-graphite">{job.analytics.total_saves}</strong> saves
                        </span>
                        <span>
                          Deadline: {formatDate(job.application_deadline)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:ml-6">
                      <Link to={`/client/jobs/${job._id}/applications`}>
                        <Button size="sm" variant="secondary" className="border-violet text-violet hover:bg-violet hover:text-white">
                          View Applications
                        </Button>
                      </Link>
                      
                      <Link to={`/client/jobs/edit/${job._id}`}>
                        <Button size="sm" variant="secondary" className="border-gray-300 text-graphite hover:bg-gray-50">
                          Edit
                        </Button>
                      </Link>
                      
                      {job.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleActivateJob(job._id)}
                          className="border-green-300 text-green-700 hover:bg-green-50"
                        >
                          Activate
                        </Button>
                      )}
                      
                      {job.status === 'active' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCloseJob(job._id)}
                          className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                        >
                          Close
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDeleteJob(job._id)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-coolgray">
                  Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of{' '}
                  {pagination.totalItems} results
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.currentPage === 1}
                    variant="secondary"
                    size="sm"
                    className="border-gray-300 text-graphite hover:bg-gray-50"
                  >
                    Previous
                  </Button>
                  
                  <span className="px-3 py-2 text-sm text-coolgray">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  
                  <Button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    variant="secondary"
                    size="sm"
                    className="border-gray-300 text-graphite hover:bg-gray-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Custom Alert Component */}
      <AlertComponent />
    </div>
  )
}
