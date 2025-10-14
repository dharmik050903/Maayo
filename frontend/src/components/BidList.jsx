import React, { useState, useEffect, useRef } from 'react'
import { bidService } from '../services/bidService'
import { formatBudget } from '../utils/currency'
import { getSafeUrl } from '../utils/urlValidation'
import confirmationService from '../services/confirmationService.jsx'
import AcceptBidModal from './AcceptBidModal'

const BidList = ({ projectId, userRole, onBidAction, project }) => {
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedBid, setSelectedBid] = useState(null)
  const [rejectMessage, setRejectMessage] = useState('')
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [bidToAccept, setBidToAccept] = useState(null)
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      console.log('BidList: useEffect running (first time)')
      fetchBids()
    } else {
      console.log('BidList: Skipping duplicate initialization due to StrictMode')
    }
  }, [projectId, statusFilter])

  const fetchBids = async () => {
    try {
      setLoading(true)
      setError('')
      
      const filter = statusFilter === 'all' ? null : statusFilter
      const response = await bidService.getProjectBids(projectId, filter)
      
      if (response.status) {
        setBids(response.data)
      } else {
        setError(response.message || 'Failed to fetch bids')
      }
    } catch (error) {
      console.error('Error fetching bids:', error)
      setError(error.message || 'Failed to fetch bids')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptBid = async (bidId) => {
    const bid = bids.find(b => b._id === bidId)
    if (bid) {
      setBidToAccept(bid)
      setShowAcceptModal(true)
    }
  }

  const handleAcceptSuccess = () => {
    setShowAcceptModal(false)
    setBidToAccept(null)
    onBidAction?.('accepted', 'Bid accepted and payment completed successfully!')
    fetchBids() // Refresh the list
  }

  const handleRejectBid = async (bidId, message = '') => {
    try {
      const response = await bidService.rejectBid(bidId, message)
      if (response.status) {
        onBidAction?.('rejected', response.message)
        fetchBids() // Refresh the list
      } else {
        setError(response.message || 'Failed to reject bid')
      }
    } catch (error) {
      console.error('Error rejecting bid:', error)
      setError(error.message || 'Failed to reject bid')
    } finally {
      setShowRejectModal(false)
      setSelectedBid(null)
      setRejectMessage('')
    }
  }

  const handleWithdrawBid = async (bidId) => {
    const confirmed = await confirmationService.confirm(
      'Are you sure you want to withdraw this bid?',
      'Withdraw Bid'
    )
    if (!confirmed) {
      return
    }

    try {
      const response = await bidService.withdrawBid(bidId)
      if (response.status) {
        onBidAction?.('withdrawn', response.message)
        fetchBids() // Refresh the list
      } else {
        setError(response.message || 'Failed to withdraw bid')
      }
    } catch (error) {
      console.error('Error withdrawing bid:', error)
      setError(error.message || 'Failed to withdraw bid')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'pending_payment': return 'bg-orange-100 text-orange-800'
      case 'withdrawn': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint"></div>
        <span className="ml-2 text-gray-600">Loading bids...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>{error}</p>
        <button
          onClick={fetchBids}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Project Bids</h3>
          <p className="text-gray-600 text-sm">
            {bids.length} bid{bids.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
          
          <button
            onClick={fetchBids}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Bids List */}
      {bids.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No bids found for this project.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <div key={bid._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                {/* Bid Info */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                    <h4 className="font-semibold text-gray-800">
                      {bid.freelancer_id?.first_name} {bid.freelancer_id?.last_name}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bid.status)}`}>
                      {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-600">Bid Amount:</span>
                      <span className="ml-2 font-semibold text-green-600">{formatBudget(bid.bid_amount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <span className="ml-2 font-semibold">{bid.proposed_duration} days</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Availability:</span>
                      <span className="ml-2 font-semibold">{bid.availability_hours}h/week</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 mb-2">Cover Letter:</h5>
                    <p className="text-gray-600 text-sm leading-relaxed">{bid.cover_letter}</p>
                  </div>
                  
                  {/* Resume and Portfolio Links */}
                  {bid.freelancer_info && (bid.freelancer_info.resume_link || bid.freelancer_info.github_link) && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 mb-2">Documents & Links:</h5>
                      <div className="space-y-2">
                        {bid.freelancer_info.resume_link && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <a 
                              href={getSafeUrl(bid.freelancer_info.resume_link)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline text-sm"
                            >
                              View Resume
                            </a>
                          </div>
                        )}
                        {bid.freelancer_info.github_link && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <a 
                              href={getSafeUrl(bid.freelancer_info.github_link)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-gray-800 hover:text-gray-600 underline text-sm"
                            >
                              View GitHub Profile
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {bid.start_date && (
                    <div className="mb-4">
                      <span className="text-gray-600 text-sm">Preferred Start Date: </span>
                      <span className="text-sm font-medium">{formatDate(bid.start_date)}</span>
                    </div>
                  )}
                  
                  {bid.milestones && bid.milestones.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 mb-2">Proposed Milestones:</h5>
                      <div className="space-y-2">
                        {bid.milestones.map((milestone, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h6 className="font-medium text-gray-800">{milestone.title}</h6>
                                {milestone.description && (
                                  <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                                )}
                              </div>
                              <span className="font-semibold text-green-600">{formatBudget(milestone.amount)}</span>
                            </div>
                            {milestone.due_date && (
                              <p className="text-xs text-gray-500 mt-1">
                                Due: {formatDate(milestone.due_date)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Submitted: {formatDate(bid.createdAt)}
                    {bid.client_decision_date && (
                      <span className="ml-4">
                        Decision: {formatDate(bid.client_decision_date)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {userRole === 'client' && bid.status === 'pending' && (
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <button
                      onClick={() => handleAcceptBid(bid._id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Accept Bid
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBid(bid)
                        setShowRejectModal(true)
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Reject Bid
                    </button>
                  </div>
                )}

                {userRole === 'client' && bid.status === 'pending_payment' && (
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <button
                      onClick={() => handleAcceptBid(bid._id)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                    >
                      💳 Complete Payment
                    </button>
                  </div>
                )}

                {userRole === 'freelancer' && bid.status === 'pending' && (
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <button
                      onClick={() => handleWithdrawBid(bid._id)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Withdraw Bid
                    </button>
                  </div>
                )}

                {bid.client_message && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h6 className="font-medium text-yellow-800 mb-1">Client Message:</h6>
                    <p className="text-sm text-yellow-700">{bid.client_message}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Bid</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject this bid from {selectedBid.freelancer_id?.first_name} {selectedBid.freelancer_id?.last_name}?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Message (Optional)
              </label>
              <textarea
                value={rejectMessage}
                onChange={(e) => setRejectMessage(e.target.value)}
                rows="3"
                maxLength="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent"
                placeholder="Provide feedback to the freelancer..."
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedBid(null)
                  setRejectMessage('')
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectBid(selectedBid._id, rejectMessage)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject Bid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accept Bid Modal */}
      {showAcceptModal && bidToAccept && project && (
        <AcceptBidModal
          bid={bidToAccept}
          project={project}
          onClose={() => {
            setShowAcceptModal(false)
            setBidToAccept(null)
          }}
          onSuccess={handleAcceptSuccess}
        />
      )}
    </div>
  )
}

export default BidList

