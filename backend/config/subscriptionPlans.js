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
            max_jobs: 10, // Job postings for clients
            max_job_applications: 20, // Job applications for freelancers
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
        razorpay_plan_id: 'plan_maayo_plus_monthly', // Replace with actual Razorpay plan ID
        features: {
            max_projects: 10,
            max_bids_per_month: 25,
            max_jobs: 50, // Job postings for clients
            max_job_applications: 100, // Job applications for freelancers
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
        razorpay_plan_id: 'plan_maayo_plus_pro_monthly', // Replace with actual Razorpay plan ID
        features: {
            max_projects: -1, // Unlimited
            max_bids_per_month: -1, // Unlimited
            max_jobs: -1, // Unlimited job postings for clients
            max_job_applications: -1, // Unlimited job applications for freelancers
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
};

// Yearly plans with discount
export const YEARLY_PLANS = {
    maayo_plus: {
        ...SUBSCRIPTION_PLANS.maayo_plus,
        price: 999, // Yearly price (₹249 * 12 = ₹2,988, but discounted to ₹999)
        billing_cycle: 'yearly',
        razorpay_plan_id: 'plan_maayo_plus_yearly',
        savings: 'Save ₹1,989 per year'
    },
    maayo_plus_pro: {
        ...SUBSCRIPTION_PLANS.maayo_plus_pro,
        price: 6000, // Yearly price (₹999 * 12 = ₹11,988, but discounted to ₹6,000)
        billing_cycle: 'yearly',
        razorpay_plan_id: 'plan_maayo_plus_pro_yearly',
        savings: 'Save ₹5,988 per year'
    }
};

// Feature limits for different user types
export const USER_TYPE_LIMITS = {
    freelancer: {
        free: {
            max_active_projects: 2,
            max_bids_per_day: 3,
            profile_views: 50,
            applications_per_year: 0
        },
        maayo_plus: {
            max_active_projects: 5,
            max_bids_per_day: 10,
            profile_views: 200,
            applications_per_year: 100
        },
        maayo_plus_pro: {
            max_active_projects: -1, // Unlimited
            max_bids_per_day: -1, // Unlimited
            profile_views: -1, // Unlimited
            applications_per_year: -1 // Unlimited
        }
    },
    client: {
        free: {
            max_active_projects: 2,
            max_freelancer_contacts: 5,
            project_analytics: false
        },
        maayo_plus: {
            max_active_projects: 5,
            max_freelancer_contacts: 20,
            project_analytics: true
        },
        maayo_plus_pro: {
            max_active_projects: -1, // Unlimited
            max_freelancer_contacts: -1, // Unlimited
            project_analytics: true
        }
    }
};

// Helper function to get plan by ID
export const getPlanById = (planId, billingCycle = 'monthly') => {
    if (billingCycle === 'yearly') {
        return YEARLY_PLANS[planId] || SUBSCRIPTION_PLANS[planId];
    }
    return SUBSCRIPTION_PLANS[planId];
};

// Helper function to check if user has feature access
export const hasFeatureAccess = (user, feature) => {
    const plan = getPlanById(user.subscription?.plan_id || 'free');
    return plan?.features[feature] || false;
};

// Helper function to check if user has reached limit
export const hasReachedLimit = (user, limitType, currentCount) => {
    const plan = getPlanById(user.subscription?.plan_id || 'free');
    const userTypeLimits = USER_TYPE_LIMITS[user.user_type];
    const limit = userTypeLimits?.[plan.id]?.[limitType];
    
    if (limit === -1) return false; // Unlimited
    return currentCount >= limit;
};
