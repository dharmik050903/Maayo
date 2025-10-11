import React, { useState, useEffect, useRef } from 'react'
import { bidService } from '../services/bidService'
import Button from './Button'
import { formatBudget } from '../utils/currency'
import confirmationService from '../services/confirmationService.jsx'
import messagingService from '../services/messagingService'

const MyBids = () => {
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedBid, setSelectedBid] = useState(null)
  const [updateData, setUpdateData] = useState({})
  // Removed local messaging state - using messagingService instead
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      console.log('MyBids: useEffect running (first time)')
      fetchMyBids()
    } else {
      console.log('MyBids: Skipping duplicate initialization due to StrictMode')
    }
  }, [statusFilter])

  const fetchMyBids = async () => {
    try {
      setLoading(true)
      setError('')
      
      const filter = statusFilter === 'all' ? null : statusFilter
      const response = await bidService.getFreelancerBids(null, filter)
      
      if (response.status) {
        setBids(response.data)
      } else {
        setError(response.message || 'Failed to fetch your bids')
      }
    } catch (error) {
      console.error('Error fetching bids:', error)
      setError(error.message || 'Failed to fetch your bids')
    } finally {
      setLoading(false)
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
        fetchMyBids() // Refresh the list
      } else {
        setError(response.message || 'Failed to withdraw bid')
      }
    } catch (error) {
      console.error('Error withdrawing bid:', error)
      setError(error.message || 'Failed to withdraw bid')
    }
  }

  const handleUpdateBid = (bid) => {
    setSelectedBid(bid)
    setUpdateData({
      bid_amount: bid.bid_amount,
      proposed_duration: bid.proposed_duration,
      cover_letter: bid.cover_letter,
      start_date: bid.start_date || '',
      availability_hours: bid.availability_hours || 40
    })
    setShowUpdateModal(true)
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const response = await bidService.updateBid(selectedBid._id, updateData)
      if (response.status) {
        setShowUpdateModal(false)
        setSelectedBid(null)
        setUpdateData({})
        fetchMyBids() // Refresh the list
      } else {
        setError(response.message || 'Failed to update bid')
      }
    } catch (error) {
      console.error('Error updating bid:', error)
      setError(error.message || 'Failed to update bid')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'withdrawn': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'accepted': return '✅'
      case 'rejected': return '❌'
      case 'withdrawn': return '↩️'
      default: return '❓'
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
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint mx-auto mb-4"></div>
        <p className="text-white/70">Loading your bids...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 max-w-2xl mx-auto">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold">Error loading bids</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchMyBids}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
            My <span className="text-mint">Bids</span>
          </h2>
          <p className="text-white/80 text-sm sm:text-base">
            {bids.length} bid{bids.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 sm:px-4 py-2 bg-white text-graphite rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent border border-gray-300 text-sm sm:text-base w-full sm:w-auto"
            style={{ color: '#374151' }}
          >
            <option value="all" style={{ color: '#374151', backgroundColor: 'white' }}>All Status</option>
            <option value="pending" style={{ color: '#374151', backgroundColor: 'white' }}>Pending</option>
            <option value="accepted" style={{ color: '#374151', backgroundColor: 'white' }}>Accepted</option>
            <option value="rejected" style={{ color: '#374151', backgroundColor: 'white' }}>Rejected</option>
            <option value="withdrawn" style={{ color: '#374151', backgroundColor: 'white' }}>Withdrawn</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMyBids}
            className="border-white text-white hover:bg-white hover:text-graphite w-full sm:w-auto text-sm sm:text-base px-3 sm:px-4 py-2"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Bids List */}
      {bids.length === 0 ? (
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-12 text-center">
          <svg className="w-20 h-20 mx-auto mb-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">No Bids Yet</h3>
          <p className="text-gray-600 mb-4 text-lg">You haven't submitted any bids yet.</p>
          <p className="text-gray-500 mb-8">Browse projects and submit your first bid to get started!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="accent" className="px-8 py-3 rounded-xl">
              Browse Projects
            </Button>
            <Button variant="outline" className="px-8 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl">
              Submit New Bid
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {bids.map((bid) => (
            <div key={bid._id} className="card p-6 bg-white/95 hover:bg-white transition-colors rounded-3xl shadow-lg">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                {/* Bid Info */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <h4 className="text-xl font-semibold text-graphite">
                      {bid.project_id?.title || 'Project Title Not Available'}
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bid.status)}`}>
                      {getStatusIcon(bid.status)} {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-mint/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-coolgray">Your Bid</p>
                        <p className="font-semibold text-mint">{formatBudget(bid.bid_amount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-coral/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-coolgray">Duration</p>
                        <p className="font-semibold text-coral">{bid.proposed_duration} days</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-violet/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-coolgray">Availability</p>
                        <p className="font-semibold text-violet">{bid.availability_hours}h/week</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h5 className="font-semibold text-graphite mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Your Cover Letter
                    </h5>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-coolgray text-sm leading-relaxed line-clamp-3">{bid.cover_letter}</p>
                    </div>
                  </div>
                  
                  {bid.project_id?.description && (
                    <div className="mb-6">
                      <h5 className="font-semibold text-graphite mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Project Description
                      </h5>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-coolgray text-sm leading-relaxed line-clamp-2">
                          {bid.project_id.description}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {bid.milestones && bid.milestones.length > 0 && (
                    <div className="mb-6">
                      <h5 className="font-semibold text-graphite mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Your Proposed Milestones
                      </h5>
                      <div className="space-y-3">
                        {bid.milestones.slice(0, 2).map((milestone, index) => (
                          <div key={index} className="bg-gradient-to-r from-violet/10 to-mint/10 p-4 rounded-lg border border-violet/20">
                            <div className="flex justify-between items-start">
                              <div>
                                <h6 className="font-semibold text-graphite">{milestone.title}</h6>
                                {milestone.description && (
                                  <p className="text-sm text-coolgray mt-1">{milestone.description}</p>
                                )}
                              </div>
                              <span className="font-bold text-mint text-lg">{formatBudget(milestone.amount)}</span>
                            </div>
                          </div>
                        ))}
                        {bid.milestones.length > 2 && (
                          <p className="text-sm text-coolgray text-center py-2">
                            +{bid.milestones.length - 2} more milestone{bid.milestones.length - 2 !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center text-xs text-coolgray bg-gray-50 p-3 rounded-lg">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Submitted: {formatDate(bid.createdAt)}</span>
                    {bid.client_decision_date && (
                      <span className="ml-4 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Decision: {formatDate(bid.client_decision_date)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {bid.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:min-w-[200px]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateBid(bid)}
                      className="flex-1 min-w-[120px] w-full sm:w-auto px-4 py-3 text-sm font-semibold border-violet text-violet hover:bg-violet hover:text-white transition-all duration-200 rounded-xl"
                    >
                      Update Bid
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleWithdrawBid(bid._id)}
                      className="flex-1 min-w-[120px] border-coral text-coral hover:bg-coral hover:text-white w-full sm:w-auto px-4 py-3 text-sm font-semibold transition-all duration-200 rounded-xl"
                    >
                      Withdraw Bid
                    </Button>
                  </div>
                )}

                {bid.status === 'accepted' && (
                  <div className="w-full sm:min-w-[200px]">
                    <div className="bg-gradient-to-r from-green-50 to-mint/10 border border-green-200 rounded-lg p-4 mb-3">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-green-600 text-lg">🎉</span>
                        </div>
                        <p className="text-green-800 font-semibold text-sm">Congratulations!</p>
                      </div>
                      <p className="text-green-700 text-xs">Your bid has been accepted. Start messaging the client!</p>
                    </div>
                    <Button
                      variant="accent"
                      size="sm"
                      className="w-full bg-mint text-white hover:bg-mint/90 rounded-xl"
                      onClick={() => {
                        console.log('MyBids: Message button clicked for bid:', bid)
                        console.log('MyBids: Client info:', {
                          id: bid.client_id?._id || bid.client_id,
                          name: bid.client_name || 'Client'
                        })
                        console.log('MyBids: Project info:', {
                          id: bid.project_id,
                          title: bid.project_title || 'Project'
                        })
                        console.log('MyBids: Bid ID:', bid._id)
                        
                        messagingService.show(
                          {
                            id: bid.client_id?._id || bid.client_id,
                            name: bid.client_name || 'Client'
                          },
                          {
                            id: bid.project_id,
                            title: bid.project_title || 'Project'
                          },
                          bid._id
                        )
                      }}
                    >
                      Message Client
                    </Button>
                  </div>
                )}

                {bid.status === 'rejected' && bid.client_message && (
                  <div className="w-full sm:min-w-[200px]">
                    <div className="bg-gradient-to-r from-red-50 to-coral/10 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-red-600 text-lg">💬</span>
                        </div>
                        <p className="text-red-800 font-semibold text-sm">Client Feedback</p>
                      </div>
                      <p className="text-red-700 text-xs">{bid.client_message}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-graphite">Update Bid</h3>
              <button
                onClick={() => {
                  setShowUpdateModal(false)
                  setSelectedBid(null)
                  setUpdateData({})
                }}
                className="text-coolgray hover:text-graphite transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdateSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-graphite mb-2">
                    Bid Amount ($) *
                  </label>
                  <input
                    type="number"
                    value={updateData.bid_amount || ''}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, bid_amount: e.target.value }))}
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent text-graphite"
                    placeholder="Enter your bid amount"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-graphite mb-2">
                    Proposed Duration (days) *
                  </label>
                  <input
                    type="number"
                    value={updateData.proposed_duration || ''}
                    onChange={(e) => {
                      // Only allow whole numbers for duration
                      const cleanValue = e.target.value.replace(/[^\d]/g, '')
                      setUpdateData(prev => ({ ...prev, proposed_duration: cleanValue }))
                    }}
                    min="1"
                    step="1"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent text-graphite"
                    placeholder="Enter duration in days (whole numbers only)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-graphite mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={updateData.start_date || ''}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, start_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent text-graphite"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-graphite mb-2">
                    Availability (hours/week)
                  </label>
                  <input
                    type="number"
                    value={updateData.availability_hours || ''}
                    onChange={(e) => {
                      // Only allow whole numbers for availability hours
                      const cleanValue = e.target.value.replace(/[^\d]/g, '')
                      setUpdateData(prev => ({ ...prev, availability_hours: cleanValue }))
                    }}
                    min="1"
                    max="168"
                    step="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent text-graphite"
                    placeholder="Hours per week (whole numbers only)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-graphite mb-2">
                  Cover Letter *
                </label>
                <textarea
                  value={updateData.cover_letter || ''}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, cover_letter: e.target.value }))}
                  rows="5"
                  maxLength="2000"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent text-graphite resize-none"
                  placeholder="Describe your approach and why you're the best fit for this project..."
                />
                <p className="text-sm text-coolgray mt-2">
                  {(updateData.cover_letter || '').length}/2000 characters
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUpdateModal(false)
                    setSelectedBid(null)
                    setUpdateData({})
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  type="submit"
                  className="px-8 w-full sm:w-auto"
                >
                  Update Bid
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Messaging handled by messagingService */}
    </div>
  )
}

export default MyBids