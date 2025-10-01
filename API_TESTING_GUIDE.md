# Escrow System API Testing Guide

## Prerequisites
- Razorpay API keys configured
- MongoDB running
- Backend server running on port 5000
- Valid user accounts (client and freelancer)

## Test Data Setup

### 1. Create Test Users
```json
// Client User
{
  "email": "client@test.com",
  "password": "password123",
  "role": "client",
  "first_name": "Test",
  "last_name": "Client"
}

// Freelancer User
{
  "email": "freelancer@test.com", 
  "password": "password123",
  "role": "freelancer",
  "first_name": "Test",
  "last_name": "Freelancer"
}
```

### 2. Authentication Headers
For all API calls, include these headers:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "id": "USER_ID",
  "user_role": "client|freelancer"
}
```

## API Testing Sequence

### Phase 1: Bank Details Management (Freelancer)

#### 1.1 Add Bank Details
```bash
POST http://localhost:5000/api/bank-details/add
Content-Type: application/json
Authorization: Bearer FREELANCER_TOKEN
id: FREELANCER_ID
user_role: freelancer

{
  "account_holder_name": "Test Freelancer",
  "account_number": "1234567890123",
  "ifsc_code": "HDFC0000001",
  "bank_name": "HDFC Bank",
  "branch_name": "Test Branch",
  "account_type": "savings",
  "upi_id": "test@upi"
}
```

**Expected Response:**
```json
{
  "status": true,
  "message": "Bank details added successfully",
  "data": {
    "bank_details_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "account_holder_name": "Test Freelancer",
    "bank_name": "HDFC Bank",
    "is_primary": 1
  }
}
```

#### 1.2 List Bank Details
```bash
POST http://localhost:5000/api/bank-details/list
Content-Type: application/json
Authorization: Bearer FREELANCER_TOKEN
id: FREELANCER_ID
user_role: freelancer
```

### Phase 2: Project and Bid Management

#### 2.1 Create Project (Client)
```bash
POST http://localhost:5000/api/project/create
Content-Type: application/json
Authorization: Bearer CLIENT_TOKEN
id: CLIENT_ID
user_role: client

{
  "title": "Test Escrow Project",
  "description": "Testing escrow system with milestones",
  "skills_required": [
    {
      "skill": "Web Development",
      "skill_id": "64f8a1b2c3d4e5f6a7b8c9d1"
    }
  ],
  "budget": 10000,
  "duration": 30
}
```

#### 2.2 Create Bid with Milestones (Freelancer)
```bash
POST http://localhost:5000/api/bid/create
Content-Type: application/json
Authorization: Bearer FREELANCER_TOKEN
id: FREELANCER_ID
user_role: freelancer

{
  "project_id": "PROJECT_ID",
  "bid_amount": 8000,
  "proposed_duration": 25,
  "cover_letter": "I can complete this project efficiently",
  "milestones": [
    {
      "title": "Design Phase",
      "description": "Complete UI/UX design",
      "amount": 2400,
      "due_date": "2024-01-15"
    },
    {
      "title": "Development Phase", 
      "description": "Complete backend development",
      "amount": 2400,
      "due_date": "2024-01-25"
    },
    {
      "title": "Testing & Deployment",
      "description": "Final testing and deployment",
      "amount": 3200,
      "due_date": "2024-01-30"
    }
  ],
  "start_date": "2024-01-10",
  "availability_hours": 40
}
```

#### 2.3 Accept Bid (Client)
```bash
POST http://localhost:5000/api/bid/accept
Content-Type: application/json
Authorization: Bearer CLIENT_TOKEN
id: CLIENT_ID
user_role: client

{
  "bid_id": "BID_ID"
}
```

#### 2.4 Update Project Price (Client)
```bash
POST http://localhost:5000/api/bid/update-price
Content-Type: application/json
Authorization: Bearer CLIENT_TOKEN
id: CLIENT_ID
user_role: client

{
  "project_id": "PROJECT_ID",
  "final_amount": 9000
}
```

### Phase 3: Escrow Payment Management

#### 3.1 Create Escrow Payment (Client)
```bash
POST http://localhost:5000/api/escrow/create
Content-Type: application/json
Authorization: Bearer CLIENT_TOKEN
id: CLIENT_ID
user_role: client

{
  "project_id": "PROJECT_ID",
  "final_amount": 9000
}
```

**Expected Response:**
```json
{
  "status": true,
  "message": "Escrow payment created successfully",
  "data": {
    "order_id": "order_xxxxx",
    "amount": 900000,
    "currency": "INR",
    "project_id": "PROJECT_ID"
  }
}
```

#### 3.2 Verify Escrow Payment (Client)
```bash
POST http://localhost:5000/api/escrow/verify
Content-Type: application/json
Authorization: Bearer CLIENT_TOKEN
id: CLIENT_ID
user_role: client

{
  "project_id": "PROJECT_ID",
  "payment_id": "pay_xxxxx",
  "signature": "signature_xxxxx"
}
```

#### 3.3 Get Escrow Status
```bash
POST http://localhost:5000/api/escrow/status
Content-Type: application/json
Authorization: Bearer CLIENT_TOKEN
id: CLIENT_ID
user_role: client

