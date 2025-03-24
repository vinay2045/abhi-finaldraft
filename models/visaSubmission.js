const mongoose = require('mongoose');

const VisaSubmissionSchema = new mongoose.Schema({
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
    destination: {
        type: String,
        required: [true, 'Destination country is required']
    },
    visaType: {
        type: String,
        enum: ['tourist', 'business', 'student', 'work', 'transit', 'medical', 'other'],
        required: [true, 'Visa type is required']
    },
    travelDate: {
        type: Date,
        required: [true, 'Travel date is required']
    },
    duration: {
        type: String,
        required: [true, 'Duration of stay is required']
    },
    travelers: {
        type: String,
        required: [true, 'Number of travelers is required']
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

module.exports = mongoose.model('VisaSubmission', VisaSubmissionSchema); 