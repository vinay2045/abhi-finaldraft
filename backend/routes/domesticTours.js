const express = require('express');
const router = express.Router();
const DomesticTour = require('../models/domesticTour');
const { isAdmin } = require('../middleware/auth');
const upload = require('../middleware/fileUpload');
const fs = require('fs');
const path = require('path');

/**
 * @route   GET /api/domestic-tours
 * @desc    Get all domestic tours
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const domesticTours = await DomesticTour.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: domesticTours
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
 * @route   GET /api/domestic-tours/:id
 * @desc    Get domestic tour by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const domesticTour = await DomesticTour.findById(req.params.id);
        
        if (!domesticTour) {
            return res.status(404).json({
                success: false,
                message: 'Domestic tour not found'
            });
        }
        
        res.json({
            success: true,
            data: domesticTour
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
 * @route   POST /api/domestic-tours
 * @desc    Create a domestic tour
 * @access  Private/Admin
 */
router.post('/', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { title, description, price, duration, categories } = req.body;
        
        // Check if image is uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image'
            });
        }
        
        // Create new domestic tour
        const newDomesticTour = new DomesticTour({
            image: `/uploads/${req.file.filename}`,
            title,
            description,
            price,
            duration,
            categories
        });
        
        // Save domestic tour
        await newDomesticTour.save();
        
        res.json({
            success: true,
            message: 'Domestic tour created successfully',
            data: newDomesticTour
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
 * @route   PUT /api/domestic-tours/:id
 * @desc    Update a domestic tour
 * @access  Private/Admin
 */
router.put('/:id', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { title, description, price, duration, categories } = req.body;
        
        // Find domestic tour
        let domesticTour = await DomesticTour.findById(req.params.id);
        
        if (!domesticTour) {
            return res.status(404).json({
                success: false,
                message: 'Domestic tour not found'
            });
        }
        
        // Update domestic tour
        const updateData = {
            title: title || domesticTour.title,
            description: description || domesticTour.description,
            price: price || domesticTour.price,
            duration: duration || domesticTour.duration,
            categories: categories || domesticTour.categories,
            updatedAt: Date.now()
        };
        
        // Update image if provided
        if (req.file) {
            // Delete old image if it exists
            if (domesticTour.image) {
                const oldImagePath = path.join(__dirname, '..', domesticTour.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            
            updateData.image = `/uploads/${req.file.filename}`;
        }
        
        // Update in database
        domesticTour = await DomesticTour.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        
        res.json({
            success: true,
            message: 'Domestic tour updated successfully',
            data: domesticTour
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
 * @route   DELETE /api/domestic-tours/:id
 * @desc    Delete a domestic tour
 * @access  Private/Admin
 */
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        // Find domestic tour
        const domesticTour = await DomesticTour.findById(req.params.id);
        
        if (!domesticTour) {
            return res.status(404).json({
                success: false,
                message: 'Domestic tour not found'
            });
        }
        
        // Delete image if it exists
        if (domesticTour.image) {
            const imagePath = path.join(__dirname, '..', domesticTour.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        // Delete from database
        await DomesticTour.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'Domestic tour deleted successfully'
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