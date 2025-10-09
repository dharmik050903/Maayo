import mongoose from "mongoose";

const jobApplySchema = new mongoose.Schema({
    // Job and freelancer references
    job_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'tbljobposted', 
        required: true 
    },
    freelancer_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'tblpersonmaster', 
        required: true 
    },
    
    // Application details
    application_status: { 
        type: String, 
        enum: ['applied', 'viewed', 'shortlisted', 'interviewed', 'selected', 'rejected', 'withdrawn', 'saved'], 
        default: 'applied' 
    },
    
    // Application content
    cover_letter: { 
        type: String, 
        maxlength: 2000,
        required: function() {
            // Required if job requires cover letter
            return this.job_requires_cover_letter;
        }
    },
    
    // Resume and portfolio
    resume_link: {
        url: { type: String }, // Not required for saved jobs
        title: { type: String, default: 'Resume' },
        description: { type: String, maxlength: 200 },
        uploaded_at: { type: Date, default: Date.now }
    },
    
    portfolio_links: [{
        title: { type: String, required: true },
        url: { type: String, required: true },
        description: { type: String, maxlength: 500 }
    }],
    
    // Additional information
    expected_salary: {
        amount: { type: Number },
        currency: { type: String, default: 'INR' },
        salary_type: { 
            type: String, 
            enum: ['monthly', 'yearly', 'hourly', 'project-based'], 
            default: 'monthly' 
        }
    },
    
    availability: {
        start_date: { type: Date },
        notice_period: { 
            type: String, 
            enum: ['immediate', '1 week', '2 weeks', '1 month', '2 months', '3+ months'] 
        },
        working_hours: { 
            type: String, 
            enum: ['part-time', 'full-time', 'flexible'] 
        }
    },
    
    // Skills assessment
    skills_match: {
        matched_skills: [{
            skill: { type: String },
            skill_id: { type: mongoose.Schema.Types.ObjectId, ref: 'tblskills' },
            proficiency_level: { 
                type: String, 
                enum: ['beginner', 'intermediate', 'advanced', 'expert'] 
            },
            years_experience: { type: Number }
        }],
        missing_skills: [String],
        match_percentage: { type: Number, min: 0, max: 100 }
    },
    
    // Client interaction tracking
    client_interactions: [{
        interaction_type: { 
            type: String, 
            enum: ['viewed', 'contacted', 'interview_scheduled', 'interview_completed', 'feedback_given', 'applied', 'shortlisted', 'interviewed', 'selected', 'rejected', 'withdrawn'] 
        },
        interaction_date: { type: Date, default: Date.now },
        notes: { type: String, maxlength: 1000 },
        initiated_by: { 
            type: String, 
            enum: ['client', 'freelancer', 'system'] 
        }
    }],
    
    // Application metadata
    application_source: { 
        type: String, 
        enum: ['platform', 'referral', 'direct'], 
        default: 'platform' 
    },
    referral_source: { type: String },
    
    // Flags and preferences
    is_saved: { type: Boolean, default: false },
    is_favorite: { type: Boolean, default: false },
    auto_apply: { type: Boolean, default: false },
    
    // Communication preferences
    communication_preferences: {
        preferred_method: { 
            type: String, 
            enum: ['email', 'phone', 'platform_message'], 
            default: 'email' 
        },
        timezone: { type: String },
        availability_hours: { type: String }
    },
    
    // Application tracking
    application_tracking: {
        applied_at: { type: Date, default: Date.now },
        last_viewed_by_client: { type: Date },
        last_updated: { type: Date, default: Date.now },
        response_deadline: { type: Date },
        interview_scheduled_at: { type: Date },
        decision_made_at: { type: Date }
    },
    
    // Notes and feedback
    client_notes: { type: String, maxlength: 2000 },
    freelancer_notes: { type: String, maxlength: 2000 },
    rejection_reason: { type: String, maxlength: 1000 },
    
    // Rating and feedback
    client_rating: { 
        type: Number, 
        min: 1, 
        max: 5 
    },
    freelancer_rating: { 
        type: Number, 
        min: 1, 
        max: 5 
    },
    feedback: {
        client_feedback: { type: String, maxlength: 1000 },
        freelancer_feedback: { type: String, maxlength: 1000 }
    },
    
    // Timestamps
    created_at: { 
        type: Date, 
        default: Date.now 
    },
    updated_at: { 
        type: Date, 
        default: Date.now 
    }
});

// Indexes for better query performance
jobApplySchema.index({ job_id: 1, freelancer_id: 1 }, { unique: true }); // Prevent duplicate applications
jobApplySchema.index({ freelancer_id: 1, application_status: 1 });
jobApplySchema.index({ job_id: 1, application_status: 1 });
jobApplySchema.index({ application_status: 1, created_at: -1 });
jobApplySchema.index({ 'application_tracking.applied_at': -1 });
jobApplySchema.index({ is_saved: 1, freelancer_id: 1 });
jobApplySchema.index({ is_favorite: 1, freelancer_id: 1 });

// Pre-save middleware to update timestamps
jobApplySchema.pre('save', function(next) {
    this.updated_at = new Date();
    this.application_tracking.last_updated = new Date();
    
    // Update last viewed by client when status changes to viewed
    if (this.isModified('application_status') && this.application_status === 'viewed') {
        this.application_tracking.last_viewed_by_client = new Date();
    }
    
    // Set decision made date when status changes to final states
    if (this.isModified('application_status') && 
        ['selected', 'rejected', 'withdrawn'].includes(this.application_status)) {
        this.application_tracking.decision_made_at = new Date();
    }
    
    next();
});

// Virtual for application age
jobApplySchema.virtual('application_age_days').get(function() {
    const now = new Date();
    const appliedAt = new Date(this.application_tracking.applied_at);
    const diffTime = now - appliedAt;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for days since last client view
jobApplySchema.virtual('days_since_last_view').get(function() {
    if (!this.application_tracking.last_viewed_by_client) return null;
    
    const now = new Date();
    const lastView = new Date(this.application_tracking.last_viewed_by_client);
    const diffTime = now - lastView;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for formatted expected salary
jobApplySchema.virtual('formatted_expected_salary').get(function() {
    if (!this.expected_salary?.amount) return null;
    
    const { amount, currency, salary_type } = this.expected_salary;
    return `${currency} ${amount.toLocaleString()} ${salary_type}`;
});

// Static method to get application statistics for a freelancer
jobApplySchema.statics.getFreelancerStats = function(freelancerId) {
    return this.aggregate([
        { $match: { freelancer_id: freelancerId } },
        {
            $group: {
                _id: null,
                total_applications: { $sum: 1 },
                total_saved: { $sum: { $cond: ['$is_saved', 1, 0] } },
                total_favorites: { $sum: { $cond: ['$is_favorite', 1, 0] } },
                applications_by_status: {
                    $push: {
                        status: '$application_status',
                        applied_at: '$application_tracking.applied_at'
                    }
                }
            }
        }
    ]);
};

// Static method to get application statistics for a job
jobApplySchema.statics.getJobStats = function(jobId) {
    return this.aggregate([
        { $match: { job_id: jobId } },
        {
            $group: {
                _id: null,
                total_applications: { $sum: 1 },
                applications_by_status: {
                    $push: {
                        status: '$application_status',
                        freelancer_id: '$freelancer_id',
                        applied_at: '$application_tracking.applied_at'
                    }
                }
            }
        }
    ]);
};

export default mongoose.model('tbljobapply', jobApplySchema);

