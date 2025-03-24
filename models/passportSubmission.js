const mongoose = require('mongoose');

const PassportSubmissionSchema = new mongoose.Schema({
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
    applicationType: {
        type: String,
        enum: ['new', 'renewal', 'damaged', 'lost', 'other'],
        required: [true, 'Application type is required']
    },
    expectedDate: {
        type: Date,
        required: [true, 'Expected date is required']
    },
    urgency: {
        type: String,
        enum: ['normal', 'Normal', 'tatkal', 'Tatkal', 'super-tatkal', 'Super-Tatkal', 'standard', 'Standard'],
        required: [true, 'Urgency level is required']
    },
    numberOfApplicants: {
        type: String,
        required: [true, 'Number of applicants is required']
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
    }
});

module.exports = mongoose.model('PassportSubmission', PassportSubmissionSchema); 