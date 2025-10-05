import mongoose from "mongoose";

const jobPostedSchema = new mongoose.Schema({
    // Client who posted the job
    client_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'tblpersonmaster', 
        required: true 
    },
    
    // Job basic information
    job_title: { 
        type: String, 
        required: true, 
        trim: true,
        maxlength: 200
    },
    job_description: { 
        type: String, 
        required: true,
        maxlength: 5000
    },
    job_type: { 
        type: String, 
        enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship'], 
        required: true 
    },
    work_mode: { 
        type: String, 
        enum: ['remote', 'onsite', 'hybrid'], 
        required: true 
    },
    
    // Location information
    location: {
        country: { type: String, required: true },
        state: { type: String },
        city: { type: String, required: true },
        address: { type: String }
    },
    
    // Salary information
    salary: {
        min_salary: { type: Number, required: true },
        max_salary: { type: Number, required: true },
        currency: { type: String, default: 'INR' },
        salary_type: { 
            type: String, 
            enum: ['monthly', 'yearly', 'hourly', 'project-based'], 
            default: 'monthly' 
        }
    },
    
    // Skills and requirements
    required_skills: [{
        skill: { type: String, required: true },
        skill_id: { type: mongoose.Schema.Types.ObjectId, ref: 'tblskills' },
        proficiency_level: { 
            type: String, 
            enum: ['beginner', 'intermediate', 'advanced', 'expert'], 
            default: 'intermediate' 
        }
    }],
    
    // Experience and education requirements
    experience_required: {
        min_experience: { type: Number, default: 0 }, // in years
        max_experience: { type: Number, default: 10 },
        experience_type: { 
            type: String, 
            enum: ['any', 'relevant', 'total'], 
            default: 'any' 
        }
    },
    
    education_required: {
        degree: { type: String },
        field: { type: String },
        minimum_grade: { type: String }
    },
    
    // Job timeline
    application_deadline: { 
        type: Date, 
        required: true 
    },
    job_start_date: { type: Date },
    job_duration: { 
        type: String, 
        enum: ['1-3 months', '3-6 months', '6-12 months', '1+ years', 'permanent'] 
    },
    
    // Job status and visibility
    status: { 
        type: String, 
        enum: ['draft', 'active', 'paused', 'closed', 'filled'], 
        default: 'draft' 
    },
    is_active: { type: Boolean, default: true },
    is_featured: { type: Boolean, default: false },
    
    // Application settings
    application_settings: {
        require_resume_link: { type: Boolean, default: true },
        allow_portfolio_links: { type: Boolean, default: true },
        require_cover_letter: { type: Boolean, default: false },
        max_applications: { type: Number, default: 100 },
        application_fee: { type: Number, default: 0 } // For premium job postings
    },
    
    // Company information
    company_info: {
        company_name: { type: String, required: true },
        company_size: { 
            type: String, 
            enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] 
        },
        company_website: { type: String },
        company_description: { type: String, maxlength: 1000 }
    },
    
    // Contact information
    contact_info: {
        contact_person: { type: String, required: true },
        contact_email: { type: String, required: true },
        contact_phone: { type: String },
        alternate_email: { type: String }
    },
    
    // Analytics and tracking
    analytics: {
        total_views: { type: Number, default: 0 },
        total_applications: { type: Number, default: 0 },
        total_saves: { type: Number, default: 0 },
        last_viewed: { type: Date },
        last_application: { type: Date }
    },
    
    // SEO and search optimization
    tags: [String],
    keywords: [String],
    
    // Timestamps
    created_at: { 
        type: Date, 
        default: Date.now 
    },
    updated_at: { 
        type: Date, 
        default: Date.now 
    },
    published_at: { type: Date },
    closed_at: { type: Date }
});

// Indexes for better query performance
jobPostedSchema.index({ client_id: 1, status: 1 });
jobPostedSchema.index({ status: 1, is_active: 1 });
jobPostedSchema.index({ 'location.city': 1, 'location.country': 1 });
jobPostedSchema.index({ 'salary.min_salary': 1, 'salary.max_salary': 1 });
jobPostedSchema.index({ job_type: 1, work_mode: 1 });
jobPostedSchema.index({ application_deadline: 1 });
jobPostedSchema.index({ created_at: -1 });
jobPostedSchema.index({ is_featured: 1, created_at: -1 });

// Text index for search functionality
jobPostedSchema.index({
    job_title: 'text',
    job_description: 'text',
    'required_skills.skill': 'text',
    'company_info.company_name': 'text',
    tags: 'text',
    keywords: 'text'
}, {
    weights: {
        job_title: 10,
        'required_skills.skill': 8,
        'company_info.company_name': 6,
        job_description: 4,
        tags: 3,
        keywords: 2
    },
    name: 'JobTextIndex'
});

// Pre-save middleware to update timestamps
jobPostedSchema.pre('save', function(next) {
    this.updated_at = new Date();
    
    // Set published_at when status changes to active
    if (this.isModified('status') && this.status === 'active' && !this.published_at) {
        this.published_at = new Date();
    }
    
    // Set closed_at when status changes to closed/filled
    if (this.isModified('status') && ['closed', 'filled'].includes(this.status) && !this.closed_at) {
        this.closed_at = new Date();
    }
    
    next();
});

// Virtual for checking if job is still accepting applications
jobPostedSchema.virtual('is_accepting_applications').get(function() {
    const now = new Date();
    return this.status === 'active' && 
           this.is_active && 
           this.application_deadline > now &&
           this.analytics.total_applications < this.application_settings.max_applications;
});

// Virtual for formatted salary range
jobPostedSchema.virtual('formatted_salary').get(function() {
    const { min_salary, max_salary, currency, salary_type } = this.salary;
    return `${currency} ${min_salary.toLocaleString()} - ${max_salary.toLocaleString()} ${salary_type}`;
});

// Virtual for days until deadline
jobPostedSchema.virtual('days_until_deadline').get(function() {
    const now = new Date();
    const deadline = new Date(this.application_deadline);
    const diffTime = deadline - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

export default mongoose.model('tbljobposted', jobPostedSchema);

