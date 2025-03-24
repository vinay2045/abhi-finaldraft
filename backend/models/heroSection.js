const mongoose = require('mongoose');

const heroSectionSchema = new mongoose.Schema({
    page: {
        type: String,
        required: true,
        unique: true,
        enum: ['domestic', 'international', 'flight', 'passport', 'visa', 'honeymoon', 'forex']
    },
    image: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('HeroSection', heroSectionSchema); 