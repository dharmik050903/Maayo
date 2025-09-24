import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'tblpersonmaster', 
        required: true 
    },
    plan_id: { 
        type: String, 
        required: true 
    }, // 'free', 'basic', 'pro', 'enterprise'
    plan_name: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['active', 'trialing', 'past_due', 'canceled', 'incomplete', 'paused'],
        default: 'active'
    },
    provider: { 
        type: String, 
        enum: ['razorpay', 'stripe'], 
        default: 'razorpay' 
    },
    subscription_id: { 
        type: String 
    }, // Razorpay/Stripe subscription ID
    customer_id: { 
        type: String 
    }, // Razorpay/Stripe customer ID
    price_id: { 
        type: String 
    }, // Razorpay/Stripe price ID
    current_period_start: { 
        type: Date 
    },
    current_period_end: { 
        type: Date 
    },
    cancel_at_period_end: { 
        type: Boolean, 
        default: false 
    },
    canceled_at: { 
        type: Date 
    },
    trial_start: { 
        type: Date 
    },
    trial_end: { 
        type: Date 
    },
    features: {
        max_projects: { type: Number, default: 0 },
        max_bids_per_month: { type: Number, default: 0 },
        ai_proposals: { type: Boolean, default: false },
        priority_support: { type: Boolean, default: false },
        advanced_analytics: { type: Boolean, default: false },
        custom_branding: { type: Boolean, default: false },
        api_access: { type: Boolean, default: false },
        escrow_protection: { type: Boolean, default: false }
    },
    billing_cycle: { 
        type: String, 
        enum: ['monthly', 'yearly'], 
        default: 'monthly' 
    },
    amount: { 
        type: Number, 
        required: true 
    },
    currency: { 
        type: String, 
        default: 'INR' 
    },
    metadata: { 
        type: Object, 
        default: {} 
    },
    created_at: { 
        type: Date, 
        default: Date.now 
    },
    updated_at: { 
        type: Date, 
        default: Date.now 
    }
});

// Indexes for better query performance
subscriptionSchema.index({ user_id: 1 });
subscriptionSchema.index({ subscription_id: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ current_period_end: 1 });

// Update the updated_at field before saving
subscriptionSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

export default mongoose.model('tblsubscriptions', subscriptionSchema);
