import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

console.log('🔍 Validating Environment Configuration...\n');

// Required environment variables
const requiredVars = [
    'MONGODB_URI',
    'jwt_secret',
    'EMAIL_SERVICE',
    'EMAIL_USER',
    'EMAIL_PASS',
    'EMAIL_FROM'
];

// Optional environment variables
const optionalVars = [
    'PORT',
    'NODE_ENV',
    'FRONTEND_URL',
    'OTP_LENGTH',
    'OTP_EXPIRY_MINUTES',
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX_REQUESTS',
    'SESSION_SECRET'
];

// Check required variables
console.log('📋 Checking Required Variables:');
let missingVars = [];
requiredVars.forEach(varName => {
    if (process.env[varName]) {
        console.log(`✅ ${varName}: Set`);
    } else {
        console.log(`❌ ${varName}: Missing`);
        missingVars.push(varName);
    }
});

// Check optional variables
console.log('\n📋 Checking Optional Variables:');
optionalVars.forEach(varName => {
    if (process.env[varName]) {
        console.log(`✅ ${varName}: Set (${process.env[varName]})`);
    } else {
        console.log(`⚠️  ${varName}: Not set (using default)`);
    }
});

// Validate JWT secret strength
if (process.env.jwt_secret) {
    if (process.env.jwt_secret.length < 32) {
        console.log('\n⚠️  Warning: JWT secret is too short. Consider using a longer, more secure secret.');
    } else {
        console.log('\n✅ JWT secret length is adequate');
    }
}

// Test database connection
console.log('\n🔗 Testing Database Connection:');
try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connection successful');
    await mongoose.disconnect();
} catch (error) {
    console.log('❌ Database connection failed:', error.message);
}

// Test email configuration
console.log('\n📧 Testing Email Configuration:');
if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.verify();
        console.log('✅ Email configuration is valid');
    } catch (error) {
        console.log('❌ Email configuration failed:', error.message);
        console.log('💡 Make sure you have:');
        console.log('   - Enabled 2FA on your Gmail account');
        console.log('   - Generated an App Password');
        console.log('   - Used the App Password (not your regular password)');
    }
} else {
    console.log('❌ Email configuration incomplete - missing required variables');
}

// Summary
console.log('\n📊 Summary:');
if (missingVars.length === 0) {
    console.log('✅ All required environment variables are set!');
    console.log('🚀 Your OTP service should be ready to use.');
} else {
    console.log('❌ Missing required variables:', missingVars.join(', '));
    console.log('📝 Please add the missing variables to your .env file.');
}

console.log('\n📚 For detailed setup instructions, see: ENV_SETUP_GUIDE.md');
