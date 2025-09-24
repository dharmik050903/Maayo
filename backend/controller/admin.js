import Admin from "../schema/admin.js";
import PersonMaster from "../schema/PersonMaster.js";
import FreelancerInfo from "../schema/freelancerInfo.js";
import ProjectInfo from "../schema/projectinfo.js";
import Bid from "../schema/bid.js";
import Review from "../schema/review.js";
import PaymentHistory from "../schema/paymenthistory.js";
import PermissionRequest from "../schema/permissionRequest.js";
import bcrypt from "bcryptjs";

export default class AdminController {
    // Dashboard Statistics
    async getDashboardStats(req, res) {
        try {
            console.log('📊 Starting dashboard stats fetch...');
            
            // Get basic counts first
            let totalUsers = 0, totalFreelancers = 0, totalClients = 0;
            let totalProjects = 0, activeProjects = 0, completedProjects = 0;
            let totalBids = 0, totalPayments = 0;
            
            try {
                totalUsers = await PersonMaster.countDocuments({ status: 1 }) || 0;
                console.log('✅ Total users:', totalUsers);
            } catch (err) {
                console.log('❌ Error fetching totalUsers:', err.message);
            }

            try {
                totalFreelancers = await PersonMaster.countDocuments({ user_type: 'freelancer', status: 1 }) || 0;
                console.log('✅ Total freelancers:', totalFreelancers);
            } catch (err) {
                console.log('❌ Error fetching totalFreelancers:', err.message);
            }

            try {
                totalClients = await PersonMaster.countDocuments({ user_type: 'client', status: 1 }) || 0;
                console.log('✅ Total clients:', totalClients);
            } catch (err) {
                console.log('❌ Error fetching totalClients:', err.message);
            }

            try {
                totalProjects = await ProjectInfo.countDocuments() || 0;
                console.log('✅ Total projects:', totalProjects);
            } catch (err) {
                console.log('❌ Error fetching totalProjects:', err.message);
            }

            try {
                activeProjects = await ProjectInfo.countDocuments({ isactive: 1 }) || 0;
                console.log('✅ Active projects:', activeProjects);
            } catch (err) {
                console.log('❌ Error fetching activeProjects:', err.message);
            }

            try {
                completedProjects = await ProjectInfo.countDocuments({ iscompleted: 1 }) || 0;
                console.log('✅ Completed projects:', completedProjects);
            } catch (err) {
                console.log('❌ Error fetching completedProjects:', err.message);
            }

            try {
                totalBids = await Bid.countDocuments() || 0;
                console.log('✅ Total bids:', totalBids);
            } catch (err) {
                console.log('❌ Error fetching totalBids:', err.message);
            }

            try {
                totalPayments = await PaymentHistory.countDocuments() || 0;
                console.log('✅ Total payments:', totalPayments);
            } catch (err) {
                console.log('❌ Error fetching totalPayments:', err.message);
            }

            // Get recent activity
            let recentUsers = [], recentProjects = [], recentBids = [];

            try {
                recentUsers = await PersonMaster.find({ status: 1 })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .select('first_name last_name email user_type createdAt')
                    .lean() || [];
                console.log('✅ Recent users count:', recentUsers.length);
            } catch (err) {
                console.log('❌ Error fetching recentUsers:', err.message);
            }

            try {
                recentProjects = await ProjectInfo.find()
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .populate('personid', 'first_name last_name')
                    .select('title description budget status createdAt')
                    .lean() || [];
                console.log('✅ Recent projects count:', recentProjects.length);
            } catch (err) {
                console.log('❌ Error fetching recentProjects:', err.message);
            }

            try {
                recentBids = await Bid.find()
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .populate('freelancer_id', 'first_name last_name')
                    .populate('project_id', 'title')
                    .lean() || [];
                console.log('✅ Recent bids count:', recentBids.length);
            } catch (err) {
                console.log('❌ Error fetching recentBids:', err.message);
            }

            const stats = {
                overview: {
                    totalUsers: totalUsers,
                    totalFreelancers: totalFreelancers,
                    totalClients: totalClients,
                    totalProjects: totalProjects,
                    activeProjects: activeProjects,
                    completedProjects: completedProjects,
                    totalBids: totalBids,
                    totalPayments: totalPayments
                },
                recentActivity: {
                    users: recentUsers,
                    projects: recentProjects,
                    bids: recentBids
                }
            };

            console.log('✅ Final stats object:', JSON.stringify(stats, null, 2));

            res.json({ 
                status: true, 
                message: 'Dashboard stats retrieved successfully',
                data: stats 
            });
        } catch (error) {
            console.error("❌ Critical error in getDashboardStats:", error);
            console.error("❌ Stack trace:", error.stack);
            
            const fallbackStats = {
                overview: {
                    totalUsers: 0,
                    totalFreelancers: 0,
                    totalClients: 0,
                    totalProjects: 0,
                    activeProjects: 0,
                    completedProjects: 0,
                    totalBids: 0,
                    totalPayments: 0
                },
                recentActivity: {
                    users: [],
                    projects: [],
                    bids: []
                }
            };
            
            res.json({ 
                status: false, 
                message: 'Dashboard stats failed, using fallback data',
                data: fallbackStats,
                error: error.message
            });
        }
    }

