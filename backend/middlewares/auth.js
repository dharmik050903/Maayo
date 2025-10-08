import jwt from 'jsonwebtoken';

export default function auth(req, res, next) {
  // Skip authentication for OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.jwt_secret);
    req.user = decoded;
    
    // Extract user info from JWT token and set in headers for controllers
    req.headers.id = decoded.id;
    req.headers.user_role = decoded.role;
    req.headers.user_email = decoded.email;
    req.headers.first_name = decoded.username?.split(' ')[0] || '';
    req.headers.last_name = decoded.username?.split(' ').slice(1).join(' ') || '';
    
    next();
  } catch (ex) {
    res.status(400).json({ error: 'Invalid token.' });
  }
}