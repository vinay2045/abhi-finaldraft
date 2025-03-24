const mongoose = require('mongoose');

const carouselSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    heading: {
        type: String,
        required: true,
        trim: true
    },
    subheading: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true
    },
    tags: {
        type: [String],
        default: []
    },
    order: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on document update
carouselSchema.pre('save', function(next) {
    if (!this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

module.exports = mongoose.model('Carousel', carouselSchema); 