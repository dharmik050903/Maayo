import mongoose from "mongoose";

const project = new mongoose.Schema({
    personid : { type: mongoose.Schema.Types.ObjectId, ref: 'tblpersonmaster' },
    title : { type: String, required: true },
    description : { type: String, required: true },
    skills_required : [
        {
            skill: { type: String, required: true },
            skill_id :{ type: mongoose.Schema.Types.ObjectId, ref: 'tblskills', required: true }
        }
    ],
    budget : { type: Number, required: true },
    duration : { type: Number, required: true, default :0}, //in days
    status : { type: String, default: 'open' },
    ispending : { type: Number, default: 0 }, // 0 - No, 1 - Yes
    isactive : { type: Number, default: 1 },// 0 - no, 1 - Yes
    iscompleted : { type: Number, default: 0 },// 0 - No, 1 - Yes
    completed_at : { type: String, default: '' },
    freelancerid : [
        {
            freelancerid: { type: mongoose.Schema.Types.ObjectId, ref: 'tblpersonmaster' },
            freelancername : { type: String ,  default : ''},
        }
    ],
    // Bid-related fields
    accepted_bid_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'tblbid' 
    },
    bid_deadline: { 
        type: String 
    }, // Deadline for submitting bids
    min_bid_amount: { 
        type: Number 
    },
    max_bid_amount: { 
        type: Number 
    },
    // Project completion and review status
    completion_date: { 
        type: String 
    },
    client_reviewed: { 
        type: Number, 
        default: 0 
    }, // 0 - not reviewed, 1 - reviewed
    freelancer_reviewed: { 
        type: Number, 
        default: 0 
    }, // 0 - not reviewed, 1 - reviewed
    
    // Escrow Payment Fields
    escrow_amount: { 
        type: Number 
    }, // Amount held in escrow
    escrow_order_id: { 
        type: String 
    }, // Razorpay order ID for escrow
    escrow_payment_id: { 
        type: String 
    }, // Razorpay payment ID
    escrow_status: { 
        type: String, 
        enum: ['not_created', 'pending', 'completed', 'failed'], 
        default: 'not_created' 
    },
    escrow_verified_at: { 
        type: String 
    },
    final_project_amount: { 
        type: Number 
    }, // Final agreed amount after bid acceptance
    
    createdAt: { type: String, default: () => new Date().toISOString() },
})

// Text index to enable free-text search across key fields
project.index({
    title: 'text',
    description: 'text',
    'skills_required.skill': 'text'
}, {
    weights: {
        title: 5,
        description: 3,
        'skills_required.skill': 4
    },
    name: 'ProjectTextIndex'
});

export default mongoose.model("tblproject", project);