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
        ? 'https://abhi-draft3-e9rr9a7mf-vinays-projects-e655e938.vercel.app'
        : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
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

// MongoDB connection with enhanced error handling
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }

        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            heartbeatFrequencyMS: 2000,
            maxPoolSize: 10,
            minPoolSize: 2,
            maxIdleTimeMS: 30000,
            connectTimeoutMS: 10000,
            retryWrites: true,
            w: 'majority'
        });
        console.log('Successfully connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        if (err.message.includes('MONGODB_URI environment variable is not defined')) {
            console.error('Please check your environment variables configuration');
        } else if (err.name === 'MongoServerSelectionError') {
            console.error('Could not connect to MongoDB server. Please check your connection string and network connectivity');
            console.error('Current MongoDB URI:', process.env.MONGODB_URI ? 'URI exists' : 'URI is missing');
        } else if (err.name === 'MongoTimeoutError') {
            console.error('MongoDB connection timed out. This might be due to network issues or IP restrictions.');
        }
        
        // In production, we might want to retry the connection
        if (process.env.NODE_ENV === 'production') {
            console.log('Retrying connection in 5 seconds...');
            setTimeout(connectDB, 5000);
        }
    }
};

// Initial database connection
connectDB();

// Handle MongoDB connection errors
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
    connectDB();
});

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
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: dbStatus,
        environment: process.env.NODE_ENV
    });
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