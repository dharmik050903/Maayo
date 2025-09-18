# Realtime Chat for Accepted Bids

This guide explains how client and freelancer can chat once a bid is accepted. Messages are stored in MongoDB in the `tblchats` collection. Realtime updates use Socket.IO.

## Overview
- Realtime transport: Socket.IO
- Storage: MongoDB via Mongoose (`tblchats`)
- Scope: Chat is enabled only when a bid status is `accepted`
- Participants: Project owner (client) and accepted freelancer

## Environment
Ensure these variables exist in `.env` (see `SETUP_GUIDE.md` for others):

```env
MONGODB_URI=mongodb://localhost:27017/maayo
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173,https://maayo-alpha.vercel.app
```

- `ALLOWED_ORIGINS` is a comma-separated allowlist for CORS and Socket.IO.

## Installation
From `backend` directory:

```bash
npm install socket.io
```

## Server Integration
- Socket server is initialized in `backend/index.js` using a shared initializer `backend/services/socket.js`.
- The same HTTP server instance is used for Express and Socket.IO.

Key files:
- `services/socket.js`: initializes and exports Socket.IO server
- `schema/chat.js`: defines `tblchats` schema
- `controller/chat.js`: send and list messages
- `router.js`: chat endpoints
- `controller/bid.js`: emits `chat:enabled` when a bid is accepted

## Data Model: tblchats
Fields:
- `project_id` (ObjectId → `tblproject`)
- `bid_id` (ObjectId → `tblbid`)
- `from_person_id` (ObjectId → `tblpersonmaster`)
- `from_person_name` (String)
- `to_person_id` (ObjectId → `tblpersonmaster`)
- `to_person_name` (String)
- `message` (String)
- `sent_at` (ISO String)

Indexes:
- `{ bid_id: 1, sent_at: 1 }`
- `{ project_id: 1, sent_at: 1 }`

## HTTP API
All endpoints require auth headers already used by your API. Body is JSON.

- POST `/api/chat/send`
  - body: `{ "bid_id": "...", "message": "Hello" }`
  - sends a message between client and freelancer for an accepted bid

- POST `/api/chat/list`
  - body: `{ "bid_id": "...", "page": 1, "limit": 50 }`
  - returns paginated messages for the accepted bid

Rules:
- Only the project owner and the accepted freelancer can send/view messages.
- Chat works only if the bid is `accepted`.

## Socket.IO Events
Client connects with a query param for their user id:

```js
import { io } from 'socket.io-client'
const socket = io(BACKEND_URL, { query: { userId: currentUserId } })

// Join a chat room by bid id to receive realtime messages
socket.emit('chat:join', { bid_id })

// Listen for new messages
socket.on('chat:new-message', ({ bid_id, message }) => {
  // append to UI if matches active chat
})

// Optional: listen for chat being enabled after accept
socket.on('chat:enabled', ({ bid_id, project_id }) => {
  // open chat UI or refresh list
})
```

Server emissions:
- `chat:new-message`: emitted to `chat:{bid_id}` room and `user:{to_person_id}`
- `chat:enabled`: emitted to both `user:{clientId}` and `user:{freelancerId}` after bid acceptance

## Flow
1. Client accepts a bid via `/api/bid/accept`
2. Server updates bid + project and emits `chat:enabled`
3. Both parties can call `/api/chat/send` and `/api/chat/list`
4. Socket clients should `chat:join` with the accepted `bid_id` to get realtime messages

## Frontend Notes
- Use the existing auth token in headers for `/api/chat/*` calls.
- On chat screen mount:
  - connect socket with `userId`
  - `socket.emit('chat:join', { bid_id })`
  - fetch history via `/api/chat/list`
  - on send, POST `/api/chat/send` and rely on socket to update peer

## Security
- Access checks ensure only participants can send/view
- Messages are immutable records; do not expose delete/update endpoints

## Troubleshooting
- CORS issues: ensure origin is in `ALLOWED_ORIGINS`
- No realtime updates: verify socket connects with `userId` and you joined `chat:{bid_id}`
- 403 on send/list: ensure bid is accepted and the caller is either client or accepted freelancer

