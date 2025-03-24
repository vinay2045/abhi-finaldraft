const mongoose = require('mongoose');

const FlightSubmissionSchema = new mongoose.Schema({
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
    tripType: {
        type: String,
        required: true,
        enum: ['one-way', 'round-trip', 'multi-city']
    },
    from: {
        type: String,
        required: true
    },
    to: {
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
    travelClass: {
        type: String,
        enum: ['economy', 'premium-economy', 'business', 'first'],
        default: 'economy'
    },
    additionalInfo: {
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
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FlightSubmission', FlightSubmissionSchema); 