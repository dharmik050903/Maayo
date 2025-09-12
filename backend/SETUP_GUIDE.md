# Backend Setup Guide

## Required Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/maayo

# Server Configuration
PORT=5000

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Email Configuration (for OTP functionality)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
```

## Email Setup for OTP

### For Gmail:
1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings > Security > App passwords
3. Generate an App Password for "Mail"
4. Use this App Password in the `EMAIL_PASS` variable

### For Other Email Services:
- Update `EMAIL_SERVICE` to your provider (e.g., 'outlook', 'yahoo')
- Use your email credentials in `EMAIL_USER` and `EMAIL_PASS`

## Starting the Server

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. The server will run on `http://localhost:5000`

## Testing OTP Endpoints

You can test the OTP endpoints using:

```bash
# Send login OTP
curl -X POST http://localhost:5000/api/otp/send-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Verify login OTP
curl -X POST http://localhost:5000/api/otp/verify-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp_code":"123456"}'
```

## Troubleshooting

- **404 Error**: Make sure the backend server is running on port 5000
- **Email not sending**: Check your email configuration in `.env`
- **Database connection**: Ensure MongoDB is running and accessible
- **CORS issues**: The server is configured with CORS enabled
