const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * Basic authentication middleware for all users
 */
const auth = async (req, res, next) => {
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
        
        // Add user info to request
        req.user = decoded.user;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token is not valid' 
        });
    }
};

/**
 * Middleware to protect admin routes
 */
const isAdmin = async (req, res, next) => {
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
        
        // Check if user is admin
        if (!decoded.user.isAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied, admin privileges required' 
            });
        }
        
        // Check if admin exists
        const admin = await Admin.findById(decoded.user.id);
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
const sanitizeAdmin = (req, res, next) => {
    if (req.admin) {
        req.admin = {
            id: req.admin._id,
            username: req.admin.username,
            email: req.admin.email,
            name: req.admin.name,
            role: req.admin.role
        };
    }
    next();
};

/**
 * Check API key for public endpoints
 */
const checkApiKey = (req, res, next) => {
    const apiKey = req.header('x-api-key');
    
    // Allow the hardcoded API key from our forms or bypass if no API key is set in env
    if (apiKey === 'travel_api_key_2024' || !process.env.API_KEY) {
        return next();
    }
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid API key' 
        });
    }
    
    next();
};

module.exports = auth;
module.exports.isAdmin = isAdmin;
module.exports.sanitizeAdmin = sanitizeAdmin;
module.exports.checkApiKey = checkApiKey; 