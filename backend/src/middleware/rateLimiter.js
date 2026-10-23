const rateLimit = require('express-rate-limit');

// Strict rate limit for authentication routes to prevent credential brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// General rate limiter for reading and prediction ingestion
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 180, // 180 requests per minute
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { authLimiter, apiLimiter };
