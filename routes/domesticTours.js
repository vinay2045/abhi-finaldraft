const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { isAdmin } = require('../middleware/auth');
const { uploadFile, uploadMultipleFiles, deleteFile } = require('../middleware/upload');
const DomesticTour = require('../models/domesticTour');

/**
 * @route   GET /api/domestic-tours
 * @desc    Get all domestic tours
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        // Default query for active tours only
        const query = { isActive: true };

        // Check for featured query param
        if (req.query.featured === 'true') {
            query.featured = true;
        }

        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get tours count for pagination
        const totalTours = await DomesticTour.countDocuments(query);

        // Get tours with pagination
        const tours = await DomesticTour.find(query)
            .select('-__v -reviews')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            data: tours,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalTours / limit),
                totalItems: totalTours,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error('Error fetching domestic tours:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   GET /api/domestic-tours/:id
 * @desc    Get a specific domestic tour
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const tour = await DomesticTour.findById(req.params.id);

        if (!tour) {
            return res.status(404).json({
                success: false,
                message: 'Tour not found'
            });
        }

        res.json({
            success: true,
            data: tour
        });
    } catch (error) {
        console.error('Error fetching domestic tour:', error);
        
        // Check if error is due to invalid ObjectId
        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Tour not found'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   POST /api/domestic-tours
 * @desc    Create a domestic tour
 * @access  Private (Admin only)
 */
