# OTP Authentication Setup Guide

## Overview
This guide explains how to set up OTP-based authentication for email login in your Maayo application. The system supports both traditional password login and OTP-based login via email.

## Required Dependencies
The following packages have been added to your `package.json`:
- `nodemailer`: For sending emails

Install it by running:
```bash
npm install nodemailer
```

## Environment Variables
Add the following environment variables to your `.env` file:

### Database Configuration
```
MONGODB_URI=mongodb://localhost:27017/maayo
jwt_secret=your_jwt_secret_key_here
```

### Email Configuration (Gmail example)
```
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=your_email@gmail.com
```


### Server Configuration
```
PORT=3000
NODE_ENV=development
```

## Email Setup (Gmail)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password for your application

### Step 2: Configure Environment Variables
```
EMAIL_SERVICE=gmail
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_character_app_password
EMAIL_FROM=your_gmail@gmail.com
```


## API Endpoints

### 1. Send Login OTP
**POST** `/api/otp/send-login`
```json
{
  "email": "user@example.com"
}
```

### 2. Verify Login OTP
**POST** `/api/otp/verify-login`
```json
{
  "email": "user@example.com",
  "otp_code": "123456"
}
```

### 3. Send Password Reset OTP
**POST** `/api/otp/send-password-reset`
```json
{
  "email": "user@example.com"
}
```

### 4. Verify Password Reset OTP
**POST** `/api/otp/verify-password-reset`
```json
{
  "email": "user@example.com",
  "otp_code": "123456",
  "new_password": "newsecurepassword"
}
```

### 5. Resend OTP
**POST** `/api/otp/resend`
```json
{
  "email": "user@example.com",
  "purpose": "login"
}
```

## Features

### Security Features
- OTP expiration (10-15 minutes based on purpose)
- Maximum attempt limits (3 attempts)
- Rate limiting (1 minute between requests)
- IP address and User-Agent tracking
- Automatic cleanup of expired OTPs

### OTP Purposes
- **login**: Login authentication via email
- **password_reset**: Password reset via email

## Usage Examples

### Frontend Integration

#### Login Flow
```javascript
// Step 1: Send OTP
const sendOTP = async (email) => {
  const response = await fetch('/api/otp/send-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email
    })
  });
  return response.json();
};

// Step 2: Verify OTP
const verifyOTP = async (email, otpCode) => {
  const response = await fetch('/api/otp/verify-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      otp_code: otpCode
    })
  });
  return response.json();
};
```

#### Password Reset Flow
```javascript
// Step 1: Send Password Reset OTP
const sendPasswordResetOTP = async (email) => {
  const response = await fetch('/api/otp/send-password-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email
    })
  });
  return response.json();
};

// Step 2: Verify Password Reset OTP
const verifyPasswordResetOTP = async (email, otpCode, newPassword) => {
  const response = await fetch('/api/otp/verify-password-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      otp_code: otpCode,
      new_password: newPassword
    })
  });
  return response.json();
};
```

## Error Handling

### Common Error Responses
- `400`: Invalid request data
- `401`: Invalid or expired OTP
- `403`: Account inactive
- `404`: User not found
- `409`: User already exists
- `429`: Rate limit exceeded
- `500`: Server error

### Error Response Format
```json
{
  "status": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Testing

### Test Email Setup
For development, you can use services like:
- [Mailtrap](https://mailtrap.io/) - Email testing
- [Ethereal Email](https://ethereal.email/) - Fake SMTP server


## Production Considerations

1. **Rate Limiting**: Implement additional rate limiting middleware
2. **Monitoring**: Add logging and monitoring for OTP delivery
3. **Backup Methods**: Consider backup OTP delivery methods
4. **Security**: Use HTTPS in production
5. **Database**: Ensure proper indexing for OTP queries
6. **Cleanup**: Set up automated cleanup of expired OTPs

## Troubleshooting

### Email Not Sending
1. Check Gmail App Password is correct
2. Verify 2FA is enabled on Gmail account
3. Check firewall/network restrictions


### OTP Not Working
1. Check OTP expiration time
2. Verify attempt limits
3. Check database connection
4. Review server logs for errors
