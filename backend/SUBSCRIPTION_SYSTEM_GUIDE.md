# Maayo Subscription System Implementation Guide

## Overview

The Maayo platform now includes a comprehensive subscription system that provides tiered access to features based on payment plans. The system integrates with Razorpay for payment processing and includes feature gating, usage limits, and subscription management.

## 🏗️ Architecture

### Backend Components

1. **Database Schema**
   - `tblsubscriptions` - Detailed subscription records
   - `tblpersonmaster` - Updated with subscription fields

2. **Controllers**
   - `SubscriptionController` - Handles subscription operations
   - `PaymentGateway` - Existing Razorpay integration

3. **Middleware**
   - `requireActiveSubscription` - Ensures user has active subscription
   - `requireFeatureAccess` - Checks specific feature access
   - `checkUsageLimit` - Validates usage limits
   - `canCreateProject` - Project creation limits for clients
   - `canSubmitBid` - Bid submission limits for freelancers

4. **Configuration**
   - `subscriptionPlans.js` - Plan definitions and feature mappings

### Frontend Components

1. **Components**
   - `SubscriptionModal.jsx` - Subscription upgrade interface

2. **Services**
   - `subscriptionService.js` - API integration for subscriptions

3. **Data**
   - `subscriptionPlans.js` - Frontend plan definitions

## 📋 Subscription Plans

### Free Plan
- **Price**: ₹0/month
- **Features**:
  - 3 projects maximum
  - 5 bids per month
  - Basic features only
  - No AI proposals
  - No priority support

### Basic Plan
- **Price**: ₹999/month (₹9,999/year - Save ₹1,989)
- **Features**:
  - 10 projects maximum
  - 25 bids per month
  - AI proposals included
  - Escrow protection
  - Basic support

### Pro Plan (Most Popular)
- **Price**: ₹2,499/month (₹24,999/year - Save ₹4,989)
- **Features**:
  - 50 projects maximum
  - 100 bids per month
  - AI proposals included
  - Priority support
  - Advanced analytics
  - Escrow protection

### Enterprise Plan
- **Price**: ₹4,999/month (₹49,999/year - Save ₹9,989)
- **Features**:
  - Unlimited projects
  - Unlimited bids
  - All Pro features
  - Custom branding
  - API access
  - Full feature set

## 🔧 API Endpoints

### Subscription Management

```bash
# Get all available plans
GET /api/subscription/plans?billing_cycle=monthly

# Get current subscription
GET /api/subscription/current

# Create subscription
POST /api/subscription/create
{
  "plan_id": "pro",
  "billing_cycle": "monthly"
}

# Verify subscription payment
POST /api/subscription/verify
{
  "subscription_id": "sub_xxx",
  "payment_id": "pay_xxx",
  "signature": "signature"
}

# Cancel subscription
POST /api/subscription/cancel
{
  "cancel_at_period_end": true
}

# Check feature access
POST /api/subscription/check-feature
{
  "feature": "ai_proposals"
}

# Get usage statistics
GET /api/subscription/usage
```

## 🛡️ Feature Gating

### Protected Routes

The following routes now require subscription features:

1. **AI Features** (Requires Basic+ plan)
   - `/api/ai/generate-proposal`
   - `/api/ai/generate-project-description`

2. **Project Creation** (Limited by plan)
   - `/api/project/create` - Limited by `max_projects`

3. **Bid Submission** (Limited by plan)
   - `/api/bid/create` - Limited by `max_bids_per_month`

### Middleware Usage

```javascript
// Require specific feature
router.post("/ai/generate-proposal", auth, requireFeatureAccess('ai_proposals'), aiController.generateProposal);

// Check usage limits
router.post("/project/create", auth, canCreateProject, projectController.createProject);
router.post("/bid/create", auth, canSubmitBid, bidController.createBid);
```

## 💳 Payment Integration

### Razorpay Setup

1. **Create Plans in Razorpay Dashboard**
   ```bash
   # Example plan IDs (replace with actual IDs from Razorpay)
   plan_basic_monthly
   plan_pro_monthly
   plan_enterprise_monthly
   plan_basic_yearly
   plan_pro_yearly
   plan_enterprise_yearly
   ```

