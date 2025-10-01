import mongoose from "mongoose";

const bankDetailsSchema = new mongoose.Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'tblpersonmaster', 
        required: true 
    },
    // Bank Account Information
    account_holder_name: { 
        type: String, 
        required: true,
        trim: true
    },
    account_number: { 
        type: String, 
        required: true,
        trim: true
    },
    ifsc_code: { 
        type: String, 
        required: true,
        trim: true,
        uppercase: true
    },
    bank_name: { 
        type: String, 
        required: true,
        trim: true
    },
    branch_name: { 
        type: String, 
        trim: true
    },
    // Additional Information
    account_type: { 
        type: String, 
        enum: ['savings', 'current', 'salary'], 
        default: 'savings' 
    },
    // Verification Status
    is_verified: { 
        type: Number, 
        default: 0 
    }, // 0 - not verified, 1 - verified
    verification_date: { 
        type: String 
    },
    // UPI Information (Alternative)
    upi_id: { 
        type: String, 
        trim: true
    },
    // Status
    is_active: { 
        type: Number, 
        default: 1 
    }, // 0 - inactive, 1 - active
    is_primary: { 
        type: Number, 
        default: 0 
    }, // 0 - not primary, 1 - primary account
    
    // Timestamps
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
bankDetailsSchema.index({ user_id: 1, is_active: 1 });
bankDetailsSchema.index({ user_id: 1, is_primary: 1 });

// Ensure only one primary account per user
bankDetailsSchema.pre('save', async function(next) {
    if (this.is_primary === 1) {
        await this.constructor.updateMany(
            { user_id: this.user_id, _id: { $ne: this._id } },
            { is_primary: 0 }
        );
    }
    next();
});

export default mongoose.model('tblbankdetails', bankDetailsSchema);

