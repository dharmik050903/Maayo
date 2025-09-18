## Subscriptions and Payments – Implementation Guide

This guide outlines the steps to add a subscription modal on the frontend and integrate a payment gateway on the backend. It is tailored to this repo’s stack:

- Frontend: React (Vite, Tailwind) in `frontend/`
- Backend: Express + MongoDB in `backend/`

The examples below use Stripe (recommended globally). Notes for Razorpay are included where relevant.

---

### 1) Plan the subscription product(s)

- Decide on tiers (e.g., Free, Pro, Business) and billing intervals (monthly/annual).
- Define benefits per tier: bid limits, AI features, visibility, etc.
- Create the products/prices in your payment provider dashboard:
  - Stripe: Products → Add product → Add recurring price(s). Note the `price_XXX` IDs.
  - Razorpay: Plans/Subscriptions → Create plan(s).

Keep a simple mapping in code (see step 5): `planKey -> Stripe priceId`.

---

### 2) Data model updates (backend)

Add subscription fields to your user document (collection: `PersonMaster`). Example shape:

```js
subscription: {
  provider: 'stripe',             // or 'razorpay'
  customerId: 'cus_...',          // provider customer id
  subscriptionId: 'sub_...',      // active subscription id
  priceId: 'price_...',           // which plan
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete',
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: Boolean
}
```

Add indexes as needed for `subscription.subscriptionId`.

---

### 3) Environment variables

Backend (`backend/.env`):

```
STRIPE_SECRET_KEY=sk_live_or_test
STRIPE_WEBHOOK_SECRET=whsec_...
APP_BASE_URL=https://maayo-alpha.vercel.app
BACKEND_BASE_URL=https://YOUR-BACKEND-DOMAIN
ALLOWED_ORIGINS=https://maayo-alpha.vercel.app
```

Frontend (Vercel → Project → Settings → Environment Variables):

```
VITE_API_BASE_URL=https://YOUR-BACKEND-DOMAIN/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_or_test
```

Razorpay (if used):

```
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

---

### 4) Backend endpoints (Stripe)

Create a new router file (e.g., `backend/payments/stripe.js`) and mount it under `/api/payments/stripe`.

Endpoints to implement:

- `POST /checkout-session`
  - Body: `{ priceId, successPath, cancelPath }`
  - Creates Stripe Checkout Session (mode: subscription) and returns `url`.
  - Attach `customer` if user already has `subscription.customerId`.
- `POST /customer-portal`
  - Returns Stripe Billing Portal URL for the authenticated user.
- `POST /webhook`
  - Raw body endpoint verifying `STRIPE_WEBHOOK_SECRET`.
  - Handle events: `customer.subscription.created|updated|deleted`, `invoice.payment_succeeded|failed`.
  - Update `PersonMaster.subscription` accordingly.

Security:

- Protect `checkout-session` and `customer-portal` with auth middleware.
- Exempt `webhook` from JSON body parser; instead use `express.raw({ type: 'application/json' })`.

Minimal pseudocode for checkout session:

```js
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

