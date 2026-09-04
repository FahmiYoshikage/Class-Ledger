import express from 'express';
import Session from '../models/Session.js';
import { authenticate } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Helper to parse user agent
function parseUserAgent(userAgent) {
    const ua = userAgent || '';

    // Simple browser detection
    let browser = 'Unknown';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    // Simple OS detection
    let os = 'Unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'MacOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';

    // Simple device detection
    let device = 'Desktop';
    if (ua.includes('Mobile')) device = 'Mobile';
    else if (ua.includes('Tablet')) device = 'Tablet';

    return { browser, os, device };
}

// @route   GET /api/sessions
// @desc    Get all active sessions for current user
// @access  Private
router.get('/', authenticate, async (req, res) => {
    try {
        // Get current session token
        const currentToken = req
            .header('Authorization')
            ?.replace('Bearer ', '');

        // Find active sessions
        const sessions = await Session.find({
            user: req.user._id,
            isActive: true,
            expiresAt: { $gt: new Date() },
        }).sort({ lastActivity: -1 });

        // If no sessions exist but user is authenticated, create one for current session
        if (sessions.length === 0 && currentToken) {
            try {
                const newSession = await createSession(
                    req.user._id,
                    currentToken,
                    req
                );
                sessions.push(newSession);
            } catch (error) {
                console.error('Error creating session:', error);
                // Continue anyway, just return empty array
            }
        }

        // Mark current session
        const sessionsWithCurrent = sessions.map((session) => ({
            ...session.toObject(),
            isCurrent: session.token === currentToken,
        }));

        res.json({
            success: true,
            data: sessionsWithCurrent,
        });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sessions',
            error: error.message,
        });
    }
});

// @route   DELETE /api/sessions/:id
// @desc    Terminate a specific session
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const session = await Session.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
            });
        }

        // Deactivate session
        session.isActive = false;
        await session.save();

        res.json({
            success: true,
            message: 'Session terminated successfully',
        });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to terminate session',
        });
    }
});

// @route   DELETE /api/sessions/terminate-all
// @desc    Terminate all sessions except current
// @access  Private
router.delete('/actions/terminate-all', authenticate, async (req, res) => {
    try {
        const currentToken = req
            .header('Authorization')
            ?.replace('Bearer ', '');

        // Deactivate all sessions except current
        await Session.updateMany(
            {
                user: req.user._id,
                token: { $ne: currentToken },
                isActive: true,
            },
            {
                $set: { isActive: false },
            }
        );

        res.json({
            success: true,
            message: 'All other sessions terminated successfully',
        });
    } catch (error) {
        console.error('Terminate all sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to terminate sessions',
        });
    }
});

// @route   GET /api/sessions/stats
// @desc    Get session statistics
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
    try {
        const [totalSessions, activeSessions] = await Promise.all([
            Session.countDocuments({ user: req.user._id }),
            Session.countDocuments({
                user: req.user._id,
                isActive: true,
                expiresAt: { $gt: new Date() },
            }),
        ]);

        res.json({
            success: true,
            data: {
                total: totalSessions,
                active: activeSessions,
            },
        });
    } catch (error) {
        console.error('Get session stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch session statistics',
        });
    }
});

export default router;

// Helper function to create session (call this after login)
export const createSession = async (userId, token, req) => {
    try {
        const userAgent = req.get('user-agent');
        const deviceInfo = parseUserAgent(userAgent);

        // Decode token to get expiry
        const decoded = jwt.decode(token);
        const expiresAt = new Date(decoded.exp * 1000);

        const session = await Session.create({
            user: userId,
            token,
            deviceInfo: {
                userAgent,
                ...deviceInfo,
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            expiresAt,
        });

        return session;
    } catch (error) {
        console.error('Create session error:', error);
        throw error;
    }
};

// Helper function to update last activity
export const updateSessionActivity = async (token) => {
    try {
        await Session.findOneAndUpdate(
            { token, isActive: true },
            { lastActivity: new Date() }
        );
    } catch (error) {
        console.error('Update session activity error:', error);
    }
};

// Helper function to invalidate session on logout
export const invalidateSession = async (token) => {
    try {
        await Session.findOneAndUpdate({ token }, { isActive: false });
    } catch (error) {
        console.error('Invalidate session error:', error);
    }
};
