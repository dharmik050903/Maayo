# API Documentation - Review and Bid System

## Overview
This document describes the newly implemented review and bid system for the Maayo freelancing platform. The system allows clients and freelancers to review each other after project completion and enables freelancers to bid on projects.

## Review System

### 1. Create Review
**Endpoint:** `POST /api/review/create`  
**Authentication:** Required  
**Access:** Clients and Freelancers only

**Request Body:**
```json
{
  "project_id": "project_object_id",
  "reviewee_id": "user_object_id",
  "rating": 5,
  "comment": "Great work! Very professional and delivered on time.",
  "communication_rating": 5,
  "quality_rating": 5,
  "timeliness_rating": 4,
  "professionalism_rating": 5
}
```

**Response:**
```json
{
  "status": true,
  "message": "Review created successfully",
  "data": { /* review object */ }
}
```

**Notes:**
- Reviews can only be created for completed projects
- Users can only review projects they are involved in
- Each user can only review a project once
- Rating must be between 1-5

### 2. Get User Reviews
**Endpoint:** `POST /api/review/user`  
**Authentication:** Required

**Request Body:**
```json
{
  "user_id": "user_object_id",
  "user_type": "freelancer", // optional: "client" or "freelancer"
  "page": 1,
  "limit": 20
}
```

**Response:**
```json
{
  "status": true,
  "message": "Reviews fetched successfully",
  "data": [ /* array of reviews */ ],
  "averageRatings": {
    "avgRating": 4.5,
    "avgCommunication": 4.3,
    "avgQuality": 4.7,
    "avgTimeliness": 4.2,
    "avgProfessionalism": 4.6,
    "totalReviews": 15
  },
  "pagination": { "total": 15, "page": 1, "limit": 20 }
}
```

### 3. Get Project Reviews
**Endpoint:** `POST /api/review/project`  
**Authentication:** Required

**Request Body:**
```json
{
  "project_id": "project_object_id"
}
```

### 4. Update Review
**Endpoint:** `POST /api/review/update`  
**Authentication:** Required  
**Access:** Only the reviewer can update their own review

**Request Body:**
```json
{
  "review_id": "review_object_id",
  "rating": 4,
  "comment": "Updated comment",
  "communication_rating": 4
}
```

### 5. Delete Review
**Endpoint:** `POST /api/review/delete`  
**Authentication:** Required  
**Access:** Only the reviewer can delete their own review

**Request Body:**
```json
{
  "review_id": "review_object_id"
}
```

## Bid System

### 1. Create Bid
**Endpoint:** `POST /api/bid/create`  
**Authentication:** Required  
**Access:** Freelancers only

**Request Body:**
```json
{
  "project_id": "project_object_id",
  "bid_amount": 1500,
  "proposed_duration": 14,
  "cover_letter": "I have extensive experience in web development and would love to work on this project...",
  "milestones": [
    {
      "title": "Design Phase",
      "description": "Create wireframes and mockups",
      "amount": 500,
      "due_date": "2024-01-15"
    },
    {
      "title": "Development Phase",
      "description": "Implement the main functionality",
      "amount": 1000,
      "due_date": "2024-01-25"
    }
  ],
  "start_date": "2024-01-10",
  "availability_hours": 40
}
```

**Response:**
```json
{
  "status": true,
  "message": "Bid created successfully",
  "data": { /* bid object */ }
}
```

**Notes:**
- Bids can only be created for open projects
- Each freelancer can only bid once per project
- Bid amount must be greater than 0
- Milestones are optional but recommended

### 2. Get Project Bids
**Endpoint:** `POST /api/bid/project`  
**Authentication:** Required  
**Access:** Project owner (client) or freelancers who bid on the project

**Request Body:**
```json
{
  "project_id": "project_object_id",
  "status": "pending", // optional: "pending", "accepted", "rejected", "withdrawn"
  "page": 1,
  "limit": 20
}
```

### 3. Get Freelancer Bids
**Endpoint:** `POST /api/bid/freelancer`  
**Authentication:** Required  
**Access:** Only own bids (or admin)

