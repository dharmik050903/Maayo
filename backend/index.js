import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connect from "./connection.js";
import router from "./router.js";
import http from "http";
import { initSocketServer } from "./services/socket.js";
import AdminAuth from "./controller/adminAuth.js";
import validateEnvironment from "./utils/validateEnvironment.js";

dotenv.config();

// Validate environment variables
validateEnvironment();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;  

// Configure CORS to allow specific frontend origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

// Default origins - always include these
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'https://maayo-frontend.vercel.app',
  'https://maayo.vercel.app',
  'https://maayo-alpha.vercel.app'
]

// Combine allowed origins with default origins
const finalOrigins = [...new Set([...allowedOrigins, ...defaultOrigins])]

app.use(cors({
  origin: function(origin, callback) {
    console.log('CORS request from origin:', origin)
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('CORS: Allowing request with no origin')
      return callback(null, true)
    }
  
    // Allow localhost and 127.0.0.1 for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      console.log('CORS: Allowing localhost/127.0.0.1 origin:', origin)
      return callback(null, true)
    }
    
    // Allow Vercel domains
    if (origin.includes('vercel.app')) {
      console.log('CORS: Allowing Vercel origin:', origin)
      return callback(null, true)
    }
    
    // Check against final origins list
    if (finalOrigins.includes(origin)) {
      console.log('CORS: Allowing origin from final list:', origin)
      return callback(null, true)
    }
    
    // Log the blocked origin for debugging
    console.log('CORS: Blocked origin:', origin)
    console.log('Final allowed origins:', finalOrigins)

    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','id','user_role','user_email','first_name','last_name'],
  optionsSuccessStatus: 200
}));

// Handle preflight OPTIONS requests
app.options('*', (req, res) => {
  console.log('OPTIONS request for:', req.path)
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, id, user_role, user_email, first_name, last_name')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.sendStatus(200)
})

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connect();  

// Initialize predefined admin accounts on server startup
const initializeAdminAccounts = async () => {
    try {
        console.log('🔧 Initializing predefined admin accounts...');
        const adminAuthController = new AdminAuth();
        const result = await adminAuthController.createPredefinedAdmins();
        if (result.created.length > 0) {
            console.log(`✅ Created ${result.created.length} new admin accounts: ${result.created.join(', ')}`);
        }
        if (result.existing.length > 0) {
            console.log(`ℹ️ ${result.existing.length} admin accounts already exist: ${result.existing.join(', ')}`);
        }
        console.log('🎉 Admin account initialization completed');
    } catch (error) {
        console.error('❌ Error initializing admin accounts:', error);
    }
};

// Call initialization after database connection
setTimeout(initializeAdminAccounts, 2000); // Wait 2 seconds for DB to fully connect  

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
    console.log(`🌐 CORS allowed origins:`, finalOrigins);
});
