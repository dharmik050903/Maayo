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

// Debug Razorpay instance
console.log('🔍 Razorpay instance created:', {
  hasOrders: !!razorpay.orders,
  hasPayments: !!razorpay.payments,
  hasPayouts: !!razorpay.payouts,
  hasFundAccount: !!razorpay.fundAccount,
  hasContacts: !!razorpay.contacts,
  availableMethods: Object.keys(razorpay)
});

// Test Razorpay connection (async to avoid blocking module load)
setTimeout(async () => {
  try {
    // Test basic orders API
    const testOrder = await razorpay.orders.create({
      amount: 100,
      currency: 'INR',
      receipt: 'test_receipt'
    });
    console.log('✅ Razorpay orders API test successful');
    
    // Test payouts API availability
    if (razorpay.payouts) {
      console.log('✅ Razorpay payouts API is available');
    } else {
      console.log('❌ Razorpay payouts API is not available');
      console.log('Available Razorpay methods:', Object.keys(razorpay));
    }
    
    // Test contacts API availability
    if (razorpay.contacts) {
      console.log('✅ Razorpay contacts API is available');
    } else {
      console.log('❌ Razorpay contacts API is not available');
    }
    
    // Test fundAccount API availability
    if (razorpay.fundAccount) {
      console.log('✅ Razorpay fundAccount API is available');
    } else {
      console.log('❌ Razorpay fundAccount API is not available');
    }
    
  } catch (error) {
    console.error('❌ Razorpay connection test failed:', error.message || error);
    console.error('Full error:', error);
  }
}, 1000);

export default razorpay;