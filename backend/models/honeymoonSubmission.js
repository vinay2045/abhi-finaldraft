const mongoose = require('mongoose');

const honeymoonSubmissionSchema = new mongoose.Schema({
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
    weddingDate: {
        type: Date,
        required: false
    },
    destination: {
        type: String,
        required: true
    },
    otherDestination: {
        type: String,
        required: false
    },
    travelDates: {
        type: Date
        
    },
    duration: {
        type: String,
        required: true
    },
    budget: {
        type: String,
        required: true
    },
    accommodation: {
        type: String,
        required: false
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
    travelers: {
        type: String,
        required: false
    },
    specialRequirements: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('HoneymoonSubmission', honeymoonSubmissionSchema); 