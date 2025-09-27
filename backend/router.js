import express from "express";
import auth from "./middlewares/auth.js";
import { requireFeatureAccess, canCreateProject, canSubmitBid } from "./middlewares/subscription.js";
import Signup from "./controller/signup.js";
import Login from "./controller/login.js";
import FreelancerInfo from "./controller/freelancerInfo.js";
import ClientInfo from "./controller/clientinfo.js";
import skills from "./controller/skills.js";
import Project from "./controller/project.js";
import Review from "./controller/review.js";
import Bid from "./controller/bid.js";
import OTP from "./controller/otp.js";
import AIController from "./controller/aiController.js";
import ChatController from "./controller/chat.js";
import PaymentGateway from "./controller/paymentcontroller.js";
import SubscriptionController from "./controller/subscriptionController.js";
import AdminAuth from "./controller/adminAuth.js";
import AdminController from "./controller/admin.js";
import { adminAuth, checkPermission, superAdminOnly } from "./middlewares/adminAuth.js";

const router = express.Router();
//Login and Signup Controllers
const signupController = new Signup();
const loginController = new Login();
const freelancerinfo = new FreelancerInfo();
const clientinfo = new ClientInfo();
const skillsController = new skills();
const projectController = new Project();
const reviewController = new Review();
const bidController = new Bid();
const otpController = new OTP();
const aiController = new AIController();
const chatController = new ChatController();
const paymentGateway = new PaymentGateway();

const subscriptionController = new SubscriptionController();

const adminAuthController = new AdminAuth();
const adminController = new AdminController();



// Auth routes

//Login and Signup Controllers
router.post("/signup",signupController.createuser);
router.post("/signup/google",signupController.googleSignup);
router.post("/auth/google/flow", loginController.googleOAuthFlow);
router.get("/auth/google/callback", loginController.googleOAuthCallback);
router.post("/login",loginController.authenticate);
router.post("/login/google", loginController.googleLogin);

// OTP Authentication routes
router.post("/otp/send-login", otpController.sendLoginOTP);
router.post("/otp/verify-login", otpController.verifyLoginOTP);
router.post("/otp/send-password-reset", otpController.sendPasswordResetOTP);
router.post("/otp/verify-password-reset", otpController.verifyPasswordResetOTP);
router.post("/otp/resend", otpController.resendOTP);
//Skills Controller
router.post("/skills",skillsController.listskills);
//Freelancer and Client Info Controllers
router.post("/freelancer/list",auth, freelancerinfo.listfreelancer);
router.post("/freelancer/info",auth,freelancerinfo.createFreelancerInfo);
router.post("/freelancer/info/update",auth,freelancerinfo.updateFreelancerInfo);
router.post("/client/info",auth,clientinfo.createClientInfo);
router.post("/client/info/update",auth,clientinfo.updateClientInfo);
// Project routes
router.post("/project/create", auth, canCreateProject, projectController.createProject);
router.post("/project/list", auth, projectController.listproject);
router.post("/project/browse",projectController.listproject);
router.post("/project/search", auth, projectController.searchProjects);
router.post("/project/update", auth, projectController.updateProject);
router.post("/project/delete", auth, projectController.deleteProject);
router.post("/project/complete", auth, projectController.completeProject);
router.post("/project/stats", auth, projectController.getProjectStats);

// Review routes
router.post("/review/create", auth, reviewController.createReview);
router.post("/review/user", auth, reviewController.getUserReviews);
router.post("/review/project", auth, reviewController.getProjectReviews);
router.post("/review/update", auth, reviewController.updateReview);
router.post("/review/delete", auth, reviewController.deleteReview);

// Bid routes
router.post("/bid/create", auth, canSubmitBid, bidController.createBid);
router.post("/bid/project", auth, bidController.getProjectBids);
router.post("/bid/freelancer", auth, bidController.getFreelancerBids);
router.post("/bid/accept", auth, bidController.acceptBid);
router.post("/bid/reject", auth, bidController.rejectBid);
router.post("/bid/withdraw", auth, bidController.withdrawBid);
router.post("/bid/update", auth, bidController.updateBid);
router.post("/bid/delete", auth, bidController.deleteBid);
// AI routes
router.post("/ai/generate-proposal", auth, requireFeatureAccess('ai_proposals'), aiController.generateProposal);
router.post("/ai/generate-project-description", auth, requireFeatureAccess('ai_proposals'), aiController.createProposalPrompt);

// Chat routes
router.post("/chat/send", auth, chatController.sendMessage);
router.post("/chat/list", auth, chatController.getMessages);
router.post("/chat/conversations", auth, chatController.getConversations);

//PaymentGateway routes
router.post("/payment/create-session", auth, paymentGateway.createOrder);
router.post("/payment/verify", auth, paymentGateway.verifyPayment);
router.post("/payment/history", auth, paymentGateway.paymentHistory);

//Subscription routes
router.post("/subscription/plans", subscriptionController.getPlans);
router.post("/subscription/current", auth, subscriptionController.getCurrentSubscription);
router.post("/subscription/create", auth, subscriptionController.createSubscription);
router.post("/subscription/verify", auth, subscriptionController.verifySubscription);
router.post("/subscription/cancel", auth, subscriptionController.cancelSubscription);
router.post("/subscription/check-feature", auth, subscriptionController.checkFeatureAccess);
router.post("/subscription/usage", auth, subscriptionController.getUsageStats);

