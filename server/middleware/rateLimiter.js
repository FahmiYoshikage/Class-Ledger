import rateLimit from 'express-rate-limit';

// General API rate limiter (100 requests per 15 minutes)
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for authentication endpoints (5 requests per 15 minutes)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: {
        success: false,
        message:
            'Too many login attempts from this IP, please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count successful attempts
});

// Create user rate limiter (prevent mass user creation)
export const createUserLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Max 10 users per hour
    message: {
        success: false,
        message: 'Too many users created from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Password change rate limiter (3 attempts per hour)
export const passwordChangeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Max 3 password changes per hour
    message: {
        success: false,
        message:
            'Too many password change attempts, please try again after 1 hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Forgot password rate limiter (3 requests per hour)
export const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Max 3 forgot password requests per hour
    message: {
        success: false,
        message:
            'Too many password reset requests, please try again after 1 hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
