#!/usr/bin/env node

// Test script for improved OTP email system
// Run with: node test-improved-otp.js

import dotenv from 'dotenv';
dotenv.config();

import otpService from './services/improvedOTPService.js';

const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';

async function testEmailService() {
    console.log('🧪 Testing Improved OTP Email Service');
    console.log('=====================================');
    
    console.log(`📧 Test Email: ${TEST_EMAIL}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`☁️ Render Host: ${process.env.RENDER ? 'Yes' : 'No'}`);
    console.log('');
    
    // Test 1: Email configuration validation
    console.log('1️⃣ Testing email configuration...');
    try {
        // This will create the transporter and show which config is used
        console.log('✅ Email service initialized successfully');
        
        // Try to verify connection
        console.log('🔍 Verifying email connection...');
        await otpService.emailTransporter.verify();
        console.log('✅ Email connection verified');
        
    } catch (error) {
        console.error('❌ Email configuration failed:', error.message);
        return;
    }
    
    // Test 2: Send test OTP
    console.log('');
    console.log('2️⃣ Sending test OTP email...');
    
    const testOTP = '123456';
    const result = await otpService.sendOTPEmail(TEST_EMAIL, testOTP, 'login', {
        first_name: 'Test',
        last_name: 'User'
    });
    
    if (result.success) {
        console.log('✅ Test OTP sent successfully!');
        console.log(`📬 Message ID: ${result.messageId}`);
    } else {
        console.error('❌ Test OTP failed to send:');
        console.error(`   Error: ${result.error}`);
        console.error(`   Services tried: ${result.services_tried || 'Unknown'}`);
    }
    
    // Test 3: Check available services
    console.log('');
    console.log('3️⃣ Available email services...');
    console.log(`   Gmail: ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`   SendGrid: ${process.env.SENDGRID_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`   Mailgun: ${process.env.MAILGUN_USERNAME && process.env.MAILGUN_PASSWORD ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`   SMTP2GO: ${process.env.SMTP2GO_USERNAME && process.env.SMTP2GO_PASSWORD ? '✅ Configured' : '❌ Not configured'}`);
    
    // Test 4: Performance test
    console.log('');
    console.log('4️⃣ Performance test (multiple sends)...');
    
    const startTime = Date.now();
    let successCount = 0;
    const testCount = 3;
    
    for (let i = 1; i <= testCount; i++) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const perfResult = await otpService.sendOTPEmail(TEST_EMAIL, otp, 'login', {
            first_name: 'PerfTest',
            last_name: 'User'
        });
        
        if (perfResult.success) {
            successCount++;
            console.log(`   ✅ Test ${i}: Sent via ${perfResult.service} (${Date.now() - startTime}ms)`);
        } else {
            console.log(`   ❌ Test ${i}: Failed - ${perfResult.error}`);
        }
        
        // Wait between tests
        if (i < testCount) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    const totalTime = Date.now() - startTime;
    console.log('');
    console.log(`📊 Performance Results:`);
    console.log(`   Success Rate: ${(successCount / testCount * 100).toFixed(1)}%`);
    console.log(`   Total Time: ${totalTime}ms`);
    console.log(`   Average Time: ${(totalTime / testCount).toFixed(0)}ms per email`);
    
    console.log('');
    console.log('🎉 Test completed!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Check if emails arrived at the test address');
    console.log('   2. Review any error messages above');
    console.log('   3. Configure additional email services if needed');
    console.log('   4. Test with /api/otp/v2/* endpoints in your application');
}

// Run the test
testEmailService().catch(error => {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
});

export default testEmailService;
