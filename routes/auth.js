const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const Admin = require('../models/Admin');
const authMiddleware = require('../middleware/auth');
const { isAdmin, sanitizeAdmin } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post(
    '/register', 
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        const { name, email, password } = req.body;

        try {
            // Check if user already exists
            let user = await User.findOne({ email });

            if (user) {
                return res.status(400).json({ 
                    success: false,
                    message: 'User already exists' 
                });
            }

            // Create new user
            user = new User({
                name,
                email,
                password
            });

            // Hash password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            // Save user to database
            await user.save();

            // Create JWT payload
            const payload = {
                user: {
                    id: user.id
                }
            };

            // Sign token
            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '24h' },
                (err, token) => {
                    if (err) throw err;
                    res.json({
                        success: true,
                        token,
                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email
                        }
                    });
                }
            );

        } catch (err) {
            console.error('Error in user registration:', err.message);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }
);

// @route   POST /api/auth/login
// @desc    Login admin and get token
// @access  Public
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if admin exists
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Check password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Create JWT token
        const payload = {
            user: {
                id: admin._id,
                isAdmin: true
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    success: true,
                    token,
                    user: {
                        id: admin._id,
                        username: admin.username,
                        email: admin.email
                    }
                });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// @route   GET /api/auth/admin
// @desc    Get admin data
// @access  Private
router.get('/admin', isAdmin, sanitizeAdmin, (req, res) => {
    res.json({
        success: true,
        admin: req.admin
    });
});

// @route   POST /api/auth/admin-login
// @desc    Authenticate admin & get token for admin dashboard
// @access  Public
router.post('/admin-login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if admin exists
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Check password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Create JWT token with admin flag
        const payload = {
            user: {
                id: admin._id,
                isAdmin: true
            }
        };

        // Update last login time
        admin.lastLogin = Date.now();
        await admin.save();

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    success: true,
                    token,
                    user: {
                        id: admin._id,
                        username: admin.username,
                        email: admin.email,
                        name: admin.name || 'Administrator'
                    }
                });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// @route   GET /api/auth/user
// @desc    Get logged in user
// @access  Private
router.get('/user', authMiddleware, async (req, res) => {
    try {
        // If it's an admin user
        if (req.user.isAdmin) {
            const admin = await Admin.findById(req.user.id).select('-password');
            return res.json({
                success: true,
                user: {
                    ...admin.toObject(),
                    isAdmin: true
                }
            });
        }

        // Regular user
        const user = await User.findById(req.user.id).select('-password');
        res.json({
            success: true,
            user
        });
    } catch (err) {
        console.error('Error fetching user:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router; 