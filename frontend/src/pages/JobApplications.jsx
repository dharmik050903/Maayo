import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Header from '../components/Header'
import ConfirmationModal from '../components/ConfirmationModal'
import { applicationService } from '../services/applicationService'
import { jobService } from '../services/jobService'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
import { isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'
import { useConfirmation } from '../hooks/useModal'

export default function JobApplications() {
  const { t } = useComprehensiveTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmation, showConfirmation, hideConfirmation } = useConfirmation()
  const [userData, setUserData] = useState(null)
  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
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
  const [applicationNotes, setApplicationNotes] = useState({})

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      window.location.href = '/login'
      return
    }
    
    const user = getCurrentUser()
    setUserData(user)
    fetchJobAndApplications()
  }, [id, filters])

  const handleLogout = () => {
    clearAuth()
    window.location.href = '/login'
  }

  const fetchJobAndApplications = async () => {
    try {
      setLoading(true)
      
      // Fetch job details
      const jobResponse = await jobService.getJobById(id)
      if (jobResponse.status) {
        setJob(jobResponse.data)
      }
      
      // Fetch applications
      const applicationsResponse = await applicationService.getJobApplications(id, filters)
      if (applicationsResponse.status) {
        setApplications(applicationsResponse.data.applications || [])
        setPagination(applicationsResponse.data.pagination || {})
      } else {
        setMessage({ type: 'error', text: applicationsResponse.message || 'Failed to fetch applications' })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setMessage({ type: 'error', text: 'Failed to fetch data. Please try again.' })
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

  const handleStatusUpdate = async (applicationId, newStatus) => {
    const notes = applicationNotes[applicationId] || ''
    console.log('🔍 handleStatusUpdate called:', { applicationId, newStatus, notes })
    
    // Add confirmation for accepting applications
    if (newStatus === 'selected') {
      console.log('🎯 Showing accept confirmation...')
      showConfirmation({
        title: 'Accept Application',
        message: 'Are you sure you want to accept this application? This will mark the candidate as selected.',
        type: 'success',
        confirmText: 'Yes, Accept',
        cancelText: 'Cancel',
        onConfirm: () => {
          hideConfirmation()
          performStatusUpdate(applicationId, newStatus, notes)
        }
      })
      return
    }
    
    // Add confirmation for rejecting applications
    if (newStatus === 'rejected') {
      console.log('🎯 Showing reject confirmation...')
      showConfirmation({
        title: 'Reject Application',
        message: 'Are you sure you want to reject this application? This action cannot be undone.',
        type: 'danger',
        confirmText: 'Yes, Reject',
        cancelText: 'Cancel',
        onConfirm: () => {
          hideConfirmation()
          performStatusUpdate(applicationId, newStatus, notes)
        }
      })
      return
    }
    
    // For other status updates, proceed directly
    performStatusUpdate(applicationId, newStatus, notes)
  }

  const performStatusUpdate = async (applicationId, newStatus, notes = '') => {
    try {
      console.log('🚀 Proceeding with status update...')
      console.log('📋 Application ID:', applicationId)
      console.log('📋 New Status:', newStatus)
      console.log('📋 Notes:', notes)
      
      const response = await applicationService.updateApplicationStatus(applicationId, {
        status: newStatus,
        notes: notes
      })
      
      if (response.status) {
        setMessage({ type: 'success', text: `Application ${newStatus === 'selected' ? 'accepted' : 'updated'} successfully!` })
        fetchJobAndApplications() // Refresh the list
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update status' })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      setMessage({ type: 'error', text: 'Failed to update status. Please try again.' })
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800'
      case 'viewed': return 'bg-yellow-100 text-yellow-800'
      case 'shortlisted': return 'bg-purple-100 text-purple-800'
      case 'interviewed': return 'bg-indigo-100 text-indigo-800'
      case 'selected': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'withdrawn': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDaysSinceApplication = (date) => {
    const now = new Date()
    const applicationDate = new Date(date)
    const diffTime = now - applicationDate
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
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
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 pt-16 sm:pt-20 pb-6 sm:pb-8">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                Job <span className="text-mint">Applications</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-white/80 mt-1 sm:mt-2 lg:mt-4">
                {job ? `Applications for "${job.job_title}"` : 'Manage job applications'}
              </p>
            </div>
            <button
              onClick={() => navigate('/client/jobs')}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 bg-gradient-to-r from-violet to-purple text-white hover:from-violet/90 hover:to-purple/90 border-0 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Jobs
            </button>
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

        {/* Job Info */}
        {job && (
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 border border-white/20">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-graphite mb-3">{job.job_title}</h2>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-xl text-sm font-medium">
                    {job.location.city}, {job.location.country}
                  </span>
                  <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-xl text-sm font-medium capitalize">
                    {job.work_mode}
                  </span>
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 rounded-xl text-sm font-medium capitalize">
                    {job.job_type}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">
                    <div className="text-graphite font-semibold text-lg">{job.analytics.total_applications}</div>
                    <div className="text-coolgray">Total Applications</div>
                  </div>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">
                    <div className="text-graphite font-semibold text-lg">{job.analytics.total_views}</div>
                    <div className="text-coolgray">Views</div>
                  </div>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">
                    <div className="text-graphite font-semibold text-lg">{formatDate(job.application_deadline)}</div>
                    <div className="text-coolgray">Deadline</div>
                  </div>
                </div>
              </div>
              <div className="sm:ml-6 flex-shrink-0">
                <span className={`px-4 py-2 text-sm font-semibold rounded-2xl ${
                  job.status === 'active' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300' :
                  job.status === 'closed' ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300' :
                  'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300'
                }`}>
                  {job.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 border border-white/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-semibold text-graphite mb-3">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint focus:border-mint text-graphite bg-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                <option value="">All Status</option>
                <option value="applied">Applied</option>
                <option value="viewed">Viewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interviewed">Interviewed</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-graphite mb-3">Sort By</label>
              <select
                value={filters.sort_by}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint focus:border-mint text-graphite bg-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                <option value="created_at">Date Applied</option>
                <option value="application_status">Status</option>
                <option value="skills_match.match_percentage">Skills Match</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-graphite mb-3">Order</label>
              <select
                value={filters.sort_order}
                onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint focus:border-mint text-graphite bg-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => setFilters({
                  page: 1,
                  limit: 20,
                  status: '',
                  sort_by: 'created_at',
                  sort_order: 'desc'
                })}
                className="w-full px-4 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="p-6 sm:p-8 text-center min-h-[300px] flex flex-col justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint mx-auto"></div>
              <p className="mt-2 text-coolgray">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-6 sm:p-8 text-center min-h-[300px] flex flex-col justify-center">
              <div className="w-16 h-16 bg-gradient-to-r from-mint/20 to-mint/30 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-graphite mb-2">No applications found</h3>
              <p className="text-coolgray mb-6">No applications match your current filter criteria.</p>
              <button
                onClick={() => setFilters({
                  page: 1,
                  limit: 20,
                  status: '',
                  sort_by: 'created_at',
                  sort_order: 'desc'
                })}
                className="px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {applications.map((application) => (
                <div key={application._id} className="p-4 sm:p-6 lg:p-8 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0 mb-3">
                        <h3 className="text-lg sm:text-xl font-bold text-graphite">
                          {application.freelancer_info?.name || 'Anonymous Freelancer'}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-xl ${getStatusColor(application.application_status)}`}>
                            {application.application_status}
                          </span>
                          {application.skills_match?.match_percentage && (
                            <span className="px-3 py-1 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800">
                              {application.skills_match.match_percentage}% match
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-coolgray mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Applied {formatDate(application.application_tracking?.applied_at)}
                          </span>
                          <span className="hidden sm:inline text-gray-400">•</span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {getDaysSinceApplication(application.application_tracking?.applied_at)} days ago
                          </span>
                          {application.expected_salary?.amount && (
                            <>
                              <span className="hidden sm:inline text-gray-400">•</span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h8M7 10h8M9 14h5c1.5 0 2.5-1 2.5-2.5S15.5 9 14 9h-2" />
                                </svg>
                                Expected: ₹{application.expected_salary.amount.toLocaleString()} {application.expected_salary.salary_type}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {application.cover_letter && (
                        <div className="mb-4">
                          <p className="text-sm text-graphite font-semibold mb-2">Cover Letter:</p>
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                            <p className="text-sm text-coolgray line-clamp-3">{application.cover_letter}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-coolgray">
                        {application.resume_link?.url && (
                          <a
                            href={application.resume_link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-mint hover:text-mint/80 flex items-center bg-gradient-to-r from-mint/10 to-mint/20 px-3 py-2 rounded-xl border border-mint/20 hover:border-mint/40 transition-all duration-200"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            View Resume
                          </a>
                        )}
                        {application.portfolio_links && application.portfolio_links.length > 0 && (
                          <span className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 px-3 py-2 rounded-xl border border-purple-200">
                            {application.portfolio_links.length} portfolio link{application.portfolio_links.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {application.availability?.start_date && (
                          <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-3 py-2 rounded-xl border border-green-200">
                            Available: {formatDate(application.availability.start_date)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-3 sm:space-y-4 lg:ml-6 lg:min-w-[250px] mt-4 lg:mt-0">
                      {/* Status Selector */}
                      <div>
                        <label className="block text-sm font-semibold text-graphite mb-2">Status</label>
                        <select
                          value={application.application_status}
                          onChange={(e) => handleStatusUpdate(application._id, e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint focus:border-mint text-graphite bg-white shadow-sm hover:shadow-md transition-all duration-200 text-sm"
                        >
                          <option value="applied">Applied</option>
                          <option value="viewed">Viewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interviewed">Interviewed</option>
                          <option value="selected">Selected</option>
                          <option value="rejected">Rejected</option>
                          <option value="withdrawn">Withdrawn</option>
                        </select>
                      </div>

                      {/* Notes Section */}
                      <div>
                        <label className="block text-sm font-semibold text-graphite mb-2">Notes</label>
                        <textarea
                          placeholder="Add notes about this application..."
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint focus:border-mint text-graphite bg-white text-sm resize-none shadow-sm hover:shadow-md transition-all duration-200"
                          rows="2"
                          value={applicationNotes[application._id] || ''}
                          onChange={(e) => {
                            setApplicationNotes(prev => ({
                              ...prev,
                              [application._id]: e.target.value
                            }))
                          }}
                        />
                      </div>

                      {/* Quick Actions */}
                      <div className="flex flex-col space-y-2 sm:space-y-3">
                        <div className="text-xs text-coolgray font-semibold">Quick Actions:</div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <button
                            onClick={() => handleStatusUpdate(application._id, 'selected')}
                            className="px-3 sm:px-4 py-2 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 border-0 text-xs sm:text-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(application._id, 'rejected')}
                            className="px-3 sm:px-4 py-2 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 bg-white text-xs sm:text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 sm:px-8 py-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-coolgray text-center sm:text-left font-medium">
                  Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of{' '}
                  {pagination.totalItems} results
                </div>
                
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.currentPage === 1}
                    className="px-4 py-2 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-md"
                  >
                    Previous
                  </button>
                  
                  <span className="px-4 py-2 bg-gradient-to-r from-mint/10 to-mint/20 text-mint font-semibold rounded-xl border border-mint/20">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-4 py-2 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-md"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
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
    </div>
  )
}
