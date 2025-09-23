import express from "express";
import auth from "./middlewares/auth.js";
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



// Auth routes

//Login and Signup Controllers
router.post("/signup",signupController.createuser);
router.post("/signup/google",loginController.googleLogin);
router.post("/login",loginController.authenticate);

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
router.post("/project/create", auth, projectController.createProject);
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
router.post("/bid/create", auth, bidController.createBid);
router.post("/bid/project", auth, bidController.getProjectBids);
router.post("/bid/freelancer", auth, bidController.getFreelancerBids);
router.post("/bid/accept", auth, bidController.acceptBid);
router.post("/bid/reject", auth, bidController.rejectBid);
router.post("/bid/withdraw", auth, bidController.withdrawBid);
router.post("/bid/update", auth, bidController.updateBid);
// AI routes
router.post("/ai/generate-proposal", auth, aiController.generateProposal);

// Chat routes
router.post("/chat/send", auth, chatController.sendMessage);
router.post("/chat/list", auth, chatController.getMessages);
router.post("/chat/conversations", auth, chatController.getConversations);

//PaymentGateway routes
router.post("/payment/create-session", auth, paymentGateway.createOrder);
router.post("/payment/verify", auth, paymentGateway.verifyPayment);
router.post("/payment/history", auth, paymentGateway.paymentHistory);

// Test endpoint for Razorpay configuration
router.get("/payment/test-config", (req, res) => {
    const config = {
        keyId: process.env.RAZORPAY_KEY_ID ? 'Set' : 'Not Set',
        keySecret: process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Not Set',
        nodeEnv: process.env.NODE_ENV || 'development'
    };
    res.json({ 
        status: 'OK', 
        message: 'Razorpay configuration check',
        config 
    });
});

// Health check for chat endpoints
router.get("/chat/health", (req, res) => {
    res.json({ 
        status: true, 
        message: "Chat service is running",
        timestamp: new Date().toISOString()
    });
});


export default router;