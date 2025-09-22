/**
 * Subscription plans configuration
 * This should match the backend plan configuration
 */

export const SUBSCRIPTION_PLANS = {
  MAYYO_PLUS: {
    id: 'maayo_plus',
    name: 'Maayo Plus',
    description: 'Perfect for freelancers who want to boost their visibility and get more projects',
    monthly: {
      price: 249,
      period: 'month',
      periodText: 'per month'
    },
    yearly: {
      price: 999,
      period: 'year',
      periodText: 'per year (valid for 12 months)',
      savings: 1989 // Savings compared to monthly
    },
    features: [
      '100 project or job applications included (per year)',
      'Each additional application costs ₹9.99',
      'Access to advanced proposal analytics',
      'Early access to new projects',
      'Premium chat support',
      'Personalized guidance on client acquisition and income growth'
    ],
    limits: {
      applications: 100,
      additionalApplicationCost: 9.99
    },
    isPopular: false
  },
  
  MAYYO_PLUS_PRO: {
    id: 'maayo_plus_pro',
    name: 'Maayo Plus Pro',
    description: 'For serious freelancers who want maximum visibility and unlimited opportunities',
    monthly: {
      price: 999,
      period: 'month',
      periodText: 'per month'
    },
    yearly: {
      price: 6000,
      period: 'year',
      periodText: 'per year (a savings of ₹5,989)',
      savings: 5989 // Savings compared to monthly
    },
    features: [
      'Everything included in the Maayo Plus plan',
      'Unlimited project/job applications',
      'VIP profile visibility and priority search ranking',
      'A "Pro" badge on the profile for enhanced trust',
      'Special access to priority and "Plus-Pro-Only" projects',
      'Early access to premium jobs (8 hours before standard users)',
      'Top-tier profile boost—highlighted in all searches and categories',
      'Monthly personalized profile/gig review by the Maayo Success Team',
      'Priority invitations to exclusive projects and features',
      '1:1 strategy session with a Maayo Success Manager',
      'Discounts on featured profile/gig promotions (when available)',
      'Beta access to new Maayo tools and features'
    ],
    limits: {
      applications: 'unlimited',
      additionalApplicationCost: 0
    },
    isPopular: true
  }
}

export const BILLING_CYCLES = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
}

export const PLAN_FEATURES_COMPARISON = [
  { 
    feature: 'Price', 
    plus: '₹999/year or ₹249/month', 
    pro: '₹999/month or ₹6,000/year' 
  },
  { 
    feature: 'Included Applications per Period', 
    plus: '100/year or 15/month', 
    pro: 'Unlimited' 
  },
  { 
    feature: 'Cost per Additional Application', 
    plus: '₹9.99', 
    pro: 'N/A' 
  },
  { 
    feature: 'Advanced Analytics', 
    plus: '✓', 
    pro: '✓' 
  },
  { 
    feature: 'Early Access to Projects', 
    plus: '✓', 
    pro: '✓ (premium tier)' 
  },
  { 
    feature: 'Premium Chat Support', 
    plus: '✓', 
    pro: '✓ (priority)' 
  },
  { 
    feature: 'Client/Job Growth Guidance', 
    plus: '✓', 
    pro: '✓' 
  },
  { 
    feature: 'Priority Profile/Search Boost', 
    plus: '—', 
    pro: '✓' 
  },
  { 
    feature: '"Pro" Badge', 
    plus: '—', 
    pro: '✓' 
  },
  { 
    feature: 'Exclusive Projects', 
    plus: '—', 
    pro: '✓' 
  },
  { 
    feature: 'Personalized Gig Review', 
    plus: '—', 
    pro: '✓ (monthly)' 
  },
  { 
    feature: '1:1 Success Manager Session', 
    plus: '—', 
    pro: '✓' 
  },
  { 
    feature: 'Discounts/Promos', 
    plus: '—', 
    pro: '✓' 
  },
  { 
    feature: 'Beta Features Access', 
    plus: '—', 
    pro: '✓' 
  }
]

export default SUBSCRIPTION_PLANS
