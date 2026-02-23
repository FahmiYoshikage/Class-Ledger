import rateLimit from 'express-rate-limit';

// Extract real client IP from behind Nginx Proxy Manager/Docker proxy chain
const getClientIp = (req) => {
    // X-Real-IP set by Nginx Proxy Manager
    const realIp = req.headers['x-real-ip'];
    if (realIp) return realIp;

    // Cloudflare's CF-Connecting-IP header
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp) return cfIp;

    // Fallback to first IP in X-Forwarded-For
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    // Last resort: req.ip (Express trust proxy)
    return req.ip;
};

// Disable ipKeyGenerator validation since we use custom header-based IP extraction
const commonValidate = { ipKeyGenerator: false };

// General API rate limiter (500 requests per 15 minutes)
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per windowMs
    keyGenerator: getClientIp,
    validate: commonValidate,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip rate limiting for notification endpoints (they have their own delays)
    skip: (req) => req.path.startsWith('/notifications/'),
    handler: (req, res) => {
        console.log(
            `⚠️ Rate limit exceeded for IP: ${getClientIp(req)}, Path: ${req.path}`
        );
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again later.',
        });
    },
});

// Rate limiter for authentication endpoints (20 requests per 15 minutes)
// Increased from 5 to 20 to accommodate proxy/Docker environments
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 login requests per windowMs
    keyGenerator: getClientIp,
    validate: commonValidate,
    message: {
        success: false,
        message:
            'Too many login attempts from this IP, please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
    handler: (req, res) => {
        console.log(
            `⚠️ Auth rate limit exceeded for IP: ${getClientIp(req)}, User-Agent: ${req.get('user-agent')}`
        );
        res.status(429).json({
            success: false,
            message:
                'Too many login attempts from this IP, please try again after 15 minutes.',
        });
    },
});

// Create user rate limiter (prevent mass user creation)
export const createUserLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Max 10 users per hour
    keyGenerator: getClientIp,
    validate: commonValidate,
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
    keyGenerator: getClientIp,
    validate: commonValidate,
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
    keyGenerator: getClientIp,
    validate: commonValidate,
    message: {
        success: false,
        message:
            'Too many password reset requests, please try again after 1 hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
