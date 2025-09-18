import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connect from "./connection.js";
import router from "./router.js";
import http from "http";
import { initSocketServer } from "./services/socket.js";
dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;  

// Configure CORS to allow specific frontend origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

// Default origins if none specified in environment
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://maayo-frontend.vercel.app',
  'https://maayo.vercel.app'
]

const finalOrigins = allowedOrigins.length > 0 ? allowedOrigins : defaultOrigins

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true) // mobile apps, curl, same-origin
    if (finalOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','user_role','user_email','id']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connect();  

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api',router)

// Initialize Socket.IO using the same CORS allowlist
const io = initSocketServer(httpServer, finalOrigins);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for origins: ${finalOrigins.join(', ')}`);
})