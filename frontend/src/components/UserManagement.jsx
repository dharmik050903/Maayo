import React, { useState, useEffect } from 'react'
import adminService from '../services/adminService'
import PermissionRequestModal from './PermissionRequestModal'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    user_type: 'all',
    page: 1,
    limit: 10
  })
  const [pagination, setPagination] = useState({})
  const [selectedUser, setSelectedUser] = useState(null)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Permission request states
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [permissionRequestType, setPermissionRequestType] = useState('')
  const [permissionTarget, setPermissionTarget] = useState(null)
  const [permissionRequestData, setPermissionRequestData] = useState({})
  const [permissionLoading, setPermissionLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await adminService.getUsers(filters)
      setUsers(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error('Error fetching users:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSuspendUser = async (reason, duration) => {
    try {
      setActionLoading(true)
      await adminService.suspendUser(selectedUser._id, reason, duration)
      fetchUsers()
      setShowSuspendModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error suspending user:', error)
      
      // Check if it's a permission error
      if (error.message.includes('Access denied') || 
          error.message.includes('Insufficient permissions') ||
          error.message.includes('permission')) {
        // Close the suspend modal and open permission request
        setShowSuspendModal(false)
        requestPermissionFor('suspend_user', selectedUser, 'suspend', reason, duration)
      } else {
        setError(error.message)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleActivateUser = async (userId) => {
    try {
      setActionLoading(true)
      await adminService.activateUser(userId)
      fetchUsers()
    } catch (error) {
      console.error('Error activating user:', error)
      
      // Check if it's a permission error
      if (error.message.includes('Access denied') || 
          error.message.includes('Insufficient permissions') ||
          error.message.includes('permission')) {
        // Find the user and trigger permission request
        const user = users.find(u => u._id === userId)
        if (user) {
          requestPermissionFor('unsuspend_user', user)
        }
      } else {
        setError(error.message)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    const reason = prompt('Please provide a reason for deleting this user:')
    if (!reason) return

    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        setActionLoading(true)
        await adminService.deleteUser(userId, reason)
        fetchUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
        
        // Check if it's a permission error
        if (error.message.includes('Access denied') || 
            error.message.includes('Insufficient permissions') ||
            error.message.includes('permission')) {
          // Find the user and trigger permission request
          const user = users.find(u => u._id === userId)
          if (user) {
            requestPermissionFor('delete_user', user)
          }
        } else {
          setError(error.message)
        }
      } finally {
        setActionLoading(false)
      }
    }
  }

  const handleEditUser = async (updatedUserData) => {
    try {
      setActionLoading(true)
      await adminService.updateUser(selectedUser._id, updatedUserData)
      fetchUsers()
      setShowEditModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error updating user:', error)
      
      // Check if it's a permission error
      if (error.message.includes('Access denied') || 
          error.message.includes('Insufficient permissions') ||
          error.message.includes('permission')) {
        // Close the edit modal and open permission request
        setShowEditModal(false)
        requestPermissionFor('edit_user', selectedUser, 'edit', null, null, updatedUserData)
      } else {
        setError(error.message)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }))
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  // Permission request handlers
  const handlePermissionRequest = async (requestData) => {
    try {
      setPermissionLoading(true)
      await adminService.submitPermissionRequest({
        type: requestData.type,
        resource: requestData.resource,
        reason: requestData.reason,
        urgency: requestData.urgency || 'medium'
      })
      
      setShowPermissionModal(false)
      setPermissionRequestType('')
      setPermissionTarget(null)
      
      alert('Permission request sent successfully! The Super Admin will review your request.')
    } catch (error) {
      console.error('Error submitting permission request:', error)
      alert('Failed to submit permission request: ' + error.message)
    } finally {
      setPermissionLoading(false)
    }
  }

  const requestPermissionFor = (action, user, actionType = null, reason = null, duration = null, updateData = null) => {
    setPermissionRequestType(action)
    setPermissionTarget(user)
    // Store additional data if needed for the permission request
    setPermissionRequestData({
      actionType,
      reason,
      duration,
      updateData
    })
    setShowPermissionModal(true)
  }

  // Modified action handlers to check permissions
  const handleEditUserAction = (user) => {
    try {
      setSelectedUser(user)
      setShowEditModal(true)
    } catch (error) {
      if (error.message.includes('permission') || error.message.includes('access')) {
        requestPermissionFor('edit_user', user)
      } else {
        setError(error.message)
      }
    }
  }

  const handleDeleteUserAction = (user) => {
    try {
      handleDeleteUser(user._id)
    } catch (error) {
      if (error.message.includes('permission') || error.message.includes('access')) {
        requestPermissionFor('delete_user', user)
      } else {
        setError(error.message)
      }
    }
  }

  if (error) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-3 rounded">
          <h3 className="font-bold text-sm sm:text-base">Error</h3>
          <p className="text-xs sm:text-sm">{error}</p>
          <button
            onClick={() => { setError(''); fetchUsers(); }}
            className="mt-2 bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (loading && users.length === 0) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">Loading users...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 min-h-screen bg-gray-50">
      {/* Header and Search */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 mb-6 border border-blue-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">User Management</h1>
          <button 
            onClick={fetchUsers}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <input
            type="text"
            placeholder="Search users..."
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-white shadow-sm transition-all duration-200"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
          <select
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-white shadow-sm transition-all duration-200"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
          <select
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-white shadow-sm transition-all duration-200"
            value={filters.user_type}
            onChange={(e) => handleFilterChange('user_type', e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="freelancer">Freelancers</option>
            <option value="client">Clients</option>
          </select>
          <select
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-white shadow-sm transition-all duration-200"
            value={filters.limit}
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length > 0 ? (
                users.map((user, index) => (
                  <tr key={user._id || index} className="hover:bg-blue-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {(user.fullName || user.first_name || user.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.fullName || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'freelancer' 
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role || 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        (user.is_suspended || user.status === 0)
                          ? 'bg-red-100 text-red-800'
                          : user.status === 1 || user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(user.is_suspended || user.status === 0) ? 'Suspended' : user.status === 1 || user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {(user.is_suspended || user.status === 0) ? (
                          <button
                            onClick={() => handleActivateUser(user._id)}
                            disabled={actionLoading}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50 font-medium transition-colors duration-200"
                          >
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowSuspendModal(true);
                            }}
                            disabled={actionLoading}
                            className="text-yellow-600 hover:text-yellow-800 disabled:opacity-50 font-medium transition-colors duration-200"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => handleEditUserAction(user)}
                          disabled={actionLoading}
                          className="text-blue-600 hover:text-blue-800 disabled:opacity-50 font-medium transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUserAction(user)}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 font-medium transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No users found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, pagination.totalUsers)} of {pagination.totalUsers} results
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Previous
            </button>
            {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
              const pageNumber = Math.max(1, filters.page - 2) + index;
              if (pageNumber > pagination.totalPages) return null;
              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-3 py-1 text-sm border rounded-lg transition-colors duration-200 ${
                    pageNumber === filters.page
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page >= pagination.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Edit User</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={selectedUser.fullName || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, fullName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={selectedUser.email || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={selectedUser.role || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="client">Client</option>
                    <option value="freelancer">Freelancer</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleEditUser(selectedUser)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend User Modal */}
      {showSuspendModal && selectedUser && (
        <SuspendUserModal
          user={selectedUser}
          onConfirm={handleSuspendUser}
          onCancel={() => {
            setShowSuspendModal(false);
            setSelectedUser(null);
          }}
          loading={actionLoading}
        />
      )}

      {/* Permission Request Modal */}
      <PermissionRequestModal
        isOpen={showPermissionModal}
        onClose={() => {
          setShowPermissionModal(false)
          setPermissionRequestType('')
          setPermissionTarget(null)
        }}
        requestType={permissionRequestType}
        targetResource={permissionTarget}
        onSubmitRequest={handlePermissionRequest}
        loading={permissionLoading}
      />
    </div>
  )
}

const SuspendUserModal = ({ user, onConfirm, onCancel, loading }) => {
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState('7')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!reason.trim()) return
    onConfirm(reason, parseInt(duration))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md border border-gray-200 shadow-2xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Suspend User: {user?.fullName || user?.email}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for suspension *
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="Please provide a reason for suspension..."
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (days)
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
              <option value="0">Permanent</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all duration-200"
            >
              {loading ? 'Suspending...' : 'Suspend User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserManagement