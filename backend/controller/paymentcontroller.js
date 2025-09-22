import razorpay from "../services/razorpay.js";
import PaymentHistory from "../schema/paymenthistory.js"; // Adjust the path as necessary

export default class PaymentGateway {
    async createOrder(req, res) {
        try {
            // Get amount and currency from request body
            const { amount, currency = "INR" } = req.body;

            // Validate amount
            if (!amount || isNaN(amount)) {
                return res.status(400).json({ error: "Amount is required and must be a number" });
            }

            // Create order options
            const options = {
                amount: amount * 100, // Razorpay expects amount in paise
                currency,
                receipt: `receipt_order_${Date.now()}`,
            };

            // Create order in Razorpay
            const order = await razorpay.orders.create(options);

            // Send order details to frontend
            res.status(201).json({ orderId: order.id, amount: order.amount, currency: order.currency });
        } catch (error) {
            res.status(500).json({ error: "Failed to create order", details: error.message });
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