router.post('/checkout-session', auth, async (req, res) => {
  const { priceId, successPath = '/billing?success=1', cancelPath = '/billing?canceled=1' } = req.body
  const user = req.user

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: user.subscription?.customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.APP_BASE_URL}${successPath}`,
    cancel_url: `${process.env.APP_BASE_URL}${cancelPath}`,
    metadata: { userId: user.id }
  })
  res.json({ url: session.url })
})
```

Webhook handler should set:

```js
user.subscription = {
  provider: 'stripe',
  customerId: sub.customer,
  subscriptionId: sub.id,
  priceId: sub.items.data[0].price.id,
  status: sub.status,
  currentPeriodEnd: new Date(sub.current_period_end * 1000),
  cancelAtPeriodEnd: sub.cancel_at_period_end
}
```

Razorpay equivalent: create subscription via SDK, open Checkout on frontend, verify signature on backend, then mark user active.

---

### 5) Plan mapping (shared config)

Create `frontend/src/data/plans.js` and `backend/config/plans.js` with a small map:

```js
export const PLANS = {
  pro: { name: 'Pro', priceId: 'price_XXXX', features: ['Feature A', 'Feature B'] },
  business: { name: 'Business', priceId: 'price_YYYY', features: ['Everything in Pro', 'Feature C'] }
}
```

Keep these in sync with your provider dashboard.

---

### 6) Subscription modal (frontend)

Create `frontend/src/components/SubscriptionModal.jsx`:

- Props: `isOpen, onClose`.
- Shows plan cards sourced from `PLANS`.
- CTA “Continue” → calls `POST /api/payments/stripe/checkout-session` with selected `priceId` → `window.location = url`.
- Show benefits and FAQ.

Attach modal from any page (e.g., `Header.jsx` or a `Billing` page). Add a guard that prompts non‑subscribed users to upgrade before accessing premium features.

UI behavior:

- Trap focus, `Escape` closes, backdrop click closes.
- Disable background scroll while open.

---

### 7) Client billing portal

- Add a button “Manage Billing” that calls `POST /api/payments/stripe/customer-portal` and redirects to the returned URL.
- Users can update card, switch plan, cancel, and download invoices.

---

### 8) Gating premium features

- Add a helper on the frontend: `hasActiveSubscription(user)` based on `user.subscription.status === 'active' || 'trialing'` and `currentPeriodEnd > now`.
- On the backend, add a middleware: `requireActiveSubscription` that reads subscription fields from DB and rejects with 402 if not active.

Use this guard on routes that require paid access (e.g., AI proposal, high bid limits, advanced search).

---

### 9) Testing checklist (Stripe Test Mode)

- Verify checkout from `https://maayo-alpha.vercel.app` works end-to-end.
- Use Stripe test cards (`4242 4242 4242 4242`).
- Confirm webhook events update the user record correctly.
- Confirm customer portal loads and changing/canceling plan updates the app state.
- Try error cases: cancel payment, card declined, expired card.

---

### 10) Go‑live checklist

- Switch keys to live mode in envs (frontend and backend).
- Update `ALLOWED_ORIGINS` to include the production URL(s).
- Set up retry/logging for webhooks; add a dead‑letter log.
- Add billing email templates: payment succeeded/failed, trial ending, canceled.
- Update Terms/Privacy and pricing pages.

---

### 11) Razorpay notes (if preferred in India)

- Create plans in Razorpay → use Subscriptions API to create a subscription for the logged‑in user.
- Frontend uses Razorpay Checkout script and opens with the `subscription_id`.
- Backend verifies signature from `razorpay_subscription_id` + `razorpay_payment_id` + `razorpay_signature`.
- Use Razorpay webhooks for lifecycle updates similar to Stripe.

---

### 12) Folder/file suggestions

- Backend:
  - `backend/payments/stripe.js` (routes)
  - `backend/payments/razorpay.js` (optional)
  - `backend/webhooks/stripe.js` (if you prefer separate files)
  - `backend/config/plans.js`
- Frontend:
  - `frontend/src/components/SubscriptionModal.jsx`
  - `frontend/src/data/plans.js`
  - `frontend/src/pages/Billing.jsx` (optional management page)

---

### 13) Minimal API contracts

```
POST /api/payments/stripe/checkout-session
Body: { priceId: string, successPath?: string, cancelPath?: string }
Resp: { url: string }

POST /api/payments/stripe/customer-portal
Body: {}
Resp: { url: string }

POST /api/payments/stripe/webhook   // raw body, no auth
```

---

### 14) Risks and considerations

- Webhook reliability: use idempotency and store last processed event id.
- Proration and plan downgrades: decide policy.
- Dunning (failed payments): email and grace period.
- Taxes/invoices: configure in Stripe Tax or include in pricing.
- Compliance: store as little PII as necessary; never store card data.

---

### 15) Next steps (actionable)

1. Create Stripe products/prices; add `PLANS` in frontend and backend.
2. Implement checkout session and customer portal endpoints.
3. Implement Stripe webhook to update `PersonMaster.subscription`.
4. Build `SubscriptionModal.jsx` and wire to a CTA.
5. Add route guards for premium features.
6. Test in Stripe test mode end‑to‑end; then switch to live keys.


