import axios from 'axios';
// Test script for Razorpay and Escrow API setup
class EscrowAPITester {
    constructor(baseURL = 'http://localhost:5000/api') {
        this.baseURL = baseURL;
        this.headers = {
            'Content-Type': 'application/json'
        };
    }

    // Test Razorpay configuration
    async testRazorpayConfig() {
        try {
            console.log('🔧 Testing Razorpay Configuration...');
            const response = await axios.get(`${this.baseURL}/payment/test-config`);
            
            if (response.data.config.keyId === 'Set' && response.data.config.keySecret === 'Set') {
                console.log('✅ Razorpay configuration is correct');
                console.log(`   Key Type: ${response.data.config.keyType}`);
                console.log(`   Environment: ${response.data.config.nodeEnv}`);
                return true;
            } else {
                console.log('❌ Razorpay configuration is missing');
                console.log(`   Key ID: ${response.data.config.keyId}`);
                console.log(`   Key Secret: ${response.data.config.keySecret}`);
                return false;
            }
        } catch (error) {
            console.log('❌ Failed to test Razorpay configuration:', error.message);
            return false;
        }
    }

    // Test order creation
    async testOrderCreation() {
        try {
            console.log('🔧 Testing Order Creation...');
            const response = await axios.post(`${this.baseURL}/payment/test-order`);
            
            if (response.data.status === 'success') {
                console.log('✅ Test order created successfully');
                console.log(`   Order ID: ${response.data.order.id}`);
                console.log(`   Amount: ${response.data.order.amount} paise`);
                return true;
            } else {
                console.log('❌ Failed to create test order');
                return false;
            }
        } catch (error) {
            console.log('❌ Failed to create test order:', error.message);
            return false;
        }
    }

    // Test database connection (via project list)
    async testDatabaseConnection() {
        try {
            console.log('🔧 Testing Database Connection...');
            const response = await axios.post(`${this.baseURL}/project/browse`, {});
            
            console.log('✅ Database connection is working');
            console.log(`   Response status: ${response.status}`);
            return true;
        } catch (error) {
            console.log('❌ Database connection failed:', error.message);
            return false;
        }
    }

    // Test all endpoints accessibility
    async testEndpointsAccessibility() {
        const endpoints = [
            '/bank-details/add',
            '/escrow/create', 
            '/escrow/status',
            '/milestone/list',
            '/milestone/complete',
            '/bid/update-price'
        ];

        console.log('🔧 Testing Endpoints Accessibility...');
        let accessibleCount = 0;

        for (const endpoint of endpoints) {
            try {
                const response = await axios.post(`${this.baseURL}${endpoint}`, {}, {
                    headers: this.headers,
                    validateStatus: () => true // Don't throw on 4xx/5xx
                });
                
                if (response.status !== 404) {
                    console.log(`✅ ${endpoint} - Accessible (Status: ${response.status})`);
                    accessibleCount++;
                } else {
                    console.log(`❌ ${endpoint} - Not found (404)`);
                }
            } catch (error) {
                console.log(`❌ ${endpoint} - Error: ${error.message}`);
            }
        }

        console.log(`\n📊 Endpoints Summary: ${accessibleCount}/${endpoints.length} accessible`);
        return accessibleCount === endpoints.length;
    }

    // Run all tests
    async runAllTests() {
        console.log('🚀 Starting Escrow API Setup Tests...\n');
        
        const tests = [
            { name: 'Razorpay Config', test: () => this.testRazorpayConfig() },
            { name: 'Order Creation', test: () => this.testOrderCreation() },
            { name: 'Database Connection', test: () => this.testDatabaseConnection() },
            { name: 'Endpoints Accessibility', test: () => this.testEndpointsAccessibility() }
        ];

        let passedTests = 0;

        for (const { name, test } of tests) {
            console.log(`\n--- Testing ${name} ---`);
            const result = await test();
            if (result) passedTests++;
            console.log('');
        }

        console.log('📋 Test Summary:');
        console.log(`✅ Passed: ${passedTests}/${tests.length}`);
        console.log(`❌ Failed: ${tests.length - passedTests}/${tests.length}`);

        if (passedTests === tests.length) {
            console.log('\n🎉 All tests passed! Your escrow system is ready to use.');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the configuration.');
        }

        return passedTests === tests.length;
    }
}

// Usage instructions
console.log(`
🔧 Escrow API Setup Test Script
===============================

This script will test your Razorpay and Escrow API setup.

Prerequisites:
1. Backend server running on port 5000
2. Razorpay API keys configured in .env file
3. MongoDB running and connected
4. All dependencies installed

To run the tests:
1. Install axios: npm install axios
2. Run: node test-escrow-setup.js

Make sure your .env file contains:
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
MONGODB_URI=mongodb://localhost:27017/maayo
`);

// Export for use
export default EscrowAPITester;

// Run tests if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    
    const tester = new EscrowAPITester();
    tester.runAllTests().catch(console.error);
}

