# OTP Connection Timeout - Troubleshooting Guide

## 🚨 **Issue: Connection Timeout Error**

**Error:** `Connection timeout` when calling `/api/otp/send-login`

**Cause:** Email service configuration or network connectivity issues on Render hosting.

---

## 🔧 **SOLUTIONS**

### **1. Environment Variables Check**

Ensure these are set in your Render dashboard:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_character_app_password
EMAIL_FROM=your_gmail@gmail.com
NODE_ENV=production
```

**✅ Verify:**
- EMAIL_USER is a valid Gmail address
- EMAIL_PASS is a 16-character App Password (not your regular password)
- EMAIL_FROM matches EMAIL_USER

### **2. Gmail App Password Setup**

**Step-by-step Gmail App Password creation:**

1. **Enable 2-Factor Authentication:**
   - Go to Google Account Settings
   - Security → 2-Step Verification → Turn on

2. **Generate App Password:**
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other"
   - Enter "Maayo" as the app name
   - Copy the 16-character password

3. **Update Render Environment:**
   ```
   EMAIL_PASS=abcd efgh ijkl mnop  # Use without spaces
   ```

### **3. Alternative Email Services**

If Gmail continues to have issues, try these alternatives:

#### **Option A: SendGrid (Recommended)**
```env
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
EMAIL_FROM=your_verified_email@domain.com
```

#### **Option B: Mailgun**
```env
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your_mailgun_username
EMAIL_PASS=your_mailgun_password
EMAIL_FROM=your_verified_email@domain.com
```

#### **Option C: SMTP2GO**
```env
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.smtp2go.com
EMAIL_PORT=2525
EMAIL_USER=your_smtp2go_username
EMAIL_PASS=your_smtp2go_password
EMAIL_FROM=your_email@domain.com
```

### **4. Updated Email Service Configuration**

The OTP service has been updated with:
- ✅ Connection timeout handling (25 seconds)
- ✅ Retry mechanisms
- ✅ Better error messages
- ✅ SMTP connection pooling
- ✅ Rate limiting protection

### **5. Render-Specific Configuration**

For Render hosting, add these environment variables:

```env
# Render specific
NODE_ENV=production
PORT=5000
RENDER=true

# Email service with fallbacks
EMAIL_SERVICE=gmail
EMAIL_DEBUG=false
EMAIL_VERIFY_CONNECTION=true
```

### **6. Test Email Configuration**

Create a test endpoint to verify email setup:

```javascript
// Add to your router.js
router.post("/test-email", async (req, res) => {
    try {
        const { email } = req.body;
        
        // Test email transporter
        await otpService.emailTransporter.verify();
        
        const result = await otpService.sendOTPEmail(
            email, 
            "123456", 
            "login", 
            { first_name: "Test" }
        );
        
        res.json({ success: result.success, error: result.error });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

---

## 🚀 **QUICK FIX STEPS**

### **Immediate Actions:**

1. **Check Render Logs:**
   ```bash
   # In Render Dashboard
   Logs → View Logs → Look for email connection errors
   ```

2. **Verify Environment Variables:**
   ```bash
   # Test if variables are loaded
   curl https://maayo-backend.onrender.com/api/test-config
   ```

3. **Test Email Service:**
   ```bash
   curl -X POST https://maayo-backend.onrender.com/api/test-email \
   -H "Content-Type: application/json" \
   -d '{"email":"your_test_email@gmail.com"}'
   ```

4. **Alternative: Use External Email Service**
   - Sign up for SendGrid (Free tier: 100 emails/day)
   - Update environment variables
   - Redeploy on Render

---

## 🔍 **ERROR CATEGORIES**

### **Authentication Errors (EAUTH)**
- **Cause:** Wrong email credentials
- **Fix:** Regenerate Gmail App Password

### **Connection Timeout (ETIMEDOUT)**
- **Cause:** Network/firewall issues
- **Fix:** Switch to SendGrid or Mailgun

### **Connection Refused (ECONNECTION)**
- **Cause:** SMTP server unreachable
- **Fix:** Check firewall settings, try different port

### **Rate Limiting**
- **Cause:** Too many email requests
- **Fix:** Implement proper rate limiting

---

## 📞 **SUPPORT ESCALATION**

### **Level 1: Basic Fixes**
- ✅ Check environment variables
- ✅ Verify Gmail App Password
- ✅ Check Render logs

### **Level 2: Service Replacement**
- ✅ Switch to SendGrid
- ✅ Update SMTP configuration
- ✅ Test with alternative service

### **Level 3: Advanced Debugging***
- ✅ Check DNS resolution
- ✅ Test SMTP connectivity
- ✅ Analyze network packets

---

## 🎯 **RECOMMENDED ACTION**

**For immediate resolution:**

1. **Switch to SendGrid** (Most reliable)
2. **Update environment variables**
3. **Redeploy on Render**
4. **Test OTP functionality**

**SendGrid Setup:**
```bash
# 1. Sign up at SendGrid
# 2. Create API key
# 3. Update Render environment:
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=SG.your_sendgrid_api_key_here
```

This should resolve the timeout issues immediately.
