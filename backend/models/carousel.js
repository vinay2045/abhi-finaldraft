const mongoose = require('mongoose');

const carouselSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    heading: {
        type: String,
        required: true
    },
    subheading: {
        type: String,
        required: true
    },
    tags: [{
        type: String
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Carousel', carouselSchema); 