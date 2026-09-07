import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// JWT Secret (in production, use environment variable)
const JWT_SECRET =
    process.env.JWT_SECRET || 'kas-kelas-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};

// Simple authentication middleware for single-admin mode
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Find user by ID
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.',
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated.',
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.',
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired.',
            });
        }
        res.status(500).json({
            success: false,
            message: 'Authentication error.',
            error: error.message,
        });
    }
};

// Check if user is admin (for single-admin mode)
const authorizeAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized. Please login.',
        });
    }

    // In single-admin mode, only allow access if user is admin
    // We check by username or a simple role check
    // For now, allow if user is active (admin assumed to be the only account)
    next();
};

// Optional authentication (user bisa akses dengan atau tanpa login - for public routes)
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (user && user.isActive) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Ignore errors, proceed without authentication
        next();
    }
};

// Generate login token for admin
const loginAdmin = async (username, password) => {
    try {
        const user = await User.findByUsername(username);

        if (!user) {
            return {
                success: false,
                message: 'Username not found.',
            };
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return {
                success: false,
                message: 'Password salah.',
            };
        }

        if (!user.isActive) {
            return {
                success: false,
                message: 'Akun non-aktif.',
            };
        }

        return {
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
            },
        };
    } catch (error) {
        return {
            success: false,
            message: 'Error during login.',
            error: error.message,
        };
    }
};

export { generateToken, authenticate, authorizeAdmin, optionalAuth, loginAdmin, JWT_SECRET };