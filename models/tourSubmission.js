const mongoose = require('mongoose');

const TourSubmissionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    tourType: {
        type: String,
        enum: ['domestic', 'international'],
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    departureDate: {
        type: Date,
        required: true
    },
    returnDate: {
        type: Date
    },
    adults: {
        type: Number,
        required: true,
        default: 1
    },
    children: {
        type: Number,
        default: 0
    },
    budget: {
        type: String
    },
    accommodationType: {
        type: String,
        enum: ['budget', 'standard', 'luxury'],
        default: 'standard'
    },
    additionalRequirements: {
        type: String
    },
    status: {
        type: String,
        enum: ['new', 'in-progress', 'resolved'],
        default: 'new'
    },
    notes: {
        type: String
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TourSubmission', TourSubmissionSchema); 