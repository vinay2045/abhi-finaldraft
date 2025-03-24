const mongoose = require('mongoose');

const contactFormSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: false
    },
    message: {
        type: String,
        required: true
    },
    fromFooter: {
        type: Boolean,
        default: false
    },
    fromPage: {
        type: String,
        default: 'contact'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ContactFormSubmission', contactFormSchema); 