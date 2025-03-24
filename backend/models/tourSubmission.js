const mongoose = require('mongoose');

const tourSubmissionSchema = new mongoose.Schema({
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
    destination: {
        type: String,
        required: true
    },
    travelDate: {
        type: Date,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    travelers: {
        type: String,
        required: true
    },
    budget: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: false
    },
    isDirectBooking: {
        type: Boolean,
        default: false
    },
    packageName: {
        type: String,
        required: false
    },
    packagePrice: {
        type: String,
        required: false
    },
    packageDuration: {
        type: String,
        required: false
    },
    bookingDate: {
        type: Date,
        required: false
    },
    specialRequirements: {
        type: String,
        required: false
    },
    passportNumber: {
        type: String,
        required: false
    },
    passportExpiry: {
        type: Date,
        required: false
    },
    tourType: {
        type: String,
        enum: ['domestic', 'international'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TourSubmission', tourSubmissionSchema); 