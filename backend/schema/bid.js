import mongoose from "mongoose";

const bidSchema = new mongoose.Schema({
    project_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'tblproject', 
        required: true 
    },
    freelancer_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'tblpersonmaster', 
        required: true 
    },
    bid_amount: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    proposed_duration: { 
        type: Number, 
        required: true, 
        min: 1 
    }, // in days
    cover_letter: { 
        type: String, 
        required: true, 
        maxlength: 2000 
    },
    // Bid status: pending, accepted, rejected, withdrawn
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected', 'withdrawn'], 
        default: 'pending' 
    },
    // Additional bid details
    milestones: [{
        _id: false,
        title: { type: String, required: true },
        description: { type: String },
        amount: { type: Number, required: true },
        due_date: { type: String },
        is_completed: { type: Number, default: 0 }, // 0 - not completed, 1 - completed
        completed_at: { type: String }, // When milestone was completed
        payment_released: { type: Number, default: 0 }, // 0 - not released, 1 - released
        payment_amount: { type: Number }, // Actual amount released
        payment_id: { type: String }, // Razorpay payout ID
        payment_released_at: { type: String } // When payment was released
    }],
    // Timeline and availability
    start_date: { 
        type: String 
    },
    availability_hours: { 
        type: Number, 
        default: 40 
    }, // hours per week
    // Client interaction
    client_message: { 
        type: String, 
        maxlength: 1000 
    },
    client_decision_date: { 
        type: String 
    },
    // Bid metadata
    is_featured: { 
        type: Number, 
        default: 0 
    }, // 0 - normal, 1 - featured
    bid_rank: { 
        type: Number, 
        default: 0 
    }, // For sorting/ranking bids
    createdAt: { 
        type: String, 
        default: () => new Date().toISOString() 
    },
    updatedAt: { 
        type: String, 
        default: null 
    }
});

// Indexes for efficient queries
bidSchema.index({ project_id: 1, status: 1 });
bidSchema.index({ freelancer_id: 1, status: 1 });
bidSchema.index({ project_id: 1, bid_amount: 1 });
bidSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('tblbid', bidSchema);

