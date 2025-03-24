const mongoose = require('mongoose');

const HoneymoonSubmissionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    weddingDate: {
        type: Date
    },
    destination: {
        type: String,
        required: [true, 'Destination is required']
    },
    otherDestination: {
        type: String
    },
    travelDates: {
        type: Date,
        required: [true, 'Travel dates are required']
    },
    duration: {
        type: String,
        required: [true, 'Duration is required']
    },
    budget: {
        type: String,
        required: [true, 'Budget range is required']
    },
    accommodation: {
        type: String
    },
    message: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'cancelled'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
});

module.exports = mongoose.model('HoneymoonSubmission', HoneymoonSubmissionSchema); 