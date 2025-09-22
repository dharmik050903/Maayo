import { authenticatedFetch } from '../utils/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const paymentService = {
  /**
   * Create a Razorpay order for payment
   * @param {number} amount - Amount in rupees
   * @param {string} currency - Currency code (default: INR)
   * @returns {Promise<Object>} Order details
   */
  async createOrder(amount, currency = 'INR') {
    try {
      console.log('Creating Razorpay order for amount:', amount, currency)
      
      const response = await authenticatedFetch(`${API_BASE_URL}/payment/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount,
          currency: currency
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to create payment order'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Order created successfully:', data)
      
      return {
        status: true,
        message: "Order created successfully",
        data: data
      }
    } catch (error) {
      console.error('Error creating order:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  /**
   * Verify payment with Razorpay
   * @param {string} orderId - Razorpay order ID
   * @param {string} paymentId - Razorpay payment ID
   * @param {string} signature - Razorpay signature
   * @returns {Promise<Object>} Verification result
   */
  async verifyPayment(orderId, paymentId, signature) {
    try {
      console.log('Verifying payment:', { orderId, paymentId, signature })
      
      const response = await authenticatedFetch(`${API_BASE_URL}/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId,
          paymentId: paymentId,
          signature: signature
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to verify payment'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Payment verification result:', data)
      
      return {
        status: true,
        message: "Payment verification completed",
        data: data
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  },

  /**
   * Get payment history for the current user
   * @returns {Promise<Object>} Payment history
   */
  async getPaymentHistory() {
    try {
      console.log('Fetching payment history')
      
      const response = await authenticatedFetch(`${API_BASE_URL}/payment/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      if (!response.ok) {
        let errorMessage = 'Failed to fetch payment history'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Payment history fetched successfully:', data)
      
      return {
        status: true,
        message: "Payment history retrieved successfully",
        data: data.history || []
      }
    } catch (error) {
      console.error('Error fetching payment history:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      throw error
    }
  }
}

export default paymentService
