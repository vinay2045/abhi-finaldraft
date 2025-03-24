const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/admin');
const { isAdmin, sanitizeAdmin } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Login admin and get token
 * @access  Public
 */
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
            id: admin._id
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
                    admin: {
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

/**
 * @route   GET /api/auth/admin
 * @desc    Get admin data
 * @access  Private
 */
router.get('/admin', isAdmin, sanitizeAdmin, (req, res) => {
    res.json({
        success: true,
        admin: req.admin
    });
});

/**
 * @route   POST /api/auth/register
 * @desc    Register new admin (should be protected or removed in production)
 * @access  Private/Admin
 */
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if admin already exists
        let admin = await Admin.findOne({ $or: [{ username }, { email }] });
        if (admin) {
            return res.status(400).json({ 
                success: false, 
                message: 'Admin already exists' 
            });
        }

        // Create new admin
        admin = new Admin({
            username,
            email,
            password
        });

        // Save admin
        await admin.save();

        res.json({
            success: true,
            message: 'Admin registered successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

module.exports = router; 