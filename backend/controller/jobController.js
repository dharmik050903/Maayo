import JobPosted from "../schema/jobPosted.js";
import mongoose from "mongoose";
import JobApply from "../schema/jobApply.js";
import PersonMaster from "../schema/PersonMaster.js";
import { getPlanById, hasReachedLimit } from "../config/subscriptionPlans.js";

export default class JobController {
    
    // Create a new job posting (Client only)
    async createJob(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;

            // Only clients can create jobs
            if (userRole !== 'client') {
                return res.status(403).json({
                    status: false,
                    message: "Only clients can create job postings"
                });
            }

            const user = await PersonMaster.findById(userId);
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: "User not found"
                });
            }

            // Check job posting limit based on subscription
            const currentPlan = getPlanById(user.subscription?.plan_id || 'free');
            const maxJobs = currentPlan.features.max_jobs || 10; // Default for free users

            if (maxJobs !== -1) {
                const currentJobCount = await JobPosted.countDocuments({ 
                    client_id: userId, 
                    status: { $in: ['active', 'draft'] } 
                });
                
                if (currentJobCount >= maxJobs) {
                    return res.status(402).json({
                        status: false,
                        message: `Job posting limit reached. Upgrade your plan to post more jobs.`,
                        data: {
                            current_plan: currentPlan,
                            current_jobs: currentJobCount,
                            max_jobs: maxJobs,
                            upgrade_required: true
                        }
                    });
                }
            }

            const jobData = req.body;
            
            // Validate required fields
            const requiredFields = [
                'job_title', 'job_description', 'job_type', 'work_mode',
                'location', 'salary', 'required_skills', 'application_deadline',
                'company_info', 'contact_info'
            ];

            for (const field of requiredFields) {
                if (!jobData[field]) {
                    return res.status(400).json({
                        status: false,
                        message: `Missing required field: ${field}`
                    });
                }
            }

            // Validate salary range
            if (jobData.salary.min_salary >= jobData.salary.max_salary) {
                return res.status(400).json({
                    status: false,
                    message: "Minimum salary must be less than maximum salary"
                });
            }

            // Validate application deadline
            const deadline = new Date(jobData.application_deadline);
            const now = new Date();
            if (deadline <= now) {
                return res.status(400).json({
                    status: false,
                    message: "Application deadline must be in the future"
                });
            }

            // Add client_id to job data
            jobData.client_id = userId;

            // Create the job
            const job = new JobPosted(jobData);
            await job.save();

            // Populate client information
            await job.populate('client_id', 'first_name last_name email company_name');

            return res.status(201).json({
                status: true,
                message: "Job posted successfully",
                data: job
            });

        } catch (error) {
            console.error("Error creating job:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // Get all jobs with filters (Public access)
    async getJobs(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                job_type,
                work_mode,
                location,
                min_salary,
                max_salary,
                skills,
                experience_level,
                date_range,
                search_query,
                sort_by = 'created_at',
                sort_order = 'desc'
            } = req.body;

            // Build filter object
            const filter = {
                status: 'active',
                is_active: true,
                application_deadline: { $gt: new Date() }
            };

            // Apply filters
            if (job_type) filter.job_type = job_type;
            if (work_mode) filter.work_mode = work_mode;
            if (location) {
                filter['location.city'] = new RegExp(location, 'i');
            }
            if (min_salary || max_salary) {
                filter['salary.min_salary'] = {};
                if (min_salary) filter['salary.min_salary'].$gte = min_salary;
                if (max_salary) filter['salary.min_salary'].$lte = max_salary;
            }
            if (skills && skills.length > 0) {
                filter['required_skills.skill'] = { $in: skills };
            }
            if (experience_level) {
                filter['experience_required.min_experience'] = { $lte: experience_level };
            }

            // Date range filter
            if (date_range) {
                const { start_date, end_date } = date_range;
                if (start_date) filter.created_at = { $gte: new Date(start_date) };
                if (end_date) {
                    filter.created_at = { 
                        ...filter.created_at, 
                        $lte: new Date(end_date) 
                    };
                }
            }

            // Text search
            if (search_query) {
                filter.$text = { $search: search_query };
            }

            // Build sort object
            const sort = {};
            if (sort_by === 'salary') {
                sort['salary.min_salary'] = sort_order === 'asc' ? 1 : -1;
            } else if (sort_by === 'deadline') {
                sort.application_deadline = sort_order === 'asc' ? 1 : -1;
            } else {
                sort[sort_by] = sort_order === 'asc' ? 1 : -1;
            }

            // Calculate pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Execute query
            const [jobs, total] = await Promise.all([
                JobPosted.find(filter)
                    .populate('client_id', 'first_name last_name company_name')
                    .populate('required_skills.skill_id', 'skill_name')
                    .sort(sort)
                    .skip(skip)
                    .limit(parseInt(limit)),
                JobPosted.countDocuments(filter)
            ]);

            return res.status(200).json({
                status: true,
                message: "Jobs retrieved successfully",
                data: jobs,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(total / parseInt(limit)),
                    total_jobs: total,
                    jobs_per_page: parseInt(limit)
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

    // Get job by ID
    async getJobById(req, res) {
        try {
            const { job_id } = req.body;

            const job = await JobPosted.findById(job_id)
                .populate('client_id', 'first_name last_name email company_name company_website')
                .populate('required_skills.skill_id', 'skill_name');

            if (!job) {
                return res.status(404).json({
                    status: false,
                    message: "Job not found"
                });
            }

            // Increment view count
            job.analytics.total_views += 1;
            job.analytics.last_viewed = new Date();
            await job.save();

            return res.status(200).json({
                status: true,
                message: "Job retrieved successfully",
                data: job
            });

        } catch (error) {
            console.error("Error fetching job:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // Update job (Client only)
    async updateJob(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;
            const { job_id } = req.body;

            if (userRole !== 'client') {
                return res.status(403).json({
                    status: false,
                    message: "Only clients can update jobs"
                });
            }

            const job = await JobPosted.findById(job_id);
            if (!job) {
                return res.status(404).json({
                    status: false,
                    message: "Job not found"
                });
            }

            // Check if user owns this job
            if (job.client_id.toString() !== userId) {
                return res.status(403).json({
                    status: false,
                    message: "You can only update your own jobs"
                });
            }

            // Prevent updates if job is closed or filled
            if (['closed', 'filled'].includes(job.status)) {
                return res.status(400).json({
                    status: false,
                    message: "Cannot update closed or filled jobs"
                });
            }

            const updateData = req.body;
            
            // Validate salary if provided
            if (updateData.salary) {
                const { min_salary, max_salary } = updateData.salary;
                if (min_salary >= max_salary) {
                    return res.status(400).json({
                        status: false,
                        message: "Minimum salary must be less than maximum salary"
                    });
                }
            }

            // Update job
            Object.assign(job, updateData);
            await job.save();

            await job.populate('client_id', 'first_name last_name email company_name');

            return res.status(200).json({
                status: true,
                message: "Job updated successfully",
                data: job
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

    // Delete job (Client only)
    async deleteJob(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;
            const { job_id } = req.body;

            if (userRole !== 'client') {
                return res.status(403).json({
                    status: false,
                    message: "Only clients can delete jobs"
                });
            }

            const job = await JobPosted.findById(job_id);
            if (!job) {
                return res.status(404).json({
                    status: false,
                    message: "Job not found"
                });
            }

            // Check if user owns this job
            if (job.client_id.toString() !== userId) {
                return res.status(403).json({
                    status: false,
                    message: "You can only delete your own jobs"
                });
            }

            // Check if job has applications
            const applicationCount = await JobApply.countDocuments({ job_id });
            if (applicationCount > 0) {
                return res.status(400).json({
                    status: false,
                    message: "Cannot delete job with existing applications. Close the job instead.",
                    data: { application_count: applicationCount }
                });
            }

            await JobPosted.findByIdAndDelete(job_id);

            return res.status(200).json({
                status: true,
                message: "Job deleted successfully"
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

    // Close job (Client only)
    async closeJob(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;
            const { job_id } = req.body;

            if (userRole !== 'client') {
                return res.status(403).json({
                    status: false,
                    message: "Only clients can close jobs"
                });
            }

            const job = await JobPosted.findById(job_id);
            if (!job) {
                return res.status(404).json({
                    status: false,
                    message: "Job not found"
                });
            }

            // Check if user owns this job
            if (job.client_id.toString() !== userId) {
                return res.status(403).json({
                    status: false,
                    message: "You can only close your own jobs"
                });
            }

            // Update job status
            job.status = 'closed';
            job.is_active = false;
            job.closed_at = new Date();
            await job.save();

            return res.status(200).json({
                status: true,
                message: "Job closed successfully",
                data: job
            });

        } catch (error) {
            console.error("Error closing job:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // Get client's jobs
    async getClientJobs(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;
            const { status, page = 1, limit = 20 } = req.body;

            if (userRole !== 'client') {
                return res.status(403).json({
                    status: false,
                    message: "Only clients can view their jobs"
                });
            }

            const filter = { client_id: userId };
            if (status) filter.status = status;

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [jobs, total] = await Promise.all([
                JobPosted.find(filter)
                    .populate('client_id', 'first_name last_name email company_name')
                    .sort({ created_at: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                JobPosted.countDocuments(filter)
            ]);

            return res.status(200).json({
                status: true,
                message: "Client jobs retrieved successfully",
                data: jobs,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(total / parseInt(limit)),
                    total_jobs: total,
                    jobs_per_page: parseInt(limit)
                }
            });

        } catch (error) {
            console.error("Error fetching client jobs:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // Get job statistics
    async getJobStats(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;

            console.log('📊 Getting job stats for user:', userId, 'role:', userRole);

            if (userRole !== 'client') {
                return res.status(403).json({
                    status: false,
                    message: "Only clients can view job statistics"
                });
            }

            // Convert userId to ObjectId for proper matching
            const clientObjectId = new mongoose.Types.ObjectId(userId);
            console.log('📊 Client ObjectId:', clientObjectId);

            // First, let's check if there are any jobs for this client
            const totalJobsCount = await JobPosted.countDocuments({ client_id: clientObjectId });
            console.log('📊 Total jobs count for client:', totalJobsCount);

            // Get all jobs for this client to debug
            const allJobs = await JobPosted.find({ client_id: clientObjectId }).select('job_title status analytics');
            console.log('📊 All jobs for client:', allJobs);

            const stats = await JobPosted.aggregate([
                { $match: { client_id: clientObjectId } },
                {
                    $group: {
                        _id: null,
                        total_jobs: { $sum: 1 },
                        active_jobs: { 
                            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } 
                        },
                        closed_jobs: { 
                            $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } 
                        },
                        filled_jobs: { 
                            $sum: { $cond: [{ $eq: ['$status', 'filled'] }, 1, 0] } 
                        },
                        total_views: { $sum: '$analytics.total_views' },
                        total_applications: { $sum: '$analytics.total_applications' },
                        total_saves: { $sum: '$analytics.total_saves' }
                    }
                }
            ]);

            console.log('📊 Aggregation result:', stats);

            const result = stats[0] || {
                total_jobs: 0,
                active_jobs: 0,
                closed_jobs: 0,
                filled_jobs: 0,
                total_views: 0,
                total_applications: 0,
                total_saves: 0
            };

            // Calculate average applications per job
            result.avg_applications = result.total_jobs > 0 ? 
                Math.round((result.total_applications / result.total_jobs) * 10) / 10 : 0;

            // Get job status breakdown
            const statusBreakdown = await JobPosted.aggregate([
                { $match: { client_id: clientObjectId } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Convert to object format expected by frontend
            result.job_status_breakdown = {};
            statusBreakdown.forEach(item => {
                result.job_status_breakdown[item._id] = item.count;
            });

            console.log('📊 Final stats result:', result);

            return res.status(200).json({
                status: true,
                message: "Job statistics retrieved successfully",
                data: result
            });

        } catch (error) {
            console.error("Error fetching job statistics:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }
}

