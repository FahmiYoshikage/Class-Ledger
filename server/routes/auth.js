import express from 'express';
import User from '../models/User.js';
import { generateToken, loginAdmin, authenticate } from '../middleware/auth.js';
import { createAuditLog } from '../middleware/auditLog.js';
import {
    authLimiter,
} from '../middleware/rateLimiter.js';

const router = express.Router();

// @route   POST /api/auth/init-admin
// @desc    Create initial admin user (Only works if no users exist)
// @access  Public (One-time only)
router.post('/init-admin', async (req, res) => {
    try {
        // Check if any users exist
        const userCount = await User.countDocuments();

        if (userCount > 0) {
            return res.status(400).json({
                success: false,
                message:
                    'Admin already exists. Use login endpoint instead.',
            });
        }

        const { username, password, fullName } = req.body;

        // Validation
        if (!username || !password || !fullName) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, and full name are required',
            });
        }

        // Create initial admin
        const admin = new User({
            username,
            password,
            fullName,
            isActive: true,
            mustChangePassword: false,
        });

        await admin.save();

        const token = generateToken(admin._id);

        res.status(201).json({
            success: true,
            message: 'Initial admin created successfully',
            token,
            user: {
                id: admin._id,
                username: admin.username,
                fullName: admin.fullName,
                role: admin.role || 'admin',
            },
        });
    } catch (error) {
        console.error('Init admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create admin',
            error: error.message,
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login admin
// @access  Public
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required',
            });
        }

        // Find user by username (using static method from simplified User model)
        const user = await User.findByUsername(username.trim());

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password',
            });
        }

        // Check if active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated.',
            });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password',
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                role: user.role || 'admin',
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message,
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private (requires auth)
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                role: user.role || 'admin',
            },
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user info',
            error: error.message,
        });
    }
});

// @route   POST /api/auth/change-password
// @desc    Change password
// @access  Private (requires auth)
router.post(
    '/change-password',
    authenticate,
    async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;

            // Validation
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password and new password are required',
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'New password must be at least 6 characters',
                });
            }

            // Get user with password
            const user = await User.findById(req.user._id);

            // Verify current password
            const isMatch = await user.comparePassword(currentPassword);

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect',
                });
            }

            // Update password
            user.password = newPassword;
            user.mustChangePassword = false;
            await user.save();

            res.json({
                success: true,
                message: 'Password changed successfully',
            });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to change password',
                error: error.message,
            });
        }
    }
);

// @route   POST /api/auth/logout
// @desc    Logout admin
// @access  Private (requires auth)
router.post('/logout', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message,
        });
    }
});

export default router;