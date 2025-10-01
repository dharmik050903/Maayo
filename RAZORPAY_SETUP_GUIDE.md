# Razorpay Payouts API Setup Guide

## Step 1: Enable Payouts in Razorpay Dashboard

### 1.1 Login and Enable Payouts
1. Go to [https://dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Login with your Razorpay account
3. Navigate to **Settings** → **Account & Settings**
4. Look for **Payouts** section and click **Enable Payouts**
5. Complete the verification process (may require business documents)

### 1.2 Get API Keys
1. Go to **Settings** → **API Keys**
2. Copy your **Key ID** and **Key Secret**
3. For testing, use **Test Mode** keys (they start with `rzp_test_`)

## Step 2: Update Environment Variables

Create or update your `backend/.env` file with the following variables:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/maayo

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:5173

# Email Configuration (if using)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Admin Configuration
ADMIN_EMAIL=admin@maayo.com
ADMIN_PASSWORD=admin123
```

## Step 3: Update Razorpay Service Configuration

The existing `backend/services/razorpay.js` should already be configured, but verify it includes:

```javascript
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpay;
```

## Step 4: Test Razorpay Configuration

### 4.1 Test API Keys
Use the existing test endpoint:
```bash
GET http://localhost:5000/api/payment/test-config
```

Expected response:
```json
{
  "status": "OK",
  "message": "Razorpay configuration check",
  "config": {
    "keyId": "Set",
    "keySecret": "Set",
    "nodeEnv": "development",
    "keyType": "Test"
  }
}
```

### 4.2 Test Order Creation
```bash
POST http://localhost:5000/api/payment/test-order
```

Expected response:
```json
{
  "status": "success",
  "message": "Test order created successfully",
  "order": {
    "id": "order_xxxxx",
    "amount": 100,
    "currency": "INR",
    "status": "created"
  }
}
```

## Step 5: Payouts API Testing

### 5.1 Create Test Fund Account
Before testing payouts, you need to create a fund account:

```javascript
// Test fund account creation
const fundAccountData = {
    account_type: "bank_account",
    bank_account: {
        name: "Test Account Holder",
        ifsc: "HDFC0000001", // Use valid IFSC codes
        account_number: "1234567890123"
    }
};

const fundAccount = await razorpay.fundAccounts.create(fundAccountData);
```

### 5.2 Test Payout Creation
```javascript
// Test payout creation
const payoutData = {
    account_number: "1234567890123",
    fund_account: {
        account_type: "bank_account",
        bank_account: {
            name: "Test Account Holder",
            ifsc: "HDFC0000001",
            account_number: "1234567890123"
        }
    },
    amount: 100, // 1 INR in paise
    currency: "INR",
    mode: "IMPS",
    purpose: "payout",
    queue_if_low_balance: true,
    reference_id: `test_payout_${Date.now()}`,
    narration: "Test payout"
};

const payout = await razorpay.payouts.create(payoutData);
```

## Step 6: Environment-Specific Notes

### Test Environment
- Use test API keys (`rzp_test_*`)
- Test payouts work with test bank accounts
- No real money is transferred

### Production Environment
- Use live API keys (`rzp_live_*`)
- Requires proper business verification
- Real money transfers occur
- Additional compliance requirements

## Step 7: Common Issues and Solutions

### Issue 1: Payouts Not Enabled
**Error**: "Payouts not enabled for this account"
**Solution**: Enable payouts in Razorpay dashboard

### Issue 2: Invalid IFSC Code
**Error**: "Invalid IFSC code"
**Solution**: Use valid IFSC codes (format: ABCD0000001)

### Issue 3: Insufficient Balance
**Error**: "Insufficient balance"
**Solution**: Add test balance in Razorpay dashboard (Test mode)

### Issue 4: Fund Account Not Created
**Error**: "Fund account not found"
**Solution**: Create fund account before creating payout

## Step 8: Testing Checklist

- [ ] Razorpay API keys configured
- [ ] Payouts enabled in dashboard
- [ ] Test order creation works
- [ ] Fund account creation works
- [ ] Test payout creation works
- [ ] Environment variables properly set
- [ ] Database connection working
- [ ] All escrow endpoints accessible

## Step 9: Production Deployment Notes

1. **Switch to Live Keys**: Update environment variables with live keys
2. **Business Verification**: Complete Razorpay business verification
3. **Compliance**: Ensure compliance with RBI guidelines
4. **Monitoring**: Set up monitoring for payout failures
5. **Webhooks**: Configure webhooks for payout status updates

