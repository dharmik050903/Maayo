import mongoose from "mongoose";

const permissionRequestSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tbladmin',
        required: true
    },
    requesterName: {
        type: String,
        required: true
    },
    requesterEmail: {
        type: String,
        required: true
    },
    requestType: {
        type: String,
        required: true,
        enum: [
            'delete_user',
            'suspend_user', 
            'unsuspend_user',
            'activate_user',
            'edit_user',
            'delete_project',
            'edit_project',
            'manage_bids',
            'manage_reviews'
        ]
    },
    targetResource: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    targetResourceName: {
        type: String,
        required: true
    },
    targetResourceType: {
        type: String,
        required: true,
        enum: ['user', 'project', 'bid', 'review']
    },
    reason: {
        type: String,
        required: true,
        maxlength: 500
    },
    urgency: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    additionalData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tbladmin'
    },
    reviewedAt: {
        type: Date
    },
    reviewNotes: {
        type: String,
        maxlength: 500
    },
    executionStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    executionError: {
        type: String
    },
    executedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient querying
permissionRequestSchema.index({ requester: 1, status: 1 });
permissionRequestSchema.index({ status: 1, createdAt: -1 });

const PermissionRequest = mongoose.model('PermissionRequest', permissionRequestSchema);

export default PermissionRequest;