{
  "project_id": "PROJECT_ID"
}
```

### Phase 4: Milestone Management

#### 4.1 List Project Milestones
```bash
POST http://localhost:5000/api/milestone/list
Content-Type: application/json
Authorization: Bearer FREELANCER_TOKEN
id: FREELANCER_ID
user_role: freelancer

{
  "project_id": "PROJECT_ID"
}
```

#### 4.2 Complete First Milestone (Freelancer)
```bash
POST http://localhost:5000/api/milestone/complete
Content-Type: application/json
Authorization: Bearer FREELANCER_TOKEN
id: FREELANCER_ID
user_role: freelancer

{
  "project_id": "PROJECT_ID",
  "milestone_index": 0,
  "completion_notes": "Design phase completed successfully"
}
```

#### 4.3 Release Milestone Payment (Client)
```bash
POST http://localhost:5000/api/escrow/release-milestone
Content-Type: application/json
Authorization: Bearer CLIENT_TOKEN
id: CLIENT_ID
user_role: client

{
  "project_id": "PROJECT_ID",
  "milestone_index": 0
}
```

**Expected Response:**
```json
{
  "status": true,
  "message": "Milestone payment released successfully",
  "data": {
    "payout_id": "pout_xxxxx",
    "amount": 2700,
    "milestone_title": "Design Phase"
  }
}
```

#### 4.4 Add New Milestone (Freelancer)
```bash
POST http://localhost:5000/api/milestone/add
Content-Type: application/json
Authorization: Bearer FREELANCER_TOKEN
id: FREELANCER_ID
user_role: freelancer

{
  "project_id": "PROJECT_ID",
  "title": "Documentation Phase",
  "description": "Create project documentation",
  "amount": 1000,
  "due_date": "2024-02-05"
}
```

#### 4.5 Modify Milestone (Freelancer)
```bash
POST http://localhost:5000/api/milestone/modify
Content-Type: application/json
Authorization: Bearer FREELANCER_TOKEN
id: FREELANCER_ID
user_role: freelancer

{
  "project_id": "PROJECT_ID",
  "milestone_index": 1,
  "title": "Updated Development Phase",
  "description": "Updated description",
  "due_date": "2024-01-28"
}
```

#### 4.6 Remove Milestone (Freelancer)
```bash
POST http://localhost:5000/api/milestone/remove
Content-Type: application/json
Authorization: Bearer FREELANCER_TOKEN
id: FREELANCER_ID
user_role: freelancer

{
  "project_id": "PROJECT_ID",
  "milestone_index": 3
}
```

## Testing Scenarios

### Scenario 1: Complete 3-Milestone Project
1. Create project with 3 milestones
2. Accept bid and create escrow
3. Complete milestone 1 → Release 30% (₹2,700)
4. Complete milestone 2 → Release 30% (₹2,700)  
5. Complete milestone 3 → Release 40% (₹3,600)

### Scenario 2: Error Handling
1. Try to create escrow without bank details
2. Try to release payment for incomplete milestone
3. Try to modify completed milestone
4. Try to access other user's project

### Scenario 3: Edge Cases
1. Project with single milestone (100% release)
2. Project with 5+ milestones (equal distribution)
3. Milestone with zero amount
4. Invalid milestone index

## Postman Collection

Create a Postman collection with these requests:

### Environment Variables
```json
{
  "base_url": "http://localhost:5000/api",
  "client_token": "CLIENT_JWT_TOKEN",
  "freelancer_token": "FREELANCER_JWT_TOKEN", 
  "client_id": "CLIENT_USER_ID",
  "freelancer_id": "FREELANCER_USER_ID",
  "project_id": "PROJECT_ID",
  "bid_id": "BID_ID"
}
```

### Pre-request Scripts
```javascript
// Set headers automatically
pm.request.headers.add({
    key: 'Authorization',
    value: 'Bearer ' + pm.environment.get('client_token')
});

pm.request.headers.add({
    key: 'id', 
    value: pm.environment.get('client_id')
});

pm.request.headers.add({
    key: 'user_role',
    value: 'client'
});
```

## Expected Test Results

### Success Cases
- ✅ Bank details added successfully
- ✅ Escrow payment created and verified
- ✅ Milestones completed and payments released
- ✅ Payment amounts calculated correctly (30%, 30%, 40%)

### Error Cases
- ❌ Invalid IFSC code format
- ❌ Milestone modification after completion
- ❌ Payment release for incomplete milestone
- ❌ Unauthorized access to other user's data

## Performance Testing

### Load Testing
- Test with 100+ concurrent escrow payments
- Test milestone completion under load
- Test payment release processing time

### Data Validation
- Test with invalid JSON payloads
- Test with missing required fields
- Test with invalid data types

## Monitoring and Logs

### Key Metrics to Monitor
- Escrow payment success rate
- Milestone completion time
- Payment release processing time
- API response times
- Error rates by endpoint

### Log Messages to Watch
- "Escrow payment created successfully"
- "Milestone payment released successfully"
- "Invalid milestone index"
- "Payment verification failed"

