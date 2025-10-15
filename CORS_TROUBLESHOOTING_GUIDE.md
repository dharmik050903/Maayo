# CORS Troubleshooting Guide

## Overview
This guide helps you diagnose and fix CORS (Cross-Origin Resource Sharing) errors in your Maayo application.

## What is CORS?
CORS is a security feature implemented by web browsers that blocks requests from one domain to another unless the server explicitly allows it.

## Common CORS Error Messages

### 1. "Access to fetch at 'X' from origin 'Y' has been blocked by CORS policy"
- **Cause**: The frontend domain is not in the allowed origins list
- **Solution**: Add your frontend domain to the CORS configuration

### 2. "Response to preflight request doesn't pass access control check"
- **Cause**: The preflight OPTIONS request is being blocked
- **Solution**: Ensure OPTIONS requests are handled properly

### 3. "The request client is not a secure context and the resource is in a private network"
- **Cause**: Mixed content (HTTP/HTTPS) or private network access
- **Solution**: Use HTTPS for both frontend and backend

## Current CORS Configuration

### Allowed Origins
Your backend currently allows requests from:

**Development:**
- `http://localhost:3000`
- `http://localhost:5173`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`

**Production:**
- `https://maayo-frontend.vercel.app`
- `https://maayo.vercel.app`
- `https://maayo-alpha.vercel.app`

**AWS Domains:**
- Any domain containing `cloudfront.net`
- Any domain containing `amazonaws.com`

**Render Domains:**
- Any domain containing `render.com`
- Any domain containing `onrender.com`

### Allowed Methods
- GET, POST, PUT, PATCH, DELETE, OPTIONS

### Allowed Headers
- Content-Type
- Authorization
- id
- user_role
- user_email
- first_name
- last_name

## Debugging Steps

### 1. Check Server Logs
Look for these log messages in your backend:

```
CORS request from origin: https://your-domain.com
CORS: Allowing/Blocked origin: https://your-domain.com
Request details: { method: 'POST', path: '/api/escrow/release-milestone', origin: 'https://your-domain.com' }
```

### 2. Check Browser Console
Look for CORS error messages in the browser's developer console.

### 3. Test with curl
```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: https://your-domain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v \
  https://maayo-backend.onrender.com/api/escrow/release-milestone

# Test actual request
curl -X POST \
  -H "Origin: https://your-domain.com" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"project_id":"test","milestone_index":0}' \
  -v \
  https://maayo-backend.onrender.com/api/escrow/release-milestone
```

## Common Solutions

### 1. Add Your Domain to Allowed Origins

**Option A: Environment Variable**
```bash
# Add to your .env file
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

**Option B: Direct Code Modification**
Edit `backend/index.js` and add your domain to the `defaultOrigins` array:

```javascript
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'https://maayo-frontend.vercel.app',
  'https://maayo.vercel.app',
  'https://maayo-alpha.vercel.app',
  'https://your-domain.com',  // Add your domain here
  'https://www.your-domain.com'  // Add www version if needed
]
```

### 2. Fix Mixed Content Issues
Ensure both frontend and backend use HTTPS in production.

### 3. Handle Preflight Requests
The server already handles OPTIONS requests, but ensure your frontend doesn't send unnecessary preflight requests.

## Testing CORS Configuration

### 1. Test Different Origins
```javascript
// Test from browser console
fetch('https://maayo-backend.onrender.com/api/health', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('CORS test successful:', data))
.catch(error => console.error('CORS test failed:', error))
```

### 2. Check Network Tab
1. Open browser developer tools
2. Go to Network tab
3. Make a request to your API
4. Look for:
   - OPTIONS request (preflight)
   - Actual request
   - Response headers with CORS information

## Environment-Specific Issues

### Development
- Use `http://localhost:5173` for Vite
- Use `http://localhost:3000` for Create React App
- Ensure backend runs on different port

### Production
- Use HTTPS for both frontend and backend
- Add your production domain to allowed origins
- Check for subdomain issues (www vs non-www)

### AWS Deployment
- Add CloudFront distribution domain
- Add S3 bucket website domain
- Add custom domain if using Route 53

## Quick Fixes

### 1. Temporary Allow All Origins (NOT RECOMMENDED FOR PRODUCTION)
```javascript
app.use(cors({
  origin: true,  // Allow all origins
  credentials: true
}))
```

### 2. Add Specific Headers
```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  next()
})
```

## Monitoring CORS Issues

### 1. Server Logs
Monitor these log patterns:
- `CORS: Blocked origin:` - Indicates blocked requests
- `CORS request from origin:` - Shows all incoming requests
- `OPTIONS request for:` - Shows preflight requests

### 2. Error Tracking
Set up error tracking to monitor CORS errors:
- Sentry
- LogRocket
- Custom error logging

## Best Practices

### 1. Security
- Never use `origin: '*'` in production
- Always specify exact domains
- Use HTTPS in production

### 2. Performance
- Cache preflight responses with `Access-Control-Max-Age`
- Minimize preflight requests by using simple requests when possible

### 3. Debugging
- Enable detailed CORS logging
- Test with different browsers
- Use browser developer tools

## Common Mistakes

### 1. Forgetting www vs non-www
- `https://example.com` ≠ `https://www.example.com`
- Add both versions to allowed origins

### 2. Protocol Mismatch
- `http://example.com` ≠ `https://example.com`
- Ensure consistent protocol usage

### 3. Port Issues
- `https://example.com` ≠ `https://example.com:3000`
- Include port numbers if needed

### 4. Trailing Slashes
- `https://example.com` ≠ `https://example.com/`
- Be consistent with trailing slashes

## Getting Help

If you're still experiencing CORS issues:

1. **Check the server logs** for detailed CORS information
2. **Test with curl** to isolate the issue
3. **Check browser console** for specific error messages
4. **Verify your domain** is in the allowed origins list
5. **Test with different browsers** to rule out browser-specific issues

## Example CORS Error Resolution

**Error:** `Access to fetch at 'https://maayo-backend.onrender.com/api/escrow/release-milestone' from origin 'https://my-new-domain.com' has been blocked by CORS policy`

**Solution:**
1. Add `https://my-new-domain.com` to allowed origins
2. Deploy the updated backend
3. Test the request again

**Code Change:**
```javascript
const defaultOrigins = [
  // ... existing origins
  'https://my-new-domain.com'  // Add this line
]
```

This should resolve the CORS issue and allow your frontend to communicate with the backend.
