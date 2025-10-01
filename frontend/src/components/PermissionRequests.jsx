import React, { useState, useEffect } from 'react'
import adminService from '../services/adminService'

const PermissionRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    status: 'pending',
    page: 1,
    limit: 10
  })
  const [pagination, setPagination] = useState({})
  const [error, setError] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [processingRequests, setProcessingRequests] = useState(new Set())

  useEffect(() => {
    fetchRequests()
  }, [filters])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await adminService.getPermissionRequests(filters)
      if (response.status) {
        setRequests(response.data.requests)
        setPagination(response.data.pagination)
        setError('')
      }
    } catch (error) {
      console.error('Error fetching permission requests:', error)
      setError('Failed to fetch permission requests')
    } finally {
      setLoading(false)
    }
  }

  const handleReviewRequest = (request) => {
    setSelectedRequest(request)
    setShowReviewModal(true)
  }

  const handleApproveReject = async (action, reviewNotes) => {
    if (!selectedRequest) return
    
    const requestId = selectedRequest._id
    
    // Prevent duplicate processing
    if (processingRequests.has(requestId) || actionLoading) {
      console.log('Request already being processed, ignoring duplicate call')
      return
    }
    
    // Check if request is still pending
    if (selectedRequest.status !== 'pending') {
      alert('This permission request has already been processed.')
      setShowReviewModal(false)
      setSelectedRequest(null)
      return
    }
    
    try {
      setActionLoading(true)
      setProcessingRequests(prev => new Set([...prev, requestId]))
      
      await adminService.handlePermissionRequest(requestId, action, reviewNotes)
      
      setShowReviewModal(false)
      setSelectedRequest(null)
      
      // Refresh the list
      await fetchRequests()
      
      alert(`Permission request ${action}d successfully!`)
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
      if (error.message?.includes('already been processed')) {
        alert('This permission request has already been processed by another admin.')
        await fetchRequests() // Refresh to show current state
      } else {
        alert(`Failed to ${action} request: ${error.message}`)
      }
    } finally {
      setActionLoading(false)
      setProcessingRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(requestId)
        return newSet
      })
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    }
    return `px-2 py-1 rounded-full text-xs font-medium border ${colors[status] || 'bg-gray-100 text-gray-800'}`
  }

  const getUrgencyBadge = (urgency) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    }
    return `px-2 py-1 rounded text-xs font-medium ${colors[urgency] || 'bg-gray-100 text-gray-800'}`
  }

  const formatRequestType = (type) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Permission Requests</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No permission requests found</h3>
          <p className="text-gray-500">There are no permission requests matching your criteria.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">
                        {request.requesterName}
                      </h3>
                      <p className="text-xs text-gray-500">{request.requesterEmail}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={getStatusBadge(request.status)}>
                        {request.status}
                      </span>
                      <span className={getUrgencyBadge(request.urgency)}>
                        {request.urgency}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {formatRequestType(request.requestType)}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      Target: {request.targetResourceName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(request.createdAt)}
                    </p>
                  </div>
                  
                  {request.status === 'approved' && request.executionStatus && (
                    <div className="mb-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        request.executionStatus === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : request.executionStatus === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {request.executionStatus === 'completed' 
                          ? '✓ Executed' 
                          : request.executionStatus === 'failed'
                          ? '✗ Failed'
                          : '⏳ Pending'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    {request.status === 'pending' ? (
                      <button
                        onClick={() => handleReviewRequest(request)}
                        disabled={processingRequests.has(request._id)}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${
                          processingRequests.has(request._id)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {processingRequests.has(request._id) ? 'Processing...' : 'Review'}
                      </button>
                    ) : (
                      <div className="text-xs text-gray-500">
                        {request.status === 'approved' ? 'Approved' : 'Rejected'}
                        {request.reviewedAt && (
                          <div className="text-gray-400">
                            {formatDate(request.reviewedAt)}
                          </div>
                        )}
                        {request.executionError && (
                          <div className="text-red-500 mt-1" title={request.executionError}>
                            Execution failed
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urgency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.requesterName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.requesterEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatRequestType(request.requestType)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {request.targetResourceName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {request.targetResourceType}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getUrgencyBadge(request.urgency)}>
                        {request.urgency}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={getStatusBadge(request.status)}>
                          {request.status}
                        </span>
                        {request.status === 'approved' && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            request.executionStatus === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : request.executionStatus === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {request.executionStatus === 'completed' 
                              ? '✓ Executed' 
                              : request.executionStatus === 'failed'
                              ? '✗ Failed'
                              : '⏳ Pending'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {request.status === 'pending' ? (
                        <button
                          onClick={() => handleReviewRequest(request)}
                          disabled={processingRequests.has(request._id)}
                          className={`font-medium ${
                            processingRequests.has(request._id)
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-blue-600 hover:text-blue-900'
                          }`}
                        >
                          {processingRequests.has(request._id) ? 'Processing...' : 'Review'}
                        </button>
                      ) : (
                        <div className="text-gray-500 text-xs">
                          <div>
                            {request.status === 'approved' ? 'Approved' : 'Rejected'}
                          </div>
                          {request.reviewedAt && (
                            <div className="text-gray-400">
                              {formatDate(request.reviewedAt)}
                            </div>
                          )}
                          {request.executionError && (
                            <div className="text-red-500 mt-1" title={request.executionError}>
                              Execution failed
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-500 text-center sm:text-left">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex justify-center sm:justify-end gap-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <ReviewRequestModal
          request={selectedRequest}
          onApprove={(notes) => handleApproveReject('approve', notes)}
          onReject={(notes) => handleApproveReject('reject', notes)}
          onClose={() => {
            setShowReviewModal(false)
            setSelectedRequest(null)
          }}
          loading={actionLoading}
        />
      )}
    </div>
  )
}

const ReviewRequestModal = ({ request, onApprove, onReject, onClose, loading }) => {
  const [reviewNotes, setReviewNotes] = useState('')

  const handleSubmit = (action) => {
    if (action === 'approve') {
      onApprove(reviewNotes)
    } else {
      onReject(reviewNotes)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Review Permission Request</h3>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requester</label>
              <p className="text-sm text-gray-900">{request.requesterName}</p>
              <p className="text-xs text-gray-500 break-all">{request.requesterEmail}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
              <p className="text-sm text-gray-900">
                {request.requestType.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Resource</label>
              <p className="text-sm text-gray-900 break-words">{request.targetResourceName}</p>
              <p className="text-xs text-gray-500">{request.targetResourceType}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                request.urgency === 'high' ? 'bg-red-100 text-red-800' :
                request.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {request.urgency}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-900 break-words">{request.reason}</p>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="reviewNotes" className="block text-sm font-medium text-gray-700 mb-2">
              Review Notes (Optional)
            </label>
            <textarea
              id="reviewNotes"
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Add any notes about your decision..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmit('reject')}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Reject'}
            </button>
            <button
              onClick={() => handleSubmit('approve')}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Approve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PermissionRequests