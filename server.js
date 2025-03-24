const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { uploadMiddleware, handleFileUpload } = require('./middleware/upload');
const fs = require('fs');
const PORT = process.env.PORT || 7777;
// const http = require('http');
// We don't need Socket.io anymore
// const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();

// Add MongoDB connection validation
mongoose.connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.error('MongoDB disconnected');
});

// Check if MongoDB connection is active before proceeding with requests
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.error('MongoDB connection is not open. Current state:', mongoose.connection.readyState);
    if (req.path.startsWith('/api/')) {
      return res.status(500).json({ error: 'Database connection is not established' });
    }
  }
  next();
});

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// Create a more generous limiter for admin endpoints
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // higher limit for admin routes
  message: { success: false, message: 'Too many admin requests, please try again later.' }
});

// Create a specific limiter for submissions endpoints that's even more generous
const submissionsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // higher limit specifically for submissions routes
  message: { success: false, message: 'Too many submission requests, please try again later.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // If it's an admin request (has auth token), use a different key to separate limits from regular users
    if (req.headers['x-auth-token']) {
      return req.headers['x-auth-token'] + req.ip;
    }
    return req.ip;
  }
});

// Middlewares
app.use(cors());
// Increase JSON payload limit to handle large base64 images
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf, encoding) => {
    if (req.method === 'PUT' || req.method === 'POST') {
      console.log(`Received ${req.method} request to ${req.originalUrl}`);
      
      try {
        // Try to test-parse the JSON
        const body = JSON.parse(buf.toString());
        console.log('JSON payload successfully parsed');
      } catch(e) {
        console.error('JSON parse error:', e.message);
        console.error('Raw request start:', buf.toString().substring(0, 100) + '...');
        res.status(400).json({ message: 'Invalid JSON: ' + e.message });
        throw new Error('Invalid JSON');
      }
    }
  }
}));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Add error handler for body-parser JSON errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON Parsing Error:', err.message);
    return res.status(400).json({ message: 'Invalid JSON: ' + err.message });
  }
  next(err);
});

// File upload middleware
app.use(uploadMiddleware);

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set proper MIME types for CSS files
app.use(express.static(path.join(__dirname, 'frontend'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Serve frontend static files in both production and development
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve admin static files (both in production and development)
app.use('/admin', express.static(path.join(__dirname, 'admin'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
// app.use('/api/carousel', require('./server/routes/carouselRoutes')); // Commented out to use direct route below
app.use('/api/domestic-tours', require('./routes/domesticTours'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/content', require('./routes/pageContent'));

// Add direct handlers for API endpoints needed by the frontend
// This avoids the need to modify the frontend code

// Direct API endpoints for carousel
// Get all carousel items
app.get('/api/carousel/all', async (req, res) => {
  try {
    console.log('Fetching all carousel items...');
    
    try {
      // Use direct MongoDB find operation
      const items = await mongoose.connection.collection('carousels')
        .find({})
        .sort({ order: 1 })
        .toArray();
      
      console.log(`Found ${items.length} carousel items`);
      res.json(items);
    } catch (dbError) {
      console.error('Database error fetching carousel items:', dbError);
      res.status(500).json({ 
        message: 'Database error when fetching carousel items',
        error: dbError.message,
        stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
      });
    }
  } catch (error) {
    console.error('Unexpected error fetching carousel items:', error);
    res.status(500).json({ 
      message: 'Failed to fetch carousel items',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get active carousel items
app.get('/api/carousel/active', async (req, res) => {
  try {
    console.log('Fetching active carousel items...');
    
    try {
      // Use direct MongoDB find operation with active filter
      const items = await mongoose.connection.collection('carousels')
        .find({ active: true })
        .sort({ order: 1 })
        .toArray();
      
      console.log(`Found ${items.length} active carousel items`);
      res.json(items);
    } catch (dbError) {
      console.error('Database error fetching active carousel items:', dbError);
      res.status(500).json({ 
        message: 'Database error when fetching active carousel items',
        error: dbError.message,
        stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
      });
    }
  } catch (error) {
    console.error('Unexpected error fetching active carousel items:', error);
    res.status(500).json({ 
      message: 'Failed to fetch active carousel items',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get a single carousel item
app.get('/api/carousel/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`Fetching carousel item with ID: ${id}`);
    
    // Validate ID format
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(id);
    } catch (error) {
      console.error(`Invalid carousel item ID format: ${id}`);
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    try {
      // Use direct MongoDB findOne operation
      const item = await mongoose.connection.collection('carousels').findOne({ _id: objectId });
      
      if (!item) {
        console.log(`Carousel item not found with ID: ${id}`);
        return res.status(404).json({ message: 'Carousel item not found' });
      }
      
      console.log(`Successfully retrieved carousel item with ID: ${id}`);
      res.json(item);
    } catch (dbError) {
      console.error(`Database error fetching carousel item ${id}:`, dbError);
      res.status(500).json({ 
        message: 'Database error when fetching carousel item',
        error: dbError.message,
        stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
      });
    }
  } catch (error) {
    console.error('Unexpected error fetching carousel item:', error);
    res.status(500).json({ 
      message: 'Failed to fetch carousel item',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create a new carousel item
app.post('/api/carousel', async (req, res) => {
  try {
    const CarouselModel = require('./server/models/carouselModel');
    const { title, heading, subheading, image, tags, order, active } = req.body;
    
    console.log('Received carousel item data:', { 
      title, 
      heading, 
      subheading, 
      imageLength: image ? image.length : 0,
      tagsProvided: Array.isArray(tags),
      orderProvided: order !== undefined,
      activeProvided: active !== undefined
    });
    
    // Validate required fields
    if (!title || !heading || !subheading || !image) {
      console.log('Missing required fields:', { 
        title: !!title, 
        heading: !!heading, 
        subheading: !!subheading, 
        image: !!image 
      });
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    try {
      // Direct MongoDB insertion approach to bypass Mongoose validation issues
      const newCarouselItem = {
        _id: new mongoose.Types.ObjectId(),
        title: title,
        heading: heading,
        subheading: subheading,
        image: image,
        tags: Array.isArray(tags) ? tags : [],
        order: typeof order === 'number' ? order : 0,
        active: typeof active === 'boolean' ? active : true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('Attempting direct MongoDB insertion for carousel item:', {
        _id: newCarouselItem._id,
        title: newCarouselItem.title,
        heading: newCarouselItem.heading,
        subheading: newCarouselItem.subheading
      });
      
      // Insert directly using the MongoDB driver
      const insertResult = await mongoose.connection.collection('carousels').insertOne(newCarouselItem);
      
      console.log('Direct MongoDB insert result:', insertResult);
      
      if (!insertResult.acknowledged) {
        console.error('Insert operation not acknowledged');
        return res.status(500).json({ message: 'Failed to create carousel item' });
      }
      
      console.log('Carousel item created successfully with ID:', newCarouselItem._id);
      
      // Return the created item
      res.status(201).json(newCarouselItem);
    } catch (dbError) {
      console.error('Error saving new carousel item:', dbError);
      if (dbError.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Validation error during save', 
          details: Object.values(dbError.errors).map(err => err.message) 
        });
      }
      if (dbError.name === 'MongoServerError' && dbError.code === 11000) {
        return res.status(400).json({ message: 'Duplicate key error' });
      }
      
      return res.status(500).json({ 
        message: 'Database operation failed', 
        error: dbError.message,
        stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
      });
    }
  } catch (error) {
    console.error('Error creating carousel item:', error);
    
    // Return more detailed error message
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: Object.values(error.errors).map(err => err.message) 
      });
    }
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate key error' });
    }
    
    res.status(500).json({ 
      message: 'Failed to create carousel item', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update a carousel item
app.put('/api/carousel/:id', async (req, res) => {
  try {
    const { title, heading, subheading, image, tags, order, active } = req.body;
    const id = req.params.id;
    
    console.log(`PUT /api/carousel/${id} - Processing valid request`);
    console.log('Request body fields:', {
      hasTitle: !!title,
      hasHeading: !!heading, 
      hasSubheading: !!subheading,
      imageLength: image ? image.length : 0,
      hasTags: Array.isArray(tags),
      orderType: typeof order,
      activeType: typeof active
    });
    
    // Validate required fields
    if (!title || !heading || !subheading || !image) {
      console.log(`PUT /api/carousel/${id} - Missing required fields`);
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`PUT /api/carousel/${id} - Invalid ID format`);
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    const objectId = new mongoose.Types.ObjectId(id);
    const collection = mongoose.connection.collection('carousels');
    
    // First check if item exists
    const existingItem = await collection.findOne({ _id: objectId });
    if (!existingItem) {
      console.log(`PUT /api/carousel/${id} - Item not found`);
      return res.status(404).json({ message: 'Carousel item not found' });
    }
    
    // Prepare update document
    const updateData = {
      title,
      heading,
      subheading,
      image,
      tags: Array.isArray(tags) ? tags : (existingItem.tags || []),
      order: typeof order === 'number' ? order : (existingItem.order || 0),
      active: typeof active === 'boolean' ? active : (existingItem.active !== undefined ? existingItem.active : true),
      updatedAt: new Date()
    };
    
    console.log(`PUT /api/carousel/${id} - Updating item`);
    
    // Update item
    await collection.updateOne({ _id: objectId }, { $set: updateData });
    
    // Get updated item 
    const updatedItem = await collection.findOne({ _id: objectId });
    
    console.log(`PUT /api/carousel/${id} - Success`);
    return res.json(updatedItem);
    
  } catch (error) {
    console.error(`PUT /api/carousel/${req.params.id} - Error:`, error);
    
    return res.status(500).json({
      message: 'Failed to update carousel item',
      error: error.message
    });
  }
});

// Delete a carousel item
app.delete('/api/carousel/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`Attempting to delete carousel item with ID: ${id}`);
    
    // Validate ID format
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(id);
    } catch (error) {
      console.error(`Invalid carousel item ID format: ${id}`);
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    try {
      // Use direct MongoDB deleteOne operation
      const deleteResult = await mongoose.connection.collection('carousels')
        .deleteOne({ _id: objectId });
      
      console.log('Delete operation result:', deleteResult);
      
      if (!deleteResult.acknowledged) {
        return res.status(500).json({ message: 'Delete operation not acknowledged' });
      }
      
      if (deleteResult.deletedCount === 0) {
        console.log(`Carousel item not found with ID: ${id}`);
        return res.status(404).json({ message: 'Carousel item not found' });
      }

      console.log(`Carousel item deleted successfully: ${id}`);
      res.json({ message: 'Carousel item deleted successfully' });
    } catch (dbError) {
      console.error(`Database error deleting carousel item ${id}:`, dbError);
      res.status(500).json({ 
        message: 'Database error when deleting carousel item',
        error: dbError.message,
        stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
      });
    }
  } catch (error) {
    console.error('Unexpected error deleting carousel item:', error);
    res.status(500).json({ 
      message: 'Failed to delete carousel item', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Put the more specific route before the generic route with parameter
// Update all carousel items order
app.put('/api/carousel-order', async (req, res) => {
  try {
    const { items } = req.body;
    
    console.log('Received request to update carousel items order:', { itemCount: items?.length || 0 });
    
    if (!items || !Array.isArray(items)) {
      console.error('Invalid items array provided for reordering');
      return res.status(400).json({ message: 'Invalid items array' });
    }

    try {
      // Use direct MongoDB operations to update each item's order
      const bulkOperations = items.map((item, index) => {
        if (!item.id) {
          console.warn(`Item at index ${index} has no ID, skipping`);
          return null; // Will be filtered out below
        }
        
        let objectId;
        try {
          objectId = new mongoose.Types.ObjectId(item.id);
        } catch (error) {
          console.warn(`Invalid item ID: ${item.id}, skipping`);
          return null; // Will be filtered out below
        }
        
        return {
          updateOne: {
            filter: { _id: objectId },
            update: { 
              $set: { 
                order: index,
                updatedAt: new Date()
              }
            }
          }
        };
      }).filter(operation => operation !== null);
      
      console.log(`Executing bulk operation for ${bulkOperations.length} items`);
      
      // Execute bulk update operation
      if (bulkOperations.length > 0) {
        const bulkResult = await mongoose.connection.collection('carousels')
          .bulkWrite(bulkOperations);
        
        console.log('Bulk update result:', bulkResult);
      } else {
        console.log('No valid items to update');
      }
      
      // Fetch updated items
      const updatedItems = await mongoose.connection.collection('carousels')
        .find({})
        .sort({ order: 1 })
        .toArray();
      
      console.log(`Returning ${updatedItems.length} updated carousel items`);
      res.json(updatedItems);
    } catch (dbError) {
      console.error('Database error updating carousel order:', dbError);
      res.status(500).json({ 
        message: 'Database error updating carousel order',
        error: dbError.message,
        stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
      });
    }
  } catch (error) {
    console.error('Unexpected error updating carousel items order:', error);
    res.status(500).json({ 
      message: 'Failed to update carousel items order',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Direct endpoint for static carousel data
app.get('/api/carousel', (req, res) => {
  // Serve static carousel data that matches what's in frontend/js/script.js
  const staticCarouselItems = [
    {
      image: '../images/photo-1739606944848-97662c0430f0 (1).avif',
      title: 'Manali & Kashmir - ₹16,999',
      heading: 'Explore the Paradise ',
      subheading: 'Experience the serene beauty of north India',
      tags: ['Mountains', 'Nature', 'Adventure']
    },
    {
      image: '../images/photo-1590001155093-a3c66ab0c3ff.avif',
      title: 'Maldives - ₹65,999',
      heading: 'Discover Hidden Gems',
      subheading: 'Sun-kissed beaches await you',
      tags: ['Beach', 'Luxury', 'Island']
    },
    {
      image: '../images/premium_photo-1661929242720-140374d97c94.avif',
      title: 'Thailand - ₹31,999',
      heading: 'Explore Exotic Thailand',
      subheading: 'Experience vibrant culture and pristine beaches',
      tags: ['Culture', 'Beach', 'Adventure']
    },
    {
      image: '../images/photo-1510414842594-a61c69b5ae57.avif',
      title: 'Dubai - ₹49,999',
      heading: 'Luxury in the Desert',
      subheading: 'Experience modern marvels and traditional charm',
      tags: ['Luxury', 'Shopping', 'Adventure']
    }
  ];
  
  res.json({
    success: true,
    data: staticCarouselItems
  });
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    // Import required models
    const ContactFormSubmission = require('./models/contactFormSubmission');
    const FlightSubmission = require('./models/flightSubmission');
    const TourSubmission = require('./models/tourSubmission');
    const VisaSubmission = require('./models/visaSubmission');
    const PassportSubmission = require('./models/passportSubmission');
    const ForexSubmission = require('./models/forexSubmission');
    const HoneymoonSubmission = require('./models/honeymoonSubmission');
    const CarouselItem = require('./models/carouselItem');
    const PageContent = require('./models/pageContent');

    // Get counts from all collections
    const contactsCount = await ContactFormSubmission.countDocuments();
    const flightsCount = await FlightSubmission.countDocuments();
    const visaCount = await VisaSubmission.countDocuments();
    const passportCount = await PassportSubmission.countDocuments();
    const forexCount = await ForexSubmission.countDocuments();
    const honeymoonCount = await HoneymoonSubmission.countDocuments();
    
    // For domestic and international tours, filter by tourType in TourSubmission
    const domesticToursCount = await TourSubmission.countDocuments({ tourType: 'domestic' });
    const internationalToursCount = await TourSubmission.countDocuments({ tourType: 'international' });

    // Content items counts
    const carouselItemsCount = await CarouselItem.countDocuments();
    const pageContentCount = await PageContent.countDocuments();

    res.json({
      success: true,
      contacts: contactsCount,
      flights: flightsCount,
      visa: visaCount,
      passport: passportCount,
      forex: forexCount,
      honeymoon: honeymoonCount,
      domesticTours: domesticToursCount,
      internationalTours: internationalToursCount,
      carouselItems: carouselItemsCount,
      pageContents: pageContentCount
    });
  } catch (err) {
    console.error('Error fetching stats:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

// Recent submissions endpoint
app.get('/api/recent-submissions', async (req, res) => {
  try {
    // Import required models
    const ContactFormSubmission = require('./models/contactFormSubmission');
    const FlightSubmission = require('./models/flightSubmission');
    const TourSubmission = require('./models/tourSubmission');
    const VisaSubmission = require('./models/visaSubmission');
    const PassportSubmission = require('./models/passportSubmission');
    const ForexSubmission = require('./models/forexSubmission');
    const HoneymoonSubmission = require('./models/honeymoonSubmission');

    // Get 5 most recent submissions of each type
    const contacts = await ContactFormSubmission.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
          
    const flights = await FlightSubmission.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
          
    const domesticTours = await TourSubmission.find({ tourType: 'domestic' })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
          
    const internationalTours = await TourSubmission.find({ tourType: 'international' })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
          
    const visas = await VisaSubmission.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
          
    const passports = await PassportSubmission.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
          
    const forexes = await ForexSubmission.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
          
    const honeymoons = await HoneymoonSubmission.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
      
    // Format all submissions with their types
    const formattedSubmissions = [
      ...contacts.map(doc => ({ ...doc, id: doc._id.toString(), type: 'contact' })),
      ...flights.map(doc => ({ ...doc, id: doc._id.toString(), type: 'flight' })),
      ...domesticTours.map(doc => ({ ...doc, id: doc._id.toString(), type: 'domestic' })),
      ...internationalTours.map(doc => ({ ...doc, id: doc._id.toString(), type: 'international' })),
      ...visas.map(doc => ({ ...doc, id: doc._id.toString(), type: 'visa' })),
      ...passports.map(doc => ({ ...doc, id: doc._id.toString(), type: 'passport' })),
      ...forexes.map(doc => ({ ...doc, id: doc._id.toString(), type: 'forex' })),
      ...honeymoons.map(doc => ({ ...doc, id: doc._id.toString(), type: 'honeymoon' }))
    ];
      
    // Sort by date descending
    formattedSubmissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
    // Return response
    res.json({
      success: true,
      submissions: formattedSubmissions
    });
  } catch (error) {
    console.error('Error fetching recent submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recent submissions'
    });
  }
});

// All submissions endpoint with pagination
app.get('/api/submissions/all', async (req, res) => {
  try {
    // Import required models
    const ContactFormSubmission = require('./models/contactFormSubmission');
    const FlightSubmission = require('./models/flightSubmission');
    const TourSubmission = require('./models/tourSubmission');
    const VisaSubmission = require('./models/visaSubmission');
    const PassportSubmission = require('./models/passportSubmission');
    const ForexSubmission = require('./models/forexSubmission');
    const HoneymoonSubmission = require('./models/honeymoonSubmission');

    // Parse query parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Type filtering
    const type = req.query.type || 'all';
    
    // Date filtering
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : null;
    const toDate = req.query.toDate ? new Date(req.query.toDate) : null;
    
    // Status filtering
    const status = req.query.status || 'all';
    
    // Prepare models to query based on type
    const modelsToQuery = [];
    
    // Base filter object for date and status filtering
    const baseFilter = {};
    
    // Add date filters if provided
    if (fromDate) {
      baseFilter.createdAt = baseFilter.createdAt || {};
      baseFilter.createdAt.$gte = fromDate;
    }
    
    if (toDate) {
      baseFilter.createdAt = baseFilter.createdAt || {};
      // Add one day to make it inclusive of the end date
      const endDate = new Date(toDate);
      endDate.setDate(endDate.getDate() + 1);
      baseFilter.createdAt.$lte = endDate;
    }
    
    // Add status filter if not 'all'
    if (status !== 'all' && status) {
      baseFilter.status = status;
    }
    
    // Determine which models to query based on the type
    if (type === 'all' || type === 'contact') {
      modelsToQuery.push({ model: ContactFormSubmission, type: 'contact' });
    }
    
    if (type === 'all' || type === 'flight') {
      modelsToQuery.push({ model: FlightSubmission, type: 'flight' });
    }
    
    if (type === 'all' || type === 'domestic') {
      modelsToQuery.push({ model: TourSubmission, type: 'domestic', tourType: 'domestic' });
    }
    
    if (type === 'all' || type === 'international') {
      modelsToQuery.push({ model: TourSubmission, type: 'international', tourType: 'international' });
    }
    
    if (type === 'all' || type === 'visa') {
      modelsToQuery.push({ model: VisaSubmission, type: 'visa' });
    }
    
    if (type === 'all' || type === 'passport') {
      modelsToQuery.push({ model: PassportSubmission, type: 'passport' });
    }
    
    if (type === 'all' || type === 'forex') {
      modelsToQuery.push({ model: ForexSubmission, type: 'forex' });
    }
    
    if (type === 'all' || type === 'honeymoon') {
      modelsToQuery.push({ model: HoneymoonSubmission, type: 'honeymoon' });
    }
    
    // Query each model and collect results
    const modelQueries = modelsToQuery.map(async ({ model, type, tourType }) => {
      try {
        // Clone base filter
        const filter = { ...baseFilter };
        
        // Add tourType filter for tour submissions
        if (tourType) {
          filter.tourType = tourType;
        }
        
        // Count total matching documents
        const totalCount = await model.countDocuments(filter);
        
        // Get paginated documents
        let submissions = [];
        
        // Only query if there are matches and this is the correct page
        if (totalCount > 0) {
          submissions = await model.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        }
        
        // Add type to each document and convert _id to id
        return {
          type,
          totalCount,
          submissions: submissions.map(doc => ({ 
            ...doc, 
            id: doc._id.toString(),
            type
          }))
        };
      } catch (err) {
        console.error(`Error querying ${type} submissions:`, err);
        return { type, totalCount: 0, submissions: [] };
      }
    });
    
    // Wait for all queries to complete
    const results = await Promise.all(modelQueries);
    
    // Calculate total count across all models
    const totalCount = results.reduce((sum, result) => sum + result.totalCount, 0);
    
    // Combine all submissions
    let allSubmissions = [];
    results.forEach(result => {
      allSubmissions = allSubmissions.concat(result.submissions);
    });
    
    // Sort by date descending
    allSubmissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination to the combined results
    // The pagination has already been applied to individual queries
    // but we need to ensure we're returning the right number of results
    if (type === 'all') {
      // For 'all' type, we need to manually paginate the combined results
      const totalPages = Math.ceil(totalCount / limit);
      
      // Return appropriate response
      res.json({
        success: true,
        totalCount,
        currentPage: page,
        totalPages,
        submissions: allSubmissions.slice(0, limit)
      });
    } else {
      // For single type, use the first result
      const result = results[0];
      const totalPages = Math.ceil(result.totalCount / limit);
      
      res.json({
        success: true,
        totalCount: result.totalCount,
        currentPage: page,
        totalPages,
        submissions: result.submissions
      });
    }
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submissions',
      error: error.message
    });
  }
});

// Endpoint for viewing a specific submission by type and ID
app.get('/api/submission/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    
    // Import required models
    const ContactFormSubmission = require('./models/contactFormSubmission');
    const FlightSubmission = require('./models/flightSubmission');
    const TourSubmission = require('./models/tourSubmission');
    const VisaSubmission = require('./models/visaSubmission');
    const PassportSubmission = require('./models/passportSubmission');
    const ForexSubmission = require('./models/forexSubmission');
    const HoneymoonSubmission = require('./models/honeymoonSubmission');

    let submission;

    // Based on type, query the appropriate collection
    switch (type) {
      case 'contact':
        submission = await ContactFormSubmission.findById(id);
        break;
      case 'flight':
        submission = await FlightSubmission.findById(id);
        break;
      case 'domestic':
      case 'international':
        submission = await TourSubmission.findById(id);
        // Verify tour type matches
        if (submission && submission.tourType !== type) {
          return res.status(400).json({
            success: false,
            message: 'Tour type mismatch'
          });
        }
        break;
      case 'visa':
        submission = await VisaSubmission.findById(id);
        break;
      case 'passport':
        submission = await PassportSubmission.findById(id);
        break;
      case 'forex':
        submission = await ForexSubmission.findById(id);
        break;
      case 'honeymoon':
        submission = await HoneymoonSubmission.findById(id);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid submission type'
        });
    }

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (err) {
    console.error('Error fetching submission details:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching submission details'
    });
  }
});

// Endpoint for marking a submission as read
app.post('/api/submission/:type/:id/read', async (req, res) => {
  try {
    const { type, id } = req.params;
    
    // Import required models
    const ContactFormSubmission = require('./models/contactFormSubmission');
    const FlightSubmission = require('./models/flightSubmission');
    const TourSubmission = require('./models/tourSubmission');
    const VisaSubmission = require('./models/visaSubmission');
    const PassportSubmission = require('./models/passportSubmission');
    const ForexSubmission = require('./models/forexSubmission');
    const HoneymoonSubmission = require('./models/honeymoonSubmission');
    
    let submission;
    let model;

    // Based on type, determine the appropriate model
    switch (type) {
      case 'contact':
        model = ContactFormSubmission;
        break;
      case 'flight':
        model = FlightSubmission;
        break;
      case 'domestic':
      case 'international':
        model = TourSubmission;
        break;
      case 'visa':
        model = VisaSubmission;
        break;
      case 'passport':
        model = PassportSubmission;
        break;
      case 'forex':
        model = ForexSubmission;
        break;
      case 'honeymoon':
        model = HoneymoonSubmission;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid submission type'
        });
    }

    // Find the submission
    submission = await model.findById(id);

    // Check if submission exists
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // For tour submissions, verify the tour type
    if ((type === 'domestic' || type === 'international') && 
        submission.tourType !== type) {
      return res.status(400).json({
        success: false,
        message: 'Tour type mismatch'
      });
    }

    // Update the submission status to read
    submission = await model.findByIdAndUpdate(
      id,
      { 
        status: 'read', 
        isRead: true, 
        readAt: new Date() 
      },
      { new: true }
    );

    // Emit real-time update to all connected admin clients
    // if (global.io) {
    //   global.io.to('admins').emit('submission_status_changed', {
    //     id,
    //     type,
    //     status: 'read',
    //     isRead: true,
    //     readAt: new Date()
    //   });
    //   console.log(`Emitted status change event (read) for ${type}:${id}`);
    // }

    res.json({
      success: true,
      message: 'Submission marked as read'
    });
  } catch (err) {
    console.error('Error marking submission as read:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error while marking submission as read'
    });
  }
});

// Endpoint for marking submission as unread
app.post('/api/submission/:type/:id/unread', async (req, res) => {
  try {
    const { type, id } = req.params;
    let submission;
    let model;

    // Based on type, determine the model to use
    switch (type) {
      case 'contact':
        model = require('./models/contactFormSubmission');
        break;
      case 'flight':
        model = require('./models/flightSubmission');
        break;
      case 'domestic':
      case 'international':
        model = require('./models/tourSubmission');
        break;
      case 'visa':
        model = require('./models/visaSubmission');
        break;
      case 'passport':
        model = require('./models/passportSubmission');
        break;
      case 'forex':
        model = require('./models/forexSubmission');
        break;
      case 'honeymoon':
        model = require('./models/honeymoonSubmission');
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid submission type'
        });
    }

    // For tour submissions, verify the tour type
    if (type === 'domestic' || type === 'international') {
      const submissionCheck = await model.findById(id);
      if (submissionCheck && submissionCheck.tourType !== type) {
        return res.status(400).json({
          success: false,
          message: 'Tour type mismatch'
        });
      }
    }

    // Update the submission status to unread
    submission = await model.findByIdAndUpdate(
      id,
      { 
        status: 'new', 
        isRead: false, 
        readAt: null 
      },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Emit real-time update to all connected admin clients
    // if (global.io) {
    //   global.io.to('admins').emit('submission_status_changed', {
    //     id,
    //     type,
    //     status: 'new',
    //     isRead: false,
    //     readAt: null
    //   });
    //   console.log(`Emitted status change event (unread) for ${type}:${id}`);
    // }

    res.json({
      success: true,
      message: 'Submission marked as unread',
      submission
    });
  } catch (err) {
    console.error('Error marking submission as unread:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error while marking submission as unread'
    });
  }
});

// Endpoint for deleting a submission
app.delete('/api/submission/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    
    // Import required models
    const ContactFormSubmission = require('./models/contactFormSubmission');
    const FlightSubmission = require('./models/flightSubmission');
    const TourSubmission = require('./models/tourSubmission');
    const VisaSubmission = require('./models/visaSubmission');
    const PassportSubmission = require('./models/passportSubmission');
    const ForexSubmission = require('./models/forexSubmission');
    const HoneymoonSubmission = require('./models/honeymoonSubmission');
    
    let model;

    // Based on type, determine the appropriate model
    switch (type) {
      case 'contact':
        model = ContactFormSubmission;
        break;
      case 'flight':
        model = FlightSubmission;
        break;
      case 'domestic':
      case 'international':
        model = TourSubmission;
        break;
      case 'visa':
        model = VisaSubmission;
        break;
      case 'passport':
        model = PassportSubmission;
        break;
      case 'forex':
        model = ForexSubmission;
        break;
      case 'honeymoon':
        model = HoneymoonSubmission;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid submission type'
        });
    }

    // For tour submissions, verify the tour type
    if (type === 'domestic' || type === 'international') {
      const submission = await model.findById(id);
      if (submission && submission.tourType !== type) {
        return res.status(400).json({
          success: false,
          message: 'Tour type mismatch'
        });
      }
    }

    // Delete the submission
    const result = await model.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    res.json({
      success: true,
      message: 'Submission deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting submission:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting submission'
    });
  }
});

// File upload route
app.post('/api/upload', uploadMiddleware, handleFileUpload);

// Helper function to escape CSV fields
function escapeCsvField(field) {
  if (field === null || field === undefined) {
    return '';
  }
  
  // Convert to string
  const stringField = String(field);
  
  // Check if we need to escape
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    // Escape double quotes with double quotes
    const escapedField = stringField.replace(/"/g, '""');
    // Wrap in quotes
    return `"${escapedField}"`;
  }
  
  return stringField;
}

// Endpoint for updating submission status
app.put('/api/submission/:type/:id/status', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { status, isRead } = req.body;
    
    // Import required models
    const ContactFormSubmission = require('./models/contactFormSubmission');
    const FlightSubmission = require('./models/flightSubmission');
    const TourSubmission = require('./models/tourSubmission');
    const VisaSubmission = require('./models/visaSubmission');
    const PassportSubmission = require('./models/passportSubmission');
    const ForexSubmission = require('./models/forexSubmission');
    const HoneymoonSubmission = require('./models/honeymoonSubmission');
    
    let model;

    // Based on type, determine the appropriate model
    switch (type) {
      case 'contact':
        model = ContactFormSubmission;
        break;
      case 'flight':
        model = FlightSubmission;
        break;
      case 'domestic':
      case 'international':
        model = TourSubmission;
        break;
      case 'visa':
        model = VisaSubmission;
        break;
      case 'passport':
        model = PassportSubmission;
        break;
      case 'forex':
        model = ForexSubmission;
        break;
      case 'honeymoon':
        model = HoneymoonSubmission;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid submission type'
        });
    }

    // For tour submissions, verify the tour type
    if (type === 'domestic' || type === 'international') {
      const submission = await model.findById(id);
      if (submission && submission.tourType !== type) {
        return res.status(400).json({
          success: false,
          message: 'Tour type mismatch'
        });
      }
    }

    // Update the submission status
    const updateData = { 
      status: status,
      isRead: status === 'read' ? true : false,
      readAt: status === 'read' ? new Date() : null
    };

    const updatedSubmission = await model.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updatedSubmission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Emit real-time update to all connected admin clients
    // if (global.io) {
    //   global.io.to('admins').emit('submission_status_changed', {
    //     id,
    //     type,
    //     status: status,
    //     isRead: status === 'read' ? true : false,
    //     readAt: status === 'read' ? new Date() : null
    //   });
    //   console.log(`Emitted status change event for ${type}:${id}`);
    // }

    res.json({
      success: true,
      message: 'Status updated successfully',
      submission: updatedSubmission
    });
  } catch (err) {
    console.error('Error updating submission status:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating submission status'
    });
  }
});

// Export submissions endpoint
app.get('/api/export/submissions', async (req, res) => {
  try {
    // Parse query parameters
    let type = req.query.type || 'all';
    let status = req.query.status;
    let search = req.query.search;
    let format = req.query.format || 'csv';
    
    // Import required models
    const ContactFormSubmission = require('./models/contactFormSubmission');
    const FlightSubmission = require('./models/flightSubmission');
    const TourSubmission = require('./models/tourSubmission');
    const VisaSubmission = require('./models/visaSubmission');
    const PassportSubmission = require('./models/passportSubmission');
    const ForexSubmission = require('./models/forexSubmission');
    const HoneymoonSubmission = require('./models/honeymoonSubmission');
    
    // Define models to query based on type
    let models = [];
    if (type === 'all') {
      models = [
        { model: ContactFormSubmission, type: 'contact' },
        { model: FlightSubmission, type: 'flight' },
        { model: TourSubmission, type: 'domestic', filterField: 'tourType', filterValue: 'domestic' },
        { model: TourSubmission, type: 'international', filterField: 'tourType', filterValue: 'international' },
        { model: VisaSubmission, type: 'visa' },
        { model: PassportSubmission, type: 'passport' },
        { model: ForexSubmission, type: 'forex' },
        { model: HoneymoonSubmission, type: 'honeymoon' }
      ];
    } else if (type === 'domestic' || type === 'international') {
      models = [{ model: TourSubmission, type, filterField: 'tourType', filterValue: type }];
    } else {
      const modelMap = {
        'contact': ContactFormSubmission,
        'flight': FlightSubmission,
        'visa': VisaSubmission,
        'passport': PassportSubmission,
        'forex': ForexSubmission,
        'honeymoon': HoneymoonSubmission
      };
      if (modelMap[type]) {
        models = [{ model: modelMap[type], type }];
      }
    }
    
    // Prepare the base filter
    const baseFilter = {};
    if (status && status !== 'all') {
      baseFilter.status = status;
    }
    if (search) {
      baseFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Collect all submissions
    let allSubmissions = [];
    for (const modelConfig of models) {
      let filter = { ...baseFilter };
      if (modelConfig.filterField) {
        filter[modelConfig.filterField] = modelConfig.filterValue;
      }
      
      try {
        const submissions = await modelConfig.model.find(filter).sort({ createdAt: -1 });
        submissions.forEach(submission => {
          const submissionData = submission.toObject();
          submissionData.type = modelConfig.type;
          allSubmissions.push(submissionData);
        });
      } catch (error) {
        console.error(`Error fetching ${modelConfig.type} submissions:`, error);
      }
    }
    
    // Format output based on requested format
    if (format === 'csv') {
      // Define CSV headers
      const csvHeaders = [
        'ID', 'Type', 'Name', 'Email', 'Phone', 'Status', 
        'Created At', 'Updated At', 'Read At'
      ].join(',');
      
      // Create CSV rows
      const csvRows = allSubmissions.map(submission => {
        return [
          submission._id,
          submission.type,
          escapeCsvField(submission.name || ''),
          escapeCsvField(submission.email || ''),
          escapeCsvField(submission.phone || ''),
          submission.status || 'new',
          submission.createdAt ? new Date(submission.createdAt).toISOString() : '',
          submission.updatedAt ? new Date(submission.updatedAt).toISOString() : '',
          submission.readAt ? new Date(submission.readAt).toISOString() : ''
        ].join(',');
      });
      
      // Combine headers and rows
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      // Set response headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=submissions-export.csv');
      
      // Send CSV data directly as text, not as JSON
      return res.send(csvContent);
    } else {
      // For JSON format or default
      return res.json({
        success: true,
        submissions: allSubmissions,
        count: allSubmissions.length
      });
    }
  } catch (error) {
    console.error('Error exporting submissions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during export',
      error: error.message
    });
  }
});

// Connect to MongoDB with improved options
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Only initialize carousel items after successful connection
    initializeCarouselItems();
    
    // Start server ONLY after successful database connection
    startServer();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Wait 5 seconds before retrying
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// Function to start the server
function startServer() {
  try {
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is busy, trying ${PORT + 1}...`);
        // Try the next port
        const server2 = app.listen(PORT + 1, () => {
          console.log(`Server running on port ${PORT + 1}`);
        });
        server2.on('error', (err2) => {
          console.error('Failed to start server on alternative port:', err2);
          process.exit(1);
        });
      } else {
        console.error('Server error:', err);
      }
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Function to initialize carousel items with static data from script.js
function initializeCarouselItems() {
  try {
    // Check if we have a Carousel model
    let CarouselModel;
    try {
      CarouselModel = require('./server/models/carouselModel');
    } catch (err) {
      console.error('Error loading carousel model:', err);
      try {
        CarouselModel = mongoose.model('Carousel');
      } catch (modelErr) {
        console.error('Could not find Carousel model:', modelErr);
        return;
      }
    }
    
    // Force reset of carousel items for testing
    console.log('Clearing existing carousel items to reset them');
    CarouselModel.deleteMany({})
      .then(() => {
        // Static carousel items matching the ones in script.js
        const staticItems = [
          {
            image: '../images/photo-1739606944848-97662c0430f0 (1).avif',
            title: 'Manali & Kashmir - ₹16,999',
            heading: 'Explore the Paradise ',
            subheading: 'Experience the serene beauty of north India',
            tags: ['Mountains', 'Nature', 'Adventure'],
            order: 0,
            active: true
          },
          {
            image: '../images/photo-1590001155093-a3c66ab0c3ff.avif',
            title: 'Maldives - ₹65,999',
            heading: 'Discover Hidden Gems',
            subheading: 'Sun-kissed beaches await you',
            tags: ['Beach', 'Luxury', 'Island'],
            order: 1,
            active: true
          },
          {
            image: '../images/premium_photo-1661929242720-140374d97c94.avif',
            title: 'Thailand - ₹31,999',
            heading: 'Explore Exotic Thailand',
            subheading: 'Experience vibrant culture and pristine beaches',
            tags: ['Culture', 'Beach', 'Adventure'],
            order: 2,
            active: true
          },
          {
            image: '../images/photo-1510414842594-a61c69b5ae57.avif',
            title: 'Dubai - ₹49,999',
            heading: 'Luxury in the Desert',
            subheading: 'Experience modern marvels and traditional charm',
            tags: ['Luxury', 'Shopping', 'Adventure'],
            order: 3,
            active: true
          }
        ];
        
        // Insert the static items
        return CarouselModel.insertMany(staticItems);
      })
      .then(result => {
        console.log(`Initialized carousel with ${result.length} static items`);
      })
      .catch(error => {
        console.error('Error inserting carousel items:', error);
      });
  } catch (error) {
    console.error('Error in carousel initialization:', error);
  }
}

// Start the connection process - only call this once
connectDB();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error'
  });
});

// Global error handlers for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(error.name, error.message);
    console.error(error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(error.name, error.message);
    console.error(error.stack);
    // Don't exit the process, just log the error
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully');
  process.exit(0);
});

// Serve static files for production
if (process.env.NODE_ENV === 'production') {
  // Redirect all non-API requests to index.html
  app.get('*', (req, res) => {
    if (req.path.startsWith('/admin') && !req.path.includes('.')) {
      res.sendFile(path.resolve(__dirname, 'admin', 'index.html'));
    } else {
      res.sendFile(path.resolve(__dirname, 'frontend/templates', 'index.html'));
    }
  });
} else {
  // Handle specific template requests in development
  app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend/templates', 'index.html'));
  });
  
  // Handle other HTML template requests - with or without .html extension
  app.get('/:template', (req, res) => {
    let templateName = req.params.template;
    
    // Remove .html extension if present
    if (templateName.endsWith('.html')) {
      templateName = templateName.substring(0, templateName.length - 5);
    }
    
    // Check for exact match first
    const exactPath = path.resolve(__dirname, 'frontend/templates', `${templateName}.html`);
    
    // Then try case-insensitive match for files with spaces
    fs.readdir(path.resolve(__dirname, 'frontend/templates'), (err, files) => {
      if (err) {
        console.error('Error reading templates directory:', err);
        return res.sendFile(path.resolve(__dirname, 'frontend/templates', 'index.html'));
      }
      
      // Find a matching file (case insensitive)
      const matchingFile = files.find(file => 
        file.toLowerCase().replace(/ /g, '%20') === (templateName + '.html').toLowerCase() ||
        file.toLowerCase() === (templateName + '.html').toLowerCase() ||
        file.toLowerCase().replace(/ /g, '') === (templateName + '.html').toLowerCase()
      );
      
      if (matchingFile) {
        res.sendFile(path.resolve(__dirname, 'frontend/templates', matchingFile));
      } else if (fs.existsSync(exactPath)) {
        res.sendFile(exactPath);
      } else {
        console.log(`Template not found: ${templateName}.html, redirecting to index.html`);
        res.sendFile(path.resolve(__dirname, 'frontend/templates', 'index.html'));
      }
    });
  });
}

// Apply rate limiting to API routes based on endpoint
app.use('/api/submissions', submissionsLimiter); // Apply submissions limiter first
app.use('/api/admin', adminLimiter); // Apply admin limiter
app.use('/api/', limiter); // Apply general limiter to all other api routes