const mongoose = require('mongoose');

const CarouselItemSchema = new mongoose.Schema({
    image: {
        type: String,
        required: [true, 'Image path is required']
    },
    title: {
        type: String,
        required: [true, 'Title is required']
    },
    heading: {
        type: String,
        required: [true, 'Heading is required']
    },
    subheading: {
        type: String,
        required: [true, 'Subheading is required']
    },
    tags: [{
        type: String
    }],
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
    }
});

module.exports = mongoose.model('CarouselItem', CarouselItemSchema); 