import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all audit logs (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            action,
            resource,
            userId,
            startDate,
            endDate,
        } = req.query;

        const query = {};

        // Filter by action
        if (action) {
            query.action = action;
        }

        // Filter by resource
        if (resource) {
            query.resource = resource;
        }

        // Filter by user
        if (userId) {
            query.user = userId;
        }

        // Filter by date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }

        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .populate('user', 'username fullName role')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip)
                .lean(),
            AuditLog.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs',
        });
    }
});

// Get audit log statistics (admin only)
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const matchQuery = {};
        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
            if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
        }

        const stats = await AuditLog.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 },
                    successCount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0],
                        },
                    },
                    failureCount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'FAILURE'] }, 1, 0],
                        },
                    },
                },
            },
            { $sort: { count: -1 } },
        ]);

        // Get top users by activity
        const topUsers = await AuditLog.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$user',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo',
                },
            },
            { $unwind: '$userInfo' },
            {
                $project: {
                    userId: '$_id',
                    username: '$userInfo.username',
                    fullName: '$userInfo.fullName',
                    count: 1,
                },
            },
        ]);

        res.json({
            success: true,
            data: {
                actionStats: stats,
                topUsers,
            },
        });
    } catch (error) {
        console.error('Get audit stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit statistics',
        });
    }
});

// Get my audit logs (user's own logs)
router.get('/me', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            AuditLog.find({ user: req.user._id })
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip)
                .lean(),
            AuditLog.countDocuments({ user: req.user._id }),
        ]);

        res.json({
            success: true,
            data: logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get my audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your audit logs',
        });
    }
});

export default router;
