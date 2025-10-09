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

  const handleStatusUpdate = async (applicationId, newStatus, notes = '') => {
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
      <main className="flex-1 max-w-7xl mx-auto px-6 pt-20 pb-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Job <span className="text-mint">Applications</span>
              </h1>
              <p className="text-lg text-white/80 mt-4">
                {job ? `Applications for "${job.job_title}"` : 'Manage job applications'}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate('/client/jobs')}
              className="border-gray-300 text-graphite hover:bg-gray-50"
            >
              Back to Jobs
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

        {/* Job Info */}
        {job && (
          <div className="card p-6 bg-white/95 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-graphite mb-2">{job.job_title}</h2>
                <div className="text-sm text-coolgray mb-3">
                  <span>{job.location.city}, {job.location.country}</span>
                  <span className="mx-2">•</span>
                  <span className="capitalize">{job.work_mode}</span>
                  <span className="mx-2">•</span>
                  <span className="capitalize">{job.job_type}</span>
                </div>
                <div className="flex items-center space-x-6 text-sm text-coolgray">
                  <span>
                    <strong className="text-graphite">{job.analytics.total_applications}</strong> total applications
                  </span>
                  <span>
                    <strong className="text-graphite">{job.analytics.total_views}</strong> views
                  </span>
                  <span>
                    Deadline: {formatDate(job.application_deadline)}
                  </span>
                </div>
              </div>
              <div className="ml-6">
                <span className={`px-3 py-1 text-sm rounded-full ${
                  job.status === 'active' ? 'bg-green-100 text-green-800' :
                  job.status === 'closed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {job.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card p-6 bg-white/95 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-graphite mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
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
              <label className="block text-sm font-medium text-graphite mb-2">Sort By</label>
              <select
                value={filters.sort_by}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mint text-graphite bg-white"
              >
                <option value="created_at">Date Applied</option>
                <option value="application_status">Status</option>
                <option value="skills_match.match_percentage">Skills Match</option>
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

        {/* Applications List */}
        <div className="card bg-white/95">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint mx-auto"></div>
              <p className="mt-2 text-coolgray">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-mint/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-graphite mb-2">No applications found</h3>
              <p className="text-coolgray mb-6">No applications match your current filter criteria.</p>
              <Button
                onClick={() => setFilters({
                  page: 1,
                  limit: 20,
                  status: '',
                  sort_by: 'created_at',
                  sort_order: 'desc'
                })}
                variant="secondary"
                className="border-gray-300 text-graphite hover:bg-gray-50"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {applications.map((application) => (
                <div key={application._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-graphite">
                          {application.freelancer_info?.name || 'Anonymous Freelancer'}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(application.application_status)}`}>
                          {application.application_status}
                        </span>
                        {application.skills_match?.match_percentage && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {application.skills_match.match_percentage}% match
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-coolgray mb-3">
                        <span>Applied {formatDate(application.application_tracking?.applied_at)}</span>
                        <span className="mx-2">•</span>
                        <span>{getDaysSinceApplication(application.application_tracking?.applied_at)} days ago</span>
                        {application.expected_salary?.amount && (
                          <>
                            <span className="mx-2">•</span>
                            <span>Expected: ₹{application.expected_salary.amount.toLocaleString()} {application.expected_salary.salary_type}</span>
                          </>
                        )}
                      </div>

                      {application.cover_letter && (
                        <div className="mb-3">
                          <p className="text-sm text-graphite font-medium mb-1">Cover Letter:</p>
                          <p className="text-sm text-coolgray line-clamp-2">{application.cover_letter}</p>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-coolgray">
                        {application.resume_link?.url && (
                          <a
                            href={application.resume_link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-mint hover:text-mint/80 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            View Resume
                          </a>
                        )}
                        {application.portfolio_links && application.portfolio_links.length > 0 && (
                          <span className="text-coolgray">
                            {application.portfolio_links.length} portfolio link{application.portfolio_links.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {application.availability?.start_date && (
                          <span className="text-coolgray">
                            Available: {formatDate(application.availability.start_date)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-6">
                      {application.application_status === 'applied' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              console.log('🔥 Accept button clicked!', application._id)
                              handleStatusUpdate(application._id, 'selected')
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusUpdate(application._id, 'rejected')}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {application.application_status === 'saved' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              console.log('🔥 Accept button clicked!', application._id)
                              handleStatusUpdate(application._id, 'selected')
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusUpdate(application._id, 'rejected')}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {application.application_status === 'viewed' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              console.log('🔥 Accept button clicked!', application._id)
                              handleStatusUpdate(application._id, 'selected')
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusUpdate(application._id, 'shortlisted')}
                            className="border-purple-300 text-purple-700 hover:bg-purple-50"
                          >
                            Shortlist
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusUpdate(application._id, 'interviewed')}
                            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                          >
                            Schedule Interview
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusUpdate(application._id, 'rejected')}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {application.application_status === 'shortlisted' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              console.log('🔥 Accept button clicked!', application._id)
                              handleStatusUpdate(application._id, 'selected')
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusUpdate(application._id, 'interviewed')}
                            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                          >
                            Schedule Interview
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusUpdate(application._id, 'rejected')}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {application.application_status === 'interviewed' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              console.log('🔥 Accept button clicked!', application._id)
                              handleStatusUpdate(application._id, 'selected')
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusUpdate(application._id, 'rejected')}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      
                      
                      {!['selected', 'rejected', 'withdrawn', 'applied', 'saved', 'viewed', 'shortlisted', 'interviewed'].includes(application.application_status) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleStatusUpdate(application._id, 'rejected')}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                      )}
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
