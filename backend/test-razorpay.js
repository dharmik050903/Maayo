import dotenv from 'dotenv';
import Razorpay from 'razorpay';

dotenv.config();

console.log('🔍 Testing Razorpay Configuration...\n');

// Check environment variables
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

console.log('📋 Configuration Check:');
console.log('Key ID:', keyId ? `${keyId.substring(0, 12)}...` : '❌ Not Set');
console.log('Key Secret:', keySecret ? `${keySecret.substring(0, 8)}...` : '❌ Not Set');
console.log('Key Type:', keyId ? (keyId.startsWith('rzp_test_') ? '✅ Test' : '⚠️  Live') : '❌ Unknown');

if (!keyId || !keySecret) {
    console.log('\n❌ Razorpay keys are missing!');
    console.log('Please add your Razorpay keys to the .env file:');
    console.log('RAZORPAY_KEY_ID=rzp_test_your_key_here');
    console.log('RAZORPAY_KEY_SECRET=your_secret_here');
    process.exit(1);
}

if (!keyId.startsWith('rzp_test_')) {
    console.log('\n⚠️  Warning: You are using LIVE keys!');
    console.log('For testing, please use TEST keys that start with "rzp_test_"');
}

// Test Razorpay connection
console.log('\n🧪 Testing Razorpay Connection...');

const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
});

try {
    const testOrder = await razorpay.orders.create({
        amount: 100, // 1 INR in paise
        currency: 'INR',
        receipt: `test_${Date.now()}`
    });
    
    console.log('✅ Razorpay connection successful!');
    console.log('Test Order ID:', testOrder.id);
    console.log('Amount:', testOrder.amount, 'paise');
    console.log('Currency:', testOrder.currency);
    console.log('Status:', testOrder.status);
    
} catch (error) {
    console.log('❌ Razorpay connection failed!');
    console.log('Error:', error.message);
    
    if (error.statusCode === 401) {
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Check if your Razorpay account is activated');
        console.log('2. Verify you are using the correct test keys');
        console.log('3. Make sure you copied the keys correctly');
        console.log('4. Try generating new keys from Razorpay dashboard');
    }
    
    if (error.message.includes('Invalid key_id')) {
        console.log('\n🔧 The key ID is invalid. Please check:');
        console.log('1. Copy the key exactly as shown in Razorpay dashboard');
        console.log('2. Make sure there are no extra spaces or characters');
        console.log('3. Verify you are in the correct environment (test/live)');
    }
}

console.log('\n📚 Next Steps:');
console.log('1. Get real test keys from: https://dashboard.razorpay.com/');
console.log('2. Update your .env file with the correct keys');
console.log('3. Run this test again: node test-razorpay.js');
console.log('4. Start your server: npm start');
