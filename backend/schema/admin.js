import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'moderator'],
        default: 'admin'
    },
    permissions: {
        users: {
            view: { type: Boolean, default: true },
            edit: { type: Boolean, default: true },
            delete: { type: Boolean, default: false },
            suspend: { type: Boolean, default: true }
        },
        freelancers: {
            view: { type: Boolean, default: true },
            edit: { type: Boolean, default: true },
            delete: { type: Boolean, default: false },
            approve: { type: Boolean, default: true },
            suspend: { type: Boolean, default: true }
        },
        projects: {
            view: { type: Boolean, default: true },
            edit: { type: Boolean, default: true },
            delete: { type: Boolean, default: true },
            moderate: { type: Boolean, default: true }
        },
        jobs: {
            view: { type: Boolean, default: true },
            edit: { type: Boolean, default: true },
            delete: { type: Boolean, default: true },
            block: { type: Boolean, default: true },
            moderate: { type: Boolean, default: true }
        },
        bids: {
            view: { type: Boolean, default: true },
            moderate: { type: Boolean, default: true },
            delete: { type: Boolean, default: true }
        },
        payments: {
            view: { type: Boolean, default: true },
            refund: { type: Boolean, default: false },
            disputes: { type: Boolean, default: true }
        },
        analytics: {
            view: { type: Boolean, default: true },
            export: { type: Boolean, default: false }
        }
    },
    profile_pic: { type: String },
    phone: { type: String, trim: true },
    status: { type: Number, default: 1 }, // 0 for Inactive, 1 for Active
    last_login: { type: String },
    loginAttempts: { type: Number, default: 0, max: 5 },
    lockUntil: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'tbladmin' },
    twoFactorEnabled: { type: Boolean, default: false },
    lastPasswordChange: { type: String, default: () => new Date().toISOString() },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() }
});

// Virtual for account lock status
adminSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Update updatedAt before saving
adminSchema.pre('save', function(next) {
    this.updatedAt = new Date().toISOString();
    next();
});

export default mongoose.model('tbladmin', adminSchema);