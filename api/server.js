const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://abhi-draft3-2qo0rbh40-vinays-projects-e655e938.vercel.app', 'https://abhi-draft3-a8y81juhx-vinays-projects-e655e938.vercel.app', 'https://abhi-draft3.vercel.app']
        : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'x-api-key']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware with error handling
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            res.status(400).json({ 
                success: false, 
                message: 'Invalid JSON payload' 
            });
            throw new Error('Invalid JSON');
        }
    }
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging in development
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.url}`);
        next();
    });
}

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
    console.error('Error:', err);

    // Handle specific error types
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid JSON payload' 
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid or missing authentication token'
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    // Default error response
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'An unexpected error occurred' 
            : err.message
    });
});

// Export the Express app as a serverless function
module.exports = app; 