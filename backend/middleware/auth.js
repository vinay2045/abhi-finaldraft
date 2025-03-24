const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');

/**
 * Middleware to protect admin routes
 */
exports.isAdmin = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('x-auth-token');

        // Check if token exists
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token, authorization denied' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if admin exists
        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token is not valid' 
            });
        }

        // Add admin to request object
        req.admin = admin;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token is not valid' 
        });
    }
};

/**
 * Sanitize admin middleware
 * Removes password from admin object
 */
exports.sanitizeAdmin = (req, res, next) => {
    if (req.admin) {
        req.admin = {
            id: req.admin._id,
            username: req.admin.username,
            email: req.admin.email
        };
    }
    next();
};

/**
 * Check API key for public endpoints
 */
exports.checkApiKey = (req, res, next) => {
    const apiKey = req.header('x-api-key');
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid API key' 
        });
    }
    
    next();
}; 