import { useState, useEffect } from 'react'
import { authenticatedFetch } from '../utils/api'

const SubscriptionModal = ({ isOpen, onClose, onUpgrade }) => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [currentSubscription, setCurrentSubscription] = useState(null)

  useEffect(() => {
    if (isOpen) {
      fetchPlans()
      fetchCurrentSubscription()
    }
  }, [isOpen, billingCycle])

  const fetchPlans = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const response = await fetch(`${API_BASE_URL}/subscription/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          billing_cycle: billingCycle
        })
      })
      const data = await response.json()
      
      if (data.status) {
        setPlans(data.data)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const fetchCurrentSubscription = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const response = await authenticatedFetch(`${API_BASE_URL}/subscription/current`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      const data = await response.json()
      
      if (data.status) {
        setCurrentSubscription(data.data)
      }
    } catch (error) {
      console.error('Error fetching current subscription:', error)
    }
  }

  const handleUpgrade = async (plan) => {
    try {
      setLoading(true)
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      
      const response = await authenticatedFetch(`${API_BASE_URL}/subscription/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan_id: plan.id,
          billing_cycle: billingCycle
        })
      })

      const data = await response.json()
      
      if (data.status && data.data.short_url) {
        // Redirect to Razorpay checkout
        window.location.href = data.data.short_url
      } else {
        alert('Failed to create subscription. Please try again.')
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getFeatureIcon = (feature) => {
    switch (feature) {
      case 'ai_proposals':
        return '🤖'
      case 'priority_support':
        return '⚡'
      case 'advanced_analytics':
        return '📊'
      case 'custom_branding':
        return '🎨'
      case 'api_access':
        return '🔌'
      case 'escrow_protection':
        return '🛡️'
      default:
        return '✅'
    }
  }

  const getFeatureName = (feature) => {
    const featureNames = {
      max_projects: 'Max Projects',
      max_bids_per_month: 'Bids per Month',
      ai_proposals: 'AI Proposals',
      priority_support: 'Priority Support',
      advanced_analytics: 'Advanced Analytics',
      custom_branding: 'Custom Branding',
      api_access: 'API Access',
      escrow_protection: 'Escrow Protection'
    }
    return featureNames[feature] || feature
  }

  const getFeatureValue = (feature, value) => {
    if (value === true) return 'Included'
    if (value === false) return 'Not Included'
    if (value === -1) return 'Unlimited'
    return value.toString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100] p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
              <p className="text-gray-600 mt-1">Unlock powerful features to grow your freelance business</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Billing Toggle */}
          <div className="mt-4 flex items-center justify-center">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white border-2 rounded-lg p-6 transition-all hover:shadow-lg ${
                  plan.popular
                    ? 'border-violet-500 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-violet-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-gray-600 ml-1">/{plan.billing_cycle === 'yearly' ? 'year' : 'month'}</span>
                  </div>
                  {plan.savings && (
                    <p className="text-sm text-green-600 font-medium">{plan.savings}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {Object.entries(plan.features).map(([feature, value]) => (
                    <div key={feature} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getFeatureIcon(feature)}</span>
                        <span className="text-sm text-gray-700">{getFeatureName(feature)}</span>
                      </div>
                      <span className={`text-sm font-medium ${
                        value === true || value === -1
                          ? 'text-green-600'
                          : value === false
                          ? 'text-gray-400'
                          : 'text-gray-900'
                      }`}>
                        {getFeatureValue(feature, value)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Current Plan Indicator */}
                {currentSubscription?.plan?.id === plan.id && (
                  <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800 text-center font-medium">
                      ✓ Current Plan
                    </p>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={loading || currentSubscription?.plan?.id === plan.id}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-violet-500 text-white hover:bg-violet-600'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } ${
                    currentSubscription?.plan?.id === plan.id
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  } ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : currentSubscription?.plan?.id === plan.id ? (
                    'Current Plan'
                  ) : plan.price === 0 ? (
                    'Get Started'
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-12 border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Frequently Asked Questions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Can I change plans anytime?</h4>
                <p className="text-sm text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">What payment methods do you accept?</h4>
                <p className="text-sm text-gray-600">We accept all major credit cards, debit cards, and UPI payments through Razorpay.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Is there a free trial?</h4>
                <p className="text-sm text-gray-600">Yes, all paid plans come with a 7-day free trial. No credit card required.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Can I cancel anytime?</h4>
                <p className="text-sm text-gray-600">Absolutely. You can cancel your subscription anytime and continue using the service until the end of your billing period.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionModal
