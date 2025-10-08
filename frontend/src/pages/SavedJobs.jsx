import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Header from '../components/Header'
import { applicationService } from '../services/applicationService'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
import { isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'

export default function SavedJobs() {
  const { t } = useComprehensiveTranslation()
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [savedJobs, setSavedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    sort_by: 'saved_at',
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
    fetchSavedJobs()
  }, [filters])

  const handleLogout = () => {
    clearAuth()
    window.location.href = '/login'
  }

  const fetchSavedJobs = async () => {
    try {
      setLoading(true)
      const response = await applicationService.getSavedJobs(filters)
      
      console.log('Saved jobs response:', response)
      console.log('Response data:', response.data)
      console.log('Response data type:', typeof response.data)
      console.log('Response data is array:', Array.isArray(response.data))
      console.log('Saved jobs array:', response.data?.saved_jobs)
      console.log('Direct data access:', response.data)
      
      if (response.status) {
        // Handle both data structures: data.saved_jobs or data directly as array
        let jobsArray = []
        let paginationData = {}
        
        if (Array.isArray(response.data)) {
          // Backend returning data directly as array
          jobsArray = response.data
          paginationData = response.pagination || {}
        } else if (response.data?.saved_jobs) {
          // Backend returning nested structure
          jobsArray = response.data.saved_jobs
          paginationData = response.data.pagination || {}
        }
        
        setSavedJobs(jobsArray)
        setPagination(paginationData)
        console.log('Set saved jobs:', jobsArray)
        console.log('Set pagination:', paginationData)
        console.log('Sample saved job structure:', jobsArray[0])
        console.log('Sample job_id structure:', jobsArray[0]?.job_id)
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to fetch saved jobs' })
      }
    } catch (error) {
      console.error('Error fetching saved jobs:', error)
      setMessage({ type: 'error', text: 'Failed to fetch saved jobs. Please try again.' })
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

  const handleUnsaveJob = async (jobId) => {
    try {
      const response = await applicationService.toggleJobSave(jobId) // Use toggleJobSave instead of saveJob
      
      if (response.status) {
        setMessage({ type: 'success', text: 'Job removed from saved list!' })
        fetchSavedJobs() // Refresh the list
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to remove job' })
      }
    } catch (error) {
      console.error('Error removing job:', error)
      setMessage({ type: 'error', text: 'Failed to remove job. Please try again.' })
    }
  }

  const formatDate = (date) => {
    if (!date) return 'Date not available'
    try {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) return 'Invalid Date'
      return dateObj.toLocaleDateString()
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const getDaysSincePosted = (date) => {
    if (!date) return 'N/A'
    try {
      const now = new Date()
      const postedDate = new Date(date)
      if (isNaN(postedDate.getTime())) return 'N/A'
      const diffTime = now - postedDate
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      return diffDays < 0 ? 0 : diffDays
    } catch (error) {
      return 'N/A'
    }
  }

  const getSalaryRange = (job) => {
    if (!job.salary) return 'Salary not specified'
    
    const { min_salary, max_salary, currency, salary_type } = job.salary
    if (min_salary && max_salary) {
      return `₹${min_salary.toLocaleString()} - ₹${max_salary.toLocaleString()} ${salary_type}`
    } else if (min_salary) {
      return `₹${min_salary.toLocaleString()}+ ${salary_type}`
    } else if (max_salary) {
      return `Up to ₹${max_salary.toLocaleString()} ${salary_type}`
    }
    return 'Salary not specified'
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
        userType="freelancer" 
        onLogout={handleLogout} 
        userData={userData}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 pt-20 pb-8">
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                Saved <span className="text-mint">Jobs</span>
              </h1>
              <p className="text-base md:text-lg text-white/80 mt-2 md:mt-4">
                Your bookmarked job opportunities
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate('/freelancer/jobs')}
              className="border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 hover:border-white/50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 px-6 py-3 font-semibold w-full sm:w-auto"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Browse Jobs</span>
              </div>
            </Button>
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
        <div className="card p-4 md:p-6 bg-white/95 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-graphite mb-2">Sort By</label>
              <select
                value={filters.sort_by}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
              >
                <option value="saved_at">Date Saved</option>
                <option value="job_title">Job Title</option>
                <option value="created_at">Date Posted</option>
                <option value="salary.min_salary">Salary</option>
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
                  sort_by: 'saved_at',
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

        {/* Saved Jobs List */}
        <div className="card bg-white/95">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint mx-auto"></div>
              <p className="mt-2 text-coolgray">Loading saved jobs...</p>
            </div>
          ) : savedJobs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-mint/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-graphite mb-2">No saved jobs</h3>
              <p className="text-coolgray mb-6">You haven't saved any jobs yet. Start browsing to find opportunities!</p>
              <Button
                onClick={() => navigate('/freelancer/jobs')}
                className="bg-mint text-white hover:bg-mint/90 border-2 border-mint hover:border-mint/80 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 px-6 py-3 font-semibold"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Browse Jobs</span>
                </div>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {savedJobs.map((savedJob) => (
                <div key={savedJob._id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-base md:text-lg font-semibold text-graphite">
                          {savedJob.job_id?.job_title || 'Job Title Not Available'}
                        </h3>
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 w-fit">
                          Saved {formatDate(savedJob.created_at)}
                        </span>
                      </div>

                      <div className="text-sm text-coolgray mb-3">
                        <span>{savedJob.job_id?.company_info?.company_name || 'Company Name Not Available'}</span>
                        <span className="mx-2">•</span>
                        <span>{savedJob.job_id?.location?.city}, {savedJob.job_id?.location?.country}</span>
                        <span className="mx-2">•</span>
                        <span className="capitalize">{savedJob.job_id?.work_mode}</span>
                        <span className="mx-2">•</span>
                        <span className="capitalize">{savedJob.job_id?.job_type}</span>
                      </div>

                      <div className="text-sm text-coolgray mb-3">
                        <span>Posted {formatDate(savedJob.job_id?.created_at)}</span>
                        <span className="mx-2">•</span>
                        <span>{getDaysSincePosted(savedJob.job_id?.created_at)} days ago</span>
                        <span className="mx-2">•</span>
                        <span>{getSalaryRange(savedJob.job_id)}</span>
                      </div>

                      {savedJob.job_id?.job_description && (
                        <div className="mb-3">
                          <p className="text-sm text-coolgray line-clamp-2">
                            {savedJob.job_id.job_description}
                          </p>
                        </div>
                      )}

                      {savedJob.job_id?.required_skills && savedJob.job_id.required_skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {savedJob.job_id.required_skills.slice(0, 5).map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                            >
                              {skill.skill}
                            </span>
                          ))}
                          {savedJob.job_id.required_skills.length > 5 && (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                              +{savedJob.job_id.required_skills.length - 5} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-coolgray">
                        {savedJob.job_id?.application_deadline && (
                          <span>
                            Deadline: {formatDate(savedJob.job_id.application_deadline)}
                          </span>
                        )}
                        {savedJob.job_id?.analytics?.total_applications && (
                          <span>
                            {savedJob.job_id.analytics.total_applications} applications
                          </span>
                        )}
                        {savedJob.job_id?.analytics?.total_views && (
                          <span>
                            {savedJob.job_id.analytics.total_views} views
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:space-y-0 sm:space-x-2 space-y-2 sm:ml-6">
                      <Button
                        size="sm"
                        onClick={() => {
                          const jobId = savedJob.job_id?._id || savedJob.job_id;
                          console.log('Navigating to job:', jobId);
                          navigate(`/freelancer/jobs/${jobId}`);
                        }}
                        className="bg-mint text-white hover:bg-mint/90 w-full sm:w-auto"
                      >
                        View Job
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const jobId = savedJob.job_id?._id || savedJob.job_id;
                          console.log('Navigating to apply for job:', jobId);
                          navigate(`/freelancer/jobs/${jobId}?apply=true`);
                        }}
                        className="border-green-300 text-green-700 hover:bg-green-50 w-full sm:w-auto"
                      >
                        Apply Now
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const jobId = savedJob.job_id?._id || savedJob.job_id;
                          console.log('Removing job:', jobId);
                          handleUnsaveJob(jobId);
                        }}
                        className="border-red-300 text-red-600 hover:bg-red-50 w-full sm:w-auto"
                      >
                        Remove
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
    </div>
  )
}
