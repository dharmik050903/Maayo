# Google Sign-In Setup Instructions

## Issue Found
The Google sign-in button is not appearing because the Google Client ID is not configured.

## Solution

### Step 1: Create Environment File
Create a `.env` file in the `frontend` directory with the following content:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_actual_google_client_id_here

# API Configuration  
VITE_API_BASE_URL=http://localhost:5000/api

# Other environment variables
VITE_APP_NAME=Maayo
VITE_APP_VERSION=1.0.0
```

### Step 2: Get Google Client ID
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set Application type to "Web application"
6. Add authorized origins:
   - `http://localhost:5173` (for development)
   - `https://yourdomain.com` (for production)
7. Copy the Client ID and replace `your_actual_google_client_id_here` in the `.env` file

### Step 3: Restart Development Server
After creating the `.env` file, restart your development server:
```bash
npm run dev
```

### Step 4: Test
1. Go to the login page
2. Select a role (Client or Freelancer)
3. The Google sign-in button should now appear

## Current Status
- ✅ Google sign-in logic is implemented correctly
- ✅ Button rendering code is working
- ❌ Google Client ID is missing (causing the button not to appear)
- ✅ Fallback button is now visible when Google Client ID is not configured

## What I Fixed
1. **Removed `hidden` class** from fallback button so it's always visible
2. **Added proper error messages** when Google Client ID is not configured
3. **Improved error handling** for missing environment variables
4. **Made the button visible** even when Google Client ID is not set

The Google sign-in functionality is working correctly - it just needs the proper Google Client ID configuration.
