import { getCurrentUser } from './api'

/**
 * Check if user has an active subscription
 * @param {Object} user - User object (optional, will get from localStorage if not provided)
 * @returns {boolean} True if user has active subscription
 */
export function hasActiveSubscription(user = null) {
  try {
    const userData = user || getCurrentUser()
    
    if (!userData) {
      return false
    }

    // Check if user has subscription data
    if (!userData.subscription) {
      return false
    }

    const subscription = userData.subscription

    // Check if subscription status is active or trialing
    const isActiveStatus = subscription.status === 'active' || subscription.status === 'trialing'
    
    if (!isActiveStatus) {
      return false
    }

    // Check if subscription hasn't expired
    if (subscription.currentPeriodEnd) {
      const currentDate = new Date()
      const periodEnd = new Date(subscription.currentPeriodEnd)
      
      if (currentDate > periodEnd) {
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return false
  }
}

/**
 * Get user's subscription plan name
 * @param {Object} user - User object (optional, will get from localStorage if not provided)
 * @returns {string|null} Plan name or null if no active subscription
 */
export function getUserSubscriptionPlan(user = null) {
  try {
    const userData = user || getCurrentUser()
    
    if (!userData || !userData.subscription || !hasActiveSubscription(userData)) {
      return null
    }

    return userData.subscription.planName || 'Premium'
  } catch (error) {
    console.error('Error getting subscription plan:', error)
    return null
  }
}

/**
 * Check if user needs to upgrade (no active subscription)
 * @param {Object} user - User object (optional, will get from localStorage if not provided)
 * @returns {boolean} True if user needs to upgrade
 */
export function needsUpgrade(user = null) {
  return !hasActiveSubscription(user)
}
