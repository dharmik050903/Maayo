# Backend API with JWT Authentication

A Node.js backend API with JWT token-based authentication system.

## Features

- JWT token generation and verification
- Protected routes with middleware authentication
- Token expiration set to 24 weeks
- Express.js REST API structure

## Project Structure

```
backend/
├── middlewares/
│   ├── auth.js          # JWT verification middleware
│   └── token.js         # Token generation utilities
├── router.js            # API routes and endpoints
├── index.js             # Main server file
├── connection.js        # Database connection (if applicable)
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
Create a `.env` file in the root directory:
```env
jwt_secret=your_jwt_secret_key_here
PORT=3000
```

4. Start the server:
```bash
npm start
```

## API Endpoints

### Protected Routes

#### POST `/api/profile`
Access user profile information (requires valid JWT token)

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response:**
```json
{
  "message": "Profile route accessed successfully",
  "user": {
    "id": 1,
    "username": "dharmik",
    "role": "user",
    "email": "das@gmamil.com"
  }
}
```

## Authentication

### JWT Token Structure
The JWT token contains the following payload:
```json
{
  "id": 1,
  "username": "dharmik",
  "role": "user",
  "email": "das@gmamil.com"
}
```

### Token Expiration
- **Duration**: 24 weeks
- **Format**: JWT with HS256 algorithm

### Middleware Usage
```javascript
import auth from './middlewares/auth.js';

// Protect a route
router.post('/protected-route', auth, (req, res) => {
  // req.user contains decoded token data
  res.json({ user: req.user });
});
```

## Dependencies

- `express`: Web framework
- `jsonwebtoken`: JWT implementation
- Other dependencies as listed in `package.json`

## Development

### Adding New Protected Routes
1. Import the auth middleware
2. Apply it to your route
3. Access user data via `req.user`

### Customizing Token Payload
Modify the `generateToken` function in `middlewares/token.js` to include additional user data.

## Security Notes

- Keep your JWT secret secure and never commit it to version control
- Use HTTPS in production
- Consider implementing token refresh mechanisms for production use
- Validate all user inputs

## License

[Add your license here]
