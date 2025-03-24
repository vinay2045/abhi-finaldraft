const express = require('express');
const router = express.Router();
const carouselController = require('../controllers/carouselController');

// Get all carousel items
router.get('/all', carouselController.getAllCarouselItems);

// Get active carousel items (for frontend)
router.get('/active', carouselController.getActiveCarouselItems);

// Get a single carousel item
router.get('/:id', carouselController.getCarouselItemById);

// Create a new carousel item
router.post('/', carouselController.createCarouselItem);

// Update a carousel item
router.put('/:id', carouselController.updateCarouselItem);

// Delete a carousel item
router.delete('/:id', carouselController.deleteCarouselItem);

// Update carousel items order
router.put('/order/update', carouselController.updateCarouselItemsOrder);

module.exports = router; 