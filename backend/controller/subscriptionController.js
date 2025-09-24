import Subscription from "../schema/subscription.js";
import PersonMaster from "../schema/PersonMaster.js";
import { SUBSCRIPTION_PLANS, YEARLY_PLANS, getPlanById, hasFeatureAccess, hasReachedLimit } from "../config/subscriptionPlans.js";
import razorpay from "../services/razorpay.js";

export default class SubscriptionController {
    /**
     * Get all available subscription plans
     */
    async getPlans(req, res) {
        try {
            const { billing_cycle = 'monthly' } = req.body;
            
            const plans = billing_cycle === 'yearly' ? YEARLY_PLANS : SUBSCRIPTION_PLANS;
            
            return res.status(200).json({
                status: true,
                message: "Subscription plans fetched successfully",
                data: Object.values(plans)
            });
        } catch (error) {
            console.error("Error fetching subscription plans:", error);
            return res.status(500).json({
                status: false,
                message: "Failed to fetch subscription plans",
                error: error.message
            });
        }
    }

    /**
     * Get user's current subscription
     */
    async getCurrentSubscription(req, res) {
        try {
            const userId = req.headers.id;
            
            // Get user's subscription from PersonMaster
            const user = await PersonMaster.findById(userId);
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: "User not found"
                });
            }

            // Get detailed subscription info if exists
            const subscription = await Subscription.findOne({ 
                user_id: userId, 
                status: { $in: ['active', 'trialing'] } 
            }).sort({ created_at: -1 });

            const currentPlan = getPlanById(user.subscription?.plan_id || 'free');
            
            return res.status(200).json({
                status: true,
                message: "Current subscription fetched successfully",
                data: {
                    plan: currentPlan,
                    subscription: subscription,
                    user_subscription: user.subscription,
                    features: user.subscription?.features || currentPlan.features
                }
            });
        } catch (error) {
            console.error("Error fetching current subscription:", error);
            return res.status(500).json({
                status: false,
                message: "Failed to fetch current subscription",
                error: error.message
            });
        }
    }

    /**
     * Create subscription using Razorpay
     */
    async createSubscription(req, res) {
        try {
            const userId = req.headers.id;
            const { plan_id, billing_cycle = 'monthly' } = req.body;

            // Validate plan
            const plan = getPlanById(plan_id, billing_cycle);
            if (!plan) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid subscription plan"
                });
            }

            // Check if user already has an active subscription
            const existingSubscription = await Subscription.findOne({
                user_id: userId,
                status: { $in: ['active', 'trialing'] }
            });

            if (existingSubscription) {
                return res.status(400).json({
                    status: false,
                    message: "User already has an active subscription"
                });
            }

            // Create Razorpay subscription
            const subscriptionOptions = {
                plan_id: plan.razorpay_plan_id,
                customer_notify: 1,
                quantity: 1,
                total_count: billing_cycle === 'yearly' ? 1 : 12, // 1 year or 12 months
                start_at: Math.floor(Date.now() / 1000) + 60, // Start in 1 minute
                expire_by: Math.floor(Date.now() / 1000) + (billing_cycle === 'yearly' ? 365 * 24 * 60 * 60 : 30 * 24 * 60 * 60),
                addons: [],
                notes: {
                    user_id: userId,
                    plan_id: plan_id,
                    billing_cycle: billing_cycle
                }
            };

            const razorpaySubscription = await razorpay.subscriptions.create(subscriptionOptions);

            // Create subscription record in database
            const subscription = new Subscription({
                user_id: userId,
                plan_id: plan_id,
                plan_name: plan.name,
                status: 'incomplete',
                provider: 'razorpay',
                subscription_id: razorpaySubscription.id,
                price_id: plan.razorpay_plan_id,
                billing_cycle: billing_cycle,
                amount: plan.price,
                currency: plan.currency,
                features: plan.features,
                metadata: {
                    razorpay_subscription: razorpaySubscription
                }
            });

            await subscription.save();

            return res.status(201).json({
                status: true,
                message: "Subscription created successfully",
                data: {
                    subscription_id: razorpaySubscription.id,
                    short_url: razorpaySubscription.short_url,
                    status: razorpaySubscription.status,
                    plan: plan
                }
            });
        } catch (error) {
            console.error("Error creating subscription:", error);
            return res.status(500).json({
                status: false,
                message: "Failed to create subscription",
                error: error.message
            });
        }
    }

    /**
     * Verify subscription payment
     */
    async verifySubscription(req, res) {
        try {
            const { subscription_id, payment_id, signature } = req.body;
            const crypto = await import('crypto');

            // Verify Razorpay signature
            const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(subscription_id + "|" + payment_id)
                .digest('hex');

            if (generatedSignature !== signature) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid signature"
                });
            }

            // Get subscription from Razorpay
            const razorpaySubscription = await razorpay.subscriptions.fetch(subscription_id);

            // Update subscription in database
            const subscription = await Subscription.findOne({ subscription_id });
            if (!subscription) {
                return res.status(404).json({
                    status: false,
                    message: "Subscription not found"
                });
            }

            // Update subscription status
            subscription.status = razorpaySubscription.status;
            subscription.current_period_start = new Date(razorpaySubscription.current_start * 1000);
            subscription.current_period_end = new Date(razorpaySubscription.current_end * 1000);
            subscription.customer_id = razorpaySubscription.customer_id;
            await subscription.save();

            // Update user's subscription in PersonMaster
            const user = await PersonMaster.findById(subscription.user_id);
            if (user) {
                user.subscription = {
                    plan_id: subscription.plan_id,
                    status: subscription.status,
                    current_period_end: subscription.current_period_end,
                    features: subscription.features
                };
                await user.save();
            }

            return res.status(200).json({
                status: true,
                message: "Subscription verified successfully",
                data: {
                    subscription: subscription,
                    razorpay_subscription: razorpaySubscription
                }
            });
        } catch (error) {
            console.error("Error verifying subscription:", error);
            return res.status(500).json({
                status: false,
                message: "Failed to verify subscription",
                error: error.message
            });
        }
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(req, res) {
        try {
            const userId = req.headers.id;
            const { cancel_at_period_end = true } = req.body;

            const subscription = await Subscription.findOne({
                user_id: userId,
                status: { $in: ['active', 'trialing'] }
            });

            if (!subscription) {
                return res.status(404).json({
                    status: false,
                    message: "No active subscription found"
                });
            }

            // Cancel subscription in Razorpay
            const razorpaySubscription = await razorpay.subscriptions.cancel(subscription.subscription_id, {
                cancel_at_cycle_end: cancel_at_period_end ? 1 : 0
            });

            // Update subscription in database
            subscription.status = cancel_at_period_end ? 'active' : 'canceled';
            subscription.cancel_at_period_end = cancel_at_period_end;
            subscription.canceled_at = cancel_at_period_end ? null : new Date();
            await subscription.save();

            // Update user's subscription
            const user = await PersonMaster.findById(userId);
            if (user) {
                user.subscription.status = subscription.status;
                user.subscription.current_period_end = subscription.current_period_end;
                await user.save();
            }

            return res.status(200).json({
                status: true,
                message: cancel_at_period_end ? 
                    "Subscription will be canceled at the end of current period" : 
                    "Subscription canceled immediately",
                data: {
                    subscription: subscription,
                    razorpay_subscription: razorpaySubscription
                }
            });
        } catch (error) {
            console.error("Error canceling subscription:", error);
            return res.status(500).json({
                status: false,
                message: "Failed to cancel subscription",
                error: error.message
            });
        }
    }

    /**
     * Check feature access for user
     */
    async checkFeatureAccess(req, res) {
        try {
            const userId = req.headers.id;
            const { feature } = req.body;

            const user = await PersonMaster.findById(userId);
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: "User not found"
                });
            }

            const hasAccess = hasFeatureAccess(user, feature);
            const currentPlan = getPlanById(user.subscription?.plan_id || 'free');

            return res.status(200).json({
                status: true,
                message: "Feature access checked",
                data: {
                    has_access: hasAccess,
                    feature: feature,
                    current_plan: currentPlan,
                    user_features: user.subscription?.features || currentPlan.features
                }
            });
        } catch (error) {
            console.error("Error checking feature access:", error);
            return res.status(500).json({
                status: false,
                message: "Failed to check feature access",
                error: error.message
            });
        }
    }

    /**
     * Get subscription usage statistics
     */
    async getUsageStats(req, res) {
        try {
            const userId = req.headers.id;
            const user = await PersonMaster.findById(userId);
            
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: "User not found"
                });
            }

            const currentPlan = getPlanById(user.subscription?.plan_id || 'free');
            
            // Get current usage (you'll need to implement these queries based on your data)
            const currentUsage = {
                projects_created: 0, // Query from projects collection
                bids_submitted: 0, // Query from bids collection
                ai_proposals_used: 0, // Query from AI usage logs
                // Add more usage metrics as needed
            };

            return res.status(200).json({
                status: true,
                message: "Usage statistics fetched successfully",
                data: {
                    current_plan: currentPlan,
                    usage: currentUsage,
                    limits: currentPlan.features,
                    user_features: user.subscription?.features || currentPlan.features
                }
            });
        } catch (error) {
            console.error("Error fetching usage stats:", error);
            return res.status(500).json({
                status: false,
                message: "Failed to fetch usage statistics",
                error: error.message
            });
        }
    }
}
