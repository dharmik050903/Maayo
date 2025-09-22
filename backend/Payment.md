# Razorpay Payment API Integration

This backend provides endpoints to create Razorpay orders and verify payments.

## Setup

1. **Install dependencies:**
   ```
   npm install razorpay
   ```

2. **Add Razorpay keys to `.env`:**
   ```
   RAZORPAY_KEY_ID=your_key_id_here
   RAZORPAY_KEY_SECRET=your_key_secret_here
   ```

3. **Endpoints:**

   - **Create Order**
     - `POST /api/payment/order`
     - Body: `{ "amount": 500, "currency": "INR" }`
     - Returns: `{ orderId, amount, currency }`

   - **Verify Payment**
     - `POST /api/payment/verify`
     - Body: `{ "orderId": "...", "paymentId": "...", "signature": "..." }`
     - Returns: `{ success: true/false, message: "..." }`

4. **Frontend Flow:**
   - Call `/api/payment/order` to get order details.
   - Use Razorpay Checkout on frontend with the order ID.
   - On payment success, call `/api/payment/verify` with orderId, paymentId, and signature.

5. **Notes:**
   - Amount is in INR paise (₹1 = 100 paise).
   - Keep your keys secure and never expose secrets on frontend.

---

For more details, see [Razorpay Docs](https://razorpay.com/docs/api/orders/).