router.post('/', isAdmin, async (req, res) => {
    try {
        // Check if cover image was uploaded
        if (!req.files || !req.files.coverImage) {
            return res.status(400).json({
                success: false,
                message: 'Cover image is required'
            });
        }

        // Upload cover image
        const coverImagePath = await uploadFile(req.files.coverImage, 'domestic-tours/covers');

        // Upload additional images if provided
        let imagePaths = [];
        if (req.files.images) {
            const imagesArray = Array.isArray(req.files.images) 
                ? req.files.images 
                : [req.files.images];
            
            imagePaths = await uploadMultipleFiles(imagesArray, 'domestic-tours/gallery');
        }

        // Process itinerary if provided as JSON string
        let itinerary = [];
        if (req.body.itinerary) {
            try {
                itinerary = JSON.parse(req.body.itinerary);
            } catch (err) {
                console.error('Error parsing itinerary:', err);
            }
        }

        // Process included/excluded arrays if provided
        let included = [];
        let excluded = [];
        let highlights = [];

        if (req.body.included) {
            try {
                included = JSON.parse(req.body.included);
            } catch (err) {
                console.error('Error parsing included:', err);
            }
        }

        if (req.body.excluded) {
            try {
                excluded = JSON.parse(req.body.excluded);
            } catch (err) {
                console.error('Error parsing excluded:', err);
            }
        }

        if (req.body.highlights) {
            try {
                highlights = JSON.parse(req.body.highlights);
            } catch (err) {
                console.error('Error parsing highlights:', err);
            }
        }

        // Create new tour
        const tour = new DomesticTour({
            title: req.body.title,
            destination: req.body.destination,
            description: req.body.description,
            shortDescription: req.body.shortDescription,
            duration: req.body.duration,
            price: req.body.price,
            discount: req.body.discount || 0,
            included,
            excluded,
            itinerary,
            coverImage: coverImagePath,
            images: imagePaths,
            highlights,
            featured: req.body.featured === 'true'
        });

        // Save tour
        await tour.save();

        res.status(201).json({
            success: true,
            data: tour
        });
    } catch (error) {
        console.error('Error creating domestic tour:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   PUT /api/domestic-tours/:id
 * @desc    Update a domestic tour
 * @access  Private (Admin only)
 */
router.put('/:id', isAdmin, async (req, res) => {
    try {
        // Find tour
        const tour = await DomesticTour.findById(req.params.id);
        
        if (!tour) {
            return res.status(404).json({
                success: false,
                message: 'Tour not found'
            });
        }

        // Update basic fields
        if (req.body.title) tour.title = req.body.title;
        if (req.body.destination) tour.destination = req.body.destination;
        if (req.body.description) tour.description = req.body.description;
        if (req.body.shortDescription) tour.shortDescription = req.body.shortDescription;
        if (req.body.duration) tour.duration = req.body.duration;
        if (req.body.price) tour.price = req.body.price;
        if (req.body.discount !== undefined) tour.discount = req.body.discount;
        if (req.body.featured !== undefined) tour.featured = req.body.featured === 'true';
        if (req.body.isActive !== undefined) tour.isActive = req.body.isActive === 'true';

        // Process arrays
        if (req.body.included) {
            try {
                tour.included = JSON.parse(req.body.included);
            } catch (err) {
                console.error('Error parsing included:', err);
            }
        }

        if (req.body.excluded) {
            try {
                tour.excluded = JSON.parse(req.body.excluded);
            } catch (err) {
                console.error('Error parsing excluded:', err);
            }
        }

        if (req.body.highlights) {
            try {
                tour.highlights = JSON.parse(req.body.highlights);
            } catch (err) {
                console.error('Error parsing highlights:', err);
            }
        }

        if (req.body.itinerary) {
            try {
                tour.itinerary = JSON.parse(req.body.itinerary);
            } catch (err) {
                console.error('Error parsing itinerary:', err);
            }
        }

        // Update cover image if provided
        if (req.files && req.files.coverImage) {
            // Delete old cover image
            if (tour.coverImage) {
                await deleteFile(tour.coverImage);
            }
            
            // Upload new cover image
            tour.coverImage = await uploadFile(req.files.coverImage, 'domestic-tours/covers');
        }

        // Add additional images if provided
        if (req.files && req.files.newImages) {
            const newImagesArray = Array.isArray(req.files.newImages) 
                ? req.files.newImages 
                : [req.files.newImages];
            
            const newImagePaths = await uploadMultipleFiles(newImagesArray, 'domestic-tours/gallery');
            
            // Add new images to existing ones
            tour.images = [...tour.images, ...newImagePaths];
        }

        // Remove images if specified
        if (req.body.removeImages) {
            try {
                const removeImages = JSON.parse(req.body.removeImages);
                
                // Delete files from storage
                for (const imagePath of removeImages) {
                    await deleteFile(imagePath);
                }
                
                // Filter out removed images
                tour.images = tour.images.filter(img => !removeImages.includes(img));
            } catch (err) {
                console.error('Error parsing removeImages:', err);
            }
        }

        // Save changes
        await tour.save();

        res.json({
            success: true,
            data: tour
        });
    } catch (error) {
        console.error('Error updating domestic tour:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   DELETE /api/domestic-tours/:id
 * @desc    Delete a domestic tour
 * @access  Private (Admin only)
 */
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        // Find tour
        const tour = await DomesticTour.findById(req.params.id);
        
        if (!tour) {
            return res.status(404).json({
                success: false,
                message: 'Tour not found'
            });
        }

        // Delete cover image
        if (tour.coverImage) {
            await deleteFile(tour.coverImage);
        }

        // Delete all additional images
        for (const imagePath of tour.images) {
            await deleteFile(imagePath);
        }

        // Delete from database
        await tour.deleteOne();

        res.json({
            success: true,
            message: 'Tour deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting domestic tour:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   POST /api/domestic-tours/:id/reviews
 * @desc    Add a review to a tour
 * @access  Public
 */
router.post('/:id/reviews', [
    check('name', 'Name is required').not().isEmpty(),
    check('rating', 'Rating is required and must be between 1-5').isInt({ min: 1, max: 5 }),
    check('comment', 'Comment is required').not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        // Find tour
        const tour = await DomesticTour.findById(req.params.id);
        
        if (!tour) {
            return res.status(404).json({
                success: false,
                message: 'Tour not found'
            });
        }

        // Create new review
        const review = {
            name: req.body.name,
            rating: req.body.rating,
            comment: req.body.comment
        };

        // Add to reviews array
        tour.reviews.push(review);

        // Calculate average rating
        const totalRating = tour.reviews.reduce((sum, item) => sum + item.rating, 0);
        tour.rating = totalRating / tour.reviews.length;

        // Save changes
        await tour.save();

        res.status(201).json({
            success: true,
            message: 'Review added successfully'
        });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router; 