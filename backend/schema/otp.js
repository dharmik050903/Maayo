import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    // Email address
    email: { 
        type: String, 
        required: true 
    },
    // The OTP code
    otp_code: { 
        type: String, 
        required: true 
    },
    // Purpose of OTP: 'login', 'password_reset'
    purpose: { 
        type: String, 
        enum: ['login', 'password_reset'], 
        required: true 
    },
    // User ID if available (for existing users)
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'tblpersonmaster' 
    },
    // OTP status: 'pending', 'verified', 'expired', 'used'
    status: { 
        type: String, 
        enum: ['pending', 'verified', 'expired', 'used'], 
        default: 'pending' 
    },
    // Number of attempts made
    attempts: { 
        type: Number, 
        default: 0 
    },
    // Maximum attempts allowed
    max_attempts: { 
        type: Number, 
        default: 3 
    },
    // Expiration time
    expires_at: { 
        type: Date, 
        required: true 
    },
    // When OTP was verified
    verified_at: { 
        type: Date 
    },
    // IP address for security
    ip_address: { 
        type: String 
    },
    // User agent for security
    user_agent: { 
        type: String 
    },
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
otpSchema.index({ email: 1, purpose: 1 });
otpSchema.index({ otp_code: 1, status: 1 });
otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

// Method to check if OTP is valid
otpSchema.methods.isValid = function() {
    return this.status === 'pending' && 
           this.attempts < this.max_attempts && 
           new Date() < this.expires_at;
};

// Method to mark OTP as verified
otpSchema.methods.markAsVerified = function() {
    this.status = 'verified';
    this.verified_at = new Date();
    this.updatedAt = new Date().toISOString();
};

// Method to increment attempts
otpSchema.methods.incrementAttempts = function() {
    this.attempts += 1;
    if (this.attempts >= this.max_attempts) {
        this.status = 'expired';
    }
    this.updatedAt = new Date().toISOString();
};

export default mongoose.model('tblotp', otpSchema);
