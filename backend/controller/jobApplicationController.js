import JobApply from "../schema/jobApply.js";
import JobPosted from "../schema/jobPosted.js";
import PersonMaster from "../schema/PersonMaster.js";
import { getPlanById, hasReachedLimit } from "../config/subscriptionPlans.js";

export default class JobApplicationController {
    
    // Apply for a job (Freelancer only)
    async applyForJob(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;
            const { job_id } = req.body;

            // Only freelancers can apply for jobs
            if (userRole !== 'freelancer') {
                return res.status(403).json({
                    status: false,
                    message: "Only freelancers can apply for jobs"
                });
            }

            const user = await PersonMaster.findById(userId);
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: "User not found"
                });
            }

            // Check if job exists and is accepting applications
            const job = await JobPosted.findById(job_id);
            if (!job) {
                return res.status(404).json({
                    status: false,
                    message: "Job not found"
                });
            }

            // Check if job is still accepting applications
            if (!job.is_accepting_applications) {
                return res.status(400).json({
                    status: false,
                    message: "This job is no longer accepting applications"
                });
            }

            // Check if user has already applied
            const existingApplication = await JobApply.findOne({
                job_id: job_id,
                freelancer_id: userId
            });

            if (existingApplication) {
                return res.status(400).json({
                    status: false,
                    message: "You have already applied for this job"
                });
            }

            // Check application limit based on subscription
            const currentPlan = getPlanById(user.subscription?.plan_id || 'free');
            const maxApplications = currentPlan.features.max_job_applications || 20; // Default for free users

            if (maxApplications !== -1) {
                const currentApplicationCount = await JobApply.countDocuments({ 
                    freelancer_id: userId,
                    'application_tracking.applied_at': {
                        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // This month
                    }
                });
                
                if (currentApplicationCount >= maxApplications) {
                    return res.status(402).json({
                        status: false,
                        message: `Monthly application limit reached. Upgrade your plan to apply for more jobs.`,
                        data: {
                            current_plan: currentPlan,
                            current_applications: currentApplicationCount,
                            max_applications: maxApplications,
                            upgrade_required: true
                        }
                    });
                }
            }

            const applicationData = req.body;
            
            // Validate required fields
            if (job.application_settings.require_cover_letter && !applicationData.cover_letter) {
                return res.status(400).json({
                    status: false,
                    message: "Cover letter is required for this job"
                });
            }

            // Validate resume link requirement
            if (job.application_settings.require_resume_link && !applicationData.resume_link?.url) {
                return res.status(400).json({
                    status: false,
                    message: "Resume link is required for this job"
                });
            }

            // Validate URL format if resume link is provided
            if (applicationData.resume_link?.url) {
                const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
                if (!urlPattern.test(applicationData.resume_link.url)) {
                    return res.status(400).json({
                        status: false,
                        message: "Please provide a valid resume URL"
                    });
                }
            }

            // Create application
            const application = new JobApply({
                job_id: job_id,
                freelancer_id: userId,
                cover_letter: applicationData.cover_letter,
                resume_link: applicationData.resume_link,
                portfolio_links: applicationData.portfolio_links || [],
                expected_salary: applicationData.expected_salary,
                availability: applicationData.availability,
                application_source: applicationData.application_source || 'platform',
                referral_source: applicationData.referral_source,
                communication_preferences: applicationData.communication_preferences,
                job_requires_cover_letter: job.application_settings.require_cover_letter
            });

            await application.save();

            // Update job analytics
            job.analytics.total_applications += 1;
            job.analytics.last_application = new Date();
            await job.save();

            // Populate application data
            await application.populate([
                {
                    path: 'job_id',
                    select: 'job_title company_info.company_name location.city salary'
                },
                {
                    path: 'freelancer_id',
                    select: 'first_name last_name email profile_pic'
                }
            ]);

            return res.status(201).json({
                status: true,
                message: "Application submitted successfully",
                data: application
            });

        } catch (error) {
            console.error("Error applying for job:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // Get freelancer's applications
    async getFreelancerApplications(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;
            const { status, page = 1, limit = 20, saved_only = false } = req.body;

            if (userRole !== 'freelancer') {
                return res.status(403).json({
                    status: false,
                    message: "Only freelancers can view their applications"
                });
            }

            const filter = { freelancer_id: userId };
            if (status) filter.application_status = status;
            if (saved_only) filter.is_saved = true;

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [applications, total] = await Promise.all([
                JobApply.find(filter)
                    .populate('job_id', 'job_title company_info.company_name location.city salary application_deadline status')
                    .populate('freelancer_id', 'first_name last_name email')
                    .sort({ 'application_tracking.applied_at': -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                JobApply.countDocuments(filter)
            ]);

            return res.status(200).json({
                status: true,
                message: "Applications retrieved successfully",
                data: applications,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(total / parseInt(limit)),
                    total_applications: total,
                    applications_per_page: parseInt(limit)
                }
            });

        } catch (error) {
            console.error("Error fetching applications:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // Get job applications for client
    async getJobApplications(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;
            const { job_id } = req.body;
            const { status, page = 1, limit = 20 } = req.body;

            if (userRole !== 'client') {
                return res.status(403).json({
                    status: false,
                    message: "Only clients can view job applications"
                });
            }

            // Verify job ownership
            const job = await JobPosted.findById(job_id);
            if (!job) {
                return res.status(404).json({
                    status: false,
                    message: "Job not found"
                });
            }

            if (job.client_id.toString() !== userId) {
                return res.status(403).json({
                    status: false,
                    message: "You can only view applications for your own jobs"
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
                data: applications,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(total / parseInt(limit)),
                    total_applications: total,
                    applications_per_page: parseInt(limit)
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

    // Update application status (Client only)
    async updateApplicationStatus(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;
            const { application_id, status, notes, rating, feedback } = req.body;

            if (userRole !== 'client') {
                return res.status(403).json({
                    status: false,
                    message: "Only clients can update application status"
                });
            }

            const application = await JobApply.findById(application_id)
                .populate('job_id', 'client_id job_title');

            if (!application) {
                return res.status(404).json({
                    status: false,
                    message: "Application not found"
                });
            }

            // Verify job ownership
            if (application.job_id.client_id.toString() !== userId) {
                return res.status(403).json({
                    status: false,
                    message: "You can only update applications for your own jobs"
                });
            }

            // Validate status
            const validStatuses = ['applied', 'viewed', 'shortlisted', 'interviewed', 'selected', 'rejected', 'withdrawn'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid application status"
                });
            }

            // Update application
            application.application_status = status;
            if (notes) application.client_notes = notes;
            if (rating) application.client_rating = rating;
            if (feedback) application.feedback.client_feedback = feedback;

            // Add interaction record
            application.client_interactions.push({
                interaction_type: status,
                interaction_date: new Date(),
                notes: notes || '',
                initiated_by: 'client'
            });

            // Update tracking
            if (status === 'viewed') {
                application.application_tracking.last_viewed_by_client = new Date();
            }

            await application.save();

            // Populate updated data
            await application.populate([
                {
                    path: 'job_id',
                    select: 'job_title company_info.company_name'
                },
                {
                    path: 'freelancer_id',
                    select: 'first_name last_name email profile_pic'
                }
            ]);

            return res.status(200).json({
                status: true,
                message: "Application status updated successfully",
                data: application
            });

        } catch (error) {
            console.error("Error updating application status:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // Save/Unsave job (Freelancer only)
    async toggleJobSave(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;
            const { job_id } = req.body;

            if (userRole !== 'freelancer') {
                return res.status(403).json({
                    status: false,
                    message: "Only freelancers can save jobs"
                });
            }

            const job = await JobPosted.findById(job_id);
            if (!job) {
                return res.status(404).json({
                    status: false,
                    message: "Job not found"
                });
            }

            // Check if job is still active
            if (!job.is_active || job.status !== 'active') {
                return res.status(400).json({
                    status: false,
                    message: "Cannot save inactive or closed jobs"
                });
            }

            // Check if user has applied for this job
            const application = await JobApply.findOne({
                job_id: job_id,
                freelancer_id: userId
            });

            if (application) {
                // Toggle save status
                application.is_saved = !application.is_saved;
                await application.save();

                // Update job analytics
                if (application.is_saved) {
                    job.analytics.total_saves += 1;
                } else {
                    job.analytics.total_saves = Math.max(0, job.analytics.total_saves - 1);
                }
                await job.save();

                return res.status(200).json({
                    status: true,
                    message: application.is_saved ? "Job saved successfully" : "Job unsaved successfully",
                    data: { is_saved: application.is_saved }
                });
            } else {
                // Create a saved job entry without application
                const savedJob = new JobApply({
                    job_id: job_id,
                    freelancer_id: userId,
                    application_status: 'saved', // Special status for saved jobs
                    is_saved: true
                });

                await savedJob.save();

                // Update job analytics
                job.analytics.total_saves += 1;
                await job.save();

                return res.status(200).json({
                    status: true,
                    message: "Job saved successfully",
                    data: { is_saved: true }
                });
            }

        } catch (error) {
            console.error("Error toggling job save:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // Get saved jobs (Freelancer only)
    async getSavedJobs(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;
            const { page = 1, limit = 20 } = req.body;

            if (userRole !== 'freelancer') {
                return res.status(403).json({
                    status: false,
                    message: "Only freelancers can view saved jobs"
                });
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [savedJobs, total] = await Promise.all([
                JobApply.find({ 
                    freelancer_id: userId, 
                    is_saved: true 
                })
                    .populate('job_id', 'job_title company_info.company_name location.city salary application_deadline status is_active')
                    .sort({ updated_at: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                JobApply.countDocuments({ 
                    freelancer_id: userId, 
                    is_saved: true 
                })
            ]);

            return res.status(200).json({
                status: true,
                message: "Saved jobs retrieved successfully",
                data: savedJobs,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(total / parseInt(limit)),
                    total_saved_jobs: total,
                    jobs_per_page: parseInt(limit)
                }
            });

        } catch (error) {
            console.error("Error fetching saved jobs:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // Get application statistics
    async getApplicationStats(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;

            if (userRole !== 'freelancer') {
                return res.status(403).json({
                    status: false,
                    message: "Only freelancers can view application statistics"
                });
            }

            const stats = await JobApply.aggregate([
                { $match: { freelancer_id: userId } },
                {
                    $group: {
                        _id: null,
                        total_applications: { $sum: 1 },
                        total_saved: { $sum: { $cond: ['$is_saved', 1, 0] } },
                        applications_by_status: {
                            $push: {
                                status: '$application_status',
                                applied_at: '$application_tracking.applied_at'
                            }
                        }
                    }
                }
            ]);

            // Calculate status counts
            const statusCounts = {
                applied: 0,
                viewed: 0,
                shortlisted: 0,
                interviewed: 0,
                selected: 0,
                rejected: 0,
                withdrawn: 0
            };

            if (stats.length > 0) {
                stats[0].applications_by_status.forEach(app => {
                    if (statusCounts.hasOwnProperty(app.status)) {
                        statusCounts[app.status]++;
                    }
                });
            }

            return res.status(200).json({
                status: true,
                message: "Application statistics retrieved successfully",
                data: {
                    total_applications: stats[0]?.total_applications || 0,
                    total_saved: stats[0]?.total_saved || 0,
                    status_breakdown: statusCounts
                }
            });

        } catch (error) {
            console.error("Error fetching application statistics:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // Withdraw application (Freelancer only)
    async withdrawApplication(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;
            const { application_id } = req.body;

            if (userRole !== 'freelancer') {
                return res.status(403).json({
                    status: false,
                    message: "Only freelancers can withdraw applications"
                });
            }

            const application = await JobApply.findById(application_id);
            if (!application) {
                return res.status(404).json({
                    status: false,
                    message: "Application not found"
                });
            }

            // Check if user owns this application
            if (application.freelancer_id.toString() !== userId) {
                return res.status(403).json({
                    status: false,
                    message: "You can only withdraw your own applications"
                });
            }

            // Check if application can be withdrawn
            if (['selected', 'rejected', 'withdrawn'].includes(application.application_status)) {
                return res.status(400).json({
                    status: false,
                    message: "Cannot withdraw application in current status"
                });
            }

            // Update application status
            application.application_status = 'withdrawn';
            application.application_tracking.decision_made_at = new Date();

            // Add interaction record
            application.client_interactions.push({
                interaction_type: 'withdrawn',
                interaction_date: new Date(),
                initiated_by: 'freelancer'
            });

            await application.save();

            return res.status(200).json({
                status: true,
                message: "Application withdrawn successfully",
                data: application
            });

        } catch (error) {
            console.error("Error withdrawing application:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }
}