    // User Management
    async getUsers(req, res) {
        try {
            const { page = 1, limit = 10, search = '', status = 'all', user_type = 'all' } = req.body;
            
            let query = {};
            
            if (search) {
                query.$or = [
                    { first_name: { $regex: search, $options: 'i' } },
                    { last_name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }
            
            if (status !== 'all') {
                query.status = parseInt(status);
            }

            if (user_type !== 'all') {
                query.user_type = user_type;
            }

            const users = await PersonMaster.find(query)
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .select('-password');

            // Add is_suspended field for frontend compatibility
            const usersWithSuspensionStatus = users.map(user => {
                const userObj = user.toObject();
                userObj.is_suspended = userObj.status === 0;
                return userObj;
            });

            const total = await PersonMaster.countDocuments(query);

            res.json({
                status: true,
                message: 'Users retrieved successfully',
                data: usersWithSuspensionStatus,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            console.error("Error fetching users:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to fetch users", 
                error: error.message 
            });
        }
    }

    async suspendUser(req, res) {
        try {
            const { userId, reason, duration } = req.body;

            if (!userId) {
                return res.status(400).json({ 
                    status: false, 
                    message: "User ID is required" 
                });
            }

            const user = await PersonMaster.findById(userId);
            if (!user) {
                return res.status(404).json({ 
                    status: false, 
                    message: 'User not found' 
                });
            }

            user.status = 0; // Inactive
            user.is_suspended = true;
            user.suspensionReason = reason;
            user.suspensionDuration = duration;
            user.suspendedAt = new Date().toISOString();
            user.suspendedBy = req.user.id;

            await user.save();

            res.json({ 
                status: true, 
                message: 'User suspended successfully' 
            });
        } catch (error) {
            console.error("Error suspending user:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to suspend user", 
                error: error.message 
            });
        }
    }

    async activateUser(req, res) {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ 
                    status: false, 
                    message: "User ID is required" 
                });
            }

            const user = await PersonMaster.findById(userId);
            if (!user) {
                return res.status(404).json({ 
                    status: false, 
                    message: 'User not found' 
                });
            }

            user.status = 1; // Active
            user.is_suspended = false;
            user.suspensionReason = undefined;
            user.suspensionDuration = undefined;
            user.suspendedAt = undefined;
            user.suspendedBy = undefined;

            await user.save();

