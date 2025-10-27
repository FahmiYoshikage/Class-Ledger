import express from 'express';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { generateToken, authenticate, authorize } from '../middleware/auth.js';
import { createAuditLog } from '../middleware/auditLog.js';
import {
    authLimiter,
    createUserLimiter,
    passwordChangeLimiter,
} from '../middleware/rateLimiter.js';
import { createSession, invalidateSession } from './sessions.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new user (Admin only)
// @access  Private (Admin)
router.post(
    '/register',
    authenticate,
    authorize('admin'),
    createUserLimiter,
    async (req, res) => {
        try {
            const { username, email, password, role, studentId, fullName } =
                req.body;

            // Validation
            if (!username || !password || !fullName) {
                return res.status(400).json({
                    success: false,
                    message: 'Username, password, and full name are required',
                });
            }

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ username }, { email: email || null }],
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username or email already exists',
                });
            }

            // If role is member and studentId provided, verify student exists
            if (role === 'member' && studentId) {
                const student = await Student.findById(studentId);
                if (!student) {
                    return res.status(404).json({
                        success: false,
                        message: 'Student not found',
                    });
                }

                // Check if student already has an account
                const existingMember = await User.findOne({ studentId });
                if (existingMember) {
                    return res.status(400).json({
                        success: false,
                        message: 'This student already has an account',
                    });
                }
            }

            // Create user
            const user = new User({
                username,
                email: email || undefined,
                password,
                role: role || 'member',
                studentId: studentId || undefined,
                fullName,
                mustChangePassword: true,
            });

            await user.save();

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                user: user.toJSON(),
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to register user',
                error: error.message,
            });
        }
    }
);

// @route   POST /api/auth/login
// @desc    Login user
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

        // Find user
        const user = await User.findOne({ username }).populate('studentId');

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
                message: 'Account is deactivated. Contact administrator.',
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

        // Create session
        await createSession(user._id, token, req);

        // Log successful login
        await createAuditLog({
            user: user._id,
            action: 'LOGIN',
            resource: 'Auth',
            status: 'SUCCESS',
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
        });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: user.toJSON(),
            mustChangePassword: user.mustChangePassword,
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
// @access  Private
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('studentId')
            .select('-password');

        res.json({
            success: true,
            user,
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
// @access  Private
router.post(
    '/change-password',
    authenticate,
    passwordChangeLimiter,
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

// @route   GET /api/auth/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
    try {
        const users = await User.find()
            .populate('studentId')
            .select('-password')
            .sort('-createdAt');

        res.json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users',
            error: error.message,
        });
    }
});

// @route   PATCH /api/auth/users/:id
// @desc    Update user (Admin only)
// @access  Private (Admin)
router.patch(
    '/users/:id',
    authenticate,
    authorize('admin'),
    async (req, res) => {
        try {
            const { role, isActive, fullName, email } = req.body;

            const user = await User.findById(req.params.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            // Update fields
            if (role !== undefined) user.role = role;
            if (isActive !== undefined) user.isActive = isActive;
            if (fullName !== undefined) user.fullName = fullName;
            if (email !== undefined) user.email = email || undefined;

            await user.save();

            res.json({
                success: true,
                message: 'User updated successfully',
                user: user.toJSON(),
            });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update user',
                error: error.message,
            });
        }
    }
);

// @route   DELETE /api/auth/users/:id
// @desc    Delete user (Admin only)
// @access  Private (Admin)
router.delete(
    '/users/:id',
    authenticate,
    authorize('admin'),
    async (req, res) => {
        try {
            const user = await User.findById(req.params.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            // Prevent deleting self
            if (user._id.toString() === req.user._id.toString()) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete your own account',
                });
            }

            await user.deleteOne();

            res.json({
                success: true,
                message: 'User deleted successfully',
            });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete user',
                error: error.message,
            });
        }
    }
);

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
                    'Admin already exists. Use /register endpoint instead.',
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
            role: 'admin',
            mustChangePassword: false,
            isActive: true,
        });

        await admin.save();

        const token = generateToken(admin._id);

        res.status(201).json({
            success: true,
            message: 'Initial admin created successfully',
            token,
            user: admin.toJSON(),
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

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate session)
// @access  Private
router.post('/logout', authenticate, async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            // Invalidate session
            await invalidateSession(token);

            // Log logout
            await createAuditLog({
                user: req.user._id,
                action: 'LOGOUT',
                resource: 'Auth',
                status: 'SUCCESS',
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent'),
            });
        }

        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
        });
    }
});

export default router;
