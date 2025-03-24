const mongoose = require('mongoose');

const visaSubmissionSchema = new mongoose.Schema({
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
    visaType: {
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
    message: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('VisaSubmission', visaSubmissionSchema); 