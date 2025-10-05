import React, { useState, useEffect } from 'react'
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
      
      const result = await escrowService.getMilestones(projectId)
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
    <div className="card p-6 bg-white/95">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-graphite">📋 Project Milestones</h3>
        <div className="text-sm text-coolgray">
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
              className={`border rounded-lg p-4 transition-all duration-200 ${
                status === 'completed' 
                  ? 'border-green-200 bg-green-50' 
                  : status === 'pending_approval'
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{getStatusIcon(status)}</span>
                    <h4 className="font-medium text-graphite">{milestone.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {status.replace('_', ' ')}
                    </span>
                    {overdue && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100">
                        Overdue
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-coolgray mb-3">{milestone.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-coolgray">💰</span>
                      <span className="font-medium text-graphite">{formatCurrency(milestone.amount)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-coolgray">📅</span>
                      <span className={`${overdue ? 'text-red-600' : 'text-coolgray'}`}>
                        Due: {formatDate(milestone.due_date)}
                      </span>
                    </div>
                  </div>

                  {milestone.completion_notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-coolgray">
                        <strong>Completion Notes:</strong> {milestone.completion_notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  {status === 'pending' && (
                    <button
                      onClick={() => handleCompleteMilestone({ ...milestone, index })}
                      className="px-4 py-2 bg-violet text-white rounded-lg hover:bg-violet/80 transition-colors text-sm font-medium"
                    >
                      Complete Milestone
                    </button>
                  )}
                  
                  {status === 'pending_approval' && (
                    <div className="text-center">
                      <div className="text-yellow-600 text-sm font-medium mb-1">Pending Approval</div>
                      <div className="text-xs text-coolgray">Waiting for client review</div>
                    </div>
                  )}
                  
                  {status === 'completed' && (
                    <div className="text-center">
                      <div className="text-green-600 text-sm font-medium mb-1">Completed</div>
                      <div className="text-xs text-coolgray">Payment processed</div>
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
