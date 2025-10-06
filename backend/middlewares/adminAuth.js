import jwt from "jsonwebtoken";
import Admin from "../schema/admin.js";

const adminAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                status: false, 
                message: 'Access denied. No token provided.' 
            });
        }

        const decoded = jwt.verify(token, process.env.jwt_secret);
        console.log('🔍 Admin Auth Debug - Decoded token:', {
            id: decoded.id,
            role: decoded.role,
            admin_role: decoded.admin_role,
            email: decoded.email
        });
        
        // Check if this is an admin token
        if (decoded.role !== 'admin' || !decoded.admin_role) {
            console.log('❌ Admin Auth Debug - Token validation failed:', {
                role: decoded.role,
                admin_role: decoded.admin_role,
                expected_role: 'admin'
            });
            return res.status(401).json({ 
                status: false, 
                message: 'Access denied. Admin privileges required.' 
            });
        }

        const admin = await Admin.findById(decoded.id).select('-password');
        if (!admin || admin.status !== 1) {
            console.log('❌ Admin Auth Debug - Admin not found or inactive:', {
                adminId: decoded.id,
                found: !!admin,
                status: admin?.status
            });
            return res.status(401).json({ 
                status: false, 
                message: 'Access denied. Admin not found or inactive.' 
            });
        }

        // Check if account is locked
        if (admin.isLocked) {
            return res.status(423).json({ 
                status: false, 
                message: 'Account temporarily locked.' 
            });
        }

        console.log('✅ Admin Auth Debug - Authentication successful:', {
            adminId: admin._id,
            adminName: admin.name,
            adminRole: admin.role
        });

        req.user = {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: 'admin',
            admin_role: admin.role,
            permissions: admin.permissions
        };
        
        next();
    } catch (error) {
        console.error("❌ Admin auth error:", error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                status: false, 
                message: 'Access denied. Invalid token.' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                status: false, 
                message: 'Access denied. Token expired.' 
            });
        }
        return res.status(500).json({ 
            status: false, 
            message: 'Server error during authentication.' 
        });
    }
};

const checkPermission = (resource, action) => {
    return (req, res, next) => {
        // For job permissions, provide default permissions if not set
        if (resource === 'jobs' && (!req.user.permissions || !req.user.permissions[resource])) {
            console.log('⚠️ Job permissions not found, providing default permissions');
            if (!req.user.permissions) req.user.permissions = {};
            req.user.permissions.jobs = {
                view: true,
                edit: true,
                delete: true,
                block: true,
                moderate: true
            };
        }

        if (!req.user.permissions[resource] || !req.user.permissions[resource][action]) {
            return res.status(403).json({ 
                status: false, 
                message: `Access denied. Insufficient permissions for ${resource}.${action}` 
            });
        }
        next();
    };
};

const superAdminOnly = (req, res, next) => {
    if (req.user.admin_role !== 'super_admin') {
        return res.status(403).json({ 
            status: false, 
            message: 'Access denied. Super admin privileges required.' 
        });
    }
    next();
};

const moderatorOrAbove = (req, res, next) => {
    if (!['super_admin', 'admin', 'moderator'].includes(req.user.admin_role)) {
        return res.status(403).json({ 
            status: false, 
            message: 'Access denied. Moderator privileges or above required.' 
        });
    }
    next();
};

export { adminAuth, checkPermission, superAdminOnly, moderatorOrAbove };