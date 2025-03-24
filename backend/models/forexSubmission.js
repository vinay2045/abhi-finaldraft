const mongoose = require('mongoose');

const forexSubmissionSchema = new mongoose.Schema({
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
    serviceType: {
        type: String,
        required: true
    },
    currencyFrom: {
        type: String,
        required: true
    },
    currencyTo: {
        type: String,
        required: true
    },
    amount: {
        type: String,
        required: false
    },
    travelDate: {
        type: Date,
        required: false
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

module.exports = mongoose.model('ForexSubmission', forexSubmissionSchema); 