// Test script to verify environment variables
console.log('🔍 Frontend Environment Variables Test');
console.log('VITE_RAZORPAY_KEY_ID:', import.meta.env.VITE_RAZORPAY_KEY_ID);
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);

if (import.meta.env.VITE_RAZORPAY_KEY_ID && import.meta.env.VITE_RAZORPAY_KEY_ID !== 'rzp_test_1234567890') {
  console.log('✅ Razorpay key is properly configured');
} else {
  console.log('❌ Razorpay key is not configured or using dummy key');
}
