import JobPosted from "../schema/jobPosted.js";
import JobApply from "../schema/jobApply.js";
import PersonMaster from "../schema/PersonMaster.js";

export default class AdminJobController {
    
    // Get all jobs with pagination and filters
    async getAllJobs(req, res) {
        try {
            // Admin authentication is handled by middleware, just check if user exists
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({
                    status: false,
                    message: "Access denied. Admin privileges required."
                });
            }

            const { 
                page = 1, 
                limit = 20, 
                status, 
                search, 
                company_name,
                job_type,
                work_mode,
                location,
                is_active,
                date_from,
                date_to
            } = req.body;

            // Build filter object
            const filter = {};
            
            if (status) filter.status = status;
            if (is_active !== undefined) filter.is_active = is_active;
            if (job_type) filter.job_type = job_type;
            if (work_mode) filter.work_mode = work_mode;
            if (location) filter['location.city'] = new RegExp(location, 'i');
            if (company_name) filter['company_info.company_name'] = new RegExp(company_name, 'i');
            
            if (search) {
                filter.$or = [
                    { job_title: new RegExp(search, 'i') },
                    { 'company_info.company_name': new RegExp(search, 'i') },
                    { job_description: new RegExp(search, 'i') }
                ];
            }
            
            if (date_from || date_to) {
                filter.created_at = {};
                if (date_from) filter.created_at.$gte = new Date(date_from);
                if (date_to) filter.created_at.$lte = new Date(date_to);
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [jobs, total] = await Promise.all([
                JobPosted.find(filter)
                    .populate('client_id', 'first_name last_name email company_name contact_number')
                    .sort({ created_at: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                JobPosted.countDocuments(filter)
            ]);

            return res.status(200).json({
                status: true,
                message: "Jobs retrieved successfully",
                data: {
                    jobs,
                    pagination: {
                        current_page: parseInt(page),
                        total_pages: Math.ceil(total / parseInt(limit)),
                        total_jobs: total,
                        jobs_per_page: parseInt(limit)
                    }
                }
            });

        } catch (error) {
            console.error("Error fetching jobs:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // Get job details by ID
    async getJobById(req, res) {
        try {
            // Admin authentication is handled by middleware
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({
                    status: false,
                    message: "Access denied. Admin privileges required."
                });
            }
            
            const { job_id } = req.body;

            const job = await JobPosted.findById(job_id)
                .populate('client_id', 'first_name last_name email company_name contact_number');

            if (!job) {
                return res.status(404).json({
                    status: false,
                    message: "Job not found"
                });
            }

            // Get application statistics for this job
            const applicationStats = await JobApply.aggregate([
                { $match: { job_id: job._id } },
                {
                    $group: {
                        _id: null,
                        total_applications: { $sum: 1 },
                        status_breakdown: {
                            $push: '$application_status'
                        }
                    }
                }
            ]);

            const statusCounts = {
                applied: 0, viewed: 0, shortlisted: 0, 
                interviewed: 0, selected: 0, rejected: 0, withdrawn: 0
            };

            if (applicationStats.length > 0) {
                applicationStats[0].status_breakdown.forEach(status => {
                    if (statusCounts.hasOwnProperty(status)) {
                        statusCounts[status]++;
                    }
                });
            }

            return res.status(200).json({
                status: true,
                message: "Job details retrieved successfully",
                data: {
                    job,
                    application_statistics: {
                        total_applications: applicationStats[0]?.total_applications || 0,
                        status_breakdown: statusCounts
                    }
                }
            });

        } catch (error) {
            console.error("Error fetching job details:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // Edit/Update job
    async updateJob(req, res) {
        try {
            // Admin authentication is handled by middleware
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({
                    status: false,
                    message: "Access denied. Admin privileges required."
                });
            }
            
            const { job_id, ...updateData } = req.body;

            const job = await JobPosted.findById(job_id);
            if (!job) {
                return res.status(404).json({
                    status: false,
                    message: "Job not found"
                });
            }

            // Validate update fields (only allow certain fields to be updated)
            const allowedUpdates = [
                'job_title', 'job_description', 'salary', 'job_type', 'work_mode',
                'location', 'required_skills', 'experience_required', 'education_required',
                'application_deadline', 'job_start_date', 'job_duration', 'is_active', 
                'status', 'is_featured', 'application_settings', 'company_info', 
                'contact_info', 'tags', 'keywords'
            ];

            const updates = {};
            Object.keys(updateData).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    updates[key] = updateData[key];
                }
            });

            // Add admin modification tracking
            updates.admin_modified = {
                modified_at: new Date(),
                modified_by: req.user.id,
                modification_reason: updateData.modification_reason || 'Admin update'
            };

            updates.updated_at = new Date();

            const updatedJob = await JobPosted.findByIdAndUpdate(
                job_id,
                { $set: updates },
                { new: true, runValidators: true }
            ).populate('client_id', 'first_name last_name email');

            return res.status(200).json({
                status: true,
                message: "Job updated successfully",
                data: updatedJob
            });

        } catch (error) {
            console.error("Error updating job:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // Block/Unblock job
    async toggleJobBlock(req, res) {
        try {
            // Admin authentication is handled by middleware
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({
                    status: false,
                    message: "Access denied. Admin privileges required."
                });
            }
            
            const { job_id, block_reason } = req.body;

            const job = await JobPosted.findById(job_id);
            if (!job) {
                return res.status(404).json({
                    status: false,
                    message: "Job not found"
                });
            }

            const isCurrentlyBlocked = job.status === 'blocked' || !job.is_active;
            
            const updates = {
                status: isCurrentlyBlocked ? 'active' : 'blocked',
                is_active: isCurrentlyBlocked ? true : false,
                updated_at: new Date(),
                admin_action: {
                    action_type: isCurrentlyBlocked ? 'unblocked' : 'blocked',
                    action_date: new Date(),
                    admin_id: req.user.id,
                    reason: block_reason || (isCurrentlyBlocked ? 'Unblocked by admin' : 'Blocked by admin')
                }
            };

            const updatedJob = await JobPosted.findByIdAndUpdate(
                job_id,
                { $set: updates },
                { new: true }
            ).populate('client_id', 'first_name last_name email');

            return res.status(200).json({
                status: true,
                message: `Job ${isCurrentlyBlocked ? 'unblocked' : 'blocked'} successfully`,
                data: updatedJob
            });

        } catch (error) {
            console.error("Error toggling job block:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // Delete job (hard delete)
    async deleteJob(req, res) {
        try {
            // Admin authentication is handled by middleware
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({
                    status: false,
                    message: "Access denied. Admin privileges required."
                });
            }
            
            const { job_id, delete_reason } = req.body;

            const job = await JobPosted.findById(job_id);
            if (!job) {
                return res.status(404).json({
                    status: false,
                    message: "Job not found"
                });
            }

            // Check if job has applications
            const applicationCount = await JobApply.countDocuments({ job_id: job_id });

            // Hard delete - permanently remove from database
            console.log(`🗑️ Admin ${req.user.id} permanently deleting job ${job.job_title}`);
            
            // Delete all related job applications first
            if (applicationCount > 0) {
                await JobApply.deleteMany({ job_id: job_id });
                console.log(`🗑️ Deleted ${applicationCount} associated job applications`);
            }

            // Delete the job
            await JobPosted.findByIdAndDelete(job_id);

            console.log(`✅ Job "${job.job_title}" permanently deleted by admin`);

            return res.status(200).json({
                status: true,
                message: "Job permanently deleted successfully",
                data: {
                    job_id: job_id,
                    job_title: job.job_title,
                    deletion_info: {
                        deleted_by: req.user.id,
                        deletion_date: new Date(),
                        reason: delete_reason || 'Deleted by admin',
                        had_applications: applicationCount > 0,
                        application_count: applicationCount
                    }
                }
            });

        } catch (error) {
            console.error("Error deleting job:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // Get job applications for admin review
    async getJobApplications(req, res) {
        try {
            // Admin authentication is handled by middleware
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({
                    status: false,
                    message: "Access denied. Admin privileges required."
                });
            }
            
            const { job_id, page = 1, limit = 20, status } = req.body;

            const job = await JobPosted.findById(job_id);
            if (!job) {
                return res.status(404).json({
                    status: false,
                    message: "Job not found"
                });
            }

            const filter = { job_id: job_id };
            if (status) filter.application_status = status;

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [applications, total] = await Promise.all([
                JobApply.find(filter)
                    .populate('freelancer_id', 'first_name last_name email profile_pic contact_number')
                    .populate('job_id', 'job_title company_info.company_name')
                    .sort({ 'application_tracking.applied_at': -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                JobApply.countDocuments(filter)
            ]);

            return res.status(200).json({
                status: true,
                message: "Job applications retrieved successfully",
                data: {
                    job_info: {
                        job_title: job.job_title,
                        company_name: job.company_info.company_name,
                        status: job.status
                    },
                    applications,
                    pagination: {
                        current_page: parseInt(page),
                        total_pages: Math.ceil(total / parseInt(limit)),
                        total_applications: total,
                        applications_per_page: parseInt(limit)
                    }
                }
            });

        } catch (error) {
            console.error("Error fetching job applications:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // Get admin dashboard statistics for jobs
    async getJobDashboardStats(req, res) {
        try {
            // Admin authentication is handled by middleware
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({
                    status: false,
                    message: "Access denied. Admin privileges required."
                });
            }

            const [jobStats, applicationStats] = await Promise.all([
                JobPosted.aggregate([
                    {
                        $group: {
                            _id: null,
                            total_jobs: { $sum: 1 },
                            active_jobs: { $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] } },
                            blocked_jobs: { $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] } },
                            draft_jobs: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
                            closed_jobs: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
                            filled_jobs: { $sum: { $cond: [{ $eq: ['$status', 'filled'] }, 1, 0] } }
                        }
                    }
                ]),
                JobApply.aggregate([
                    {
                        $group: {
                            _id: null,
                            total_applications: { $sum: 1 },
                            applications_this_month: {
                                $sum: {
                                    $cond: [
                                        {
                                            $gte: [
                                                '$application_tracking.applied_at',
                                                new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                                            ]
                                        },
                                        1,
                                        0
                                    ]
                                }
                            }
                        }
                    }
                ])
            ]);

            return res.status(200).json({
                status: true,
                message: "Job dashboard statistics retrieved successfully",
                data: {
                    job_statistics: jobStats[0] || {
                        total_jobs: 0,
                        active_jobs: 0,
                        blocked_jobs: 0,
                        draft_jobs: 0,
                        closed_jobs: 0,
                        filled_jobs: 0
                    },
                    application_statistics: applicationStats[0] || {
                        total_applications: 0,
                        applications_this_month: 0
                    }
                }
            });

        } catch (error) {
            console.error("Error fetching job dashboard statistics:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }
}