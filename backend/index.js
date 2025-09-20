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
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000')
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

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
  
    // Allow localhost and 127.0.0.1 for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true)
    }
    
    // Check against allowed origins
    if (allowedOrigins.includes(origin)) return callback(null, true)
    
    // Log the blocked origin for debugging
    console.log('CORS: Blocked origin:', origin)

    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','id','user_role','user_email','first_name','last_name']
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

httpServer.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
    console.log(`🔌 Socket.IO server initialized`);
    console.log(`🌐 CORS allowed origins:`, allowedOrigins.length > 0 ? allowedOrigins : 'All localhost origins allowed');
});
