import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    project_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'tblproject', 
        required: true 
    },
    reviewer_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'tblpersonmaster', 
        required: true 
    },
    reviewee_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'tblpersonmaster', 
        required: true 
    },
    reviewer_type: { 
        type: String, 
        enum: ['client', 'freelancer'], 
        required: true 
    },
    reviewee_type: { 
        type: String, 
        enum: ['client', 'freelancer'], 
        required: true 
    },
    rating: { 
        type: Number, 
        required: true, 
        min: 1, 
        max: 5 
    },
    comment: { 
        type: String, 
        required: true, 
        maxlength: 1000 
    },
    // Additional review criteria
    communication_rating: { 
        type: Number, 
        min: 1, 
        max: 5, 
        default: 5 
    },
    quality_rating: { 
        type: Number, 
        min: 1, 
        max: 5, 
        default: 5 
    },
    timeliness_rating: { 
        type: Number, 
        min: 1, 
        max: 5, 
        default: 5 
    },
    professionalism_rating: { 
        type: Number, 
        min: 1, 
        max: 5, 
        default: 5 
    },
    // Review status
    is_verified: { 
        type: Number, 
        default: 0 
    }, // 0 - unverified, 1 - verified
    is_public: { 
        type: Number, 
        default: 1 
    }, // 0 - private, 1 - public
    createdAt: { 
        type: String, 
        default: () => new Date().toISOString() 
    },
    updatedAt: { 
        type: String, 
        default: null 
    }
});

// Index for efficient queries
reviewSchema.index({ project_id: 1, reviewer_id: 1 });
reviewSchema.index({ reviewee_id: 1 });
reviewSchema.index({ reviewer_type: 1, reviewee_type: 1 });

export default mongoose.model('tblreview', reviewSchema);

