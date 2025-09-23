import Razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config();

// Validate Razorpay configuration
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.error('❌ Razorpay configuration missing:');
  console.error('RAZORPAY_KEY_ID:', keyId ? 'Set' : 'Not Set');
  console.error('RAZORPAY_KEY_SECRET:', keySecret ? 'Set' : 'Not Set');
  console.error('Please check your .env file and ensure Razorpay keys are configured.');
} else {
  console.log('✅ Razorpay configuration loaded successfully');
}

// Initialize Razorpay instance with keys from .env
const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

// Test Razorpay connection
razorpay.orders.create({
  amount: 100,
  currency: 'INR',
  receipt: 'test_receipt'
}).then(() => {
  console.log('✅ Razorpay connection test successful');
}).catch((error) => {
  console.error('❌ Razorpay connection test failed:', error.message);
});

export default razorpay;