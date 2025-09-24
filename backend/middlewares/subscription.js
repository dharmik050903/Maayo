import PersonMaster from "../schema/PersonMaster.js";
import { getPlanById, hasFeatureAccess, hasReachedLimit } from "../config/subscriptionPlans.js";

/**
 * Middleware to check if user has active subscription
 */
export const requireActiveSubscription = async (req, res, next) => {
    try {
        const userId = req.headers.id;
        
        if (!userId) {
            return res.status(401).json({
                status: false,
                message: "Authentication required"
            });
        }

        const user = await PersonMaster.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        const currentPlan = getPlanById(user.subscription?.plan_id || 'free');
        
        // Check if subscription is active
        if (user.subscription?.status === 'active' || user.subscription?.plan_id === 'free') {
            req.user = user;
            req.currentPlan = currentPlan;
            next();
        } else {
            return res.status(402).json({
                status: false,
                message: "Active subscription required",
                data: {
                    current_plan: currentPlan,
                    subscription_status: user.subscription?.status
                }
            });
        }
    } catch (error) {
        console.error("Error in requireActiveSubscription middleware:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

/**
 * Middleware to check specific feature access
 */
export const requireFeatureAccess = (feature) => {
    return async (req, res, next) => {
        try {
            const userId = req.headers.id;
            
            if (!userId) {
                return res.status(401).json({
                    status: false,
                    message: "Authentication required"
                });
            }

            const user = await PersonMaster.findById(userId);
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: "User not found"
                });
            }

            const hasAccess = hasFeatureAccess(user, feature);
            
            if (hasAccess) {
                req.user = user;
                req.currentPlan = getPlanById(user.subscription?.plan_id || 'free');
                next();
            } else {
                const currentPlan = getPlanById(user.subscription?.plan_id || 'free');
                return res.status(402).json({
                    status: false,
                    message: `Feature '${feature}' requires a paid subscription`,
                    data: {
                        feature: feature,
                        current_plan: currentPlan,
                        upgrade_required: true
                    }
                });
            }
        } catch (error) {
            console.error(`Error in requireFeatureAccess middleware for ${feature}:`, error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    };
};

/**
 * Middleware to check usage limits
 */
export const checkUsageLimit = (limitType) => {
    return async (req, res, next) => {
        try {
            const userId = req.headers.id;
            
            if (!userId) {
                return res.status(401).json({
                    status: false,
                    message: "Authentication required"
                });
            }

            const user = await PersonMaster.findById(userId);
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: "User not found"
                });
            }

            // Get current usage count (implement based on your data structure)
            let currentCount = 0;
            
            switch (limitType) {
                case 'max_projects':
                    // Query projects collection for user's projects
                    // currentCount = await Project.countDocuments({ personid: userId });
                    break;
                case 'max_bids_per_month':
                    // Query bids collection for user's bids this month
                    // const startOfMonth = new Date();
                    // startOfMonth.setDate(1);
                    // currentCount = await Bid.countDocuments({ 
                    //     freelancer_id: userId, 
                    //     createdAt: { $gte: startOfMonth } 
                    // });
                    break;
                default:
                    currentCount = 0;
            }

            const hasReached = hasReachedLimit(user, limitType, currentCount);
            
            if (!hasReached) {
                req.user = user;
                req.currentPlan = getPlanById(user.subscription?.plan_id || 'free');
                req.currentUsage = currentCount;
                next();
            } else {
                const currentPlan = getPlanById(user.subscription?.plan_id || 'free');
                return res.status(402).json({
                    status: false,
                    message: `Usage limit reached for ${limitType}`,
                    data: {
                        limit_type: limitType,
                        current_usage: currentCount,
                        current_plan: currentPlan,
                        upgrade_required: true
                    }
                });
            }
        } catch (error) {
            console.error(`Error in checkUsageLimit middleware for ${limitType}:`, error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    };
};

/**
 * Middleware to check if user can create projects (for clients)
 */
export const canCreateProject = async (req, res, next) => {
    try {
        const userId = req.headers.id;
        const user = await PersonMaster.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        if (user.user_type !== 'client') {
            return res.status(403).json({
                status: false,
                message: "Only clients can create projects"
            });
        }

        // Check project creation limit
        const currentPlan = getPlanById(user.subscription?.plan_id || 'free');
        const maxProjects = currentPlan.features.max_projects;
        
        if (maxProjects === -1) {
            // Unlimited projects
            req.user = user;
            req.currentPlan = currentPlan;
            next();
        } else {
            // Check current project count
            // const currentProjectCount = await Project.countDocuments({ personid: userId });
            
            // For now, allow creation (implement actual count check)
            req.user = user;
            req.currentPlan = currentPlan;
            next();
        }
    } catch (error) {
        console.error("Error in canCreateProject middleware:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

/**
 * Middleware to check if user can submit bids (for freelancers)
 */
export const canSubmitBid = async (req, res, next) => {
    try {
        const userId = req.headers.id;
        const user = await PersonMaster.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        if (user.user_type !== 'freelancer') {
            return res.status(403).json({
                status: false,
                message: "Only freelancers can submit bids"
            });
        }

        // Check bid submission limit
        const currentPlan = getPlanById(user.subscription?.plan_id || 'free');
        const maxBidsPerMonth = currentPlan.features.max_bids_per_month;
        
        if (maxBidsPerMonth === -1) {
            // Unlimited bids
            req.user = user;
            req.currentPlan = currentPlan;
            next();
        } else {
            // Check current bid count for this month
            // const startOfMonth = new Date();
            // startOfMonth.setDate(1);
            // const currentBidCount = await Bid.countDocuments({ 
            //     freelancer_id: userId, 
            //     createdAt: { $gte: startOfMonth } 
            // });
            
            // For now, allow bid submission (implement actual count check)
            req.user = user;
            req.currentPlan = currentPlan;
            next();
        }
    } catch (error) {
        console.error("Error in canSubmitBid middleware:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
