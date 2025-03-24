const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { isAdmin } = require('../middleware/auth');
const ContactFormSubmission = require('../models/contactFormSubmission');
const FlightSubmission = require('../models/flightSubmission');
const TourSubmission = require('../models/tourSubmission');
const VisaSubmission = require('../models/visaSubmission');
const PassportSubmission = require('../models/passportSubmission');
const ForexSubmission = require('../models/forexSubmission');
const HoneymoonSubmission = require('../models/honeymoonSubmission');
const DomesticTour = require('../models/domesticTour');
const InternationalTour = require('../models/internationalTour');
const CarouselItem = require('../models/carouselItem');
const PageContent = require('../models/pageContent');

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private (Admin only)
router.get('/stats', isAdmin, async (req, res) => {
    try {
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
        console.error('Error fetching admin stats:', err.message);
        res.status(500).json({ 
            success: false,
            message: 'Server error while fetching statistics'
        });
    }
});

// @route   GET /api/admin/recent-submissions
// @desc    Get recent submissions (last 5 from each type)
// @access  Private (Admin only)
router.get('/recent-submissions', isAdmin, async (req, res) => {
    try {
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

// @route   GET /api/admin/submission/:type/:id
// @desc    Get detailed information about a specific submission
// @access  Private (Admin only)
router.get('/submission/:type/:id', isAdmin, async (req, res) => {
    try {
        const { type, id } = req.params;
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

// @route   GET /api/admin/submissions/:type
// @desc    Get all submissions of a specific type
// @access  Private (Admin only)
router.get('/submissions/:type', isAdmin, async (req, res) => {
    try {
        const { type } = req.params;
        let submissions;

        // Based on type, query the appropriate collection
        switch (type) {
            case 'contact':
                submissions = await ContactFormSubmission.find().sort({ createdAt: -1 });
                break;
            case 'flight':
                submissions = await FlightSubmission.find().sort({ createdAt: -1 });
                break;
            case 'domestic':
                submissions = await TourSubmission.find({ tourType: 'domestic' }).sort({ createdAt: -1 });
                break;
            case 'international':
                submissions = await TourSubmission.find({ tourType: 'international' }).sort({ createdAt: -1 });
                break;
            case 'visa':
                submissions = await VisaSubmission.find().sort({ createdAt: -1 });
                break;
            case 'passport':
                submissions = await PassportSubmission.find().sort({ createdAt: -1 });
                break;
            case 'forex':
                submissions = await ForexSubmission.find().sort({ createdAt: -1 });
                break;
            case 'honeymoon':
                submissions = await HoneymoonSubmission.find().sort({ createdAt: -1 });
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid submission type'
                });
        }

        res.json({
            success: true,
            submissions
        });
    } catch (err) {
        console.error(`Error fetching ${req.params.type} submissions:`, err.message);
        res.status(500).json({ 
            success: false,
            message: `Server error while fetching ${req.params.type} submissions`
        });
    }
});

// @route   PUT /api/admin/submission/:type/:id
// @desc    Update status of a submission
// @access  Private (Admin only)
router.put('/submission/:type/:id', isAdmin, async (req, res) => {
    try {
        const { type, id } = req.params;
        const { status } = req.body;
        
        if (!status || !['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        let submission;
        let model;

        // Based on type, determine the model to use
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

        // Update the submission status
        submission = await model.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

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
        console.error('Error updating submission status:', err.message);
        res.status(500).json({ 
            success: false,
            message: 'Server error while updating submission status'
        });
    }
});

// @route   GET /api/admin/submissions/contact
// @desc    Get all contact form submissions
// @access  Private (Admin only)
router.get('/submissions/contact', isAdmin, async (req, res) => {
    try {
        // Get submissions with pagination options
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        
        // Get filter options
        const status = req.query.status;
        const search = req.query.search;
        
        // Build query
        let query = {};
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Get total count for pagination
        const total = await ContactFormSubmission.countDocuments(query);
        
        // Get submissions
        const submissions = await ContactFormSubmission.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        res.json({
            success: true,
            submissions,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Error fetching contact submissions:', err.message);
        res.status(500).json({ 
            success: false,
            message: 'Server error while fetching contact submissions'
        });
    }
});

// @route   GET /api/admin/submission/contact/:id
// @desc    Get a specific contact form submission
// @access  Private (Admin only)
router.get('/submission/contact/:id', isAdmin, async (req, res) => {
    try {
        const submission = await ContactFormSubmission.findById(req.params.id);
        
        if (!submission) {
            return res.status(404).json({ 
                success: false,
                message: 'Submission not found'
            });
        }
        
        res.json({
            success: true,
            submission
        });
    } catch (err) {
        console.error('Error fetching submission:', err.message);
        res.status(500).json({ 
            success: false,
            message: 'Server error while fetching submission'
        });
    }
});

// @route   PUT /api/admin/submission/contact/:id/status
// @desc    Update a contact submission's status
// @access  Private (Admin only)
router.put('/submission/contact/:id/status', isAdmin, async (req, res) => {
    try {
        const { status, notes } = req.body;
        
        // Validate status
        if (!['new', 'in-progress', 'resolved'].includes(status)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid status value'
            });
        }
        
        // Find and update the submission
        const submission = await ContactFormSubmission.findById(req.params.id);
        
        if (!submission) {
            return res.status(404).json({ 
                success: false,
                message: 'Submission not found'
            });
        }
        
        submission.status = status;
        submission.notes = notes;
        
        await submission.save();
        
        res.json({
            success: true,
            message: 'Submission status updated',
            submission
        });
    } catch (err) {
        console.error('Error updating submission status:', err.message);
        res.status(500).json({ 
            success: false,
            message: 'Server error while updating submission'
        });
    }
});

// @route   DELETE /api/admin/submission/contact/:id
// @desc    Delete a contact submission
// @access  Private (Admin only)
router.delete('/submission/contact/:id', isAdmin, async (req, res) => {
    try {
        const result = await ContactFormSubmission.findByIdAndDelete(req.params.id);
        
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

// @route   GET /api/admin/submissions/:id
// @desc    Get submission by ID without knowing the type
// @access  Private (Admin only)
router.get('/submissions/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        let submission = null;
        let type = null;

        // Try to find the submission in each collection
        submission = await ContactFormSubmission.findById(id);
        if (submission) {
            type = 'contact';
            return res.json({
                success: true,
                submission: {
                    ...submission.toObject(),
                    type,
                    id: submission._id
                }
            });
        }

        submission = await FlightSubmission.findById(id);
        if (submission) {
            type = 'flight';
            return res.json({
                success: true,
                submission: {
                    ...submission.toObject(),
                    type,
                    id: submission._id
                }
            });
        }

        // Check for domestic and international tour submissions
        submission = await TourSubmission.findById(id);
        if (submission) {
            type = submission.tourType || 'domestic'; // Default to domestic if not specified
            return res.json({
                success: true,
                submission: {
                    ...submission.toObject(),
                    type,
                    id: submission._id
                }
            });
        }

        submission = await VisaSubmission.findById(id);
        if (submission) {
            type = 'visa';
            return res.json({
                success: true,
                submission: {
                    ...submission.toObject(),
                    type,
                    id: submission._id
                }
            });
        }

        submission = await PassportSubmission.findById(id);
        if (submission) {
            type = 'passport';
            return res.json({
                success: true,
                submission: {
                    ...submission.toObject(),
                    type,
                    id: submission._id
                }
            });
        }

        submission = await ForexSubmission.findById(id);
        if (submission) {
            type = 'forex';
            return res.json({
                success: true,
                submission: {
                    ...submission.toObject(),
                    type,
                    id: submission._id
                }
            });
        }

        submission = await HoneymoonSubmission.findById(id);
        if (submission) {
            type = 'honeymoon';
            return res.json({
                success: true,
                submission: {
                    ...submission.toObject(),
                    type,
                    id: submission._id
                }
            });
        }

        // If we get here, no submission was found
        return res.status(404).json({
            success: false,
            message: 'Submission not found'
        });
    } catch (err) {
        console.error('Error finding submission by ID:', err.message);
        res.status(500).json({ 
            success: false,
            message: 'Server error while finding submission'
        });
    }
});

// @route   POST /api/admin/submission/:type/:id/read
// @desc    Mark submission as read
// @access  Private (Admin only)
router.post('/submission/:type/:id/read', isAdmin, async (req, res) => {
    try {
        const { type, id } = req.params;
        let submission;
        let model;

        // Based on type, determine the model to use
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

        // Update the submission status to read
        submission = await model.findByIdAndUpdate(
            id,
            { status: 'read', isRead: true },
            { new: true }
        );

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        res.json({
            success: true,
            message: 'Submission marked as read',
            data: submission
        });
    } catch (err) {
        console.error('Error marking submission as read:', err.message);
        res.status(500).json({ 
            success: false,
            message: 'Server error while updating submission'
        });
    }
});

// @route   DELETE /api/admin/submission/:type/:id
// @desc    Delete a submission
// @access  Private (Admin only)
router.delete('/submission/:type/:id', isAdmin, async (req, res) => {
    try {
        const { type, id } = req.params;
        let model;

        // Based on type, determine the model to use
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
                // For tour submissions, we need to verify the tour type matches
                const tourSubmission = await TourSubmission.findById(id);
                if (tourSubmission && tourSubmission.tourType !== type) {
                    return res.status(400).json({
                        success: false,
                        message: 'Tour type mismatch'
                    });
                }
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

// @route   GET /api/admin/submissions/all
// @desc    Get all submissions with filtering and pagination
// @access  Private (Admin only)
router.get('/submissions/all', isAdmin, async (req, res) => {
    try {
        // Parse query parameters with defaults
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Define all valid submission types
        const validTypes = ['all', 'contact', 'flight', 'domestic', 'international', 'visa', 'passport', 'forex', 'honeymoon'];
        
        // Get type parameter and set default if not provided or invalid
        let type = req.query.type || 'all';
        if (!validTypes.includes(type)) {
            console.log(`Invalid submission type '${type}' received, defaulting to 'all'`);
            type = 'all';
        }
        
        // Log request for debugging
        console.log(`Processing submissions request: type=${type}, page=${page}, limit=${limit}`);
        
        // Other filters
        const status = req.query.status || 'all';
        const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : null;
        const toDate = req.query.toDate ? new Date(req.query.toDate) : null;
        const search = req.query.search || '';
        
        // Set end of day for toDate
        if (toDate) {
            toDate.setHours(23, 59, 59, 999);
        }
        
        // Build date filter
        const dateFilter = {};
        if (fromDate && toDate) {
            dateFilter.createdAt = { $gte: fromDate, $lte: toDate };
        } else if (fromDate) {
            dateFilter.createdAt = { $gte: fromDate };
        } else if (toDate) {
            dateFilter.createdAt = { $lte: toDate };
        }
        
        // Build search filter
        const searchFilter = search ? {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ]
        } : {};
        
        // Build status filter
        const statusFilter = {};
        if (status === 'read') {
            statusFilter.$or = [
                { status: 'read' },
                { isRead: true }
            ];
        } else if (status === 'new') {
            statusFilter.$or = [
                { status: { $ne: 'read' } },
                { status: { $exists: false }, isRead: { $ne: true } },
                { status: { $exists: false }, isRead: { $exists: false } }
            ];
        }
        
        // Combine all filters
        const baseFilter = {
            ...dateFilter,
            ...searchFilter,
            ...(Object.keys(statusFilter).length > 0 ? statusFilter : {})
        };
        
        // Define models to query based on type
        let modelsToQuery = [];
        
        if (type === 'all') {
            // Query all models
            modelsToQuery = [
                { model: ContactFormSubmission, type: 'contact' },
                { model: FlightSubmission, type: 'flight' },
                { model: TourSubmission, tourType: 'domestic', type: 'domestic' },
                { model: TourSubmission, tourType: 'international', type: 'international' },
                { model: VisaSubmission, type: 'visa' },
                { model: PassportSubmission, type: 'passport' },
                { model: ForexSubmission, type: 'forex' },
                { model: HoneymoonSubmission, type: 'honeymoon' }
            ];
        } else if (type === 'domestic' || type === 'international') {
            // Query specific tour type
            modelsToQuery = [
                { model: TourSubmission, tourType: type, type }
            ];
        } else {
            // Map type to model
            const modelMap = {
                'contact': ContactFormSubmission,
                'flight': FlightSubmission,
                'visa': VisaSubmission,
                'passport': PassportSubmission,
                'forex': ForexSubmission,
                'honeymoon': HoneymoonSubmission
            };
            
            if (modelMap[type]) {
                modelsToQuery = [{ model: modelMap[type], type }];
            }
        }
        
        // Array to hold all submissions and total count
        let allSubmissions = [];
        let totalCount = 0;
        
        // Query each model in parallel
        const modelQueries = modelsToQuery.map(async ({ model, type, tourType }) => {
            try {
                // Clone base filter
                const filter = { ...baseFilter };
                
                // Add tour type filter if applicable
                if (tourType) {
                    filter.tourType = tourType;
                }
                
                // Count total matching documents
                const count = await model.countDocuments(filter);
                
                // Only fetch documents if count > 0
                if (count > 0) {
                    // Fetch documents with pagination
                    const submissions = await model.find(filter)
                        .sort({ createdAt: -1 })
                        .skip(type === 'all' ? 0 : skip) // Skip only for specific type queries
                        .limit(type === 'all' ? 1000 : limit) // For 'all', get more and paginate after combining
                        .lean();
                    
                    // Format submissions with type and convert _id to id for consistency
                    const formattedSubmissions = submissions.map(doc => ({
                        ...doc,
                        id: doc._id.toString(),
                        type
                    }));
                    
                    return {
                        submissions: formattedSubmissions,
                        count
                    };
                }
                
                return { submissions: [], count: 0 };
            } catch (error) {
                console.error(`Error querying ${type} submissions:`, error);
                return { submissions: [], count: 0 };
            }
        });
        
        // Wait for all queries to complete
        const results = await Promise.all(modelQueries);
        
        // Combine results
        results.forEach(result => {
            allSubmissions = [...allSubmissions, ...result.submissions];
            totalCount += result.count;
        });
        
        // Sort all submissions by date descending
        allSubmissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Apply final pagination for 'all' type
        const paginatedSubmissions = type === 'all' 
            ? allSubmissions.slice(skip, skip + limit)
            : allSubmissions;
        
        // Return response
        res.json({
            success: true,
            submissions: paginatedSubmissions,
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit) || 1
            }
        });
        
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching submissions',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Add route for exporting submissions as CSV
router.get('/export/submissions', isAdmin, async (req, res) => {
    try {
        // Parse query parameters
        // Validate and sanitize type parameter
        let type = req.query.type || 'all';
        // List of valid types
        const validTypes = ['all', 'contact', 'flight', 'domestic', 'international', 'visa', 'passport', 'forex', 'honeymoon'];
        // If type is invalid, default to 'all'
        if (!validTypes.includes(type)) {
            console.warn(`Invalid submission type received for export: "${type}". Defaulting to "all".`);
            type = 'all';
        }
        
        const status = req.query.status || 'all';
        const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : null;
        const toDate = req.query.toDate ? new Date(req.query.toDate) : null;
        const search = req.query.search || '';
        const format = req.query.format || 'csv'; // Currently only CSV is supported
        
        if (toDate) {
            // Set to end of day
            toDate.setHours(23, 59, 59, 999);
        }
        
        // Prepare base query for date filtering
        const dateQuery = {};
        if (fromDate && toDate) {
            dateQuery.createdAt = { $gte: fromDate, $lte: toDate };
        } else if (fromDate) {
            dateQuery.createdAt = { $gte: fromDate };
        } else if (toDate) {
            dateQuery.createdAt = { $lte: toDate };
        }
        
        // Prepare search query
        const searchQuery = search ? {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ]
        } : {};
        
        // Combine date and search queries
        const baseQuery = { ...dateQuery, ...searchQuery };
        
        // Add status filtering if needed
        const statusQuery = {};
        if (status === 'read') {
            statusQuery.$or = [{ status: 'read' }, { isRead: true }];
        } else if (status === 'new') {
            statusQuery.$or = [
                { status: { $ne: 'read' } },
                { status: { $exists: false }, isRead: { $ne: true } },
                { status: { $exists: false }, isRead: { $exists: false } }
            ];
        }
        
        // Final query combining all conditions
        const finalQuery = { ...baseQuery, ...(Object.keys(statusQuery).length ? statusQuery : {}) };
        
        // Define all models and their corresponding types
        const modelMap = {
            'contact': { model: ContactFormSubmission, type: 'contact' },
            'flight': { model: FlightSubmission, type: 'flight' },
            'domestic': { model: TourSubmission, type: 'domestic' },
            'international': { model: TourSubmission, type: 'international' },
            'visa': { model: VisaSubmission, type: 'visa' },
            'passport': { model: PassportSubmission, type: 'passport' },
            'forex': { model: ForexSubmission, type: 'forex' },
            'honeymoon': { model: HoneymoonSubmission, type: 'honeymoon' }
        };
        
        // Determine which models to query based on the type
        let models = [];
        if (type === 'all') {
            // Query all models
            models = Object.values(modelMap);
        } else {
            // Query specific model - we already validated that type is valid
            models = [modelMap[type]];
        }
        
        // Special handling for domestic/international tours
        if (type === 'domestic' || type === 'international') {
            finalQuery.tourType = type;
        }
        
        // Execute queries for each model to get all matching submissions
        const aggregatedResults = [];
        
        for (const { model, type } of models) {
            // Skip to next iteration if model is undefined
            if (!model) {
                console.warn(`Model for type "${type}" is undefined. Skipping export.`);
                continue;
            }
            
            try {
                // Clone query for this model
                const modelQuery = { ...finalQuery };
                
                // Execute find query without pagination to get all results
                const submissions = await model.find(modelQuery)
                    .sort({ createdAt: -1 })
                    .catch(err => {
                        console.error(`Error finding submissions for type "${type}" during export:`, err);
                        return []; // Return empty array if find fails
                    });
                
                // Add type property to each submission
                submissions.forEach(submission => {
                    try {
                        const submissionObj = submission.toObject();
                        submissionObj.type = type;
                        submissionObj.id = submissionObj._id || submissionObj.id;
                        aggregatedResults.push(submissionObj);
                    } catch (err) {
                        console.error(`Error processing submission of type "${type}" during export:`, err);
                    }
                });
            } catch (err) {
                console.error(`Error processing model for type "${type}" during export:`, err);
                // Continue to the next model
            }
        }
        
        // Sort aggregated results by date
        aggregatedResults.sort((a, b) => {
            try {
                return new Date(b.createdAt) - new Date(a.createdAt);
            } catch (err) {
                console.error("Error sorting during export:", err);
                return 0; // Return 0 if date comparison fails
            }
        });
        
        // Format as CSV
        if (format === 'csv') {
            try {
                // Define CSV headers
                const csvHeaders = [
                    'ID', 'Type', 'Name', 'Email', 'Phone', 'Status', 
                    'Date', 'Time', 'Subject', 'Message', 'Destination', 
                    'Travel Date', 'Duration', 'Budget', 'Number of Travelers'
                ];
                
                // Create CSV content
                let csvContent = csvHeaders.join(',') + '\n';
                
                // Add each submission as a row
                aggregatedResults.forEach(submission => {
                    try {
                        // Format date and time
                        const createdAt = new Date(submission.createdAt);
                        const formattedDate = createdAt.toLocaleDateString();
                        const formattedTime = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        
                        // Get status
                        const status = (submission.status === 'read' || submission.isRead) ? 'Read' : 'New';
                        
                        // Create a row with common fields
                        const row = [
                            submission._id,
                            submission.type,
                            escapeCsvField(submission.name || ''),
                            escapeCsvField(submission.email || ''),
                            escapeCsvField(submission.phone || ''),
                            status,
                            formattedDate,
                            formattedTime,
                            escapeCsvField(submission.subject || ''),
                            escapeCsvField(submission.message || '')
                        ];
                        
                        // Add type-specific fields
                        row.push(escapeCsvField(submission.destination || submission.tourDestination || ''));
                        row.push(escapeCsvField(submission.departureDate || submission.travelDate || ''));
                        row.push(escapeCsvField(submission.duration || ''));
                        row.push(escapeCsvField(submission.budget || ''));
                        row.push(escapeCsvField(submission.travelers || submission.numberOfTravelers || ''));
                        
                        // Add row to CSV content
                        csvContent += row.join(',') + '\n';
                    } catch (err) {
                        console.error("Error processing row for CSV export:", err);
                        // Skip this row and continue
                    }
                });
                
                // Set response headers for CSV download
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="submissions_export_${new Date().toISOString().split('T')[0]}.csv"`);
                
                // Send CSV content
                return res.send(csvContent);
            } catch (err) {
                console.error("Error generating CSV content:", err);
                return res.status(500).json({ success: false, message: 'Error generating CSV export' });
            }
        }
        
        // If format is not supported
        return res.status(400).json({ success: false, message: 'Unsupported export format' });
        
    } catch (error) {
        console.error('Error exporting submissions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during export',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Helper function to escape CSV fields
function escapeCsvField(field) {
    if (field === null || field === undefined) return '';
    
    // Convert to string
    const stringField = String(field);
    
    // Check if we need to escape this field
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        // Escape double quotes with double quotes and wrap in quotes
        return '"' + stringField.replace(/"/g, '""') + '"';
    }
    
    return stringField;
}

module.exports = router; 