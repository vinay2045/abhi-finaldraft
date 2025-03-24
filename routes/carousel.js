const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { isAdmin } = require('../middleware/auth');
const CarouselItem = require('../models/carouselItem');
const fs = require('fs');
const path = require('path');

// @route   GET /api/carousel
// @desc    Get active carousel items for the homepage
// @access  Public
router.get('/', async (req, res) => {
    try {
        const carouselItems = await CarouselItem.find({ active: true })
            .sort({ order: 1 })
            .select('-__v');

        res.json({
            success: true,
            count: carouselItems.length,
            data: carouselItems
        });
    } catch (err) {
        console.error('Error fetching carousel items:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/carousel/all
// @desc    Get all carousel items including inactive ones
// @access  Private (Admin only)
router.get('/all', isAdmin, async (req, res) => {
    try {
        const carouselItems = await CarouselItem.find()
            .sort({ order: 1 })
            .select('-__v');

        res.json({
            success: true,
            count: carouselItems.length,
            data: carouselItems
        });
    } catch (err) {
        console.error('Error fetching all carousel items:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/carousel
// @desc    Create a new carousel item
// @access  Private (Admin only)
router.post(
    '/',
    [
        isAdmin,
        check('title', 'Title is required').not().isEmpty(),
        check('heading', 'Heading is required').not().isEmpty(),
        check('subheading', 'Subheading is required').not().isEmpty(),
        check('image', 'Image path is required').not().isEmpty(),
        check('tags', 'Tags must be an array').isArray()
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
            const { title, heading, subheading, image, tags, order, active } = req.body;

            // Find max order to place new item at the end if order not specified
            let newOrder = order;
            if (newOrder === undefined) {
                const lastItem = await CarouselItem.findOne().sort({ order: -1 });
                newOrder = lastItem ? lastItem.order + 1 : 0;
            }

            const carouselItem = new CarouselItem({
                title,
                heading,
                subheading,
                image,
                tags: Array.isArray(tags) ? tags : [],
                order: newOrder,
                active: active !== undefined ? active : true
            });

            await carouselItem.save();

            res.status(201).json({
                success: true,
                data: carouselItem
            });
        } catch (err) {
            console.error('Error creating carousel item:', err.message);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }
);

// @route   PUT /api/carousel/:id
// @desc    Update a carousel item
// @access  Private (Admin only)
router.put(
    '/:id',
    isAdmin,
    async (req, res) => {
        try {
            const { title, heading, subheading, image, tags, order, active } = req.body;
            const updateFields = {};

            // Only add fields that are provided
            if (title !== undefined) updateFields.title = title;
            if (heading !== undefined) updateFields.heading = heading;
            if (subheading !== undefined) updateFields.subheading = subheading;
            if (image !== undefined) updateFields.image = image;
            if (tags !== undefined) updateFields.tags = Array.isArray(tags) ? tags : [];
            if (order !== undefined) updateFields.order = order;
            if (active !== undefined) updateFields.active = active;

            // Find and update the carousel item
            let carouselItem = await CarouselItem.findById(req.params.id);

            if (!carouselItem) {
                return res.status(404).json({
                    success: false,
                    message: 'Carousel item not found'
                });
            }

            carouselItem = await CarouselItem.findByIdAndUpdate(
                req.params.id,
                { $set: updateFields },
                { new: true }
            );

            res.json({
                success: true,
                data: carouselItem
            });
        } catch (err) {
            console.error('Error updating carousel item:', err.message);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }
);

// @route   DELETE /api/carousel/:id
// @desc    Delete a carousel item
// @access  Private (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const carouselItem = await CarouselItem.findById(req.params.id);

        if (!carouselItem) {
            return res.status(404).json({
                success: false,
                message: 'Carousel item not found'
            });
        }

        // Delete the carousel item
        await CarouselItem.findByIdAndDelete(req.params.id);

        // If image is stored locally and not used elsewhere, delete it
        if (carouselItem.image && carouselItem.image.startsWith('/uploads/')) {
            try {
                const imagePath = path.join(__dirname, '..', carouselItem.image);
                if (fs.existsSync(imagePath)) {
                    // Check if image is used by other carousel items
                    const usedElsewhere = await CarouselItem.findOne({
                        _id: { $ne: req.params.id },
                        image: carouselItem.image
                    });

                    if (!usedElsewhere) {
                        fs.unlinkSync(imagePath);
                    }
                }
            } catch (err) {
                console.error('Error deleting image file:', err);
                // Continue anyway - we still want to delete the carousel item
            }
        }

        res.json({
            success: true,
            message: 'Carousel item deleted'
        });
    } catch (err) {
        console.error('Error deleting carousel item:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/carousel/reorder
// @desc    Reorder carousel items
// @access  Private (Admin only)
router.put('/reorder', isAdmin, async (req, res) => {
    try {
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid items array'
            });
        }

        // Update each item with its new order
        const updatePromises = items.map((item, index) => {
            return CarouselItem.findByIdAndUpdate(
                item.id,
                { $set: { order: index } },
                { new: true }
            );
        });

        await Promise.all(updatePromises);

        // Get the updated items
        const updatedItems = await CarouselItem.find()
            .sort({ order: 1 })
            .select('-__v');

        res.json({
            success: true,
            message: 'Carousel items reordered successfully',
            data: updatedItems
        });
    } catch (err) {
        console.error('Error reordering carousel items:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/carousel/upload
// @desc    Upload an image for carousel item from base64 data
// @access  Private (Admin only)
router.post('/upload', isAdmin, async (req, res) => {
    try {
        const { imageData } = req.body;

        if (!imageData) {
            return res.status(400).json({
                success: false,
                message: 'No image data provided'
            });
        }

        // Validate if it's a base64 image
        if (!imageData.startsWith('data:image/')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid image data format'
            });
        }

        // Extract image format and data
        const matches = imageData.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({
                success: false,
                message: 'Invalid image data format'
            });
        }

        const imageType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        // Create directory if not exists
        const uploadDir = path.join(__dirname, '../uploads/carousel');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const fileName = `carousel_${Date.now()}.${imageType}`;
        const filePath = path.join(uploadDir, fileName);

        // Save the file
        fs.writeFileSync(filePath, buffer);

        // Return the URL to the saved image
        const fileUrl = `/uploads/carousel/${fileName}`;

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            fileUrl
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during image upload'
        });
    }
});

module.exports = router; 