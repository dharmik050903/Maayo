export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'INR',
    billing_cycle: 'monthly',
    features: {
      max_projects: 3,
      max_bids_per_month: 5,
      ai_proposals: false,
      priority_support: false,
      advanced_analytics: false,
      custom_branding: false,
      api_access: false,
      escrow_protection: false,
      applications_per_year: 0,
      additional_application_cost: 0
    },
    description: 'Perfect for getting started',
    popular: false
  },
  maayo_plus: {
    id: 'maayo_plus',
    name: 'Maayo Plus',
    price: 249, // Monthly price
    currency: 'INR',
    billing_cycle: 'monthly',
    features: {
      max_projects: 10,
      max_bids_per_month: 25,
      ai_proposals: true,
      priority_support: true,
      advanced_analytics: true,
      custom_branding: false,
      api_access: false,
      escrow_protection: true,
      applications_per_year: 100,
      additional_application_cost: 9.99,
      early_access_projects: true,
      premium_chat_support: true,
      personalized_guidance: true
    },
    description: 'Perfect for freelancers who want to boost their visibility and get more projects',
    popular: false
  },
  maayo_plus_pro: {
    id: 'maayo_plus_pro',
    name: 'Maayo Plus Pro',
    price: 999, // Monthly price
    currency: 'INR',
    billing_cycle: 'monthly',
    features: {
      max_projects: -1, // Unlimited
      max_bids_per_month: -1, // Unlimited
      ai_proposals: true,
      priority_support: true,
      advanced_analytics: true,
      custom_branding: true,
      api_access: true,
      escrow_protection: true,
      applications_per_year: -1, // Unlimited
      additional_application_cost: 0,
      early_access_projects: true,
      premium_chat_support: true,
      personalized_guidance: true,
      vip_profile_visibility: true,
      pro_badge: true,
      exclusive_projects: true,
      personalized_gig_review: true,
      success_manager_session: true,
      discounts_promos: true,
      beta_features_access: true
    },
    description: 'For serious freelancers who want maximum visibility and unlimited opportunities',
    popular: true
  }
}

// Yearly plans with discount
export const YEARLY_PLANS = {
  maayo_plus: {
    ...SUBSCRIPTION_PLANS.maayo_plus,
    price: 999, // Yearly price (₹249 * 12 = ₹2,988, but discounted to ₹999)
    billing_cycle: 'yearly',
    savings: 'Save ₹1,989 per year'
  },
  maayo_plus_pro: {
    ...SUBSCRIPTION_PLANS.maayo_plus_pro,
    price: 6000, // Yearly price (₹999 * 12 = ₹11,988, but discounted to ₹6,000)
    billing_cycle: 'yearly',
    savings: 'Save ₹5,988 per year'
  }
}

// Feature descriptions for better UX
export const FEATURE_DESCRIPTIONS = {
  max_projects: 'Maximum number of active projects you can have',
  max_bids_per_month: 'Maximum number of bids you can submit per month',
  ai_proposals: 'Generate professional proposals using AI',
  priority_support: 'Get priority customer support with faster response times',
  advanced_analytics: 'Access detailed analytics and insights about your performance',
  custom_branding: 'Customize your profile with your own branding',
  api_access: 'Access to Maayo API for integrations',
  escrow_protection: 'Secure payment protection for your projects',
  applications_per_year: 'Number of project applications included per year',
  additional_application_cost: 'Cost per additional application beyond the limit',
  early_access_projects: 'Get early access to new projects before they go public',
  premium_chat_support: 'Access to premium chat support with faster response times',
  personalized_guidance: 'Personalized guidance on client acquisition and income growth',
  vip_profile_visibility: 'VIP profile visibility and priority search ranking',
  pro_badge: 'Professional badge displayed on your profile for enhanced trust',
  exclusive_projects: 'Access to exclusive projects available only to Pro members',
  personalized_gig_review: 'Monthly personalized profile/gig review by the Maayo Success Team',
  success_manager_session: '1:1 strategy session with a Maayo Success Manager',
  discounts_promos: 'Access to discounts on featured profile/gig promotions',
  beta_features_access: 'Early access to new Maayo tools and features'
}

// Helper function to check if user has feature access
export const hasFeatureAccess = (user, feature) => {
  if (!user || !user.subscription) return false
  
  const plan = user.subscription.plan_id === 'free' ? SUBSCRIPTION_PLANS.free : 
               user.subscription.plan_id === 'maayo_plus' ? SUBSCRIPTION_PLANS.maayo_plus :
               user.subscription.plan_id === 'maayo_plus_pro' ? SUBSCRIPTION_PLANS.maayo_plus_pro :
               SUBSCRIPTION_PLANS.free
  
  return plan.features[feature] || false
}

// Helper function to get user's current plan
export const getCurrentPlan = (user) => {
  if (!user || !user.subscription) return SUBSCRIPTION_PLANS.free
  
  return SUBSCRIPTION_PLANS[user.subscription.plan_id] || SUBSCRIPTION_PLANS.free
}

// Helper function to format price
export const formatPrice = (price, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(price)
}

// Helper function to get upgrade suggestions
export const getUpgradeSuggestions = (user, feature) => {
  const suggestions = []
  
  if (feature === 'ai_proposals' && !hasFeatureAccess(user, 'ai_proposals')) {
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
  
  if (feature === 'vip_profile_visibility' && !hasFeatureAccess(user, 'vip_profile_visibility')) {
    suggestions.push({
      plan: 'maayo_plus_pro',
      reason: 'Get VIP profile visibility',
      benefit: 'Priority search ranking and enhanced visibility',
      price: '₹999/month'
    })
  }
  
  return suggestions
}
