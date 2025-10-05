import React, { useState, useEffect } from 'react'
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
      
      // Set up periodic refresh every 30 seconds to catch milestone updates
      const refreshInterval = setInterval(() => {
        console.log('🔄 ClientMilestoneReview: Auto-refreshing milestones...')
        fetchMilestones()
      }, 30000) // 30 seconds
      
      return () => clearInterval(refreshInterval)
    }
  }, [projectId])

  const fetchMilestones = async () => {
    try {
      console.log('🔄 ClientMilestoneReview: Fetching milestones for project:', projectId)
      setLoading(true)
      setError(null)
      
      const result = await escrowService.getMilestones(projectId)
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
      console.log('💳 ClientMilestoneReview: Initiating Razorpay payment for milestone:', milestone.index)
      setPayingMilestone(milestone.index)
      
      // Create a payment order first (this integrates with Razorpay)
      const orderResponse = await escrowService.createEscrowPayment(projectId, milestone.amount)
      
      if (!orderResponse.status) {
        throw new Error(orderResponse.message || 'Failed to create payment order')
      }
      
      const orderData = orderResponse.data
      console.log('📊 ClientMilestoneReview: Payment order created:', orderData)
      
      // Initialize Razorpay payment
      const razorpayOptions = {
        amount: orderData.amount, // Amount in paise
        currency: orderData.currency || 'INR',
        order_id: orderData.razorpay_order_id,
        name: 'Maayo Platform',
        description: `Payment for Milestone ${milestone.index + 1} - ${projectTitle}`,
        image: '/favicon.ico', // Add your company logo if available
        
        // Pre-fill customer details if available
        prefill: {
          name: 'Client', // You can get this from user data
          email: 'client@example.com', // You can get this from user data
        },
        
        // Callback handlers
        handler: async (response) => {
          console.log('✅ ClientMilestoneReview: Razorpay payment completed:', response)
          
          try {
            // Verify the payment and release milestone
            const verifyResponse = await escrowService.verifyEscrowPayment(
              projectId,
              response.razorpay_payment_id,
              response.razorpay_signature
            )
            
            if (verifyResponse.status) {
              // Payment verified, now release the milestone
              const releaseResponse = await escrowService.releaseMilestonePayment(
                projectId,
                milestone.index
              )
              
              if (releaseResponse.status) {
                alert('Payment processed successfully! Milestone approved and payment released to freelancer.')
                fetchMilestones() // Refresh milestones
              } else {
                alert('Payment successful but milestone release failed: ' + releaseResponse.message)
              }
            } else {
              alert('Payment verification failed: ' + verifyResponse.message)
            }
          } catch (verifyError) {
            console.error('❌ ClientMilestoneReview: Payment verification error:', verifyError)
            alert('Payment successful but verification failed. Please contact support.')
          }
        },
        
        modal: {
          ondismiss: () => {
            console.log('❌ ClientMilestoneReview: Payment cancelled by user')
            setPayingMilestone(null)
          }
        },
        
        // Payment options
        notes: {
          milestone_index: milestone.index,
          project_id: projectId,
          milestone_amount: milestone.amount,
          milestone_description: milestone.description
        }
      }
      
      const razorpay = await initializeRazorpay(razorpayOptions)
      
      if (!razorpay) {
        throw new Error('Failed to initialize Razorpay payment')
      }
      
      razorpay.open()
      
    } catch (error) {
      console.error('❌ ClientMilestoneReview: Payment initialization error:', error)
      alert(error.message || 'Failed to initialize payment')
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
