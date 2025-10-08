import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Header from '../components/Header'
import { applicationService } from '../services/applicationService'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
import { isAuthenticated, getCurrentUser, clearAuth } from '../utils/api'
import { useNotification } from '../hooks/useModal'
import socketService from '../services/socketService'

export default function ApplicationList() {
  const { t } = useComprehensiveTranslation()
  const navigate = useNavigate()
  const { notification, showNotification, hideNotification } = useNotification()
  const [userData, setUserData] = useState(null)
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
    fetchApplications()

    // Connect to socket for real-time notifications
    if (user && user._id) {
      socketService.connect(user._id)
    }

    // Listen for socket notifications
    const handleSocketNotification = (event) => {
      const notificationData = event.detail
      console.log('📧 ApplicationList: Received notification:', notificationData)
      
      if (notificationData.type === 'application_accepted') {
        showNotification({
          title: notificationData.title,
          message: notificationData.message,
          type: 'success',
          autoClose: true,
          autoCloseDelay: 5000
        })
        
        // Refresh applications to show updated status
        fetchApplications()
      }
    }

    window.addEventListener('socketNotification', handleSocketNotification)

    // Cleanup
    return () => {
      window.removeEventListener('socketNotification', handleSocketNotification)
      socketService.disconnect()
    }
  }, [filters])

  const handleLogout = () => {
    clearAuth()
    window.location.href = '/login'
  }

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await applicationService.getFreelancerApplications(filters)
      
      console.log('Applications response:', response)
      
      if (response.status) {
        setApplications(response.data.applications || [])
        setPagination(response.data.pagination || {})
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to fetch applications' })
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      setMessage({ type: 'error', text: 'Failed to fetch applications. Please try again.' })
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

  const handleWithdrawApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) {
      return
    }

    try {
      const response = await applicationService.withdrawApplication(applicationId)
      
      if (response.status) {
        setMessage({ type: 'success', text: 'Application withdrawn successfully!' })
        fetchApplications() // Refresh the list
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to withdraw application' })
      }
    } catch (error) {
      console.error('Error withdrawing application:', error)
      setMessage({ type: 'error', text: 'Failed to withdraw application. Please try again.' })
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
                My <span className="text-mint">Applications</span>
              </h1>
              <p className="text-lg text-white/80 mt-4">
                Track the status of your job applications
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => navigate('/freelancer/saved-jobs')}
                className="border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 hover:border-white/50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 px-6 py-3 font-semibold"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span>Saved Jobs</span>
                </div>
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/freelancer/application-stats')}
                className="border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 hover:border-white/50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 px-6 py-3 font-semibold"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Statistics</span>
                </div>
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
              <p className="text-coolgray mb-6">You haven't applied to any jobs yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {applications.map((application) => (
                <div key={application._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-graphite">
                          {application.job_id?.job_title || 'Job Title Not Available'}
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
                        <span>{application.job_id?.company_info?.company_name || 'Company Name Not Available'}</span>
                        <span className="mx-2">•</span>
                        <span>{application.job_id?.location?.city}, {application.job_id?.location?.country}</span>
                        <span className="mx-2">•</span>
                        <span className="capitalize">{application.job_id?.work_mode}</span>
                        <span className="mx-2">•</span>
                        <span className="capitalize">{application.job_id?.job_type}</span>
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
                          <p className="text-sm text-graphite font-medium mb-1">Your Cover Letter:</p>
                          <p className="text-sm text-coolgray line-clamp-2">{application.cover_letter}</p>
                        </div>
                      )}

                      {application.client_notes && (
                        <div className="mb-3">
                          <p className="text-sm text-graphite font-medium mb-1">Client Notes:</p>
                          <p className="text-sm text-coolgray line-clamp-2">{application.client_notes}</p>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-coolgray">
                        {application.resume_link?.url && (
                          <span className="text-mint flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Resume attached
                          </span>
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
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/freelancer/jobs/${application.job_id?._id || application.job_id}`)}
                        className="border-gray-300 text-graphite hover:bg-gray-50"
                      >
                        View Job
                      </Button>
                      
                      {!['selected', 'rejected', 'withdrawn'].includes(application.application_status) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleWithdrawApplication(application._id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Withdraw
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

      {/* Notification Modal */}
      {notification.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                notification.type === 'success' ? 'bg-green-100' : 
                notification.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                {notification.type === 'success' ? '✅' : 
                 notification.type === 'error' ? '❌' : 'ℹ️'}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
            </div>
            <p className="text-gray-600 mb-4">{notification.message}</p>
            <div className="flex justify-end">
              <Button
                onClick={hideNotification}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
