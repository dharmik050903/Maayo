import React, { useState, useEffect } from 'react'
import { getMilestonesCached } from '../services/cachedApiService'
import { escrowService } from '../services/escrowService'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
import { initializeRazorpay } from '../utils/razorpay'
import Button from './Button'
import CustomAlert from './CustomAlert'

const ClientMilestoneReview = ({ projectId, projectTitle }) => {
  const { t } = useComprehensiveTranslation()
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [payingMilestone, setPayingMilestone] = useState(null)
  const [alert, setAlert] = useState(null)

  // Helper function to show custom alert
  const showAlert = (type, title, message) => {
    setAlert({ type, title, message })
  }

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  useEffect(() => {
    if (projectId) {
      fetchMilestones()
    }
  }, [projectId])

  const fetchMilestones = async () => {
    try {
      console.log('🔄 ClientMilestoneReview: Fetching milestones for project:', projectId)
      setLoading(true)
      setError(null)
      
      const result = await getMilestonesCached(projectId)
      console.log('📊 ClientMilestoneReview: Milestone fetch result:', result)
      
      if (result.status) {
        const milestonesData = result.data.milestones || []
        console.log('✅ ClientMilestoneReview: Milestones found:', milestonesData.length)
        setMilestones(milestonesData)
        
        if (milestonesData.length === 0) {
          setError('No milestones found for this project')
        }
      } else {
        console.log('❌ ClientMilestoneReview: API returned error:', result.message)
        setError(result.message || 'Failed to fetch milestones')
      }
    } catch (error) {
      console.error('❌ ClientMilestoneReview: Error fetching milestones:', error)
      setError(error.message || 'Failed to fetch milestones')
    } finally {
      setLoading(false)
          }
  }

  const handlePayMilestone = async (milestone) => {
    try {
      console.log('💳 ClientMilestoneReview: Processing milestone payment for:', milestone.index)
      setPayingMilestone(milestone.index)
      
      // First, check if escrow exists for this project
      const escrowStatusResponse = await escrowService.getEscrowStatus(projectId)
      
      if (!escrowStatusResponse.status) {
        throw new Error('Failed to check escrow status: ' + escrowStatusResponse.message)
      }
      
      const escrowStatus = escrowStatusResponse.data
      console.log('📊 ClientMilestoneReview: Escrow status:', escrowStatus)
      
      // If escrow doesn't exist or is not completed, we need to create/complete it first
      if (escrowStatus.escrow_status === 'not_created' || escrowStatus.escrow_status === 'pending') {
        console.log('🔄 ClientMilestoneReview: Escrow not ready, need to create/complete escrow first')
        
        if (escrowStatus.escrow_status === 'not_created') {
          // Create escrow payment first
          const createResponse = await escrowService.createEscrowPayment(projectId, escrowStatus.final_project_amount)
          
          if (!createResponse.status) {
            throw new Error('Failed to create escrow: ' + createResponse.message)
          }
          
          console.log('✅ ClientMilestoneReview: Escrow created, now processing payment...')
          
          // Process the Razorpay payment for escrow creation
          const razorpayOptions = {
            amount: createResponse.data.amount,
            currency: createResponse.data.currency || 'INR',
            order_id: createResponse.data.order_id,
            name: 'Maayo Platform',
            description: `Escrow Payment for Project: ${projectTitle}`,
            image: '/favicon.ico',
            
            prefill: {
              name: 'Client',
              email: 'client@example.com',
            },
            
            handler: async (response) => {
              console.log('✅ ClientMilestoneReview: Escrow payment completed:', response)
              
              try {
                // Verify the escrow payment
                const verifyResponse = await escrowService.verifyEscrowPayment(
                  projectId,
                  response.razorpay_payment_id,
                  response.razorpay_signature
                )
                
                if (verifyResponse.status) {
                  console.log('✅ ClientMilestoneReview: Escrow verified, now releasing milestone...')
                  
                  // Now release the milestone payment
                  const releaseResponse = await escrowService.releaseMilestonePayment(
                    projectId,
                    milestone.index
                  )
                  
                  if (releaseResponse.status) {
                    showAlert('success', 'Payment Successful', 'Payment processed successfully! Milestone approved and payment released to freelancer.')
                    fetchMilestones() // Refresh milestones
                  } else {
                    showAlert('error', 'Release Failed', 'Escrow created but milestone release failed: ' + releaseResponse.message)
                  }
                } else {
                  showAlert('error', 'Verification Failed', 'Escrow payment verification failed: ' + verifyResponse.message)
                }
              } catch (verifyError) {
                console.error('❌ ClientMilestoneReview: Escrow verification error:', verifyError)
                showAlert('error', 'Verification Error', 'Escrow payment successful but verification failed. Please contact support.')
              }
            },
            
            modal: {
              ondismiss: () => {
                console.log('❌ ClientMilestoneReview: Escrow payment cancelled by user')
                setPayingMilestone(null)
              }
            },
            
            notes: {
              project_id: projectId,
              type: 'escrow_payment',
              milestone_index: milestone.index
            }
          }
          
          const razorpay = await initializeRazorpay(razorpayOptions)
          
          if (!razorpay) {
            throw new Error('Failed to initialize Razorpay payment')
          }
          
          razorpay.open()
          
        } else {
          // Escrow is pending, need to complete it first
          console.log('🔄 ClientMilestoneReview: Escrow is pending, attempting to reset...')
          
          // Try to reset the escrow status first
          const resetResponse = await escrowService.resetEscrowStatus(projectId)
          
          if (resetResponse.status) {
            console.log('✅ ClientMilestoneReview: Escrow status reset, retrying payment...')
            
            // Retry creating escrow payment
            const createResponse = await escrowService.createEscrowPayment(projectId, escrowStatus.final_project_amount)
            
            if (!createResponse.status) {
              throw new Error('Failed to create escrow after reset: ' + createResponse.message)
            }
            
            console.log('✅ ClientMilestoneReview: Escrow created after reset, now processing payment...')
            
            // Process the Razorpay payment for escrow creation
            const razorpayOptions = {
              amount: createResponse.data.amount,
              currency: createResponse.data.currency || 'INR',
              order_id: createResponse.data.order_id,
              name: 'Maayo Platform',
              description: `Escrow Payment for Project: ${projectTitle}`,
              image: '/favicon.ico',
              
              prefill: {
                name: 'Client',
                email: 'client@example.com',
              },
              
              handler: async (response) => {
                console.log('✅ ClientMilestoneReview: Escrow payment completed:', response)
                
                try {
                  // Verify the escrow payment
                  const verifyResponse = await escrowService.verifyEscrowPayment(
                    projectId,
                    response.razorpay_payment_id,
                    response.razorpay_signature
                  )
                  
                  if (verifyResponse.status) {
                    console.log('✅ ClientMilestoneReview: Escrow verified, now releasing milestone...')
                    
                    // Now release the milestone payment
                    const releaseResponse = await escrowService.releaseMilestonePayment(
                      projectId,
                      milestone.index
                    )
                    
                    if (releaseResponse.status) {
                      showAlert('success', 'Payment Successful', 'Payment processed successfully! Milestone approved and payment released to freelancer.')
                      fetchMilestones() // Refresh milestones
                    } else {
                      showAlert('error', 'Release Failed', 'Escrow created but milestone release failed: ' + releaseResponse.message)
                    }
                  } else {
                    showAlert('error', 'Verification Failed', 'Escrow payment verification failed: ' + verifyResponse.message)
                  }
                } catch (verifyError) {
                  console.error('❌ ClientMilestoneReview: Escrow verification error:', verifyError)
                  showAlert('error', 'Verification Error', 'Escrow payment successful but verification failed. Please contact support.')
                }
              },
              
              modal: {
                ondismiss: () => {
                  console.log('❌ ClientMilestoneReview: Escrow payment cancelled by user')
                  setPayingMilestone(null)
                }
              },
              
              notes: {
                project_id: projectId,
                type: 'escrow_payment',
                milestone_index: milestone.index
              }
            }
            
            const razorpay = await initializeRazorpay(razorpayOptions)
            
            if (!razorpay) {
              throw new Error('Failed to initialize Razorpay payment')
            }
            
            razorpay.open()
            
          } else {
            throw new Error('Failed to reset escrow status: ' + resetResponse.message)
          }
        }
        
      } else if (escrowStatus.escrow_status === 'completed') {
        // Escrow is completed, directly release milestone payment
        console.log('✅ ClientMilestoneReview: Escrow completed, releasing milestone payment...')
        
        const releaseResponse = await escrowService.releaseMilestonePayment(
          projectId,
          milestone.index
        )
        
        if (releaseResponse.status) {
          showAlert('success', 'Payment Released', 'Milestone payment released successfully!')
          fetchMilestones() // Refresh milestones
        } else {
          showAlert('error', 'Release Failed', 'Failed to release milestone payment: ' + releaseResponse.message)
        }
        
      } else {
        throw new Error('Invalid escrow status: ' + escrowStatus.escrow_status)
      }
      
    } catch (error) {
      console.error('❌ ClientMilestoneReview: Milestone payment error:', error)
      showAlert('error', 'Payment Error', error.message || 'Failed to process milestone payment')
    } finally {
      setPayingMilestone(null)
    }
  }

  const getMilestoneStatus = (milestone) => {
    console.log('🔍 Client getMilestoneStatus input:', milestone)
    
    // Backend uses is_completed: 1 for completed milestones
    if (milestone.is_completed === 1) {
      // Check if payment has been released
      if (milestone.payment_released === 1) {
        // Check if payment was auto-released
        if (milestone.auto_released) {
          return 'auto_paid' // Auto-released payment
        } else {
          return 'completed' // Manual payment release
        }
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
      case 'auto_paid': return 'text-green-700 bg-green-200' // Different color for auto-payments
      case 'completed': return 'text-green-600 bg-green-100'
      case 'pending_approval': return 'text-yellow-600 bg-yellow-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
          default: return 'text-gray-600 bg-gray-100'
        }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'auto_paid': return '🤖' // Auto-payment icon
      case 'completed': return '✅'
      case 'pending_approval': return '⏳'
      case 'in_progress': return '🔄'
          default: return '📋'
        }
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-mint mx-auto mb-2"></div>
        <p className="text-sm text-coolgray">Loading milestones...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600 text-sm">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchMilestones}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
          )
  }

  if (milestones.length === 0) {
    return (
      <div className="text-center py-6 text-coolgray">
        <div className="text-4xl mb-2">📋</div>
        <p className="text-sm">No Milestones Defined Yet</p>
        <p className="text-xs mt-1">Milestones will appear here after freelancer completes them</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {alert && (
        <CustomAlert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
      {milestones.map((milestone, index) => {
        const status = getMilestoneStatus(milestone)
        const statusColor = getStatusColor(status)
        const statusIcon = getStatusIcon(status)
        
        console.log(`🔍 Client Milestone ${index + 1} Debug:`, {
          title: milestone.title,
          status: milestone.status,
          computedStatus: status,
          index: milestone.index
        })
        
        return (
          <div key={`milestone-${milestone.index || index}`} className="group relative overflow-hidden border-2 rounded-2xl p-4 sm:p-6 bg-gradient-to-r from-white to-gray-50/50 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 border-gray-200 w-full">
            {/* Status indicator bar */}
            <div className={`absolute top-0 left-0 right-0 h-2 ${
              status === 'completed' 
                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                : status === 'pending_approval'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                : 'bg-gradient-to-r from-gray-300 to-gray-400'
            }`}></div>

            <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
              <div className="flex-1 w-full">
                {/* Enhanced Header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-lg ${
                    status === 'completed' 
                      ? 'bg-gradient-to-r from-green-100 to-green-200' 
                      : status === 'pending_approval'
                      ? 'bg-gradient-to-r from-yellow-100 to-yellow-200'
                      : 'bg-gradient-to-r from-gray-100 to-gray-200'
                  }`}>
                    <span className="text-xl sm:text-2xl">{statusIcon}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg sm:text-xl font-bold text-graphite mb-1">
                      {milestone.title || `Milestone ${milestone.index + 1}`}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-sm sm:text-base text-coolgray mb-4 leading-relaxed">{milestone.description}</p>
                
                {/* Enhanced Info Cards - Vertical Stack for Better Spacing */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center p-3 sm:p-4 rounded-xl bg-gradient-to-r from-gray-100/50 to-gray-200/50 border border-gray-200 w-full">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h8M7 10h8M9 14h5c1.5 0 2.5-1 2.5-2.5S15.5 9 14 9h-2" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">Amount</p>
                      <p className="font-bold text-base sm:text-lg text-gray-800">{formatCurrency(milestone.amount)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 sm:p-4 rounded-xl bg-gradient-to-r from-blue-100/50 to-blue-200/50 border border-blue-200 w-full">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 0h4m-4 0H8m4 0h4m-4 8v4m0-8v8" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">Due Date</p>
                      <p className="font-bold text-base sm:text-lg text-gray-800">{formatDate(milestone.due_date)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Action Section */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full lg:w-auto lg:min-w-[200px]">
                <div className="flex-1 lg:flex-none">
                  {status === 'pending_approval' && (
                    <div className="flex items-center gap-3 text-yellow-700 p-4 rounded-2xl bg-gradient-to-r from-yellow-50 to-yellow-100/50 border border-yellow-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">Waiting for your approval</span>
                    </div>
                  )}
                  
                  {status === 'completed' && (
                    <div className="flex items-center gap-3 text-green-700 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">Payment Done Successfully</span>
                    </div>
                  )}
                  
                  {status === 'pending' && (
                    <div className="flex items-center gap-3 text-gray-600 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">Waiting for freelancer to complete</span>
                    </div>
                  )}
                </div>
                
                {status === 'pending_approval' && (
                  <Button
                    variant="accent"
                    size="lg"
                    onClick={() => handlePayMilestone(milestone)}
                    disabled={payingMilestone === milestone.index}
                    className="w-full lg:w-auto px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    {payingMilestone === milestone.index ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h8M7 10h8M9 14h5c1.5 0 2.5-1 2.5-2.5S15.5 9 14 9h-2" />
                        </svg>
                        Accept
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            {/* Enhanced Completion Notes */}
            {milestone.status === 'pending_approval' && milestone.completion_notes && (
              <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <h5 className="font-bold text-blue-900 mb-2 text-lg">Freelancer's Completion Notes:</h5>
                    <p className="text-blue-800 text-base mb-3 leading-relaxed">{milestone.completion_notes}</p>
                    {milestone.evidence && (
                      <div>
                        <h6 className="font-semibold text-blue-900 mb-1">Evidence:</h6>
                        <p className="text-blue-800 text-sm">{milestone.evidence}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ClientMilestoneReview
