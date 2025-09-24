import React, { useState, useEffect } from 'react'
import adminService from '../services/adminService'

const PermissionRequestsPanel = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    fetchRequests()
    // Set up auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(fetchRequests, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchRequests = async () => {
    try {
      setError('')
      const response = await adminService.getPermissionRequests()
      setRequests(response.data || [])
    } catch (error) {
      console.error('Error fetching permission requests:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestAction = async (requestId, action, reason = '') => {
    try {
      setActionLoading(requestId)
      await adminService.handlePermissionRequest(requestId, action, reason)
      
      // Update local state
      setRequests(prev => prev.map(req => 
        req._id === requestId 
          ? { ...req, status: action, handledAt: new Date(), handlerReason: reason }
          : req
      ))
      
      // Show success message
      alert(`Request ${action} successfully!`)
    } catch (error) {
      console.error(`Error ${action} request:`, error)
      alert(`Failed to ${action} request: ${error.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const getRequestTypeLabel = (type) => {
    switch (type) {
      case 'edit_user': return 'Edit User'
      case 'delete_user': return 'Delete User'
      case 'edit_project': return 'Edit Project'
      case 'delete_project': return 'Delete Project'
      case 'edit_bid': return 'Edit Bid'
      case 'delete_bid': return 'Delete Bid'
      case 'manage_freelancer': return 'Manage Freelancer'
      default: return type.replace('_', ' ').toUpperCase()
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const pendingRequests = requests.filter(req => req.status === 'pending')
  const handledRequests = requests.filter(req => req.status !== 'pending')

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">Loading permission requests...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Permission Requests</h2>
          <p className="text-gray-600 mt-1">Manage access requests from other administrators</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            {pendingRequests.length} Pending
          </span>
          <button
            onClick={fetchRequests}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Requests</h3>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {request.status.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {getRequestTypeLabel(request.type)}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Requested by:</strong> {request.requesterName} ({request.requesterEmail})
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Resource:</strong> {request.resourceName || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Reason:</strong> {request.reason}
                      </p>
                      <p className="text-xs text-gray-500">
                        Requested: {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleRequestAction(request._id, 'approved')}
                      disabled={actionLoading === request._id}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === request._id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Reason for rejection (optional):')
                        if (reason !== null) {
                          handleRequestAction(request._id, 'rejected', reason)
                        }
                      }}
                      disabled={actionLoading === request._id}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Handled Requests */}
      {handledRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Handled Requests</h3>
          <div className="space-y-3">
            {handledRequests.slice(0, 10).map((request) => (
              <div key={request._id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {request.status.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {getRequestTypeLabel(request.type)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {request.requesterName} • {new Date(request.handledAt || request.createdAt).toLocaleString()}
                    </p>
                    {request.handlerReason && (
                      <p className="text-xs text-gray-500 mt-1">
                        <strong>Note:</strong> {request.handlerReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900">No permission requests</p>
          <p className="text-gray-500 mt-1">All administrators have the necessary permissions</p>
        </div>
      )}
    </div>
  )
}

export default PermissionRequestsPanel