// Test endpoint for Razorpay configuration
router.get("/payment/test-config", (req, res) => {
    const config = {
        keyId: process.env.RAZORPAY_KEY_ID ? 'Set' : 'Not Set',
        keySecret: process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Not Set',
        nodeEnv: process.env.NODE_ENV || 'development',
        keyType: process.env.RAZORPAY_KEY_ID ? (process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_') ? 'Test' : 'Live') : 'Unknown'
    };
    res.json({ 
        status: 'OK', 
        message: 'Razorpay configuration check',
        config 
    });
});

// Test endpoint for Google OAuth configuration
router.get("/auth/test-config", (req, res) => {
    const config = {
        clientId: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'Not Set',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not Set',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
        redirectUri: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback`,
        nodeEnv: process.env.NODE_ENV || 'development'
    };
    res.json({ 
        status: 'OK', 
        message: 'Google OAuth configuration check',
        config 
    });
});

// Test endpoint to create a small test order
router.post("/payment/test-order", async (req, res) => {
    try {
        const razorpay = (await import('../services/razorpay.js')).default;
        
        const testOrder = await razorpay.orders.create({
            amount: 100, // 1 INR in paise
            currency: 'INR',
            receipt: `test_${Date.now()}`
        });
        
        res.json({
            status: 'success',
            message: 'Test order created successfully',
            order: {
                id: testOrder.id,
                amount: testOrder.amount,
                currency: testOrder.currency,
                status: testOrder.status
            }
        });
    } catch (error) {
        console.error('Test order creation failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Test order creation failed',
            error: error.message,
            details: error.response?.data || error
        });
    }
});

// Health check for chat endpoints
router.get("/chat/health", (req, res) => {
    res.json({ 
        status: true, 
        message: "Chat service is running",
        timestamp: new Date().toISOString()
    });
});

// Admin Authentication Routes
router.post("/admin/auth/login", adminAuthController.adminLogin);
router.post("/admin/auth/setup-super-admin", adminAuthController.createSuperAdmin); // One-time setup
router.post("/admin/auth/bootstrap", adminAuthController.createPredefinedAdmins); // Bootstrap predefined admins
router.post("/admin/auth/change-password", adminAuth, adminAuthController.changePassword);
router.post("/admin/auth/profile", adminAuth, adminAuthController.getAdminProfile);
router.post("/admin/auth/update-profile", adminAuth, adminAuthController.updateAdminProfile);
router.post("/admin/auth/logout", adminAuth, adminAuthController.adminLogout);

// Admin Dashboard
router.post("/admin/dashboard/stats", adminAuth, adminController.getDashboardStats);

// Admin User Management
router.post("/admin/users/list", adminAuth, checkPermission('users', 'view'), adminController.getUsers);
router.post("/admin/users/suspend", adminAuth, checkPermission('users', 'suspend'), adminController.suspendUser);
router.post("/admin/users/activate", adminAuth, checkPermission('users', 'suspend'), adminController.activateUser);
router.post("/admin/users/delete", adminAuth, checkPermission('users', 'delete'), adminController.deleteUser);

// Admin Freelancer Management
router.post("/admin/freelancers/list", adminAuth, checkPermission('freelancers', 'view'), adminController.getFreelancers);
router.post("/admin/freelancers/approve", adminAuth, checkPermission('freelancers', 'approve'), adminController.approveFreelancer);

// Admin Project Management
router.post("/admin/projects/list", adminAuth, checkPermission('projects', 'view'), adminController.getProjects);
router.post("/admin/projects/delete", adminAuth, checkPermission('projects', 'delete'), adminController.deleteProject);

// Admin Bid Management
router.post("/admin/bids/list", adminAuth, checkPermission('bids', 'view'), adminController.getBids);
router.post("/admin/bids/delete", adminAuth, checkPermission('bids', 'delete'), adminController.deleteBid);

// Admin Payment Management
router.post("/admin/payments/list", adminAuth, checkPermission('payments', 'view'), adminController.getPayments);
router.post("/admin/payments/delete", adminAuth, checkPermission('payments', 'delete'), adminController.deletePayment);

// Admin User Update
router.post("/admin/users/update", adminAuth, checkPermission('users', 'edit'), adminController.updateUser);

// Admin Project Update  
router.post("/admin/projects/update", adminAuth, checkPermission('projects', 'edit'), adminController.updateProject);

// Admin Management (Super Admin only)
router.post("/admin/admins/list", adminAuth, superAdminOnly, adminController.getAdmins);
router.post("/admin/admins/create", adminAuth, superAdminOnly, adminController.createAdmin);

// Permission Request Management
router.post("/admin/permission-requests/submit", adminAuth, adminController.submitPermissionRequest);
router.get("/admin/permission-requests/list", adminAuth, superAdminOnly, adminController.getPermissionRequests);
router.post("/admin/permission-requests/:requestId/handle", adminAuth, superAdminOnly, adminController.handlePermissionRequestAction);

export default router;