            res.json({ 
                status: true, 
                message: 'User unsuspended successfully' 
            });
        } catch (error) {
            console.error("Error activating user:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to activate user", 
                error: error.message 
            });
        }
    }

    async deleteUser(req, res) {
        try {
            const { userId, reason } = req.body;
            
            // Check permissions
            if (!req.user.permissions.users.delete) {
                return res.status(403).json({ 
                    status: false, 
                    message: 'Insufficient permissions' 
                });
            }

            if (!userId) {
                return res.status(400).json({ 
                    status: false, 
                    message: "User ID is required" 
                });
            }

            // Soft delete - just mark as deleted
            const user = await PersonMaster.findByIdAndUpdate(userId, { 
                status: 0,
                isDeleted: true,
                deletedAt: new Date().toISOString(),
                deletedBy: req.user.id,
                deletionReason: reason
            });

            if (!user) {
                return res.status(404).json({ 
                    status: false, 
                    message: 'User not found' 
                });
            }

            res.json({ 
                status: true, 
                message: 'User deleted successfully' 
            });
        } catch (error) {
            console.error("Error deleting user:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to delete user", 
                error: error.message 
            });
        }
    }

    // Freelancer Management
    async getFreelancers(req, res) {
        try {
            console.log('📋 Fetching freelancers...');
            const { page = 1, limit = 10, search = '', approval = 'all', status = 'all' } = req.body;
            
            let query = { user_type: 'freelancer' };
            
            // Add search functionality
            if (search) {
                query.$or = [
                    { first_name: { $regex: search, $options: 'i' } },
                    { last_name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { personName: { $regex: search, $options: 'i' } }
                ];
            }
            
            // Add status filter
            if (status !== 'all') {
                query.status = parseInt(status);
            }

            console.log('🔍 Freelancer query:', JSON.stringify(query, null, 2));

            // Get freelancers from PersonMaster and try to join with FreelancerInfo
            const freelancers = await PersonMaster.aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: 'tblfreelancerinfos', // FreelancerInfo collection name
                        localField: '_id',
                        foreignField: 'personid',
                        as: 'freelancerProfile'
                    }
                },
                {
                    $addFields: {
                        hasProfile: { $gt: [{ $size: '$freelancerProfile' }, 0] },
                        profileData: { $arrayElemAt: ['$freelancerProfile', 0] }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        first_name: 1,
                        last_name: 1,
                        personName: 1,
                        email: 1,
                        contact_number: 1,
                        country: 1,
                        profile_pic: 1,
                        status: 1,
                        email_verified: 1,
                        phone_verified: 1,
                        createdAt: 1,
                        last_login: 1,
                        user_type: 1,
                        hasProfile: 1,
                        skills: '$profileData.skills',
                        experience: '$profileData.experience',
                        hourlyRate: '$profileData.hourlyRate',
                        bio: '$profileData.bio',
                        portfolio: '$profileData.portfolio',
                        approvalStatus: '$profileData.approvalStatus'
                    }
                },
                { $sort: { createdAt: -1 } },
                { $skip: (page - 1) * limit },
                { $limit: parseInt(limit) }
            ]);

            const total = await PersonMaster.countDocuments(query);

            console.log('✅ Found freelancers:', freelancers.length, 'Total:', total);

            res.json({
                status: true,
                message: 'Freelancers retrieved successfully',
                data: freelancers,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            console.error("❌ Error fetching freelancers:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to fetch freelancers", 
                error: error.message 
            });
        }
    }

    async approveFreelancer(req, res) {
        try {
            const { freelancerId, status, reason } = req.body;

            if (!freelancerId || !status) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Freelancer ID and status are required" 
                });
            }

            const freelancer = await FreelancerInfo.findById(freelancerId);
            if (!freelancer) {
                return res.status(404).json({ 
                    status: false, 
                    message: 'Freelancer not found' 
                });
            }

            freelancer.approvalStatus = status;
            freelancer.approvalDate = new Date().toISOString();
            freelancer.approvedBy = req.user.id;
            if (reason) freelancer.approvalReason = reason;

            await freelancer.save();

            res.json({ 
                status: true, 
                message: `Freelancer ${status} successfully` 
            });
        } catch (error) {
            console.error("Error approving freelancer:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to approve freelancer", 
                error: error.message 
            });
        }
    }

    // Project Management
    async getProjects(req, res) {
        try {
            const { page = 1, limit = 10, search = '', status = 'all', category = 'all' } = req.body;
            
            let query = {};
            
            if (search) {
                query.$or = [
                    { project_title: { $regex: search, $options: 'i' } },
                    { project_description: { $regex: search, $options: 'i' } },
                    { category: { $regex: search, $options: 'i' } }
                ];
            }
            
            if (status === 'active') {
                query.isactive = 1;
            } else if (status === 'completed') {
                query.iscompleted = 1;
            } else if (status === 'pending') {
                query.ispending = 1;
            }
            
            if (category !== 'all') {
                query.category = category;
            }

            const projects = await ProjectInfo.find(query)
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .populate('personid', 'first_name last_name email');

            const total = await ProjectInfo.countDocuments(query);

            res.json({
                status: true,
                message: 'Projects retrieved successfully',
                data: projects,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            console.error("Error fetching projects:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to fetch projects", 
                error: error.message 
            });
        }
    }

    async deleteProject(req, res) {
        try {
            const { projectId, reason } = req.body;

            if (!req.user.permissions.projects.delete) {
                return res.status(403).json({ 
                    status: false, 
                    message: 'Insufficient permissions' 
                });
            }

            if (!projectId) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Project ID is required" 
                });
            }

            const project = await ProjectInfo.findById(projectId);
            if (!project) {
                return res.status(404).json({ 
                    status: false, 
                    message: 'Project not found' 
                });
            }

            // Soft delete
            project.isDeleted = true;
            project.deletedAt = new Date().toISOString();
            project.deletedBy = req.user.id;
            project.deletionReason = reason;

            await project.save();

            res.json({ 
                status: true, 
                message: 'Project deleted successfully' 
            });
        } catch (error) {
            console.error("Error deleting project:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to delete project", 
                error: error.message 
            });
        }
    }

    // Admin Management (Super Admin only)
    async getAdmins(req, res) {
        try {
            if (req.user.admin_role !== 'super_admin') {
                return res.status(403).json({ 
                    status: false, 
                    message: 'Access denied. Super admin only.' 
                });
            }

            const admins = await Admin.find({ _id: { $ne: req.user.id } })
                .select('-password -loginAttempts -lockUntil')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 });

            res.json({ 
                status: true, 
                message: 'Admins retrieved successfully',
                data: admins 
            });
        } catch (error) {
            console.error("Error fetching admins:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to fetch admins", 
                error: error.message 
            });
        }
    }

    async createAdmin(req, res) {
        try {
            if (req.user.admin_role !== 'super_admin') {
                return res.status(403).json({ 
                    status: false, 
                    message: 'Access denied. Super admin only.' 
                });
            }

            const { name, email, password, role, permissions } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Name, email, and password are required" 
                });
            }

            const existingAdmin = await Admin.findOne({ email });
            if (existingAdmin) {
                return res.status(400).json({ 
                    status: false, 
                    message: 'Admin with this email already exists' 
                });
            }

            const hashedPassword = await bcrypt.hash(password, 12);

            const admin = new Admin({
                name,
                email,
                password: hashedPassword,
                role: role || 'admin',
                permissions: permissions || {},
                createdBy: req.user.id,
                status: 1
            });

            await admin.save();

            res.json({ 
                status: true, 
                message: 'Admin created successfully',
                data: {
                    _id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                    permissions: admin.permissions
                }
            });
        } catch (error) {
            console.error("Error creating admin:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to create admin", 
                error: error.message 
            });
        }
    }

    // Helper methods
    async getUserGrowthData() {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        return await PersonMaster.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo.toISOString() } } },
            {
                $group: {
                    _id: {
                        year: { $year: { $dateFromString: { dateString: "$createdAt" } } },
                        month: { $month: { $dateFromString: { dateString: "$createdAt" } } }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
    }

    async getProjectStatsData() {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        return await ProjectInfo.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo.toISOString() } } },
            {
                $group: {
                    _id: {
                        year: { $year: { $dateFromString: { dateString: "$createdAt" } } },
                        month: { $month: { $dateFromString: { dateString: "$createdAt" } } }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
    }

    // Bid Management
    async getBids(req, res) {
        try {
            const { page = 1, limit = 10, search = '', status = 'all' } = req.body;
            
            let query = {};
            
            if (search) {
                // Add search logic for bids
            }
            
            if (status !== 'all') {
                query.status = status;
            }

            const bids = await Bid.find(query)
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .populate('freelancer_id', 'first_name last_name')
                .populate('project_id', 'project_title');

            const total = await Bid.countDocuments(query);

            res.json({
                status: true,
                message: 'Bids retrieved successfully',
                data: bids,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            console.error("Error fetching bids:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to fetch bids", 
                error: error.message 
            });
        }
    }

    // Payment Management
    async getPayments(req, res) {
        try {
            const { page = 1, limit = 10, search = '', status = 'all' } = req.body;
            
            let query = {};
            
            if (search) {
                // Add search logic for payments
            }
            
            if (status !== 'all') {
                query.status = status;
            }

            const payments = await PaymentHistory.find(query)
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await PaymentHistory.countDocuments(query);

            res.json({
                status: true,
                message: 'Payments retrieved successfully',
                data: payments,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            console.error("Error fetching payments:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to fetch payments", 
                error: error.message 
            });
        }
    }

    // Bid Management Methods
    async deleteBid(req, res) {
        try {
            const { bidId, reason } = req.body;

            if (!bidId) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Bid ID is required" 
                });
            }

            const bid = await Bid.findById(bidId);
            if (!bid) {
                return res.status(404).json({ 
                    status: false, 
                    message: 'Bid not found' 
                });
            }

            // Soft delete
            bid.isDeleted = true;
            bid.deletedAt = new Date().toISOString();
            bid.deletedBy = req.user.id;
            bid.deletionReason = reason;

            await bid.save();

            res.json({ 
                status: true, 
                message: 'Bid deleted successfully' 
            });
        } catch (error) {
            console.error("❌ Error deleting bid:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to delete bid", 
                error: error.message 
            });
        }
    }

    // Payment Management Methods  
    async deletePayment(req, res) {
        try {
            const { paymentId, reason } = req.body;

            if (!paymentId) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Payment ID is required" 
                });
            }

            const payment = await PaymentHistory.findById(paymentId);
            if (!payment) {
                return res.status(404).json({ 
                    status: false, 
                    message: 'Payment not found' 
                });
            }

            // Soft delete
            payment.isDeleted = true;
            payment.deletedAt = new Date().toISOString();
            payment.deletedBy = req.user.id;
            payment.deletionReason = reason;

            await payment.save();

            res.json({ 
                status: true, 
                message: 'Payment record deleted successfully' 
            });
        } catch (error) {
            console.error("❌ Error deleting payment:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to delete payment", 
                error: error.message 
            });
        }
    }

    // Project Update Methods
    async updateProject(req, res) {
        try {
            const { projectId, updates } = req.body;

            if (!projectId) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Project ID is required" 
                });
            }

            const project = await ProjectInfo.findById(projectId);
            if (!project) {
                return res.status(404).json({ 
                    status: false, 
                    message: 'Project not found' 
                });
            }

            // Update allowed fields
            const allowedUpdates = ['title', 'description', 'budget', 'status', 'skills', 'deadline', 'isactive', 'iscompleted'];
            const updateData = {};
            
            allowedUpdates.forEach(field => {
                if (updates[field] !== undefined) {
                    updateData[field] = updates[field];
                }
            });

            updateData.updatedAt = new Date().toISOString();
            updateData.updatedBy = req.user.id;

            const updatedProject = await ProjectInfo.findByIdAndUpdate(
                projectId, 
                updateData, 
                { new: true, runValidators: true }
            ).populate('personid', 'first_name last_name email');

            res.json({ 
                status: true, 
                message: 'Project updated successfully',
                data: updatedProject
            });
        } catch (error) {
            console.error("❌ Error updating project:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to update project", 
                error: error.message 
            });
        }
    }

    // User Update Methods
    async updateUser(req, res) {
        try {
            const { userId, updates } = req.body;

            if (!userId) {
                return res.status(400).json({ 
                    status: false, 
                    message: "User ID is required" 
                });
            }

            const user = await PersonMaster.findById(userId);
            if (!user) {
                return res.status(404).json({ 
                    status: false, 
                    message: 'User not found' 
                });
            }

            // Update allowed fields
            const allowedUpdates = ['first_name', 'last_name', 'personName', 'contact_number', 'country', 'status', 'email_verified', 'phone_verified'];
            const updateData = {};
            
            allowedUpdates.forEach(field => {
                if (updates[field] !== undefined) {
                    updateData[field] = updates[field];
                }
            });

            updateData.updatedAt = new Date().toISOString();
            updateData.updatedBy = req.user.id;

            const updatedUser = await PersonMaster.findByIdAndUpdate(
                userId, 
                updateData, 
                { new: true, runValidators: true }
            );

            res.json({ 
                status: true, 
                message: 'User updated successfully',
                data: updatedUser
            });
        } catch (error) {
            console.error("❌ Error updating user:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to update user", 
                error: error.message 
            });
        }
    }

    // Permission Request Management
    // Submit Permission Request
    async submitPermissionRequest(req, res) {
        try {
            console.log('📝 Submitting permission request...');
            console.log('Request body:', JSON.stringify(req.body, null, 2));
            const { type, resource, reason, urgency = 'medium' } = req.body;

            // Extract resource ID - resource could be an object or just an ID
            const resourceId = resource._id || resource;
            
            // Determine resource type and name
            let targetResourceType = 'user';
            let targetResourceName = '';
            
            if (type.includes('user')) {
                targetResourceType = 'user';
                const user = await PersonMaster.findById(resourceId);
                targetResourceName = user ? `${user.first_name} ${user.last_name} (${user.email})` : 'Unknown User';
            } else if (type.includes('project')) {
                targetResourceType = 'project';
                const project = await ProjectInfo.findById(resourceId);
                targetResourceName = project ? project.title : 'Unknown Project';
            }

            // Create permission request
            const permissionRequest = new PermissionRequest({
                requester: req.user.id,
                requesterName: req.user.name,
                requesterEmail: req.user.email,
                requestType: type,
                targetResource: resourceId,
                targetResourceName,
                targetResourceType,
                reason,
                urgency,
                additionalData: {
                    originalRequest: req.body
                }
            });

            await permissionRequest.save();

            console.log('✅ Permission request created:', permissionRequest._id);

            res.json({
                status: true,
                message: 'Permission request submitted successfully',
                data: {
                    requestId: permissionRequest._id,
                    status: 'pending'
                }
            });
        } catch (error) {
            console.error("❌ Error submitting permission request:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to submit permission request", 
                error: error.message 
            });
        }
    }

    // Get Permission Requests
    async getPermissionRequests(req, res) {
        try {
            console.log('📋 Fetching permission requests...');
            const { status = 'all', page = 1, limit = 10 } = req.query;

            const filter = {};
            if (status !== 'all') {
                filter.status = status;
            }

            const requests = await PermissionRequest.find(filter)
                .populate('requester', 'name email')
                .populate('reviewedBy', 'name email')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await PermissionRequest.countDocuments(filter);

            console.log(`✅ Found ${requests.length} permission requests`);

            res.json({
                status: true,
                message: 'Permission requests fetched successfully',
                data: {
                    requests,
                    pagination: {
                        total,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error("❌ Error fetching permission requests:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to fetch permission requests", 
                error: error.message 
            });
        }
    }

    // Handle Permission Request (Approve/Reject)
    async handlePermissionRequestAction(req, res) {
        try {
            console.log('⚖️ Handling permission request action...');
            const { requestId } = req.params;
            const { action, reviewNotes } = req.body;

            if (!['approve', 'reject'].includes(action)) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid action. Must be "approve" or "reject"'
                });
            }

            const request = await PermissionRequest.findById(requestId);
            if (!request) {
                return res.status(404).json({
                    status: false,
                    message: 'Permission request not found'
                });
            }

            if (request.status !== 'pending') {
                return res.status(400).json({
                    status: false,
                    message: 'Permission request has already been processed'
                });
            }

            // Update the request
            request.status = action === 'approve' ? 'approved' : 'rejected';
            request.reviewedBy = req.user.id;
            request.reviewedAt = new Date();
            request.reviewNotes = reviewNotes;

            await request.save();

            // If approved, execute the requested action
            if (action === 'approve') {
                try {
                    console.log(`🎯 Executing approved action: ${request.requestType}`);
                    await this.executePermissionRequestAction(request, req.user);
                    
                    // Mark execution as completed
                    request.executionStatus = 'completed';
                    request.executedAt = new Date();
                    await request.save();
                    
                    console.log(`✅ Successfully executed action: ${request.requestType}`);
                } catch (executionError) {
                    console.error(`❌ Failed to execute action: ${request.requestType}`, executionError);
                    // Update request with execution error
                    request.executionError = executionError.message;
                    request.executionStatus = 'failed';
                    await request.save();
                    
                    return res.status(500).json({
                        status: false,
                        message: 'Permission request approved but action execution failed',
                        error: executionError.message
                    });
                }
            }

            console.log(`✅ Permission request ${action}d:`, requestId);

            res.json({
                status: true,
                message: `Permission request ${action}d successfully${action === 'approve' ? ' and action executed' : ''}`,
                data: {
                    requestId,
                    status: request.status,
                    reviewedAt: request.reviewedAt,
                    executed: action === 'approve'
                }
            });
        } catch (error) {
            console.error("❌ Error handling permission request action:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to handle permission request", 
                error: error.message 
            });
        }
    }

    // Execute the actual requested action
    async executePermissionRequestAction(request, approver) {
        const { requestType, targetResource, additionalData } = request;
        
        console.log(`🔧 Executing ${requestType} on resource ${targetResource}`);
        
        switch (requestType) {
            case 'suspend_user':
                await this.executeSuspendUser(targetResource, additionalData, approver);
                break;
                
            case 'unsuspend_user':
            case 'activate_user':
                await this.executeActivateUser(targetResource, approver);
                break;
                
            case 'delete_user':
                await this.executeDeleteUser(targetResource, additionalData, approver);
                break;
                
            case 'edit_user':
                await this.executeEditUser(targetResource, additionalData, approver);
                break;
                
            case 'delete_project':
                await this.executeDeleteProject(targetResource, additionalData, approver);
                break;
                
            case 'edit_project':
                await this.executeEditProject(targetResource, additionalData, approver);
                break;
                
            default:
                throw new Error(`Unknown request type: ${requestType}`);
        }
    }

    // Individual execution methods
    async executeSuspendUser(userId, additionalData, approver) {
        const user = await PersonMaster.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const reason = additionalData?.originalRequest?.reason || 'Suspended via admin approval';
        const duration = additionalData?.originalRequest?.duration || 30;

        user.status = 0;
        user.is_suspended = true;
        user.suspension_reason = reason;
        user.suspension_date = new Date();
        user.suspended_by = approver.id;
        user.suspension_duration = duration;
        
        await user.save();
        console.log(`✅ User ${user.email} suspended by ${approver.name}`);
    }

    async executeActivateUser(userId, approver) {
        const user = await PersonMaster.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.status = 1;
        user.is_suspended = false;
        user.suspension_reason = null;
        user.suspension_date = null;
        user.suspended_by = null;
        user.suspension_duration = null;
        user.reactivated_by = approver.id;
        user.reactivated_date = new Date();
        
        await user.save();
        console.log(`✅ User ${user.email} activated by ${approver.name}`);
    }

    async executeDeleteUser(userId, additionalData, approver) {
        const user = await PersonMaster.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const reason = additionalData?.originalRequest?.reason || 'Deleted via admin approval';
        
        // Soft delete - mark as deleted but keep record
        user.status = -1;
        user.deleted_date = new Date();
        user.deleted_by = approver.id;
        user.deletion_reason = reason;
        
        await user.save();
        console.log(`✅ User ${user.email} deleted by ${approver.name}`);
    }

    async executeEditUser(userId, additionalData, approver) {
        const user = await PersonMaster.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const updates = additionalData?.originalRequest?.updateData;
        if (!updates) {
            throw new Error('No update data provided');
        }

        // Apply the updates
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined && key !== '_id') {
                user[key] = updates[key];
            }
        });

        user.last_modified_by = approver.id;
        user.last_modified_date = new Date();
        
        await user.save();
        console.log(`✅ User ${user.email} updated by ${approver.name}`);
    }

    async executeDeleteProject(projectId, additionalData, approver) {
        const project = await ProjectInfo.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const reason = additionalData?.originalRequest?.reason || 'Deleted via admin approval';
        
        // Soft delete
        project.isactive = 0;
        project.deleted_date = new Date();
        project.deleted_by = approver.id;
        project.deletion_reason = reason;
        
        await project.save();
        console.log(`✅ Project ${project.title} deleted by ${approver.name}`);
    }

    async executeEditProject(projectId, additionalData, approver) {
        const project = await ProjectInfo.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const updates = additionalData?.originalRequest?.updateData;
        if (!updates) {
            throw new Error('No update data provided');
        }

        // Apply the updates
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined && key !== '_id') {
                project[key] = updates[key];
            }
        });

        project.last_modified_by = approver.id;
        project.last_modified_date = new Date();
        
        await project.save();
        console.log(`✅ Project ${project.title} updated by ${approver.name}`);
    }
}