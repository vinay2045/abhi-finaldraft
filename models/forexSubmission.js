const mongoose = require('mongoose');

const ForexSubmissionSchema = new mongoose.Schema({
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
    serviceType: {
        type: String,
        enum: ['currency-exchange', 'travel-card', 'wire-transfer', 'travel-insurance', 'other'],
        required: [true, 'Service type is required']
    },
    currencyFrom: {
        type: String,
        required: [true, 'Source currency is required']
    },
    currencyTo: {
        type: String,
        required: [true, 'Target currency is required']
    },
    amount: {
        type: String,
        required: [true, 'Amount is required']
    },
    travelDate: {
        type: Date
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

module.exports = mongoose.model('ForexSubmission', ForexSubmissionSchema); 