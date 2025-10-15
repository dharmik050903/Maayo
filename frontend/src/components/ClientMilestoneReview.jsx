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
  const [submittedPayments, setSubmittedPayments] = useState(new Set())
  const [paymentHistory, setPaymentHistory] = useState(new Map())
  const [showPaymentDetails, setShowPaymentDetails] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)

  // Note: This component does NOT redirect to dashboard after milestone payment success
  // Users stay on the current page (milestone management) after successful payments

  // Helper function to manage submitted payments
  const getSubmittedPaymentsKey = () => `submitted_payments_${projectId}`
  
  const loadSubmittedPayments = () => {
    try {
      const stored = localStorage.getItem(getSubmittedPaymentsKey())
      if (stored) {
        const parsed = JSON.parse(stored)
        setSubmittedPayments(new Set(parsed))
        console.log('📋 ClientMilestoneReview: Loaded submitted payments:', parsed)
      }
    } catch (error) {
      console.error('❌ ClientMilestoneReview: Error loading submitted payments:', error)
    }
  }
  
  const saveSubmittedPayments = (payments) => {
    try {
      localStorage.setItem(getSubmittedPaymentsKey(), JSON.stringify([...payments]))
      console.log('💾 ClientMilestoneReview: Saved submitted payments:', [...payments])
    } catch (error) {
      console.error('❌ ClientMilestoneReview: Error saving submitted payments:', error)
    }
  }
  
  const markPaymentAsSubmitted = (milestoneIndex) => {
    const newSubmittedPayments = new Set(submittedPayments)
    newSubmittedPayments.add(milestoneIndex)
    setSubmittedPayments(newSubmittedPayments)
    saveSubmittedPayments(newSubmittedPayments)
    console.log('✅ ClientMilestoneReview: Marked milestone', milestoneIndex, 'as payment submitted')
  }
  
  const isPaymentSubmitted = (milestoneIndex) => {
    return submittedPayments.has(milestoneIndex)
  }
  
  const getPaymentHistoryKey = () => `payment_history_${projectId}`
  
  const loadPaymentHistory = () => {
    try {
      const stored = localStorage.getItem(getPaymentHistoryKey())
      if (stored) {
        const parsed = JSON.parse(stored)
        setPaymentHistory(new Map(parsed))
        console.log('📋 ClientMilestoneReview: Loaded payment history:', parsed)
      }
    } catch (error) {
      console.error('❌ ClientMilestoneReview: Error loading payment history:', error)
    }
  }
  
  const savePaymentHistory = (history) => {
    try {
      localStorage.setItem(getPaymentHistoryKey(), JSON.stringify([...history]))
      console.log('💾 ClientMilestoneReview: Saved payment history:', [...history])
    } catch (error) {
      console.error('❌ ClientMilestoneReview: Error saving payment history:', error)
    }
  }
  
  const addPaymentRecord = (milestoneIndex, paymentData) => {
    const newHistory = new Map(paymentHistory)
    newHistory.set(milestoneIndex, {
      ...paymentData,
      timestamp: new Date().toISOString(),
      status: 'submitted'
    })
    setPaymentHistory(newHistory)
    savePaymentHistory(newHistory)
    console.log('✅ ClientMilestoneReview: Added payment record for milestone', milestoneIndex)
  }
  
  const getPaymentRecord = (milestoneIndex) => {
    return paymentHistory.get(milestoneIndex)
  }
  
  const showPaymentDetailsModal = (milestone) => {
    const paymentRecord = getPaymentRecord(milestone.index)
    if (paymentRecord) {
      setSelectedPayment({
        milestone: milestone,
        payment: paymentRecord
      })
      setShowPaymentDetails(true)
    }
  }

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
      loadSubmittedPayments()
      loadPaymentHistory()
      fetchMilestones()
    }
  }, [projectId])

  const fetchMilestones = async (forceRefresh = false) => {
    try {
      console.log('🔄 ClientMilestoneReview: Fetching milestones for project:', projectId, forceRefresh ? '(force refresh)' : '')
      setLoading(true)
      setError(null)
      
      // If force refresh, we can try to clear cache or use a different approach
      const result = await getMilestonesCached(projectId, forceRefresh)
      console.log('📊 ClientMilestoneReview: Milestone fetch result:', result)
      
      if (result.status) {
        const milestonesData = result.data.milestones || []
        console.log('✅ ClientMilestoneReview: Milestones found:', milestonesData.length)
        console.log('📊 ClientMilestoneReview: Milestone data:', milestonesData)
        console.log('🔍 ClientMilestoneReview: Detailed milestone analysis:')
        milestonesData.forEach((milestone, index) => {
          console.log(`  Milestone ${index + 1}:`, {
            title: milestone.title,
            is_completed: milestone.is_completed,
            payment_released: milestone.payment_released,
            auto_released: milestone.auto_released,
            status: milestone.status,
            amount: milestone.amount
          })
          
          // Clean up submitted payments that have been processed
          if (milestone.payment_released === 1 && isPaymentSubmitted(milestone.index)) {
            console.log('🧹 ClientMilestoneReview: Cleaning up submitted payment for milestone', milestone.index, '- payment now processed')
            const newSubmittedPayments = new Set(submittedPayments)
            newSubmittedPayments.delete(milestone.index)
            setSubmittedPayments(newSubmittedPayments)
            saveSubmittedPayments(newSubmittedPayments)
          }
        })
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

  const handleApproveMilestone = async (milestone) => {
    try {
      console.log('🔄 ClientMilestoneReview: Approving milestone:', milestone)
      setPayingMilestone(milestone.index)
      
      const approveResponse = await escrowService.approveMilestone(projectId, milestone.index)
      
      if (approveResponse.status) {
        addPaymentRecord(milestone.index, {
          amount: milestone.amount,
          milestone_title: milestone.title,
          payment_id: approveResponse.data.payment_result?.payout_id || 'approved',
          manual_processing: false,
          status: 'completed'
        })
        showAlert('success', 'Milestone Approved & Payment Made Successfully', '🎉 Milestone approved and payment released to freelancer successfully!')
        console.log('✅ ClientMilestoneReview: Milestone approved and payment released')
        console.log('🔍 ClientMilestoneReview: Approval response:', approveResponse)
        
        // Add a small delay before refreshing to ensure backend has processed
        setTimeout(() => {
          console.log('🔄 ClientMilestoneReview: Refreshing milestones after approval delay')
          fetchMilestones(true) // Force refresh milestones
        }, 1000)
      } else {
        showAlert('error', 'Approval Failed', 'Failed to approve milestone: ' + approveResponse.message)
      }
    } catch (error) {
      console.error('❌ ClientMilestoneReview: Error approving milestone:', error)
      showAlert('error', 'Approval Failed', error.message || 'Failed to approve milestone')
    } finally {
      setPayingMilestone(null)
    }
  }

  const handleRejectMilestone = async (milestone) => {
    try {
      console.log('🔄 ClientMilestoneReview: Rejecting milestone:', milestone)
      setPayingMilestone(milestone.index)
      
      const rejectResponse = await escrowService.rejectMilestone(projectId, milestone.index)
      
      if (rejectResponse.status) {
        addPaymentRecord(milestone.index, {
          amount: milestone.amount,
          milestone_title: milestone.title,
          payment_id: 'rejected',
          manual_processing: false,
          status: 'rejected'
        })
        showAlert('warning', 'Milestone Rejected', 'Milestone has been rejected. Freelancer will be notified to make necessary changes.')
        console.log('✅ ClientMilestoneReview: Milestone rejected')
        fetchMilestones(true) // Force refresh milestones
      } else {
        showAlert('error', 'Rejection Failed', 'Failed to reject milestone: ' + rejectResponse.message)
      }
    } catch (error) {
      console.error('❌ ClientMilestoneReview: Error rejecting milestone:', error)
      showAlert('error', 'Rejection Failed', error.message || 'Failed to reject milestone')
    } finally {
      setPayingMilestone(null)
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
                      // Check if automatic transfer was successful
                      if (releaseResponse.data?.automatic_transfer) {
                        markPaymentAsCompleted(milestone.index)
                        addPaymentRecord(milestone.index, {
                          amount: milestone.amount,
                          milestone_title: milestone.title,
                          payment_id: releaseResponse.data.payout_id,
                          automatic_transfer: true,
                          transfer_id: releaseResponse.data.payment_details?.transfer_id,
                          status: 'transferred'
                        })
                        showAlert('success', 'Payment Transferred', 'Milestone payment has been automatically transferred to freelancer account!')
                        console.log('✅ ClientMilestoneReview: Automatic transfer successful')
                      } else if (releaseResponse.data?.manual_processing_required) {
                        markPaymentAsSubmitted(milestone.index)
                        addPaymentRecord(milestone.index, {
                          amount: milestone.amount,
                          milestone_title: milestone.title,
                          payment_id: releaseResponse.data.payout_id,
                          manual_processing: true,
                          payment_details: releaseResponse.data.payment_details
                        })
                        showAlert('warning', 'Payment Request Submitted', 'Your payment request has been submitted successfully. The payment will be processed manually by our team within 24-48 hours. You will receive a confirmation once the payment is completed.')
                        console.log('✅ ClientMilestoneReview: Manual processing required, payment request submitted')
                      } else {
                        addPaymentRecord(milestone.index, {
                          amount: milestone.amount,
                          milestone_title: milestone.title,
                          payment_id: releaseResponse.data.payout_id,
                          manual_processing: false,
                          status: 'completed'
                        })
                        showAlert('success', 'Payment Made Successfully', '🎉 Payment processed successfully! Milestone approved and payment released to freelancer.')
                      console.log('✅ ClientMilestoneReview: Payment successful, staying on current page (no redirect)')
                      }
                      fetchMilestones(true) // Force refresh milestones
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
                      // Check if automatic transfer was successful
                      if (releaseResponse.data?.automatic_transfer) {
                        markPaymentAsCompleted(milestone.index)
                        addPaymentRecord(milestone.index, {
                          amount: milestone.amount,
                          milestone_title: milestone.title,
                          payment_id: releaseResponse.data.payout_id,
                          automatic_transfer: true,
                          transfer_id: releaseResponse.data.payment_details?.transfer_id,
                          status: 'transferred'
                        })
                        showAlert('success', 'Payment Transferred', 'Milestone payment has been automatically transferred to freelancer account!')
                        console.log('✅ ClientMilestoneReview: Automatic transfer successful')
                      } else if (releaseResponse.data?.manual_processing_required) {
                        markPaymentAsSubmitted(milestone.index)
                        addPaymentRecord(milestone.index, {
                          amount: milestone.amount,
                          milestone_title: milestone.title,
                          payment_id: releaseResponse.data.payout_id,
                          manual_processing: true,
                          payment_details: releaseResponse.data.payment_details
                        })
                        showAlert('warning', 'Payment Request Submitted', 'Your payment request has been submitted successfully. The payment will be processed manually by our team within 24-48 hours. You will receive a confirmation once the payment is completed.')
                        console.log('✅ ClientMilestoneReview: Manual processing required, payment request submitted')
                      } else {
                        addPaymentRecord(milestone.index, {
                          amount: milestone.amount,
                          milestone_title: milestone.title,
                          payment_id: releaseResponse.data.payout_id,
                          manual_processing: false,
                          status: 'completed'
                        })
                        showAlert('success', 'Payment Made Successfully', '🎉 Payment processed successfully! Milestone approved and payment released to freelancer.')
                      console.log('✅ ClientMilestoneReview: Payment successful, staying on current page (no redirect)')
                      }
                      fetchMilestones(true) // Force refresh milestones
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
          // Check if manual processing is required
          if (releaseResponse.data?.manual_processing_required) {
            markPaymentAsSubmitted(milestone.index)
            addPaymentRecord(milestone.index, {
              amount: milestone.amount,
              milestone_title: milestone.title,
              payment_id: releaseResponse.data.payout_id,
              manual_processing: true,
              payment_details: releaseResponse.data.payment_details
            })
            showAlert('warning', 'Payment Request Submitted', 'Your payment request has been submitted successfully. The payment will be processed manually by our team within 24-48 hours. You will receive a confirmation once the payment is completed.')
            console.log('✅ ClientMilestoneReview: Manual processing required, payment request submitted')
          } else {
            addPaymentRecord(milestone.index, {
              amount: milestone.amount,
              milestone_title: milestone.title,
              payment_id: releaseResponse.data.payout_id,
              manual_processing: false,
              status: 'completed'
            })
            showAlert('success', 'Payment Made Successfully', '🎉 Milestone payment released successfully!')
          console.log('✅ ClientMilestoneReview: Payment successful, staying on current page (no redirect)')
          }
          fetchMilestones(true) // Force refresh milestones
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
    console.log('🔍 Milestone details:', {
      is_completed: milestone.is_completed,
      payment_released: milestone.payment_released,
      auto_released: milestone.auto_released,
      manual_processing: milestone.manual_processing,
      status: milestone.status,
      index: milestone.index,
      title: milestone.title
    })
    console.log('🔍 Full milestone object:', JSON.stringify(milestone, null, 2))
    
          // Backend uses is_completed: 1 for completed milestones
          if (milestone.is_completed === 1) {
            // Check if payment has been released
            if (milestone.payment_released === 1) {
              // Check if payment was auto-released
              if (milestone.auto_released === true) {
                console.log('✅ Status: auto_paid')
                return 'auto_paid' // Auto-released payment
              } else if (milestone.auto_released === false) {
                console.log('⚠️ Status: manual_processing (payment approved but payout failed)')
                return 'manual_processing' // Manual processing required
              } else if (milestone.manual_processing === true && milestone.payment_initiated === true) {
                console.log('⚠️ Status: manual_processing (payment initiated but requires manual processing)')
                return 'manual_processing' // Payment initiated but requires manual processing
              } else {
                console.log('✅ Status: completed')
                return 'completed' // Manual payment release
              }
            } else {
              // Check if payment has been initiated
              if (milestone.payment_initiated === true) {
                console.log('🔄 Status: payment_initiated (payment processing)')
                return 'payment_initiated' // Payment initiated but not yet released
              } else {
                console.log('⏳ Status: pending_approval (completed but payment not released)')
                console.log('🔍 Payment not released - milestone.payment_released =', milestone.payment_released)
                return 'pending_approval' // Completed but payment not released yet
              }
            }
          }
    
    // Legacy support for string status fields (if they exist)
    if (milestone.status === 'completed') return 'completed'
    if (milestone.status === 'pending_approval') return 'pending_approval'
    if (milestone.status === 'in_progress') return 'in_progress'
    
    console.log('📋 Status: pending (not completed yet)')
    return 'pending' // Not completed yet
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'auto_paid': return 'text-green-700 bg-green-200' // Different color for auto-payments
      case 'completed': return 'text-green-600 bg-green-100'
      case 'manual_processing': return 'text-orange-600 bg-orange-100' // Orange for manual processing
      case 'payment_initiated': return 'text-blue-700 bg-blue-200' // Blue for payment initiated
      case 'pending_approval': return 'text-yellow-600 bg-yellow-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
          default: return 'text-gray-600 bg-gray-100'
        }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'auto_paid': return '🤖' // Auto-payment icon
      case 'completed': return '✅'
      case 'manual_processing': return '⏳' // Clock icon for manual processing
      case 'payment_initiated': return '💳' // Credit card icon for payment initiated
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
      
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Milestone Review</h2>
          <p className="text-gray-600">Review and approve completed milestones</p>
        </div>
        <button
          onClick={() => fetchMilestones(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      
      <div className="space-y-6">
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
            <div key={`milestone-${milestone.index || index}`} className="group relative overflow-hidden border-2 rounded-2xl p-6 bg-gradient-to-r from-white to-gray-50/50 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 border-gray-200 w-full">
            {/* Status indicator bar */}
            <div className={`absolute top-0 left-0 right-0 h-2 ${
              status === 'completed' 
                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                : status === 'pending_approval'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                : status === 'payment_initiated'
                ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                : 'bg-gradient-to-r from-gray-300 to-gray-400'
            }`}></div>

            <div className="flex flex-col gap-6">
              <div className="flex-1 w-full">
                {/* Enhanced Header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-lg ${
                    status === 'completed' 
                      ? 'bg-gradient-to-r from-green-100 to-green-200' 
                      : status === 'pending_approval'
                      ? 'bg-gradient-to-r from-yellow-100 to-yellow-200'
                      : status === 'payment_initiated'
                      ? 'bg-gradient-to-r from-blue-100 to-blue-200'
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
              <div className="flex flex-col gap-4 w-full">
                <div className="flex-1">
                  {status === 'pending_approval' && (
                    <div className="flex flex-col gap-4 text-yellow-700 p-4 rounded-2xl bg-gradient-to-r from-yellow-50 to-yellow-100/50 border border-yellow-200">
                      <div className="flex items-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">Waiting for your approval</span>
                      </div>
                      <div className="flex flex-col gap-3 w-full">
                        <button
                          onClick={() => handleApproveMilestone(milestone)}
                          disabled={payingMilestone === milestone.index}
                          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold flex items-center justify-center gap-2"
                        >
                          {payingMilestone === milestone.index ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Approving...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Accept & Pay
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectMilestone(milestone)}
                          disabled={payingMilestone === milestone.index}
                          className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {status === 'payment_initiated' && (
                    <div className="flex flex-col gap-4 text-blue-700 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200">
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="text-sm font-medium">Payment Initiated</span>
                      </div>
                      <div className="text-sm text-blue-600">
                        <p>✅ Payment has been initiated and is being processed.</p>
                        <p className="mt-2">The freelancer will receive payment within 1-2 business days.</p>
                      </div>
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
                  
                  {status === 'manual_processing' && (
                    <div className="flex items-center gap-3 text-orange-700 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <span className="text-sm font-medium">Payment Request Submitted - Processing Manually</span>
                        {getPaymentRecord(milestone.index) && (
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-xs text-orange-600">
                              Payment ID: {getPaymentRecord(milestone.index).payment_id}
                            </div>
                            <button
                              onClick={() => showPaymentDetailsModal(milestone)}
                              className="text-xs text-orange-700 hover:text-orange-800 underline"
                            >
                              View Details
                            </button>
                          </div>
                        )}
                      </div>
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
      
      {/* Payment Details Modal */}
      {showPaymentDetails && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
              <button
                onClick={() => setShowPaymentDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Milestone</label>
                <p className="text-gray-900">{selectedPayment.milestone.title}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Amount</label>
                <p className="text-gray-900 font-semibold">{formatCurrency(selectedPayment.payment.amount)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Payment ID</label>
                <p className="text-gray-900 font-mono text-sm">{selectedPayment.payment.payment_id}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <p className={`text-sm font-medium ${
                  selectedPayment.payment.manual_processing 
                    ? 'text-orange-600' 
                    : 'text-green-600'
                }`}>
                  {selectedPayment.payment.manual_processing 
                    ? 'Manual Processing Required' 
                    : 'Payment Completed'
                  }
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Submitted At</label>
                <p className="text-gray-900 text-sm">{formatDate(selectedPayment.payment.timestamp)}</p>
              </div>
              
              {selectedPayment.payment.manual_processing && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-orange-800 mb-2">Payment Status</h4>
                  <div className="text-xs text-orange-700 space-y-1">
                    <p><strong>Processing:</strong> Manual processing required</p>
                    <p><strong>Amount:</strong> {formatCurrency(selectedPayment.payment.amount)}</p>
                    <p className="text-orange-600 italic">Payment will be processed by our team within 24-48 hours</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPaymentDetails(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientMilestoneReview
