const Carousel = require('../models/carouselModel');

// Get all carousel items
exports.getAllCarouselItems = async (req, res) => {
    try {
        // Get all carousel items, sorted by order
        const items = await Carousel.find().sort({ order: 1 });
        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching carousel items:', error);
        res.status(500).json({ message: 'Failed to fetch carousel items' });
    }
};

// Get active carousel items (for frontend)
exports.getActiveCarouselItems = async (req, res) => {
    try {
        // Get only active carousel items, sorted by order
        const items = await Carousel.find({ active: true }).sort({ order: 1 });
        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching active carousel items:', error);
        res.status(500).json({ message: 'Failed to fetch active carousel items' });
    }
};

// Get a single carousel item by ID
exports.getCarouselItemById = async (req, res) => {
    try {
        const item = await Carousel.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Carousel item not found' });
        }
        res.status(200).json(item);
    } catch (error) {
        console.error('Error fetching carousel item:', error);
        res.status(500).json({ message: 'Failed to fetch carousel item' });
    }
};

// Create a new carousel item
exports.createCarouselItem = async (req, res) => {
    try {
        const { title, heading, subheading, image, tags, order, active } = req.body;
        
        // Validate required fields
        if (!title || !heading || !subheading || !image) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Create new carousel item
        const newItem = new Carousel({
            title,
            heading,
            subheading,
            image,
            tags: tags || [],
            order: order || 0,
            active: active !== undefined ? active : true
        });

        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        console.error('Error creating carousel item:', error);
        res.status(500).json({ message: 'Failed to create carousel item' });
    }
};

// Update a carousel item
exports.updateCarouselItem = async (req, res) => {
    try {
        const { title, heading, subheading, image, tags, order, active } = req.body;
        
        // Find and update the item
        const updatedItem = await Carousel.findByIdAndUpdate(
            req.params.id,
            {
                title,
                heading,
                subheading,
                image,
                tags,
                order,
                active,
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ message: 'Carousel item not found' });
        }

        res.status(200).json(updatedItem);
    } catch (error) {
        console.error('Error updating carousel item:', error);
        res.status(500).json({ message: 'Failed to update carousel item' });
    }
};

// Delete a carousel item
exports.deleteCarouselItem = async (req, res) => {
    try {
        const deletedItem = await Carousel.findByIdAndDelete(req.params.id);
        
        if (!deletedItem) {
            return res.status(404).json({ message: 'Carousel item not found' });
        }

        res.status(200).json({ message: 'Carousel item deleted successfully' });
    } catch (error) {
        console.error('Error deleting carousel item:', error);
        res.status(500).json({ message: 'Failed to delete carousel item' });
    }
};

// Update all carousel items order
exports.updateCarouselItemsOrder = async (req, res) => {
    try {
        const { items } = req.body;
        
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ message: 'Invalid items array' });
        }

        // Update each item's order
        const updatePromises = items.map((item, index) => {
            return Carousel.findByIdAndUpdate(
                item.id,
                { order: index, updatedAt: Date.now() },
                { new: true }
            );
        });

        await Promise.all(updatePromises);
        
        // Fetch updated items
        const updatedItems = await Carousel.find().sort({ order: 1 });
        
        res.status(200).json(updatedItems);
    } catch (error) {
        console.error('Error updating carousel items order:', error);
        res.status(500).json({ message: 'Failed to update carousel items order' });
    }
}; 