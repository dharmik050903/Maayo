import React, { useState } from 'react'
import { escrowService } from '../services/escrowService'

const CreateEscrowPayment = ({ projectId, onSuccess }) => {
  const [finalAmount, setFinalAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreateEscrow = async () => {
    if (!finalAmount || finalAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!projectId) {
      setError('Project ID is missing')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      console.log('Creating escrow payment with:', {
        projectId,
        finalAmount,
        amountType: typeof finalAmount,
        parsedAmount: parseFloat(finalAmount)
      })
      
      const result = await escrowService.createEscrowPayment(projectId, finalAmount)
      
      if (result.status) {
        // Initialize Razorpay payment
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: result.data.amount,
          currency: result.data.currency,
          name: 'Maayo Escrow Payment',
          description: 'Project Escrow Payment',
          order_id: result.data.order_id,
          handler: async function (response) {
            await verifyEscrowPayment(response)
          },
          prefill: {
            name: localStorage.getItem('userName') || 'User',
            email: localStorage.getItem('userEmail') || ''
          },
          theme: {
            color: '#7c3aed'
          },
          modal: {
            ondismiss: function() {
              setLoading(false)
            }
          }
        }
        
        const rzp = new window.Razorpay(options)
        rzp.open()
      }
    } catch (error) {
      console.error('Error creating escrow payment:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      
      // More specific error messages
      let errorMessage = 'Failed to create escrow payment'
      if (error.message.includes('Project ID is required')) {
        errorMessage = 'Project ID is missing. Please refresh the page and try again.'
      } else if (error.message.includes('Valid amount is required')) {
        errorMessage = 'Please enter a valid amount greater than 0.'
      } else if (error.message.includes('Unable to connect to server')) {
        errorMessage = 'Server connection failed. Please check your internet connection and try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      setLoading(false)
    }
  }

  const verifyEscrowPayment = async (paymentResponse) => {
    try {
      const result = await escrowService.verifyEscrowPayment(
        projectId,
        paymentResponse.razorpay_payment_id,
        paymentResponse.razorpay_signature
      )
      
      if (result.status) {
        alert('Escrow payment created successfully!')
        onSuccess?.()
        setFinalAmount('')
      }
    } catch (error) {
      console.error('Error verifying escrow payment:', error)
      alert(error.message || 'Payment verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Escrow Payment</h3>
        <p className="text-gray-600">
          Create an escrow payment to secure funds for this project. The amount will be held in escrow until milestones are completed.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Final Project Amount (₹)
          </label>
          <input
            type="number"
            value={finalAmount}
            onChange={(e) => {
              setFinalAmount(e.target.value)
              setError('')
            }}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter final project amount"
            min="1"
            step="0.01"
            disabled={loading}
          />
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            This amount will be held in escrow and released based on milestone completion.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important Information</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Payment will be processed through Razorpay</li>
                  <li>Funds will be held in escrow until milestones are completed</li>
                  <li>You can release payments manually after milestone completion</li>
                  <li>Make sure you have sufficient balance in your account</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleCreateEscrow}
          disabled={loading || !finalAmount}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Create Escrow Payment
            </>
          )}
        </button>
      </div>

      {/* Debug Information - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Debug Information</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p><strong>Project ID:</strong> {projectId || 'Not provided'}</p>
            <p><strong>Final Amount:</strong> {finalAmount || 'Not set'}</p>
            <p><strong>Amount Type:</strong> {typeof finalAmount}</p>
            <p><strong>Parsed Amount:</strong> {parseFloat(finalAmount) || 'Invalid'}</p>
            <p><strong>Razorpay Key:</strong> {import.meta.env.VITE_RAZORPAY_KEY_ID ? 'Set' : 'Not set'}</p>
            <p><strong>API Base URL:</strong> {import.meta.env.VITE_API_BASE_URL || 'Not set'}</p>
          </div>
        </div>
      )}

      {/* Razorpay Script Loading Check */}
      {!window.Razorpay && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Razorpay Not Loaded</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Please ensure the Razorpay script is loaded on this page.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateEscrowPayment

