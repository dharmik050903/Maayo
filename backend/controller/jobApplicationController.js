import JobApply from "../schema/jobApply.js";
import JobPosted from "../schema/jobPosted.js";
import PersonMaster from "../schema/PersonMaster.js";
import FreelancerInfo from "../schema/freelancerInfo.js";
import { getPlanById, hasReachedLimit } from "../config/subscriptionPlans.js";
import { getIO } from "../services/socket.js";

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

            console.log('Checking for existing application:');
            console.log('Job ID:', job_id);
            console.log('User ID:', userId);
            console.log('Existing application found:', existingApplication);

            if (existingApplication) {
                return res.status(400).json({
                    status: false,
                    message: "You have already applied for this job",
                    data: {
                        existing_application_id: existingApplication._id,
                        applied_at: existingApplication.application_tracking?.applied_at,
                        status: existingApplication.application_status
                    }
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
            if (job.application_settings?.require_cover_letter && !applicationData.cover_letter) {
                return res.status(400).json({
                    status: false,
                    message: "Cover letter is required for this job"
                });
            }

            // Validate resume link requirement
            if (job.application_settings?.require_resume_link && !applicationData.resume_link?.url) {
                return res.status(400).json({
                    status: false,
                    message: "Resume link is required for this job"
                });
            }

            // Validate URL format if resume link is provided
            if (applicationData.resume_link?.url) {
                try {
                    new URL(applicationData.resume_link.url);
                } catch (error) {
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
                cover_letter: applicationData.cover_letter || undefined,
                resume_link: applicationData.resume_link || undefined,
                portfolio_links: applicationData.portfolio_links || [],
                expected_salary: applicationData.expected_salary || undefined,
                availability: applicationData.availability || undefined,
                application_source: applicationData.application_source || 'platform',
                referral_source: applicationData.referral_source || undefined,
                communication_preferences: applicationData.communication_preferences || undefined,
                job_requires_cover_letter: job.application_settings?.require_cover_letter || false,
                application_tracking: {
                    applied_at: new Date(),
                    last_updated: new Date()
                }
            });

            await application.save();

            console.log('Application created successfully:', application._id);
            console.log('Job ID:', job_id);
            console.log('Freelancer ID:', userId);
            console.log('Application status:', application.application_status);

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

            console.log('Fetching applications for user:', userId);
            console.log('Filter:', filter);
            console.log('Page:', page, 'Limit:', limit);

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [applications, total] = await Promise.all([
                JobApply.find(filter)
                    .populate('job_id', 'job_title company_info.company_name location.city location.country salary application_deadline status work_mode job_type job_description')
                    .populate('freelancer_id', 'first_name last_name email')
                    .sort({ 'application_tracking.applied_at': -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                JobApply.countDocuments(filter)
            ]);

            console.log('Found applications:', applications.length);
            console.log('Total applications:', total);

            return res.status(200).json({
                status: true,
                message: "Applications retrieved successfully",
                data: {
                    applications: applications,
                    pagination: {
                        current_page: parseInt(page),
                        total_pages: Math.ceil(total / parseInt(limit)),
                        total_applications: total,
                        applications_per_page: parseInt(limit)
                    }
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

            console.log('Fetching applications for job:', job_id);
            console.log('Filter:', filter);
            console.log('User ID:', userId);

            const [applications, total] = await Promise.all([
                JobApply.find(filter)
                    .populate('freelancer_id', 'first_name last_name email profile_pic contact_number')
                    .populate('job_id', 'job_title company_info.company_name')
                    .sort({ 'application_tracking.applied_at': -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                JobApply.countDocuments(filter)
            ]);

            console.log('Found applications:', applications.length);
            console.log('Total applications:', total);
            console.log('Sample application:', applications[0]);

            return res.status(200).json({
                status: true,
                message: "Job applications retrieved successfully",
                data: {
                    applications: applications,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / parseInt(limit)),
                        totalItems: total,
                        limit: parseInt(limit)
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
            if (feedback) {
                if (!application.feedback) {
                    application.feedback = {};
                }
                application.feedback.client_feedback = feedback;
            }

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

            // Send notification to freelancer if application is accepted
            if (status === 'selected') {
                try {
                    const io = getIO();
                    if (io) {
                        const notification = {
                            type: 'application_accepted',
                            title: '🎉 Application Accepted!',
                            message: `Congratulations! Your application for "${application.job_id.job_title}" has been accepted by the client.`,
                            application_id: application._id,
                            job_title: application.job_id.job_title,
                            timestamp: new Date().toISOString()
                        };
                        
                        // Send to freelancer's room
                        io.to(`user:${application.freelancer_id}`).emit('notification', notification);
                        console.log('📧 Sent acceptance notification to freelancer:', application.freelancer_id);
                    }
                } catch (notificationError) {
                    console.error('Error sending notification:', notificationError);
                    // Don't fail the request if notification fails
                }
            }

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
                // Fetch freelancer's resume from database
                console.log('Fetching freelancer info for userId:', userId);
                console.log('FreelancerInfo model:', FreelancerInfo);
                
                let freelancerInfo;
                try {
                    freelancerInfo = await FreelancerInfo.findOne({ personId: userId });
                    console.log('Found freelancer info:', freelancerInfo);
                } catch (dbError) {
                    console.error('Database error fetching freelancer info:', dbError);
                    freelancerInfo = null;
                }
                
                let resumeLink = {
                    url: '',
                    title: 'Resume',
                    description: 'Freelancer Resume',
                    uploaded_at: new Date()
                };
                
                // Use freelancer's actual resume if available
                if (freelancerInfo && freelancerInfo.resume_link && typeof freelancerInfo.resume_link === 'string' && freelancerInfo.resume_link.trim() !== '') {
                    resumeLink.url = freelancerInfo.resume_link.trim();
                    console.log('Using freelancer resume:', resumeLink.url);
                } else {
                    console.log('No resume found or freelancer info not available, using empty string');
                    resumeLink.url = '';
                }
                
                // Ensure resume_link.url is always a valid string
                if (typeof resumeLink.url !== 'string') {
                    console.log('Resume link is not a string, converting to empty string');
                    resumeLink.url = '';
                }
                
                // Additional validation to prevent any weird characters
                if (resumeLink.url && resumeLink.url.length > 0) {
                    // Check if URL looks valid (basic check)
                    if (!resumeLink.url.includes('http') && !resumeLink.url.includes('www') && !resumeLink.url.includes('.')) {
                        console.log('Resume link does not look like a valid URL, using empty string');
                        resumeLink.url = '';
                    }
                }
                
                // Final safety check - ensure it's a clean string
                resumeLink.url = String(resumeLink.url || '').trim();
                
                console.log('Creating saved job with resume_link:', resumeLink);
                
                // Create a saved job entry without application - simplified approach
                const savedJob = new JobApply({
                    job_id: job_id,
                    freelancer_id: userId,
                    application_status: 'saved',
                    is_saved: true,
                    resume_link: {
                        url: resumeLink.url || '', // Ensure it's always a string
                        title: 'Resume',
                        description: 'Freelancer Resume',
                        uploaded_at: new Date()
                    },
                    cover_letter: '',
                    job_requires_cover_letter: false,
                    application_source: 'platform',
                    communication_preferences: {
                        preferred_method: 'email'
                    },
                    application_tracking: {
                        applied_at: new Date(),
                        last_updated: new Date()
                    },
                    portfolio_links: []
                });

                try {
                await savedJob.save();

                // Update job analytics
                job.analytics.total_saves += 1;
                await job.save();

                return res.status(200).json({
                    status: true,
                    message: "Job saved successfully",
                    data: { is_saved: true }
                });
                } catch (saveError) {
                    console.error("Error saving job:", saveError);
                    return res.status(500).json({
                        status: false,
                        message: "Failed to save job",
                        error: saveError.message
                    });
                }
            }

        } catch (error) {
            console.error("Error toggling job save:", error);
            console.error("Error details:", error);
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

            console.log('Getting saved jobs for userId:', userId, 'userRole:', userRole);

            if (userRole !== 'freelancer') {
                return res.status(403).json({
                    status: false,
                    message: "Only freelancers can view saved jobs"
                });
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            // First, let's check what saved jobs exist for this user
            const allSavedJobs = await JobApply.find({ 
                freelancer_id: userId, 
                is_saved: true 
            });
            console.log('All saved jobs for user:', allSavedJobs.length);
            console.log('Sample saved job:', allSavedJobs[0]);

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

            console.log('Found saved jobs after populate:', savedJobs.length, 'total:', total);
            console.log('Sample populated job:', savedJobs[0]);

            console.log('About to return response with structure:');
            console.log('- savedJobs length:', savedJobs.length);
            console.log('- savedJobs[0]:', savedJobs[0]);
            console.log('- total:', total);
            
            const responseData = {
                status: true,
                message: "Saved jobs retrieved successfully",
                data: {
                    saved_jobs: savedJobs,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / parseInt(limit)),
                        totalItems: total,
                        limit: parseInt(limit)
                    }
                }
            };
            
            console.log('Response data structure:', JSON.stringify(responseData, null, 2));
            
            return res.status(200).json(responseData);

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

