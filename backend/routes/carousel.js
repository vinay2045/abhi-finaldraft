const express = require('express');
const router = express.Router();
const Carousel = require('../models/carousel');
const { isAdmin } = require('../middleware/auth');
const upload = require('../middleware/fileUpload');
const fs = require('fs');
const path = require('path');

/**
 * @route   GET /api/carousel
 * @desc    Get all carousel items
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const carouselItems = await Carousel.find().sort({ updatedAt: -1 });
        res.json({
            success: true,
            data: carouselItems
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   GET /api/carousel/:id
 * @desc    Get carousel item by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const carouselItem = await Carousel.findById(req.params.id);
        
        if (!carouselItem) {
            return res.status(404).json({
                success: false,
                message: 'Carousel item not found'
            });
        }
        
        res.json({
            success: true,
            data: carouselItem
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   POST /api/carousel
 * @desc    Create a carousel item
 * @access  Private/Admin
 */
router.post('/', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { title, heading, subheading, tags } = req.body;
        
        // Check if image is uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image'
            });
        }
        
        // Create new carousel item
        const newCarouselItem = new Carousel({
            image: `/uploads/${req.file.filename}`,
            title,
            heading,
            subheading,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        });
        
        // Save carousel item
        await newCarouselItem.save();
        
        res.json({
            success: true,
            message: 'Carousel item created successfully',
            data: newCarouselItem
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   PUT /api/carousel/:id
 * @desc    Update a carousel item
 * @access  Private/Admin
 */
router.put('/:id', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { title, heading, subheading, tags } = req.body;
        
        // Find carousel item
        let carouselItem = await Carousel.findById(req.params.id);
        
        if (!carouselItem) {
            return res.status(404).json({
                success: false,
                message: 'Carousel item not found'
            });
        }
        
        // Update carousel item
        const updateData = {
            title: title || carouselItem.title,
            heading: heading || carouselItem.heading,
            subheading: subheading || carouselItem.subheading,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : carouselItem.tags,
            updatedAt: Date.now()
        };
        
        // Update image if provided
        if (req.file) {
            // Delete old image if it exists
            if (carouselItem.image) {
                const oldImagePath = path.join(__dirname, '..', carouselItem.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            
            updateData.image = `/uploads/${req.file.filename}`;
        }
        
        // Update in database
        carouselItem = await Carousel.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        
        res.json({
            success: true,
            message: 'Carousel item updated successfully',
            data: carouselItem
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   DELETE /api/carousel/:id
 * @desc    Delete a carousel item
 * @access  Private/Admin
 */
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        // Find carousel item
        const carouselItem = await Carousel.findById(req.params.id);
        
        if (!carouselItem) {
            return res.status(404).json({
                success: false,
                message: 'Carousel item not found'
            });
        }
        
        // Delete image if it exists
        if (carouselItem.image) {
            const imagePath = path.join(__dirname, '..', carouselItem.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        // Delete from database
        await Carousel.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'Carousel item deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router; 