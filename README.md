# Maayo - Freelancing Platform

This repository contains the source code for the Maayo freelancing platform, structured as a monorepo with a React frontend and a Node.js (Express) backend.

## Project Structure

```
Maayo/
├── backend/      # Node.js, Express, MongoDB API
├── frontend/     # React, Vite, TailwindCSS UI
└── README.md     # This file
```

---

## Backend Setup

The backend is a Node.js application using Express and Mongoose.

### 1. Navigate to the backend directory

```bash
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Environment Variables

Create a `.env` file in the `backend/` directory and add the following variables.

```env
# Server Configuration
PORT=5000

# Database Configuration (replace with your MongoDB connection string)
MONGODB_URI=mongodb://localhost:27017/maayo

# JWT Configuration (use a long, random, secure string)
JWT_SECRET=your_super_secret_jwt_key

# Email Configuration (for OTP functionality)
# For Gmail, you need to enable 2-factor auth and create an App Password.
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=your_email@gmail.com
```

### 4. Start the backend server

```bash
npm start
```

The server will be running at `http://localhost:5000`.

---

## Frontend Setup

The frontend is a React application built with Vite.

### 1. Navigate to the frontend directory

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the frontend development server

```bash
npm run dev
```

The application will open in your browser at `http://localhost:5173`.