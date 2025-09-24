import mongoose, { Mongoose } from "mongoose";

const personMaster = new mongoose.Schema({
    personId: { type:mongoose.Schema.Types.ObjectId},
    googleId: { type: String, unique: true, sparse: true },//for OAuth ID 
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    personName: { type: String },
    profile_pic: { type: String },
    last_login: { type: String },

    password: { type: String, required: function() { return !this.googleId; } },
    email: { type: String, required: true ,unique: true},

    contact_number: { type: String,}, 
    country: { type: String, },
    user_type: { type: String, required: true }, // Freelance or Client 
    
    // 0 for Inactive and 1 for Active
    status: { type: Number , default:1},
    email_verified: { type: Number, default:0 },  // 0 for Unverified and 1 for Verified
    phone_verified: { type: Number, default:0 },  // 0 for Unverified and 1 for Verified
    
    // Subscription fields
    subscription: {
        plan_id: { type: String, default: 'free' },
        status: { type: String, default: 'active' },
        current_period_end: { type: Date },
        features: {
            max_projects: { type: Number, default: 3 },
            max_bids_per_month: { type: Number, default: 5 },
            ai_proposals: { type: Boolean, default: false },
            priority_support: { type: Boolean, default: false },
            advanced_analytics: { type: Boolean, default: false },
            custom_branding: { type: Boolean, default: false },
            api_access: { type: Boolean, default: false },
            escrow_protection: { type: Boolean, default: false }
        }
    },
    
    createdAt: { type: String, default: () => new Date().toISOString() },
})

export default mongoose.model('tblpersonmaster', personMaster);