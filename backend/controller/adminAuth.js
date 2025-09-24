import Admin from "../schema/admin.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../middlewares/token.js";

export default class AdminAuth {
    // Admin Login
    async adminLogin(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Email and password are required" 
                });
            }

            // Find admin and check if active
            const admin = await Admin.findOne({ email, status: 1 });
            if (!admin) {
                return res.status(401).json({ 
                    status: false, 
                    message: "Invalid credentials or account inactive" 
                });
            }

            // Check if account is locked
            if (admin.isLocked) {
                return res.status(423).json({ 
                    status: false, 
                    message: "Account temporarily locked due to multiple failed login attempts" 
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, admin.password);
            if (!isPasswordValid) {
                // Increment login attempts
                admin.loginAttempts += 1;
                if (admin.loginAttempts >= 5) {
                    admin.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
                }
                await admin.save();
                return res.status(401).json({ 
                    status: false, 
                    message: "Invalid credentials" 
                });
            }

            // Reset login attempts on successful login
            admin.loginAttempts = 0;
            admin.lockUntil = undefined;
            admin.last_login = new Date().toISOString();
            await admin.save();

            // Generate JWT token
            const token = generateToken({
                id: String(admin._id),
                username: admin.name,
                role: 'admin',
                admin_role: admin.role,
                email: admin.email,
                permissions: admin.permissions
            });

            res.json({
                status: true,
                message: 'Admin login successful',
                token,
                admin: {
                    _id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                    permissions: admin.permissions,
                    profile_pic: admin.profile_pic,
                    phone: admin.phone,
                    last_login: admin.last_login
                }
            });
        } catch (error) {
            console.error("Error during admin login:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Admin login failed", 
                error: error.message 
            });
        }
    }

    // Create Super Admin (One-time setup)
    async createSuperAdmin(req, res) {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Name, email, and password are required" 
                });
            }

            // Check if super admin already exists
            const existingAdmin = await Admin.findOne({ role: 'super_admin' });
            if (existingAdmin) {
                return res.status(400).json({ 
                    status: false, 
                    message: 'Super admin already exists' 
                });
            }

            // Check if email already exists
            const existingEmail = await Admin.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({ 
                    status: false, 
                    message: 'Email already exists' 
                });
            }

            const hashedPassword = await bcrypt.hash(password, 12);

            const superAdmin = new Admin({
                name,
                email,
                password: hashedPassword,
                role: 'super_admin',
                permissions: {
                    users: { view: true, edit: true, delete: true, suspend: true },
                    freelancers: { view: true, edit: true, delete: true, approve: true, suspend: true },
                    projects: { view: true, edit: true, delete: true, moderate: true },
                    bids: { view: true, moderate: true, delete: true },
                    payments: { view: true, refund: true, disputes: true },
                    analytics: { view: true, export: true }
                },
                status: 1
            });

            await superAdmin.save();

            // Create predefined admin accounts
            await this.createPredefinedAdmins();

            res.json({
                status: true,
                message: 'Super admin created successfully',
                data: {
                    adminId: superAdmin._id,
                    name: superAdmin.name,
                    email: superAdmin.email,
                    role: superAdmin.role
                }
            });
        } catch (error) {
            console.error("Error creating super admin:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to create super admin", 
                error: error.message 
            });
        }
    }

    // Create predefined admin accounts
    async createPredefinedAdmins(req, res) {
        try {
            const predefinedAdmins = [
                {
                    name: 'Master Admin',
                    email: 'master@maayo.com',
                    password: 'MasterAdmin@123',
                    role: 'super_admin',
                    permissions: {
                        users: { view: true, edit: true, delete: true, suspend: true },
                        freelancers: { view: true, edit: true, delete: true, approve: true, suspend: true },
                        projects: { view: true, edit: true, delete: true, moderate: true },
                        bids: { view: true, moderate: true, delete: true },
                        payments: { view: true, refund: true, disputes: true },
                        analytics: { view: true, export: true }
                    }
                },
                {
                    name: 'Content Admin',
                    email: 'content@maayo.com',
                    password: 'ContentAdmin@123',
                    role: 'admin',
                    permissions: {
                        users: { view: true, edit: true, delete: false, suspend: false },
                        freelancers: { view: true, edit: true, delete: false, approve: true, suspend: false },
                        projects: { view: true, edit: true, delete: true, moderate: true },
                        bids: { view: true, moderate: true, delete: true },
                        payments: { view: true, refund: false, disputes: false },
                        analytics: { view: true, export: false }
                    }
                },
                {
                    name: 'Support Admin',
                    email: 'support@maayo.com',
                    password: 'SupportAdmin@123',
                    role: 'moderator',
                    permissions: {
                        users: { view: true, edit: false, delete: false, suspend: false },
                        freelancers: { view: true, edit: false, delete: false, approve: false, suspend: false },
                        projects: { view: true, edit: false, delete: false, moderate: false },
                        bids: { view: true, moderate: false, delete: false },
                        payments: { view: true, refund: false, disputes: false },
                        analytics: { view: true, export: false }
                    }
                }
            ];

            let created = [];
            let existing = [];

            for (const adminData of predefinedAdmins) {
                // Check if admin already exists
                const existingAdmin = await Admin.findOne({ email: adminData.email });
                if (!existingAdmin) {
                    // Hash password
                    const hashedPassword = await bcrypt.hash(adminData.password, 12);
                    
                    const admin = new Admin({
                        ...adminData,
                        password: hashedPassword,
                        status: 1
                    });
                    
                    await admin.save();
                    created.push(adminData.email);
                    console.log(`Predefined admin created: ${adminData.email}`);
                } else {
                    existing.push(adminData.email);
                }
            }

            if (res) {
                res.json({
                    status: true,
                    message: 'Predefined admin accounts bootstrap completed',
                    created: created,
                    existing: existing,
                    total: predefinedAdmins.length
                });
            }

            return { created, existing };
        } catch (error) {
            console.error('Error creating predefined admins:', error);
            if (res) {
                return res.status(500).json({ 
                    status: false, 
                    message: "Failed to create predefined admin accounts", 
                    error: error.message 
                });
            }
            throw error;
        }
    }

    // Change Admin Password
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const adminId = req.user.id;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Current password and new password are required" 
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ 
                    status: false, 
                    message: "New password must be at least 6 characters long" 
                });
            }

            const admin = await Admin.findById(adminId);
            if (!admin) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Admin not found" 
                });
            }

            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Current password is incorrect" 
                });
            }

            admin.password = await bcrypt.hash(newPassword, 12);
            admin.lastPasswordChange = new Date().toISOString();
            await admin.save();

            res.json({ 
                status: true, 
                message: 'Password changed successfully' 
            });
        } catch (error) {
            console.error("Error changing admin password:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to change password", 
                error: error.message 
            });
        }
    }

    // Get Admin Profile
    async getAdminProfile(req, res) {
        try {
            const adminId = req.user.id;

            const admin = await Admin.findById(adminId)
                .select('-password -loginAttempts -lockUntil')
                .populate('createdBy', 'name email');

            if (!admin) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Admin not found" 
                });
            }

            res.json({
                status: true,
                message: 'Admin profile retrieved successfully',
                data: admin
            });
        } catch (error) {
            console.error("Error getting admin profile:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to get admin profile", 
                error: error.message 
            });
        }
    }

    // Update Admin Profile
    async updateAdminProfile(req, res) {
        try {
            const adminId = req.user.id;
            const { name, phone, profile_pic } = req.body;

            const admin = await Admin.findById(adminId);
            if (!admin) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Admin not found" 
                });
            }

            if (name) admin.name = name;
            if (phone) admin.phone = phone;
            if (profile_pic) admin.profile_pic = profile_pic;

            await admin.save();

            res.json({ 
                status: true, 
                message: 'Admin profile updated successfully',
                data: {
                    _id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    phone: admin.phone,
                    profile_pic: admin.profile_pic,
                    role: admin.role
                }
            });
        } catch (error) {
            console.error("Error updating admin profile:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to update admin profile", 
                error: error.message 
            });
        }
    }

    // Admin Logout (just for logging purposes)
    async adminLogout(req, res) {
        try {
            const adminId = req.user.id;

            // Update last login time for tracking
            await Admin.findByIdAndUpdate(adminId, { 
                last_login: new Date().toISOString() 
            });

            res.json({ 
                status: true, 
                message: 'Admin logged out successfully' 
            });
        } catch (error) {
            console.error("Error during admin logout:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Admin logout failed", 
                error: error.message 
            });
        }
    }
}