**Request Body:**
```json
{
  "freelancer_id": "user_object_id", // optional, defaults to current user
  "status": "accepted", // optional
  "page": 1,
  "limit": 20
}
```

### 4. Accept Bid
**Endpoint:** `POST /api/bid/accept`  
**Authentication:** Required  
**Access:** Project owner (client) only

**Request Body:**
```json
{
  "bid_id": "bid_object_id"
}
```

**Notes:**
- Accepting a bid automatically rejects all other pending bids for the project
- Project status changes to "in_progress"
- Freelancer is assigned to the project

### 5. Reject Bid
**Endpoint:** `POST /api/bid/reject`  
**Authentication:** Required  
**Access:** Project owner (client) only

**Request Body:**
```json
{
  "bid_id": "bid_object_id",
  "client_message": "Thank you for your bid, but we've decided to go with another freelancer." // optional
}
```

### 6. Withdraw Bid
**Endpoint:** `POST /api/bid/withdraw`  
**Authentication:** Required  
**Access:** Only the freelancer who created the bid

**Request Body:**
```json
{
  "bid_id": "bid_object_id"
}
```

### 7. Update Bid
**Endpoint:** `POST /api/bid/update`  
**Authentication:** Required  
**Access:** Only the freelancer who created the bid (and only if pending)

**Request Body:**
```json
{
  "bid_id": "bid_object_id",
  "bid_amount": 1200,
  "cover_letter": "Updated cover letter",
  "proposed_duration": 10
}
```

## Project Management Updates

### 1. Complete Project
**Endpoint:** `POST /api/project/complete`  
**Authentication:** Required  
**Access:** Project owner (client) only

**Request Body:**
```json
{
  "id": "project_object_id"
}
```

**Notes:**
- Project must be active and have an accepted bid
- Sets project status to "completed"
- Enables review creation for both parties

### 2. Get Project Statistics
**Endpoint:** `POST /api/project/stats`  
**Authentication:** Required

**Request Body:** None (uses current user)

**Response for Clients:**
```json
{
  "status": true,
  "message": "Project statistics fetched successfully",
  "data": {
    "totalProjects": 10,
    "activeProjects": 2,
    "completedProjects": 8,
    "totalSpent": 15000
  }
}
```

**Response for Freelancers:**
```json
{
  "status": true,
  "message": "Project statistics fetched successfully",
  "data": {
    "totalBids": 25,
    "acceptedBids": 8,
    "completedProjects": 6,
    "totalEarned": 12000
  }
}
```

## Database Schema Updates

### Project Schema Additions
- `accepted_bid_id`: Reference to the accepted bid
- `bid_deadline`: Deadline for submitting bids
- `min_bid_amount`: Minimum bid amount (optional)
- `max_bid_amount`: Maximum bid amount (optional)
- `completion_date`: When the project was completed
- `client_reviewed`: Whether client has reviewed (0/1)
- `freelancer_reviewed`: Whether freelancer has reviewed (0/1)

### New Collections

#### Reviews Collection (`tblreview`)
- Stores all reviews between clients and freelancers
- Includes detailed rating breakdowns
- Links to projects and users

#### Bids Collection (`tblbid`)
- Stores all project bids
- Includes milestones and timeline information
- Tracks bid status and client decisions

## Workflow Example

1. **Client creates project** → Project status: "open"
2. **Freelancers submit bids** → Multiple bids with different amounts and timelines
3. **Client reviews bids** → Can accept one, reject others
4. **Project starts** → Status: "in_progress", freelancer assigned
5. **Project completion** → Client marks project as completed
6. **Reviews exchanged** → Both parties can review each other
7. **Project archived** → Status: "completed", reviews visible

## Error Handling

All endpoints return consistent error responses:
```json
{
  "status": false,
  "message": "Error description",
  "error": "Detailed error message" // in development
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created successfully
- `400`: Bad request (validation errors)
- `403`: Forbidden (access denied)
- `404`: Not found
- `500`: Internal server error

## Security Notes

- All endpoints require authentication
- Users can only access/modify their own data
- Project owners have exclusive rights to accept/reject bids
- Reviews can only be created for completed projects
- Bid modifications only allowed for pending bids
