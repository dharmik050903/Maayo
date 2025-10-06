import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { jobService } from '../services/jobService'
import { applicationService } from '../services/applicationService'
import Button from './Button'
import Header from './Header'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
import { isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'

export default function JobSearch() {
  const { t } = useComprehensiveTranslation()
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    job_type: '',
    work_mode: '',
    location: '',
    min_salary: '',
    max_salary: '',
    skills: [],
    experience_level: '',
    search_query: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  })
  const [pagination, setPagination] = useState({})
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      window.location.href = '/login'
      return
    }
    
    const user = getCurrentUser()
    setUserData(user)
    // Load jobs immediately without filters
    fetchJobs()
  }, [])

  const handleLogout = () => {
    clearAuth()
    window.location.href = '/login'
  }

  const fetchJobs = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching jobs with filters:', filters)
      console.log('🔍 Current user:', userData)
      console.log('🔍 API URL:', `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/job/list`)
      
      const response = await jobService.getJobs(filters)
      console.log('📋 Jobs response:', response)
      
      if (response.status) {
        console.log('✅ Jobs data:', response.data)
        console.log('✅ Jobs count:', response.data?.length || 0)
        console.log('✅ Response structure:', {
          isArray: Array.isArray(response.data),
          hasJobs: response.data?.jobs,
          hasPagination: response.data?.pagination
        })
        
        // Handle both possible data structures
        const jobsArray = Array.isArray(response.data) ? response.data : (response.data.jobs || [])
        const paginationData = Array.isArray(response.data) ? {} : (response.data.pagination || {})
        
        console.log('📊 Processed jobs:', jobsArray)
        console.log('📊 Processed pagination:', paginationData)
        console.log('📊 Jobs array length:', jobsArray.length)
        
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
      page: 1 // Reset to first page when filters change
    }))
    // Don't trigger API call automatically - wait for Apply Filters button
  }

  const handleApplyFilters = () => {
    fetchJobs()
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchJobs()
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }))
  }

  const handleSaveJob = async (jobId) => {
    try {
      const response = await applicationService.toggleJobSave(jobId)
      if (response.status) {
        // Update the job in the list to reflect saved status
        setJobs(prev => prev.map(job => 
          job._id === jobId 
            ? { ...job, is_saved: response.data.is_saved }
            : job
        ))
      }
    } catch (error) {
      console.error('Error saving job:', error)
    }
  }

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      job_type: '',
      work_mode: '',
      location: '',
      min_salary: '',
      max_salary: '',
      skills: [],
      experience_level: '',
      search_query: '',
      sort_by: 'created_at',
      sort_order: 'desc'
    })
    // Apply cleared filters immediately
    setTimeout(() => fetchJobs(), 100)
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
      <main className="flex-1 max-w-7xl mx-auto px-6 pt-20 pb-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Find Your Next <span className="text-mint">Job</span>
              </h1>
              <p className="text-lg text-white/80 mt-4">
                Discover opportunities that match your skills and interests
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => navigate('/freelancer/applications')}
                className="border-gray-300 text-graphite hover:bg-gray-50"
              >
                My Applications
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/freelancer/saved-jobs')}
                className="border-gray-300 text-graphite hover:bg-gray-50"
              >
                Saved Jobs
              </Button>
            </div>
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

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="lg:w-1/3">
            <div className="card bg-white/95 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-graphite">Filters</h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden text-mint hover:text-mint/80"
                >
                  {showFilters ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className={`space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Search</label>
                  <input
                    type="text"
                    value={filters.search_query}
                    onChange={(e) => handleFilterChange('search_query', e.target.value)}
                    placeholder="Job title, company, skills..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                  />
                </div>

                {/* Job Type */}
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Job Type</label>
                  <select
                    value={filters.job_type}
                    onChange={(e) => handleFilterChange('job_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                  >
                    <option value="">All Types</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                {/* Work Mode */}
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Work Mode</label>
                  <select
                    value={filters.work_mode}
                    onChange={(e) => handleFilterChange('work_mode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                  >
                    <option value="">All Modes</option>
                    <option value="remote">Remote</option>
                    <option value="onsite">On-site</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Location</label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    placeholder="City, State"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                  />
                </div>

                {/* Salary Range */}
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Salary Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={filters.min_salary}
                      onChange={(e) => handleFilterChange('min_salary', e.target.value)}
                      placeholder="Min"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                    />
                    <input
                      type="number"
                      value={filters.max_salary}
                      onChange={(e) => handleFilterChange('max_salary', e.target.value)}
                      placeholder="Max"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                    />
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Experience Level</label>
                  <select
                    value={filters.experience_level}
                    onChange={(e) => handleFilterChange('experience_level', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                  >
                    <option value="">All Levels</option>
                    <option value="0">Entry Level (0 years)</option>
                    <option value="1">1+ years</option>
                    <option value="3">3+ years</option>
                    <option value="5">5+ years</option>
                    <option value="10">10+ years</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-graphite mb-2">Sort By</label>
                  <select
                    value={filters.sort_by}
                    onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
                  >
                    <option value="created_at">Date Posted</option>
                    <option value="salary.min_salary">Salary</option>
                    <option value="application_deadline">Deadline</option>
                  </select>
                </div>

                {/* Sort Order */}
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

                <Button
                  onClick={handleApplyFilters}
                  variant="primary"
                  className="w-full mb-3"
                >
                  Apply Filters
                </Button>
                
                <Button
                  onClick={clearFilters}
                  variant="secondary"
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Jobs List */}
          <div className="lg:w-2/3">
            <div className="card bg-white/95 rounded-lg shadow-sm">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint mx-auto"></div>
                  <p className="mt-2 text-coolgray">Loading jobs...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mb-4">
                    <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-coolgray mb-4">No jobs found matching your criteria.</p>
                  <Button
                    onClick={clearFilters}
                    variant="secondary"
                    className="border-gray-300 text-graphite hover:bg-gray-50"
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      onSaveJob={handleSaveJob}
                    />
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
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
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
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
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
          </div>
        </div>
      </main>
    </div>
  )
}

// Job Card Component
function JobCard({ job, onSaveJob }) {
  const formatSalary = (salary) => {
    if (!salary.min_salary && !salary.max_salary) return 'Salary not specified'
    if (salary.min_salary === salary.max_salary) {
      return `${salary.currency} ${salary.min_salary.toLocaleString()} ${salary.salary_type}`
    }
    return `${salary.currency} ${salary.min_salary.toLocaleString()} - ${salary.max_salary.toLocaleString()} ${salary.salary_type}`
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString()
  }

  const getDaysUntilDeadline = (deadline) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntilDeadline = getDaysUntilDeadline(job.application_deadline)

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Link
              to={`/freelancer/jobs/${job._id}`}
              className="text-lg font-semibold text-mint hover:text-mint/80"
            >
              {job.job_title}
            </Link>
            <span className={`px-2 py-1 text-xs rounded-full ${
              job.job_type === 'full-time' ? 'bg-green-100 text-green-800' :
              job.job_type === 'part-time' ? 'bg-yellow-100 text-yellow-800' :
              job.job_type === 'contract' ? 'bg-blue-100 text-blue-800' :
              job.job_type === 'freelance' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {job.job_type}
            </span>
          </div>

          <div className="text-sm text-coolgray mb-2">
            <span className="font-medium">{job.company_info.company_name}</span>
            <span className="mx-2">•</span>
            <span>{job.location.city}, {job.location.country}</span>
            <span className="mx-2">•</span>
            <span className="capitalize">{job.work_mode}</span>
          </div>

          <p className="text-graphite mb-3 line-clamp-2">
            {job.job_description.substring(0, 200)}...
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {job.required_skills.slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-graphite text-xs rounded"
              >
                {skill.skill}
              </span>
            ))}
            {job.required_skills.length > 5 && (
              <span className="px-2 py-1 bg-gray-100 text-graphite text-xs rounded">
                +{job.required_skills.length - 5} more
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-coolgray">
            <div className="flex items-center space-x-4">
              <span className="font-medium text-mint">
                {formatSalary(job.salary)}
              </span>
              <span>
                Posted {formatDate(job.created_at)}
              </span>
              <span className={`${
                daysUntilDeadline < 7 ? 'text-red-600' : 
                daysUntilDeadline < 14 ? 'text-yellow-600' : 
                'text-coolgray'
              }`}>
                {daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : 'Deadline passed'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-coolgray">
                {job.analytics.total_applications} applications
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          <button
            onClick={() => onSaveJob(job._id)}
            className={`p-2 rounded-md transition-colors ${
              job.is_saved 
                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                : 'bg-gray-100 text-graphite hover:bg-gray-200'
            }`}
            title={job.is_saved ? 'Unsave job' : 'Save job'}
          >
            {job.is_saved ? '★' : '☆'}
          </button>
          
          <Link to={`/freelancer/jobs/${job._id}`}>
            <Button size="sm" className="bg-mint hover:bg-mint/90 text-white">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
