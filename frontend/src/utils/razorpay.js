/**
 * Razorpay integration utility for frontend
 */

// Load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/**
 * Initialize Razorpay payment
 * @param {Object} options - Razorpay options
 * @returns {Promise<Object>} Payment result
 */
export const initializeRazorpay = async (options) => {
  try {
    // Check if Razorpay key is configured
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID
    console.log('🔍 Razorpay Key Debug:', {
      envKey: razorpayKey,
      isDummy: razorpayKey === 'rzp_test_1234567890',
      isConfigured: !!razorpayKey && razorpayKey !== 'rzp_test_1234567890'
    })
    
    if (!razorpayKey || razorpayKey === 'rzp_test_1234567890') {
      console.warn('⚠️ Razorpay key not configured properly. Using fallback key.')
      console.warn('Please check your .env file and restart the development server.')
    } else {
      console.log('✅ Razorpay key is properly configured:', razorpayKey.substring(0, 12) + '...')
    }

    const isLoaded = await loadRazorpayScript()
    if (!isLoaded) {
      throw new Error('Failed to load Razorpay script')
    }

    return new Promise((resolve, reject) => {
      const razorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        ...options,
        handler: function (response) {
          console.log('Payment successful:', response)
          resolve({
            success: true,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature
          })
        },
        prefill: {
          name: options.name || '',
          email: options.email || '',
          contact: options.contact || ''
        },
        theme: {
          color: '#4F46E5' // Indigo color matching the app theme
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed')
            resolve({
              success: false,
              error: 'Payment cancelled by user'
            })
          }
        }
      }

      const razorpay = new window.Razorpay(razorpayOptions)
      razorpay.open()
    })
  } catch (error) {
    console.error('Error initializing Razorpay:', error)
    throw error
  }
}

/**
 * Process subscription payment
 * @param {Object} plan - Subscription plan details
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Payment result
 */
export const processSubscriptionPayment = async (plan, userData) => {
  try {
    // Calculate amount based on plan and billing cycle
    const amount = plan.price // Amount in rupees
    
    // Create Razorpay order
    const { paymentService } = await import('../services/paymentService')
    const orderResponse = await paymentService.createOrder(amount, 'INR')
    
    if (!orderResponse.status) {
      throw new Error(orderResponse.message || 'Failed to create order')
    }

    const orderData = orderResponse.data
    
    // Initialize Razorpay payment
    const paymentResult = await initializeRazorpay({
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.orderId,
      name: userData?.first_name ? `${userData.first_name} ${userData.last_name}` : 'User',
      email: userData?.email || '',
      contact: userData?.contact_number || '',
      description: `Subscription: ${plan.name}`,
      notes: {
        plan_id: plan.id,
        plan_name: plan.name,
        user_id: userData?._id
      }
    })

    if (paymentResult.success) {
      // Verify payment
      const verificationResult = await paymentService.verifyPayment(
        paymentResult.orderId,
        paymentResult.paymentId,
        paymentResult.signature
      )

      if (verificationResult.status && verificationResult.data.success) {
        return {
          success: true,
          message: 'Payment successful! Your subscription is now active.',
          paymentId: paymentResult.paymentId,
          orderId: paymentResult.orderId
        }
      } else {
        throw new Error('Payment verification failed')
      }
    } else {
      return {
        success: false,
        message: paymentResult.error || 'Payment was cancelled'
      }
    }
  } catch (error) {
    console.error('Error processing subscription payment:', error)
    return {
      success: false,
      message: error.message || 'Payment failed. Please try again.'
    }
  }
}

export default {
  initializeRazorpay,
  processSubscriptionPayment
}
