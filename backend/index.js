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

// AWS-specific origins (add your AWS domains here)
const awsOrigins = [
  // Add your AWS CloudFront domains
  // 'https://your-domain.com',
  // 'https://www.your-domain.com',
  // 'https://your-cloudfront-domain.cloudfront.net',
  // 'https://your-s3-bucket.s3-website-us-east-1.amazonaws.com'
]

// Combine allowed origins with default origins and AWS origins
const finalOrigins = [...new Set([...allowedOrigins, ...defaultOrigins, ...awsOrigins])]

app.use(cors({
  origin: function(origin, callback) {
    console.log('CORS request from origin:', origin)
    console.log('Request headers:', {
      origin: origin,
      userAgent: 'N/A', // We can't access req here
      referer: 'N/A'
    })
    
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
    
    // Allow AWS CloudFront domains
    if (origin.includes('cloudfront.net') || origin.includes('amazonaws.com')) {
      console.log('CORS: Allowing AWS origin:', origin)
      return callback(null, true)
    }
    
    // Allow Vercel domains
    if (origin.includes('vercel.app')) {
      console.log('CORS: Allowing Vercel origin:', origin)
      return callback(null, true)
    }
    
    // Allow Render domains (for your backend)
    if (origin.includes('render.com') || origin.includes('onrender.com')) {
      console.log('CORS: Allowing Render origin:', origin)
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
    console.log('Available origins check:', {
      isLocalhost: origin.includes('localhost'),
      is127: origin.includes('127.0.0.1'),
      isCloudfront: origin.includes('cloudfront.net'),
      isAws: origin.includes('amazonaws.com'),
      isVercel: origin.includes('vercel.app'),
      isRender: origin.includes('render.com') || origin.includes('onrender.com'),
      inFinalList: finalOrigins.includes(origin)
    })

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
  console.log('OPTIONS headers:', {
    origin: req.headers.origin,
    'access-control-request-method': req.headers['access-control-request-method'],
    'access-control-request-headers': req.headers['access-control-request-headers']
  })
  
  // Set CORS headers for preflight requests
  const origin = req.headers.origin
  if (origin && (origin.includes('vercel.app') || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, id, user_role, user_email, first_name, last_name')
    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('Access-Control-Max-Age', '86400') // Cache preflight for 24 hours
    console.log('✅ CORS headers set for OPTIONS request from:', origin)
  } else {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, id, user_role, user_email, first_name, last_name')
    console.log('⚠️ CORS headers set with wildcard for OPTIONS request from:', origin)
  }
  
  res.sendStatus(200)
})

// CORS debugging middleware
app.use((req, res, next) => {
  console.log('Request details:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer,
    host: req.headers.host
  })
  
  // Ensure CORS headers are set on all responses
  const origin = req.headers.origin
  if (origin && (origin.includes('vercel.app') || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Credentials', 'true')
    console.log('✅ CORS headers set for request from:', origin)
  }
  
  next()
})

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Backend server is running',
    cors: {
      origin: req.headers.origin,
      allowed: req.headers.origin && (req.headers.origin.includes('vercel.app') || req.headers.origin.includes('localhost'))
    }
  })
})

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
