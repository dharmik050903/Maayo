import razorpay from "../services/razorpay.js";
import PaymentHistory from "../schema/paymenthistory.js"; // Adjust the path as necessary

export default class PaymentGateway {
    async createOrder(req, res) {
        try {
            // Check if Razorpay keys are configured
            if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
                console.error('Razorpay keys not configured:', {
                    keyId: process.env.RAZORPAY_KEY_ID ? 'Set' : 'Not Set',
                    keySecret: process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Not Set'
                });
                return res.status(500).json({ 
                    error: "Payment gateway not configured", 
                    details: "Razorpay keys are missing" 
                });
            }

            // Get amount and currency from request body
            const { amount, currency = "INR" } = req.body;

            // Validate amount
            if (!amount || isNaN(amount)) {
                return res.status(400).json({ error: "Amount is required and must be a number" });
            }

            // Validate amount range (minimum 1 INR = 100 paise)
            if (amount < 1) {
                return res.status(400).json({ error: "Amount must be at least 1 INR" });
            }

            // Create order options
            const options = {
                amount: Math.round(amount * 100), // Razorpay expects amount in paise, ensure it's an integer
                currency,
                receipt: `receipt_order_${Date.now()}`,
            };

            console.log('Creating Razorpay order with options:', options);

            // Create order in Razorpay
            const order = await razorpay.orders.create(options);

            console.log('Razorpay order created successfully:', order.id);

            // Send order details to frontend
            res.status(201).json({ 
                orderId: order.id, 
                amount: order.amount, 
                currency: order.currency,
                status: order.status
            });
        } catch (error) {
            console.error('Error creating Razorpay order:', error);
            
            // Provide more specific error messages
            let errorMessage = "Failed to create order";
            let errorDetails = error.message;

            if (error.message.includes('Invalid key_id') || error.message.includes('Authentication failed')) {
                errorMessage = "Invalid Razorpay configuration";
                errorDetails = "Please check your Razorpay key configuration. Make sure you're using the correct test/live keys.";
            } else if (error.message.includes('amount')) {
                errorMessage = "Invalid amount";
                errorDetails = "Please check the amount value";
            } else if (error.message.includes('currency')) {
                errorMessage = "Invalid currency";
                errorDetails = "Please check the currency value";
            } else if (error.statusCode === 401) {
                errorMessage = "Razorpay Authentication Failed";
                errorDetails = "Your Razorpay keys are invalid or expired. Please check your .env file and get new keys from Razorpay dashboard.";
            }

            res.status(500).json({ 
                error: errorMessage, 
                details: errorDetails,
                debug: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async verifyPayment(req, res) {
        try {
            const { orderId, paymentId, signature } = req.body;
            const crypto = await import('crypto');

            // Create expected signature
            const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(orderId + "|" + paymentId)
                .digest('hex');

            // Compare signatures
            if (generatedSignature === signature) {
                return res.status(200).json({ success: true, message: "Payment verified successfully" });
            } else {
                return res.status(400).json({ success: false, message: "Invalid signature" });
            }
        } catch (error) {
            res.status(500).json({ error: "Failed to verify payment", details: error.message });
        }
    }
    async paymentHistory(req, res) {
        try {
            const userId = req.user?._id || req.body.userId; // Adjust as per your auth logic
            if (!userId) {
                return res.status(400).json({ error: "User ID is required" });
            }
            const history = await PaymentHistory.find({ userId }).sort({ createdAt: -1 });
            res.status(200).json({ history });
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch payment history", details: error.message });
        }
    }
}
