import AuditLog from '../models/AuditLog.js';

/**
 * Middleware to log actions to audit log
 * Usage: Add to routes that need audit logging
 */
export const logAudit = (action, resource) => {
    return async (req, res, next) => {
        // Store original send function
        const originalSend = res.send;

        // Override send to capture response
        res.send = function (data) {
            // Restore original send
            res.send = originalSend;

            // Log audit entry (non-blocking)
            if (req.user) {
                const logEntry = {
                    user: req.user._id,
                    action,
                    resource,
                    resourceId: req.params.id || req.body._id || null,
                    details: {
                        method: req.method,
                        path: req.originalUrl,
                        body: sanitizeBody(req.body),
                        query: req.query,
                    },
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('user-agent'),
                    status:
                        res.statusCode >= 200 && res.statusCode < 300
                            ? 'SUCCESS'
                            : 'FAILURE',
                };

                // Add error message if failed
                if (logEntry.status === 'FAILURE') {
                    try {
                        const parsedData =
                            typeof data === 'string' ? JSON.parse(data) : data;
                        logEntry.errorMessage =
                            parsedData.message || 'Unknown error';
                    } catch (e) {
                        logEntry.errorMessage = 'Failed to parse error message';
                    }
                }

                // Save log asynchronously without blocking response
                AuditLog.create(logEntry).catch((err) => {
                    console.error('Failed to create audit log:', err);
                });
            }

            // Send the response
            return originalSend.call(this, data);
        };

        next();
    };
};

/**
 * Helper function to create audit log manually
 */
export const createAuditLog = async (data) => {
    try {
        await AuditLog.create(data);
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
};

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeBody(body) {
    if (!body) return null;

    const sanitized = { ...body };

    // Remove sensitive fields
    const sensitiveFields = [
        'password',
        'currentPassword',
        'newPassword',
        'token',
        'secret',
    ];
    sensitiveFields.forEach((field) => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });

    return sanitized;
}
