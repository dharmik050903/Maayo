const fs = require('fs');
const path = require('path');

// Environment variables for development
const envContent = `# Database Configuration
MONGODB_URI=mongodb://localhost:27017/maayo

# JWT Configuration
jwt_secret=your-super-secret-jwt-key-for-development-only-make-it-long-and-secure-123456789

# Admin Credentials (for development)
MASTER_ADMIN_EMAIL=admin@maayo.com
MASTER_ADMIN_PASSWORD=Admin123!

CONTENT_ADMIN_EMAIL=content@maayo.com
CONTENT_ADMIN_PASSWORD=Content123!

SUPPORT_ADMIN_EMAIL=support@maayo.com
SUPPORT_ADMIN_PASSWORD=Support123!

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Origins
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://maayo-alpha.vercel.app

# Email Configuration (optional for development)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Google OAuth (optional for development)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Razorpay (optional for development)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📝 Please update the database URI and other credentials as needed.');
  console.log('🚀 You can now start the backend server with: npm start');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('📝 Please create the .env file manually with the following content:');
  console.log('\n' + envContent);
}