2. **Environment Variables**
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxx
   RAZORPAY_KEY_SECRET=xxx
   ```

### Payment Flow

1. User selects plan in `SubscriptionModal`
2. Frontend calls `/api/subscription/create`
3. Backend creates Razorpay subscription
4. User redirected to Razorpay checkout
5. Payment completed, webhook updates subscription
6. User gains access to premium features

## 🎯 Usage Tracking

### Current Implementation

The system tracks:
- Project creation count
- Bid submission count
- AI proposal usage
- Feature access by plan

### Future Enhancements

- Real-time usage monitoring
- Usage alerts and notifications
- Detailed analytics dashboard
- Usage-based billing

## 🔄 Subscription Lifecycle

### States

1. **incomplete** - Payment pending
2. **active** - Subscription active
3. **trialing** - Free trial period
4. **past_due** - Payment failed
5. **canceled** - Subscription canceled
6. **paused** - Temporarily paused

### Transitions

```
incomplete → active (payment successful)
active → past_due (payment failed)
past_due → active (payment retry successful)
active → canceled (user cancellation)
```

## 🚀 Frontend Integration

### Using SubscriptionModal

```jsx
import SubscriptionModal from '../components/SubscriptionModal'

function Header() {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  return (
    <>
      <button onClick={() => setShowSubscriptionModal(true)}>
        Upgrade Plan
      </button>
      
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onUpgrade={(plan) => {
          // Handle upgrade
          setShowSubscriptionModal(false)
        }}
      />
    </>
  )
}
```

### Checking Feature Access

```jsx
import { subscriptionService } from '../services/subscriptionService'

function AIProposalButton() {
  const user = getCurrentUser()
  
  const handleClick = () => {
    if (!subscriptionService.hasFeatureAccess(user, 'ai_proposals')) {
      // Show upgrade modal
      setShowSubscriptionModal(true)
      return
    }
    
    // Proceed with AI proposal generation
    generateProposal()
  }

  return (
    <button onClick={handleClick}>
      Generate AI Proposal
    </button>
  )
}
```

## 📊 Monitoring & Analytics

### Key Metrics

1. **Subscription Metrics**
   - Active subscriptions by plan
   - Monthly recurring revenue (MRR)
   - Churn rate
   - Conversion rate (free to paid)

2. **Usage Metrics**
   - Feature adoption rates
   - Usage patterns by plan
   - Limit hit rates
   - Upgrade triggers

### Dashboard Integration

The system provides endpoints for:
- Current subscription status
- Usage statistics
- Feature access checks
- Upgrade suggestions

## 🔧 Configuration

### Plan Customization

To modify plans, update:
1. `backend/config/subscriptionPlans.js`
2. `frontend/src/data/subscriptionPlans.js`
3. Razorpay dashboard plans

### Feature Flags

Add new features by:
1. Adding feature to plan configurations
2. Creating middleware for feature gating
3. Updating frontend feature checks

## 🚨 Error Handling

### Common Scenarios

1. **Payment Failed**
   - Subscription status: `past_due`
   - User retains access until period end
   - Retry mechanism via Razorpay

2. **Feature Access Denied**
   - HTTP 402 status code
   - Upgrade suggestions provided
   - Graceful degradation

3. **Usage Limit Reached**
   - HTTP 402 status code
   - Current usage displayed
   - Upgrade options shown

## 🔐 Security Considerations

1. **Payment Verification**
   - Razorpay signature verification
   - Webhook validation
   - Idempotency handling

2. **Feature Access**
   - Server-side validation
   - Middleware protection
   - Real-time checks

3. **Data Protection**
   - Minimal PII storage
   - Encrypted sensitive data
   - Audit logging

## 📈 Future Enhancements

### Planned Features

1. **Advanced Analytics**
   - Revenue forecasting
   - User behavior analysis
   - Churn prediction

2. **Flexible Billing**
   - Usage-based pricing
   - Custom plans
   - Enterprise contracts

3. **Enhanced UX**
   - In-app upgrade prompts
   - Usage notifications
   - Personalized recommendations

## 🛠️ Development Notes

### Testing

1. **Test Plans**
   - Use Razorpay test mode
   - Test all subscription states
   - Verify feature gating

2. **Webhook Testing**
   - Use Razorpay webhook testing
   - Verify all event types
   - Test error scenarios

### Deployment

1. **Environment Setup**
   - Configure Razorpay keys
   - Set up webhook endpoints
   - Update CORS settings

2. **Database Migration**
   - Add subscription fields to existing users
   - Set default free plan
   - Create indexes

## 📞 Support

For issues or questions:
1. Check Razorpay documentation
2. Review webhook logs
3. Monitor subscription status
4. Test payment flows

---

This subscription system provides a solid foundation for monetizing the Maayo platform while ensuring a smooth user experience for both free and paid users.
