const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { isAdmin } = require('../middleware/auth');
const PageContent = require('../models/pageContent');
const fs = require('fs');
const path = require('path');

// @route   GET /api/content/carousel
// @desc    Get carousel items
// @access  Public
router.get('/carousel', async (req, res) => {
    try {
        const contentItems = await PageContent.find({ 
            contentType: 'carousel'
        }).sort({ order: 1 });

        res.json({
            success: true,
            count: contentItems.length,
            data: contentItems
        });
    } catch (err) {
        console.error('Error fetching carousel content:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/content/blog
// @desc    Get blog items
// @access  Public
router.get('/blog', async (req, res) => {
    try {
        const contentItems = await PageContent.find({ 
            contentType: 'blog'
        }).sort({ order: 1 });

        res.json({
            success: true,
            count: contentItems.length,
            data: contentItems
        });
    } catch (err) {
        console.error('Error fetching blog content:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/content/honeymoon
// @desc    Get honeymoon package items
// @access  Public
router.get('/honeymoon', async (req, res) => {
    try {
        const contentItems = await PageContent.find({ 
            contentType: 'honeymoon'
        }).sort({ order: 1 });

        res.json({
            success: true,
            count: contentItems.length,
            data: contentItems
        });
    } catch (err) {
        console.error('Error fetching honeymoon content:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/content/tour/all
// @desc    Get all tour items
// @access  Public
router.get('/tour/all', async (req, res) => {
    try {
        const contentItems = await PageContent.find({ 
            contentType: { $in: ['domestic-tour', 'international-tour'] }
        }).sort({ order: 1 });

        res.json({
            success: true,
            count: contentItems.length,
            data: contentItems
        });
    } catch (err) {
        console.error('Error fetching tour content:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/content/tour/domestic
// @desc    Get domestic tour items
// @access  Public
router.get('/tour/domestic', async (req, res) => {
    try {
        const contentItems = await PageContent.find({ 
            contentType: 'domestic-tour'
        }).sort({ order: 1 });

        res.json({
            success: true,
            count: contentItems.length,
            data: contentItems
        });
    } catch (err) {
        console.error('Error fetching domestic tour content:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/content/hero/:page
// @desc    Get hero section for a specific page
// @access  Public
router.get('/hero/:page', async (req, res) => {
    try {
        const page = req.params.page;
        const contentItems = await PageContent.find({ 
            contentType: 'hero',
            pageName: page
        }).sort({ order: 1 });

        res.json({
            success: true,
            count: contentItems.length,
            data: contentItems
        });
    } catch (err) {
        console.error('Error fetching hero content:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/content/:pageName/:sectionId
// @desc    Get content for a specific page section
// @access  Public
router.get('/:pageName/:sectionId', async (req, res) => {
    try {
        const { pageName, sectionId } = req.params;
        
        const contentItems = await PageContent.find({ 
            pageName, 
            sectionId 
        }).sort({ order: 1 });

        res.json({
            success: true,
            count: contentItems.length,
            data: contentItems
        });
    } catch (err) {
        console.error('Error fetching page content:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/content/page/:pageName
// @desc    Get all content for a specific page
// @access  Public
router.get('/page/:pageName', async (req, res) => {
    try {
        const { pageName } = req.params;
        
        const contentItems = await PageContent.find({ pageName })
            .sort({ sectionId: 1, order: 1 });

        res.json({
            success: true,
            count: contentItems.length,
            data: contentItems
        });
    } catch (err) {
        console.error('Error fetching page content:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/content/all
// @desc    Get all content for all pages
// @access  Private (Admin only)
router.get('/all', isAdmin, async (req, res) => {
    try {
        const contentItems = await PageContent.find()
            .sort({ pageName: 1, sectionId: 1, order: 1 });

        res.json({
            success: true,
            count: contentItems.length,
            data: contentItems
        });
    } catch (err) {
        console.error('Error fetching all page content:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/content
// @desc    Create a new content item
// @access  Private (Admin only)
router.post(
    '/',
    [
        isAdmin,
        check('pageName', 'Page name is required').not().isEmpty(),
        check('sectionId', 'Section ID is required').not().isEmpty(),
        check('contentType', 'Content type is required').not().isEmpty(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { 
                pageName, sectionId, contentType, image, title, heading,
                description, tags, price, duration, category, order
            } = req.body;

            // Find max order to place new item at the end if order not specified
            let newOrder = order;
            if (newOrder === undefined) {
                const lastItem = await PageContent.findOne({
                    pageName,
                    sectionId
                }).sort({ order: -1 });
                newOrder = lastItem ? lastItem.order + 1 : 0;
            }

            const contentItem = new PageContent({
                pageName,
                sectionId,
                contentType,
                image,
                title,
                heading,
                description,
                tags: Array.isArray(tags) ? tags : [],
                price,
                duration,
                category,
                order: newOrder
            });

            await contentItem.save();

            res.status(201).json({
                success: true,
                data: contentItem
            });
        } catch (err) {
            console.error('Error creating content item:', err.message);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }
);

// @route   PUT /api/content/:id
// @desc    Update a content item
// @access  Private (Admin only)
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { 
            pageName, sectionId, contentType, image, title, heading,
            description, tags, price, duration, category, order
        } = req.body;
        
        const updateFields = {};

        // Only add fields that are provided
        if (pageName !== undefined) updateFields.pageName = pageName;
        if (sectionId !== undefined) updateFields.sectionId = sectionId;
        if (contentType !== undefined) updateFields.contentType = contentType;
        if (image !== undefined) updateFields.image = image;
        if (title !== undefined) updateFields.title = title;
        if (heading !== undefined) updateFields.heading = heading;
        if (description !== undefined) updateFields.description = description;
        if (tags !== undefined) updateFields.tags = Array.isArray(tags) ? tags : [];
        if (price !== undefined) updateFields.price = price;
        if (duration !== undefined) updateFields.duration = duration;
        if (category !== undefined) updateFields.category = category;
        if (order !== undefined) updateFields.order = order;
        
        // Update lastUpdated timestamp
        updateFields.lastUpdated = Date.now();

        // Find and update the content item
        let contentItem = await PageContent.findById(req.params.id);

        if (!contentItem) {
            return res.status(404).json({
                success: false,
                message: 'Content item not found'
            });
        }

        contentItem = await PageContent.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true }
        );

        res.json({
            success: true,
            data: contentItem
        });
    } catch (err) {
        console.error('Error updating content item:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/content/:id
// @desc    Delete a content item
// @access  Private (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const contentItem = await PageContent.findById(req.params.id);

        if (!contentItem) {
            return res.status(404).json({
                success: false,
                message: 'Content item not found'
            });
        }

        // Delete the content item
        await PageContent.findByIdAndDelete(req.params.id);

        // If image is stored locally and not used elsewhere, delete it
        if (contentItem.image && contentItem.image.startsWith('/uploads/')) {
            try {
                const imagePath = path.join(__dirname, '..', contentItem.image);
                if (fs.existsSync(imagePath)) {
                    // Check if image is used by other content
                    const usedElsewhere = await PageContent.findOne({
                        _id: { $ne: req.params.id },
                        image: contentItem.image
                    });

                    if (!usedElsewhere) {
                        fs.unlinkSync(imagePath);
                    }
                }
            } catch (err) {
                console.error('Error deleting image file:', err);
                // Continue anyway - we still want to delete the content item
            }
        }

        res.json({
            success: true,
            message: 'Content item deleted'
        });
    } catch (err) {
        console.error('Error deleting content item:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router; 