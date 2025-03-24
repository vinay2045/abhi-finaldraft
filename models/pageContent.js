const mongoose = require('mongoose');

const PageContentSchema = new mongoose.Schema({
    pageName: {
        type: String,
        required: [true, 'Page name is required'],
        enum: ['index', 'aboutus', 'flights', 'visa', 'passport', 'forex', 'honeymoon', 'domestic', 'international']
    },
    sectionId: {
        type: String,
        required: [true, 'Section ID is required']
    },
    contentType: {
        type: String,
        required: [true, 'Content type is required'],
        enum: ['hero', 'section', 'card']
    },
    image: {
        type: String
    },
    title: {
        type: String
    },
    heading: {
        type: String
    },
    description: {
        type: String
    },
    tags: [{
        type: String
    }],
    price: {
        type: String
    },
    duration: {
        type: String
    },
    category: {
        type: String
    },
    order: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Add index for efficient querying by page and section
PageContentSchema.index({ pageName: 1, sectionId: 1 });

module.exports = mongoose.model('PageContent', PageContentSchema); 