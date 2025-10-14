import React, { useState, useEffect } from 'react'
import { bidService } from '../services/bidService'
import { escrowService } from '../services/escrowService'
import { initializeRazorpay } from '../utils/razorpay'
import CustomAlert from './CustomAlert'

const AcceptBidModal = ({ bid, project, onClose, onSuccess }) => {
  const [finalAmount, setFinalAmount] = useState(bid.bid_amount)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('amount') // 'amount' | 'payment' | 'processing'
  const [alert, setAlert] = useState({ isOpen: false, type: 'info', title: '', message: '' })

  const showAlert = (type, title, message) => {
    setAlert({
      isOpen: true,
      type,
      title,
      message
    })
  }

  const closeAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }))
  }

  // Calculate platform commission (5%)
  const platformCommission = Math.round(finalAmount * 0.05 * 100) / 100
  const freelancerAmount = finalAmount - platformCommission

  const handleAcceptBid = async () => {
    try {
      setLoading(true)
      setStep('processing')

      // Validate final amount before proceeding
      if (!finalAmount || finalAmount <= 0) {
        throw new Error('Please enter a valid final amount greater than ₹0')
      }

      console.log('🚀 AcceptBidModal: Starting payment process...')
      console.log('📊 AcceptBidModal: Data:', {
        bidId: bid._id,
        bidStatus: bid.status,
        finalAmount: finalAmount,
        projectId: project._id,
        bidAmount: bid.bid_amount
      })

      // Check bid status and handle accordingly
      if (bid.status === 'pending') {
        // Step 1: Accept bid with final amount (only for pending bids)
        console.log('📝 AcceptBidModal: Accepting pending bid...')
        const acceptResponse = await bidService.acceptBid(bid._id, finalAmount)
        
        if (!acceptResponse.status) {
          throw new Error(acceptResponse.message)
        }
        console.log('✅ Bid accepted, creating escrow payment...')
      } else if (bid.status === 'pending_payment') {
        // For pending_payment bids, skip acceptance and go directly to payment
        console.log('💳 AcceptBidModal: Bid already accepted, proceeding to payment...')
      } else {
        throw new Error(`Cannot process payment for bid with status: ${bid.status}`)
      }

      setStep('payment')

      // Step 2: Create escrow payment
      const escrowResponse = await escrowService.createEscrowPayment(project._id)
      
      if (!escrowResponse.status) {
        throw new Error(escrowResponse.message)
      }

      // Step 3: Open Razorpay payment gateway
      const razorpayOptions = {
        amount: escrowResponse.data.amount,
        currency: escrowResponse.data.currency || 'INR',
        order_id: escrowResponse.data.order_id,
        name: 'Maayo Platform',
        description: `Project Payment: ${project.title}`,
        image: '/favicon.ico',
        
        prefill: {
          name: 'Client',
          email: 'client@example.com',
        },
        
        handler: async (response) => {
          try {
            console.log('✅ Payment completed, verifying...')
            
            // Step 4: Verify escrow payment
            const verifyResponse = await escrowService.verifyEscrowPayment(
              project._id,
              response.razorpay_payment_id,
              response.razorpay_signature
            )
            
            if (verifyResponse.status) {
              showAlert('success', 'Success!', '🎉 Bid accepted and payment completed! Project is now active.')
              onSuccess()
              onClose()
            } else {
              showAlert('error', 'Payment Verification Failed', verifyResponse.message)
            }
          } catch (error) {
            console.error('❌ Payment verification error:', error)
            showAlert('error', 'Payment Verification Failed', error.message)
          }
        },
        
        modal: {
          ondismiss: () => {
            console.log('Payment cancelled')
            setStep('amount')
          }
        }
      }

      const rzp = new window.Razorpay(razorpayOptions)
      rzp.open()

    } catch (error) {
      console.error('❌ Error accepting bid:', error)
      
      // Handle different types of errors
      if (error.message.includes('Unexpected token') || error.message.includes('<!DOCTYPE')) {
        showAlert('error', 'Backend Server Error', 'Backend server is not running. Please start the backend server to accept bids.\n\nTo start the backend:\n1. Open terminal in the backend folder\n2. Run: npm start')
      } else if (error.message.includes('Failed to fetch')) {
        showAlert('error', 'Network Error', 'Unable to connect to the server. Please check your internet connection.')
      } else {
        showAlert('error', 'Failed to Accept Bid', error.message)
      }
      
      setStep('amount')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAmount = async () => {
    try {
      setLoading(true)
      
      // Check if backend is reachable first
      const response = await bidService.updateProjectPayment(project._id, finalAmount)
      
      if (response.status) {
        showAlert('success', 'Success!', '✅ Payment amount updated successfully!')
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error('❌ Error updating payment:', error)
      
      // Handle different types of errors
      if (error.message.includes('Project must have an accepted bid')) {
        showAlert('warning', 'Cannot Update Payment', 'No bid has been accepted for this project yet.\n\nPlease accept a bid first, then you can update the payment amount.')
      } else if (error.message.includes('Unexpected token') || error.message.includes('<!DOCTYPE')) {
        showAlert('error', 'Backend Server Error', 'Backend server is not running. This feature requires the backend server.\n\nYou can still proceed with "Accept & Pay" - it will work with the current amount.')
      } else if (error.message.includes('Failed to fetch')) {
        showAlert('error', 'Network Error', 'Unable to connect to the server. Please check your internet connection.')
      } else {
        showAlert('error', 'Failed to Update Payment', error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {bid.status === 'pending_payment' ? 'Complete Payment' : 'Accept Bid'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {step === 'amount' && (
          <>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Final Project Amount (₹)
              </label>
              <input
                type="number"
                value={finalAmount || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  setFinalAmount(value)
                }}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold text-gray-800 bg-white"
                min="1"
                step="0.01"
                placeholder="Enter final amount"
                autoFocus
              />
              {finalAmount > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  Current amount: ₹{finalAmount.toLocaleString()}
                </p>
              )}
              {finalAmount <= 0 && (
                <p className="text-sm text-red-600 mt-1">
                  ⚠️ Please enter a valid amount greater than ₹0
                </p>
              )}
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border-2 border-gray-200 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <span className="text-2xl mr-2">💰</span>
                Payment Breakdown
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-white rounded-lg border">
                  <span className="text-gray-700 font-medium">Total Project Amount</span>
                  <span className="font-bold text-xl text-gray-800">₹{finalAmount.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-red-700 font-medium">Platform Commission (5%)</span>
                  <span className="font-bold text-lg text-red-600">-₹{platformCommission.toLocaleString()}</span>
                </div>
                
                <div className="border-t-2 border-gray-300 my-2"></div>
                
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                  <span className="font-bold text-green-800">Freelancer Receives</span>
                  <span className="font-bold text-2xl text-green-600">₹{freelancerAmount.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center text-sm text-yellow-700">
                  <span className="text-lg mr-2">💡</span>
                  <span>Platform commission helps us maintain and improve the service</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpdateAmount}
                disabled={loading || finalAmount <= 0}
                className="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors font-semibold text-lg"
              >
                {loading ? 'Updating...' : 'Update Amount'}
              </button>
              <button
                onClick={handleAcceptBid}
                disabled={loading || finalAmount <= 0}
                className="flex-1 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors font-semibold text-lg"
              >
                {loading ? 'Processing...' : (bid.status === 'pending_payment' ? 'Complete Payment' : 'Accept & Pay')}
              </button>
            </div>
            
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600">
                💡 <strong>Tip:</strong> {bid.status === 'pending_payment' 
                  ? 'You can skip "Update Amount" and directly proceed with "Complete Payment"'
                  : 'You can skip "Update Amount" and directly proceed with "Accept & Pay"'
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Note: "Update Amount" only works after a bid has been accepted
              </p>
            </div>
          </>
        )}

        {step === 'payment' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Opening payment gateway...</p>
            <p className="text-sm text-gray-500 mt-2">Please complete the payment to activate the project</p>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing bid acceptance...</p>
            <p className="text-sm text-gray-500 mt-2">Setting up payment and project activation</p>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>💳 Payment is required upfront to activate the project</p>
          <p>🚀 Project will be activated automatically after payment verification</p>
        </div>
      </div>
      
      {/* Custom Alert */}
      <CustomAlert
        isOpen={alert.isOpen}
        onClose={closeAlert}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </div>
  )
}

export default AcceptBidModal
