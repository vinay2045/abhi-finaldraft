const mongoose = require('mongoose');

const passportSubmissionSchema = new mongoose.Schema({
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
    applicationType: {
        type: String,
        required: true
    },
    urgency: {
        type: String,
        required: true
    },
    applicants: {
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

module.exports = mongoose.model('PassportSubmission', passportSubmissionSchema); 