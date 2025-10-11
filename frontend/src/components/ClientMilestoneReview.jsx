import React, { useState, useEffect } from 'react'
import { getMilestonesCached } from '../services/cachedApiService'
import { escrowService } from '../services/escrowService'
import { useComprehensiveTranslation } from '../hooks/useComprehensiveTranslation'
import { initializeRazorpay } from '../utils/razorpay'
import Button from './Button'

const ClientMilestoneReview = ({ projectId, projectTitle }) => {
  const { t } = useComprehensiveTranslation()
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [payingMilestone, setPayingMilestone] = useState(null)

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
                    alert('Payment processed successfully! Milestone approved and payment released to freelancer.')
                    fetchMilestones() // Refresh milestones
                  } else {
                    alert('Escrow created but milestone release failed: ' + releaseResponse.message)
                  }
                } else {
                  alert('Escrow payment verification failed: ' + verifyResponse.message)
                }
              } catch (verifyError) {
                console.error('❌ ClientMilestoneReview: Escrow verification error:', verifyError)
                alert('Escrow payment successful but verification failed. Please contact support.')
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
                      alert('Payment processed successfully! Milestone approved and payment released to freelancer.')
                      fetchMilestones() // Refresh milestones
                    } else {
                      alert('Escrow created but milestone release failed: ' + releaseResponse.message)
                    }
                  } else {
                    alert('Escrow payment verification failed: ' + verifyResponse.message)
                  }
                } catch (verifyError) {
                  console.error('❌ ClientMilestoneReview: Escrow verification error:', verifyError)
                  alert('Escrow payment successful but verification failed. Please contact support.')
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
          alert('Milestone payment released successfully!')
          fetchMilestones() // Refresh milestones
        } else {
          alert('Failed to release milestone payment: ' + releaseResponse.message)
        }
        
      } else {
        throw new Error('Invalid escrow status: ' + escrowStatus.escrow_status)
      }
      
    } catch (error) {
      console.error('❌ ClientMilestoneReview: Milestone payment error:', error)
      alert(error.message || 'Failed to process milestone payment')
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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
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
    <div className="space-y-4">
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
          <div key={`milestone-${milestone.index || index}`} className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-graphite text-lg">
                  Milestone {milestone.index + 1}
                </h4>
                <p className="text-coolgray text-sm mt-1">{milestone.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                {statusIcon} {status.replace('_', ' ')}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-lg font-bold text-graphite">
                Amount: {formatCurrency(milestone.amount)}
              </div>
              
              {status === 'pending_approval' && (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => handlePayMilestone(milestone)}
                  disabled={payingMilestone === milestone.index}
                  className="px-6"
                >
                  {payingMilestone === milestone.index ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Pay Now'
                  )}
                </Button>
              )}
              
              {status === 'completed' && (
                <div className="text-green-600 font-medium">
                  ✅ Payment Released
                </div>
              )}
              
              {status === 'pending' && (
                <div className="text-gray-500 text-sm">
                  Waiting for freelancer to complete
                </div>
              )}
            </div>
            
            {milestone.status === 'pending_approval' && milestone.completion_notes && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-1">Freelancer's Completion Notes:</h5>
                <p className="text-blue-800 text-sm">{milestone.completion_notes}</p>
                {milestone.evidence && (
                  <div className="mt-2">
                    <h6 className="font-medium text-blue-900 mb-1">Evidence:</h6>
                    <p className="text-blue-800 text-sm">{milestone.evidence}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ClientMilestoneReview
