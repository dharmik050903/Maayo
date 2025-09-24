import { authenticatedFetch } from '../utils/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export const subscriptionService = {
  // Get all available subscription plans
  async getPlans(billingCycle = 'monthly') {
    try {
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
        return {
          status: true,
          message: "Plans fetched successfully",
          data: data.data
        }
      } else {
        throw new Error(data.message || 'Failed to fetch plans')
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error)
      throw error
    }
  },

  // Get user's current subscription
  async getCurrentSubscription() {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/subscription/current`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      const data = await response.json()
      
      if (data.status) {
        return {
          status: true,
          message: "Current subscription fetched successfully",
          data: data.data
        }
      } else {
        throw new Error(data.message || 'Failed to fetch current subscription')
      }
    } catch (error) {
      console.error('Error fetching current subscription:', error)
      throw error
    }
  },

  // Create a new subscription
  async createSubscription(planId, billingCycle = 'monthly') {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/subscription/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan_id: planId,
          billing_cycle: billingCycle
        })
      })

      const data = await response.json()
      
      if (data.status) {
        return {
          status: true,
          message: "Subscription created successfully",
          data: data.data
        }
      } else {
        throw new Error(data.message || 'Failed to create subscription')
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      throw error
    }
  },

  // Verify subscription payment
  async verifySubscription(subscriptionId, paymentId, signature) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/subscription/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription_id: subscriptionId,
          payment_id: paymentId,
          signature: signature
        })
      })

      const data = await response.json()
      
      if (data.status) {
        return {
          status: true,
          message: "Subscription verified successfully",
          data: data.data
        }
      } else {
        throw new Error(data.message || 'Failed to verify subscription')
      }
    } catch (error) {
      console.error('Error verifying subscription:', error)
      throw error
    }
  },

  // Cancel subscription
  async cancelSubscription(cancelAtPeriodEnd = true) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cancel_at_period_end: cancelAtPeriodEnd
        })
      })

      const data = await response.json()
      
      if (data.status) {
        return {
          status: true,
          message: "Subscription canceled successfully",
          data: data.data
        }
      } else {
        throw new Error(data.message || 'Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      throw error
    }
  },

  // Check feature access
  async checkFeatureAccess(feature) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/subscription/check-feature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          feature: feature
        })
      })

      const data = await response.json()
      
      if (data.status) {
        return {
          status: true,
          message: "Feature access checked",
          data: data.data
        }
      } else {
        throw new Error(data.message || 'Failed to check feature access')
      }
    } catch (error) {
      console.error('Error checking feature access:', error)
      throw error
    }
  },

  // Get usage statistics
  async getUsageStats() {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/subscription/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      const data = await response.json()
      
      if (data.status) {
        return {
          status: true,
          message: "Usage statistics fetched successfully",
          data: data.data
        }
      } else {
        throw new Error(data.message || 'Failed to fetch usage statistics')
      }
    } catch (error) {
      console.error('Error fetching usage statistics:', error)
      throw error
    }
  },

  // Helper function to check if user has feature access locally
  hasFeatureAccess(user, feature) {
    if (!user || !user.subscription) return false
    
    const features = user.subscription.features || {}
    return features[feature] || false
  },

  // Helper function to check if user has reached limit
  hasReachedLimit(user, limitType, currentCount) {
    if (!user || !user.subscription) return false
    
    const features = user.subscription.features || {}
    const limit = features[limitType]
    
    if (limit === -1) return false // Unlimited
    if (limit === undefined || limit === null) return false
    
    return currentCount >= limit
  },

  // Helper function to get upgrade suggestions
  getUpgradeSuggestions(user, feature) {
    const suggestions = []
    
    if (feature === 'ai_proposals' && !this.hasFeatureAccess(user, 'ai_proposals')) {
      suggestions.push({
        plan: 'maayo_plus',
        reason: 'Unlock AI-powered proposal generation',
        benefit: 'Save time and create more professional proposals',
        price: '₹249/month'
      })
    }
    
    if (feature === 'max_projects' && user.subscription?.plan_id === 'free') {
      suggestions.push({
        plan: 'maayo_plus',
        reason: 'Create more projects',
        benefit: 'Increase your project limit from 3 to 10',
        price: '₹249/month'
      })
    }
    
    if (feature === 'max_bids_per_month' && user.subscription?.plan_id === 'free') {
      suggestions.push({
        plan: 'maayo_plus',
        reason: 'Submit more bids',
        benefit: 'Increase your monthly bid limit from 5 to 25',
        price: '₹249/month'
      })
    }
    
    if (feature === 'applications_per_year' && user.subscription?.plan_id === 'free') {
      suggestions.push({
        plan: 'maayo_plus',
        reason: 'Get more project applications',
        benefit: '100 applications per year included',
        price: '₹249/month'
      })
    }
    
    if (feature === 'vip_profile_visibility' && !this.hasFeatureAccess(user, 'vip_profile_visibility')) {
      suggestions.push({
        plan: 'maayo_plus_pro',
        reason: 'Get VIP profile visibility',
        benefit: 'Priority search ranking and enhanced visibility',
        price: '₹999/month'
      })
    }
    
    if (feature === 'advanced_analytics' && !this.hasFeatureAccess(user, 'advanced_analytics')) {
      suggestions.push({
        plan: 'maayo_plus',
        reason: 'Access advanced analytics',
        benefit: 'Get detailed insights about your performance',
        price: '₹249/month'
      })
    }
    
    return suggestions
  }
}

export default subscriptionService
