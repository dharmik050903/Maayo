import React, { useState, useEffect } from 'react'
import { getMilestonesCached } from '../services/cachedApiService'
import { escrowService } from '../services/escrowService'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'

const FreelancerMilestoneTracker = ({ projectId, projectTitle }) => {
  const { t } = useComprehensiveTranslation()
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completingMilestone, setCompletingMilestone] = useState(null)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [completionEvidence, setCompletionEvidence] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (projectId) {
      fetchMilestones()
    }
  }, [projectId])

  const fetchMilestones = async () => {
    try {
      console.log('🔄 FreelancerMilestoneTracker: Fetching milestones for project:', projectId)
      setLoading(true)
      setError(null)
      
      const result = await getMilestonesCached(projectId)
      console.log('📊 FreelancerMilestoneTracker: Milestone fetch result:', result)
      
      if (result.status) {
        const milestonesData = result.data.milestones || []
        console.log('✅ FreelancerMilestoneTracker: Milestones found:', milestonesData.length)
        console.log('📊 FreelancerMilestoneTracker: Milestone details:', milestonesData.map(m => ({
          title: m.title,
          status: m.status,
          index: m.index,
          fullObject: m // Show complete object structure
        })))
        setMilestones(milestonesData)
        
        if (milestonesData.length === 0) {
          setError('No milestones found for this project')
        }
      } else {
        console.log('❌ FreelancerMilestoneTracker: API returned error:', result.message)
        setError(result.message || 'Failed to fetch milestones')
      }
    } catch (error) {
      console.error('❌ FreelancerMilestoneTracker: Error fetching milestones:', error)
      console.error('❌ FreelancerMilestoneTracker: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      
      let errorMessage = error.message || 'Failed to fetch milestones'
      
      // Provide more specific error messages
      if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
        errorMessage = 'You do not have access to this project\'s milestones. You may not be assigned to this project.'
      } else if (error.message.includes('Not found')) {
        errorMessage = 'Project milestones not found. This project may not have milestones set up.'
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteMilestone = (milestone) => {
    setSelectedMilestone(milestone)
    setShowCompletionModal(true)
    setCompletionNotes('')
    setCompletionEvidence('')
  }

  const submitMilestoneCompletion = async () => {
    if (!selectedMilestone) return

    try {
      console.log('🚀 Submitting milestone completion:', {
        projectId,
        milestoneIndex: selectedMilestone.index,
        milestoneStatus: selectedMilestone.status,
        completionNotes,
        completionEvidence
      })
      
      setCompletingMilestone(selectedMilestone.index)
      const result = await escrowService.completeMilestone(
        projectId, 
        selectedMilestone.index, 
        completionNotes,
        completionEvidence
      )
      
      if (result.status) {
        setSuccessMessage('Milestone completion submitted successfully! Waiting for client approval.')
        setShowSuccessModal(true)
        setShowCompletionModal(false)
        fetchMilestones() // Refresh milestones
      } else {
        setErrorMessage(result.message || 'Failed to complete milestone')
        setShowErrorModal(true)
      }
    } catch (error) {
      console.error('Error completing milestone:', error)
      setErrorMessage(error.message || 'Failed to complete milestone')
      setShowErrorModal(true)
    } finally {
      setCompletingMilestone(null)
    }
  }

  const getMilestoneStatus = (milestone) => {
    console.log('🔍 getMilestoneStatus input:', milestone)
    
    // Backend uses is_completed: 1 for completed milestones
    if (milestone.is_completed === 1) {
      // Check if payment has been released
      if (milestone.payment_released === 1) {
        return 'completed' // Payment released
      } else {
        return 'pending_approval' // Completed but payment not released yet
      }
    }
    
    // Legacy support for string status fields (if they exist)
    if (milestone.status === 'completed') return 'completed'
    if (milestone.status === 'pending_approval') return 'pending_approval'
    if (milestone.status === 'in_progress') return 'in_progress'
    
    return 'pending' // Not completed yet
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'pending_approval': return 'text-yellow-600 bg-yellow-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅'
      case 'pending_approval': return '⏳'
      case 'in_progress': return '🔄'
      default: return '📋'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && getMilestoneStatus({ due_date: dueDate }) !== 'completed'
  }

  if (loading) {
    return (
      <div className="card p-6 bg-white/95">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet"></div>
          <span className="ml-3 text-coolgray">Loading milestones...</span>
        </div>
      </div>
    )
  }


  if (milestones.length === 0) {
    return (
      <div className="card p-6 bg-white/95">
        <h3 className="text-lg font-semibold text-graphite mb-4">📋 Project Milestones</h3>
        <div className="text-center py-8 text-yellow-700">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-lg mb-2">No Milestones Defined Yet</p>
          <p className="text-sm">Milestones will appear here once set up by the client</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-black">📋 Project Milestones</h3>
        <div className="text-sm text-black font-semibold">
          {milestones.filter(m => getMilestoneStatus(m) === 'completed').length} / {milestones.length} completed
        </div>
      </div>

      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const status = getMilestoneStatus(milestone)
          const overdue = isOverdue(milestone.due_date)
          
          console.log(`🔍 Milestone ${index + 1} Debug:`, {
            title: milestone.title,
            status: milestone.status,
            computedStatus: status,
            index: milestone.index
          })
          
          return (
        <div
          key={index}
          className={`group relative overflow-hidden border-2 rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
            status === 'completed'
              ? 'border-green-200 bg-gradient-to-r from-green-50 to-green-100/50'
              : status === 'pending_approval'
              ? 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100/50'
              : 'border-gray-200 bg-gradient-to-r from-white to-gray-50/50'
          }`}
        >
              {/* Status indicator bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                status === 'completed' 
                  ? 'bg-gradient-to-r from-green-400 to-green-600' 
                  : status === 'pending_approval'
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                  : 'bg-gradient-to-r from-gray-300 to-gray-400'
              }`}></div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1">
              {/* Enhanced Header - Mobile Optimized */}
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-sm ${
                  status === 'completed'
                    ? 'bg-gradient-to-r from-green-100 to-green-200'
                    : status === 'pending_approval'
                    ? 'bg-gradient-to-r from-yellow-100 to-yellow-200'
                    : 'bg-gradient-to-r from-gray-100 to-gray-200'
                }`}>
                  <span className="text-lg sm:text-xl">{getStatusIcon(status)}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm sm:text-base font-bold text-black mb-1" style={{ color: '#000000' }}>{milestone.title}</h4>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                      {status.replace('_', ' ')}
                    </span>
                    {overdue && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold text-red-600 bg-red-100 border border-red-200">
                        ⚠️ Overdue
                      </span>
                    )}
                  </div>
                </div>
              </div>
                  
              {/* Description - Mobile Optimized */}
              <p className="text-xs sm:text-sm text-black mb-2 sm:mb-3 leading-relaxed font-bold" style={{ color: '#000000' }}>{milestone.description}</p>
              
              {/* Enhanced Info Cards - Mobile Optimized */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-3">
                <div className="flex items-center p-2 sm:p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-black font-bold" style={{ color: '#000000' }}>Amount</p>
                    <p className="font-bold text-sm sm:text-lg text-black" style={{ color: '#000000' }}>{formatCurrency(milestone.amount)}</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 sm:p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 0h4m-4 0H8m4 0h4m-4 8v4m0-8v8" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-black font-bold" style={{ color: '#000000' }}>Due Date</p>
                    <p className={`font-bold text-sm sm:text-lg ${overdue ? 'text-red-600' : 'text-black'}`} style={{ color: overdue ? '#dc2626' : '#000000' }}>
                      {formatDate(milestone.due_date)}
                    </p>
                  </div>
                </div>
              </div>

                  {/* Completion Notes */}
                  {milestone.completion_notes && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-200">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold text-blue-800 mb-1">Completion Notes</p>
                          <p className="text-sm text-blue-700">{milestone.completion_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Action Section */}
                <div className="ml-4 flex-shrink-0">
                  {status === 'pending' && (
                    <button
                      onClick={() => handleCompleteMilestone({ ...milestone, index })}
                      className="px-6 py-3 bg-gradient-to-r from-violet to-purple text-white rounded-xl hover:from-violet/90 hover:to-purple/90 transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Complete Milestone
                    </button>
                  )}
                  
                  {status === 'pending_approval' && (
                    <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-yellow-100/50 rounded-xl border border-yellow-200">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-200 to-yellow-300 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-yellow-700 text-sm font-semibold mb-1">Pending Approval</div>
                      <div className="text-xs text-yellow-600">Waiting for client review</div>
                    </div>
                  )}
                  
                  {status === 'completed' && (
                    <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl border border-green-200">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-200 to-green-300 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-green-700 text-sm font-semibold mb-1">Completed</div>
                      <div className="text-xs text-green-600">Payment processed</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Milestone Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-graphite mb-4">
              Complete Milestone: {selectedMilestone?.title}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">
                  Completion Notes *
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Describe what you've completed for this milestone..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet text-sm text-graphite placeholder-gray-500"
                  rows="4"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-graphite mb-1">
                  Evidence/Proof (Optional)
                </label>
                <textarea
                  value={completionEvidence}
                  onChange={(e) => setCompletionEvidence(e.target.value)}
                  placeholder="Links to files, screenshots, or other proof of completion..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet text-sm text-graphite placeholder-gray-500"
                  rows="3"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your completion will be submitted for client approval. 
                  Once approved, payment will be processed automatically.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitMilestoneCompletion}
                disabled={!completionNotes.trim() || completingMilestone}
                className="flex-1 px-4 py-2 bg-violet text-white rounded-lg hover:bg-violet/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {completingMilestone ? 'Submitting...' : 'Submit Completion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="text-center">
              <div className="text-green-500 text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-graphite mb-4">Success!</h3>
              <p className="text-coolgray mb-6">{successMessage}</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">❌</div>
              <h3 className="text-xl font-semibold text-graphite mb-4">Error</h3>
              <p className="text-coolgray mb-6">{errorMessage}</p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FreelancerMilestoneTracker
