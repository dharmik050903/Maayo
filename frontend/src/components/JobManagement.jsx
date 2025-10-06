import React, { useState, useEffect } from 'react'
import adminService from '../services/adminService'

const JobManagement = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [pagination, setPagination] = useState({})

  // Filter states
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: 'all',
    job_type: 'all',
    work_mode: 'all',
    location: '',
    company_name: '',
    is_active: undefined
  })

  useEffect(() => {
    fetchJobs()
  }, [filters])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await adminService.getJobs(filters)
      setJobs(response.data || [])
      setPagination(response.pagination || {})
    } catch (error) {
      setError(error.message)
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setFilters(prev => ({ ...prev, page: 1 }))
  }

  const handleEdit = (job) => {
    setSelectedJob(job)
    setShowEditModal(true)
  }

  const handleDelete = (job) => {
    setSelectedJob(job)
    setDeleteReason('')
    setShowDeleteModal(true)
  }

  const handleBlock = (job) => {
    setSelectedJob(job)
    setBlockReason('')
    setShowBlockModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedJob || !deleteReason.trim()) {
      alert('Please provide a reason for deletion')
      return
    }

    try {
      setActionLoading(true)
      await adminService.deleteJob(selectedJob._id, deleteReason)
      
      // Remove the deleted job from the list
      setJobs(prev => prev.filter(job => job._id !== selectedJob._id))
      setShowDeleteModal(false)
      setSelectedJob(null)
      setDeleteReason('')
      
      alert('Job deleted successfully')
    } catch (error) {
      console.error('Error deleting job:', error)
      alert(`Failed to delete job: ${error.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const confirmBlock = async () => {
    if (!selectedJob) return

    try {
      setActionLoading(true)
      const response = await adminService.toggleJobBlock(selectedJob._id, blockReason)
      
      // Update the job in the list
      setJobs(prev => prev.map(job => 
        job._id === selectedJob._id ? response.data : job
      ))
      
      setShowBlockModal(false)
      setSelectedJob(null)
      setBlockReason('')
      
      alert(response.message)
    } catch (error) {
      console.error('Error toggling job block:', error)
      alert(`Failed to update job: ${error.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const getStatusBadge = (status, isActive) => {
    if (!isActive || status === 'blocked') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Blocked</span>
    }
    
    const statusStyles = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-red-100 text-red-800',
      filled: 'bg-blue-100 text-blue-800'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    )
  }

  const formatSalary = (salary) => {
    if (!salary) return 'Not specified'
    return `${salary.currency || 'INR'} ${salary.min_salary?.toLocaleString()} - ${salary.max_salary?.toLocaleString()} ${salary.salary_type || 'monthly'}`
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading && jobs.length === 0) {
    return (
      <div className="p-4 lg:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 mb-6 border border-blue-100 shadow-sm">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 text-gray-900">Job Management</h1>
        
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-3 rounded">
            {error}
            <button
              onClick={fetchJobs}
              className="ml-4 text-red-800 hover:text-red-900 underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 border border-gray-200">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Job title, company, description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
                <option value="filled">Filled</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
              <select
                value={filters.job_type}
                onChange={(e) => setFilters(prev => ({ ...prev, job_type: e.target.value, page: 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="freelance">Freelance</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
              <select
                value={filters.work_mode}
                onChange={(e) => setFilters(prev => ({ ...prev, work_mode: e.target.value, page: 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Modes</option>
                <option value="remote">Remote</option>
                <option value="onsite">Onsite</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setFilters({
                  page: 1,
                  limit: 10,
                  search: '',
                  status: 'all',
                  job_type: 'all',
                  work_mode: 'all',
                  location: '',
                  company_name: '',
                  is_active: undefined
                })
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        </form>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Jobs ({pagination.total_jobs || 0})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No jobs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Job Details</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type & Mode</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Salary</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Applications</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Posted</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map((job, index) => (
                    <tr key={job._id || index} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <p className="font-medium text-gray-900 truncate" title={job.job_title}>
                            {job.job_title}
                          </p>
                          <p className="text-sm text-gray-500 truncate" title={job.job_description}>
                            {job.job_description?.substring(0, 100)}...
                          </p>
                          <p className="text-xs text-gray-400">
                            📍 {job.location?.city}, {job.location?.country}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 truncate" title={job.company_info?.company_name}>
                            {job.company_info?.company_name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            👤 {job.client_id?.first_name} {job.client_id?.last_name}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {job.job_type}
                          </span>
                          <br />
                          <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            {job.work_mode}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatSalary(job.salary)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(job.status, job.is_active)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {job.analytics?.total_applications || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(job.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(job)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            title="Edit Job"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleBlock(job)}
                            className={`text-sm font-medium ${
                              job.status === 'blocked' || !job.is_active 
                                ? 'text-green-600 hover:text-green-900' 
                                : 'text-yellow-600 hover:text-yellow-900'
                            }`}
                            title={job.status === 'blocked' || !job.is_active ? 'Unblock Job' : 'Block Job'}
                          >
                            {job.status === 'blocked' || !job.is_active ? '✅' : '🚫'}
                          </button>
                          <button
                            onClick={() => handleDelete(job)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                            title="Delete Job"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.current_page - 1) * pagination.jobs_per_page) + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.jobs_per_page, pagination.total_jobs)} of{' '}
                  {pagination.total_jobs} jobs
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page <= 1}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                    Page {pagination.current_page} of {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.total_pages}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to permanently delete the job "{selectedJob?.job_title}"? 
              This action cannot be undone and will also delete all associated applications.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for deletion (required)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows="3"
                placeholder="Please provide a reason for deleting this job..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedJob(null)
                  setDeleteReason('')
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={actionLoading || !deleteReason.trim()}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block/Unblock Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedJob?.status === 'blocked' || !selectedJob?.is_active ? 'Unblock Job' : 'Block Job'}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedJob?.status === 'blocked' || !selectedJob?.is_active 
                ? `Are you sure you want to unblock the job "${selectedJob?.job_title}"?`
                : `Are you sure you want to block the job "${selectedJob?.job_title}"?`
              }
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                rows="3"
                placeholder="Please provide a reason for this action..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBlockModal(false)
                  setSelectedJob(null)
                  setBlockReason('')
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmBlock}
                disabled={actionLoading}
                className={`flex-1 px-4 py-2 text-white rounded-md disabled:opacity-50 ${
                  selectedJob?.status === 'blocked' || !selectedJob?.is_active
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {actionLoading ? 'Processing...' : (selectedJob?.status === 'blocked' || !selectedJob?.is_active ? 'Unblock' : 'Block')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobManagement