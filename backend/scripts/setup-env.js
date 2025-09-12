import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

console.log('🚀 Setting up environment configuration for Maayo OTP Services...\n');

// Check if .env file already exists
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists!');
    console.log('📝 Please manually add the missing variables or backup your existing .env file.\n');
} else {
    console.log('📝 Creating .env file...');
}

// Generate secure secrets
const jwtSecret = crypto.randomBytes(64).toString('hex');
const sessionSecret = crypto.randomBytes(64).toString('hex');

// Environment template
const envTemplate = `# Database Configuration
MONGODB_URI=mongodb://localhost:27017/maayo

# JWT Configuration
jwt_secret=${jwtSecret}

# Email Configuration for OTP Services
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=your_email@gmail.com

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL (for OAuth redirects if needed)
FRONTEND_URL=http://localhost:3000

# OTP Configuration
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5

# Session Configuration (if using sessions)
SESSION_SECRET=${sessionSecret}
`;

// Write .env file
try {
    fs.writeFileSync(envPath, envTemplate);
    console.log('✅ .env file created successfully!');
} catch (error) {
    console.log('❌ Error creating .env file:', error.message);
    process.exit(1);
}

// Check if .gitignore exists and add .env if needed
const gitignorePath = path.join(process.cwd(), '.gitignore');
if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('.env')) {
        fs.appendFileSync(gitignorePath, '\n# Environment variables\n.env\n.env.local\n.env.production\n');
        console.log('✅ Added .env to .gitignore');
    }
} else {
    fs.writeFileSync(gitignorePath, '# Environment variables\n.env\n.env.local\n.env.production\n');
    console.log('✅ Created .gitignore with .env entries');
}

console.log('\n📋 Next Steps:');
console.log('1. 📧 Configure your email settings:');
console.log('   - Enable 2FA on your Gmail account');
console.log('   - Generate an App Password');
console.log('   - Update EMAIL_USER and EMAIL_PASS in .env file');
console.log('');
console.log('2. 🗄️  Update database connection:');
console.log('   - Update MONGODB_URI if using a different database');
console.log('');
console.log('3. 🧪 Test your configuration:');
console.log('   - Run: node scripts/validate-env.js');
console.log('');
console.log('4. 📚 Read the setup guide:');
console.log('   - See: ENV_SETUP_GUIDE.md for detailed instructions');
console.log('');
console.log('🔐 Security Notes:');
console.log('- JWT and session secrets have been auto-generated');
console.log('- Never commit .env file to version control');
console.log('- Use different secrets for production');
console.log('');
console.log('✨ Setup complete! Happy coding!');
