import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        action: {
            type: String,
            required: true,
            enum: [
                // Auth actions
                'LOGIN',
                'LOGOUT',
                'REGISTER',
                'PASSWORD_CHANGE',
                'PASSWORD_RESET',
                // User management
                'USER_CREATE',
                'USER_UPDATE',
                'USER_DELETE',
                'USER_ACTIVATE',
                'USER_DEACTIVATE',
                // Student actions
                'STUDENT_CREATE',
                'STUDENT_UPDATE',
                'STUDENT_DELETE',
                // Payment actions
                'PAYMENT_CREATE',
                'PAYMENT_UPDATE',
                'PAYMENT_DELETE',
                // Expense actions
                'EXPENSE_CREATE',
                'EXPENSE_UPDATE',
                'EXPENSE_DELETE',
                // Event actions
                'EVENT_CREATE',
                'EVENT_UPDATE',
                'EVENT_DELETE',
                // Settings actions
                'SETTINGS_UPDATE',
                // Other
                'OTHER',
            ],
        },
        resource: {
            type: String,
            required: true, // e.g., 'User', 'Student', 'Payment'
        },
        resourceId: {
            type: String, // ID of the affected resource
        },
        details: {
            type: mongoose.Schema.Types.Mixed, // Store additional context
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
        status: {
            type: String,
            enum: ['SUCCESS', 'FAILURE'],
            default: 'SUCCESS',
        },
        errorMessage: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
