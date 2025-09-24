import React, { useState } from 'react'

const PermissionRequestModal = ({ 
  isOpen, 
  onClose, 
  requestType, 
  targetResource, 
  onSubmitRequest,
  loading = false 
}) => {
  const [reason, setReason] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (reason.trim() && onSubmitRequest) {
      onSubmitRequest({
        type: requestType,
        resource: targetResource,
        reason: reason.trim()
      })
    }
  }

  const getRequestTitle = () => {
    switch (requestType) {
      case 'edit_user': return 'Request User Edit Permission'
      case 'delete_user': return 'Request User Delete Permission'
      case 'edit_project': return 'Request Project Edit Permission'
      case 'delete_project': return 'Request Project Delete Permission'
      case 'edit_bid': return 'Request Bid Edit Permission'
      case 'delete_bid': return 'Request Bid Delete Permission'
      case 'manage_freelancer': return 'Request Freelancer Management Permission'
      default: return 'Request Permission'
    }
  }

  const getRequestDescription = () => {
    switch (requestType) {
      case 'edit_user': 
        return `You are requesting permission to edit user: ${targetResource?.name || targetResource?.email || 'Unknown User'}`
      case 'delete_user': 
        return `You are requesting permission to delete user: ${targetResource?.name || targetResource?.email || 'Unknown User'}`
      case 'edit_project':
        return `You are requesting permission to edit project: ${targetResource?.title || 'Unknown Project'}`
      case 'delete_project':
        return `You are requesting permission to delete project: ${targetResource?.title || 'Unknown Project'}`
      case 'edit_bid':
        return `You are requesting permission to edit bid: ${targetResource?.id || 'Unknown Bid'}`
      case 'delete_bid':
        return `You are requesting permission to delete bid: ${targetResource?.id || 'Unknown Bid'}`
      case 'manage_freelancer':
        return `You are requesting permission to manage freelancer: ${targetResource?.name || 'Unknown Freelancer'}`
      default: 
        return 'You are requesting permission to perform this action'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {getRequestTitle()}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Permission Required</p>
                <p>{getRequestDescription()}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Request <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why you need this permission..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="4"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                This request will be sent to the Super Admin for approval.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !reason.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PermissionRequestModal