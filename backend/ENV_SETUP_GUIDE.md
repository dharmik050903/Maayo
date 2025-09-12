# Environment Variables Setup Guide for OTP Services

## Overview
This guide explains how to set up environment variables for the OTP authentication system in your Maayo application.

## Required Environment Variables

Create a `.env` file in your backend root directory with the following variables:

### 1. Database Configuration
```env
MONGODB_URI=mongodb://localhost:27017/maayo
```

### 2. JWT Configuration
```env
jwt_secret=your_jwt_secret_key_here_make_it_long_and_secure
```
**Important**: Use a long, random string for security. You can generate one using:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Email Configuration (Required for OTP)
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=your_email@gmail.com
```

### 4. Server Configuration
```env
PORT=3000
NODE_ENV=development
```

### 5. Frontend URL (Optional - for redirects)
```env
FRONTEND_URL=http://localhost:3000
```

### 6. OTP Configuration (Optional - defaults provided)
```env
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
```

### 7. Rate Limiting Configuration (Optional)
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5
```

## Complete .env File Example

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/maayo

# JWT Configuration
jwt_secret=your_jwt_secret_key_here_make_it_long_and_secure

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
SESSION_SECRET=your_session_secret_key_here
```

## Gmail Setup for OTP Emails

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to "Security"
3. Enable "2-Step Verification"

### Step 2: Generate App Password
1. In Google Account settings, go to "Security"
2. Under "2-Step Verification", click "App passwords"
3. Select "Mail" and "Other (custom name)"
4. Enter "Maayo OTP Service" as the name
5. Copy the generated 16-character password

### Step 3: Configure Environment Variables
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_character_app_password
EMAIL_FROM=your_gmail@gmail.com
```

## Alternative Email Services

### Using Outlook/Hotmail
```env
EMAIL_SERVICE=hotmail
EMAIL_USER=your_email@outlook.com
EMAIL_PASS=your_password
EMAIL_FROM=your_email@outlook.com
```

### Using Yahoo Mail
```env
EMAIL_SERVICE=yahoo
EMAIL_USER=your_email@yahoo.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@yahoo.com
```

### Using Custom SMTP Server
```env
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=your_email@yourdomain.com
EMAIL_PASS=your_password
EMAIL_FROM=your_email@yourdomain.com
EMAIL_SECURE=false
```

## Environment Variables by Purpose

### Required for OTP to Work
- `MONGODB_URI` - Database connection
- `jwt_secret` - JWT token signing
- `EMAIL_SERVICE` - Email service provider
- `EMAIL_USER` - Email account username
- `EMAIL_PASS` - Email account password
- `EMAIL_FROM` - Sender email address

### Optional but Recommended
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode
- `FRONTEND_URL` - Frontend URL for redirects

### Optional Configuration
- `OTP_LENGTH` - OTP code length (default: 6)
- `OTP_EXPIRY_MINUTES` - OTP expiration time (default: 10)
- `RATE_LIMIT_WINDOW_MS` - Rate limiting window (default: 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 5)

## Security Best Practices

### 1. Never Commit .env to Version Control
Add `.env` to your `.gitignore` file:
```
.env
.env.local
.env.production
```

### 2. Use Strong Secrets
Generate strong secrets for production:
```bash
# Generate JWT secret
node -e "console.log('jwt_secret=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate session secret
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Environment-Specific Configuration
Create different `.env` files for different environments:
- `.env.development` - Development environment
- `.env.production` - Production environment
- `.env.test` - Testing environment

### 4. Production Environment Variables
For production, set these in your hosting platform:
- Heroku: Use Config Vars
- AWS: Use Parameter Store or Secrets Manager
- DigitalOcean: Use App Platform environment variables
- Vercel: Use Environment Variables in dashboard

## Testing Your Configuration

### 1. Test Database Connection
```javascript
// Test in your connection.js file
console.log('MongoDB URI:', process.env.MONGODB_URI);
```

### 2. Test Email Configuration
```javascript
// Test email sending
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Test email
transporter.verify((error, success) => {
    if (error) {
        console.log('Email config error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});
```

### 3. Test OTP Service
```javascript
// Test OTP generation and email sending
import otpService from './services/otpService.js';

// Test OTP generation
const otp = otpService.generateOTP();
console.log('Generated OTP:', otp);

// Test email sending
const result = await otpService.sendOTPEmail(
    'test@example.com',
    otp,
    'login',
    { first_name: 'Test' }
);
console.log('Email send result:', result);
```

## Common Issues and Solutions

### 1. "Invalid login" Error
- Check if 2FA is enabled on Gmail
- Verify app password is correct
- Ensure EMAIL_USER is the full email address

### 2. "Connection timeout" Error
- Check EMAIL_SERVICE value
- Verify EMAIL_HOST and EMAIL_PORT for custom SMTP
- Check firewall settings

### 3. "Authentication failed" Error
- Verify EMAIL_PASS is the app password, not regular password
- Check if account is locked or suspended
- Ensure EMAIL_USER is correct

### 4. "JWT secret not defined" Error
- Add jwt_secret to your .env file
- Restart the server after adding the variable
- Check for typos in variable name

### 5. "MongoDB connection failed" Error
- Verify MONGODB_URI is correct
- Check if MongoDB is running
- Ensure database name is correct

## Production Deployment

### Heroku
```bash
# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set jwt_secret=your_jwt_secret
heroku config:set EMAIL_SERVICE=gmail
heroku config:set EMAIL_USER=your_email@gmail.com
heroku config:set EMAIL_PASS=your_app_password
heroku config:set EMAIL_FROM=your_email@gmail.com
```

### AWS EC2
```bash
# Create .env file on server
sudo nano /var/www/your-app/.env

# Add all environment variables
# Restart your application
```

### Docker
```dockerfile
# In your Dockerfile
ENV MONGODB_URI=your_mongodb_uri
ENV jwt_secret=your_jwt_secret
ENV EMAIL_SERVICE=gmail
ENV EMAIL_USER=your_email@gmail.com
ENV EMAIL_PASS=your_app_password
ENV EMAIL_FROM=your_email@gmail.com
```

## Verification Checklist

- [ ] `.env` file created in backend root directory
- [ ] All required environment variables set
- [ ] Gmail 2FA enabled and app password generated
- [ ] Database connection working
- [ ] Email service configured and tested
- [ ] JWT secret is long and secure
- [ ] `.env` added to `.gitignore`
- [ ] Production environment variables set (if deploying)

## Support

If you encounter issues:
1. Check the console logs for specific error messages
2. Verify all environment variables are set correctly
3. Test email configuration separately
4. Ensure MongoDB is running and accessible
5. Check network connectivity for external services
