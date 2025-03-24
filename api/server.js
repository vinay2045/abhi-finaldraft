const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-app.vercel.app', 'https://www.your-app.vercel.app']
        : '*',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection with retry logic
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        // Retry connection after 5 seconds
        setTimeout(connectDB, 5000);
    }
};

connectDB();

// Import routes
const carouselRoutes = require('../routes/carousel');
const adminRoutes = require('../routes/admin');
const authRoutes = require('../routes/auth');
const submissionsRoutes = require('../routes/submissions');
const pageContentRoutes = require('../routes/pageContent');
const domesticToursRoutes = require('../routes/domesticTours');

// API routes
app.use('/api/carousel', carouselRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/page-content', pageContentRoutes);
app.use('/api/domestic-tours', domesticToursRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Handle MongoDB connection errors
    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        return res.status(503).json({
            success: false,
            message: 'Database connection error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Default error response
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Export the Express app as a serverless function
module.exports = app; 