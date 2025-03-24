const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');

// Import submission models
const ContactFormSubmission = require('../models/contactFormSubmission');
const FlightSubmission = require('../models/flightSubmission');
const VisaSubmission = require('../models/visaSubmission');
const HoneymoonSubmission = require('../models/honeymoonSubmission');
const ForexSubmission = require('../models/forexSubmission');
const PassportSubmission = require('../models/passportSubmission');
const TourSubmission = require('../models/tourSubmission');

/**
 * @route   POST /api/submissions/contact
 * @desc    Submit contact form
 * @access  Public
 */
router.post('/contact', async (req, res) => {
    try {
        const { name, email, subject, message, fromFooter, fromPage } = req.body;
        
        const newSubmission = new ContactFormSubmission({
            name,
            email,
            subject,
            message,
            fromFooter: fromFooter || false,
            fromPage: fromPage || 'contact'
        });
        
        await newSubmission.save();
        
        res.json({
            success: true,
            message: 'Contact form submitted successfully'
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
 * @route   POST /api/submissions/flight
 * @desc    Submit flight inquiry
 * @access  Public
 */
router.post('/flight', async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            tripType,
            from,
            to,
            departureDate,
            returnDate,
            passengers,
            travelClass,
            additionalInfo
        } = req.body;
        
        const newSubmission = new FlightSubmission({
            name,
            email,
            phone,
            tripType,
            from,
            to,
            departureDate,
            returnDate,
            passengers,
            travelClass,
            additionalInfo
        });
        
        await newSubmission.save();
        
        res.json({
            success: true,
            message: 'Flight inquiry submitted successfully'
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
 * @route   POST /api/submissions/visa
 * @desc    Submit visa inquiry
 * @access  Public
 */
router.post('/visa', async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            destination,
            visaType,
            travelDate,
            duration,
            travelers,
            message
        } = req.body;
        
        const newSubmission = new VisaSubmission({
            name,
            email,
            phone,
            destination,
            visaType,
            travelDate,
            duration,
            travelers,
            message
        });
        
        await newSubmission.save();
        
        res.json({
            success: true,
            message: 'Visa inquiry submitted successfully'
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
 * @route   POST /api/submissions/honeymoon
 * @desc    Submit honeymoon inquiry
 * @access  Public
 */
router.post('/honeymoon', async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            weddingDate,
            destination,
            otherDestination,
            travelDates,
            duration,
            budget,
            accommodation,
            message,
            isDirectBooking,
            packageName,
            packagePrice,
            packageDuration,
            bookingDate,
            travelers,
            specialRequirements
        } = req.body;
        
        const newSubmission = new HoneymoonSubmission({
            name,
            email,
            phone,
            weddingDate,
            destination,
            otherDestination,
            travelDates,
            duration,
            budget,
            accommodation,
            message,
            isDirectBooking: isDirectBooking || false,
            packageName,
            packagePrice,
            packageDuration,
            bookingDate,
            travelers,
            specialRequirements
        });
        
        await newSubmission.save();
        
        res.json({
            success: true,
            message: 'Honeymoon inquiry submitted successfully'
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
 * @route   POST /api/submissions/forex
 * @desc    Submit forex inquiry
 * @access  Public
 */
router.post('/forex', async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            serviceType,
            currencyFrom,
            currencyTo,
            amount,
            travelDate,
            message
        } = req.body;
        
        const newSubmission = new ForexSubmission({
            name,
            email,
            phone,
            serviceType,
            currencyFrom,
            currencyTo,
            amount,
            travelDate,
            message
        });
        
        await newSubmission.save();
        
        res.json({
            success: true,
            message: 'Forex inquiry submitted successfully'
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
 * @route   POST /api/submissions/passport
 * @desc    Submit passport application inquiry
 * @access  Public
 */
router.post('/passport', async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            applicationType,
            urgency,
            applicants,
            message
        } = req.body;
        
        const newSubmission = new PassportSubmission({
            name,
            email,
            phone,
            applicationType,
            urgency,
            applicants,
            message
        });
        
        await newSubmission.save();
        
        res.json({
            success: true,
            message: 'Passport application inquiry submitted successfully'
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
 * @route   POST /api/submissions/tour
 * @desc    Submit tour inquiry
 * @access  Public
 */
router.post('/tour', async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            destination,
            travelDate,
            duration,
            travelers,
            budget,
            message,
            isDirectBooking,
            packageName,
            packagePrice,
            packageDuration,
            bookingDate,
            specialRequirements,
            passportNumber,
            passportExpiry,
            tourType
        } = req.body;
        
        const newSubmission = new TourSubmission({
            name,
            email,
            phone,
            destination,
            travelDate,
            duration,
            travelers,
            budget,
            message,
            isDirectBooking: isDirectBooking || false,
            packageName,
            packagePrice,
            packageDuration,
            bookingDate,
            specialRequirements,
            passportNumber,
            passportExpiry,
            tourType: tourType || 'domestic'
        });
        
        await newSubmission.save();
        
        res.json({
            success: true,
            message: 'Tour inquiry submitted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ADMIN ROUTES FOR VIEWING SUBMISSIONS

/**
 * @route   GET /api/submissions/contact
 * @desc    Get all contact form submissions
 * @access  Private/Admin
 */
router.get('/contact', isAdmin, async (req, res) => {
    try {
        const submissions = await ContactFormSubmission.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: submissions
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
 * @route   GET /api/submissions/flight
 * @desc    Get all flight inquiry submissions
 * @access  Private/Admin
 */
router.get('/flight', isAdmin, async (req, res) => {
    try {
        const submissions = await FlightSubmission.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: submissions
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
 * @route   GET /api/submissions/visa
 * @desc    Get all visa inquiry submissions
 * @access  Private/Admin
 */
router.get('/visa', isAdmin, async (req, res) => {
    try {
        const submissions = await VisaSubmission.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: submissions
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
 * @route   GET /api/submissions/honeymoon
 * @desc    Get all honeymoon inquiry submissions
 * @access  Private/Admin
 */
router.get('/honeymoon', isAdmin, async (req, res) => {
    try {
        const submissions = await HoneymoonSubmission.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: submissions
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
 * @route   GET /api/submissions/forex
 * @desc    Get all forex inquiry submissions
 * @access  Private/Admin
 */
router.get('/forex', isAdmin, async (req, res) => {
    try {
        const submissions = await ForexSubmission.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: submissions
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
 * @route   GET /api/submissions/passport
 * @desc    Get all passport application inquiry submissions
 * @access  Private/Admin
 */
router.get('/passport', isAdmin, async (req, res) => {
    try {
        const submissions = await PassportSubmission.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: submissions
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
 * @route   GET /api/submissions/tour/:type
 * @desc    Get all tour inquiry submissions by type (domestic/international)
 * @access  Private/Admin
 */
router.get('/tour/:type', isAdmin, async (req, res) => {
    try {
        const submissions = await TourSubmission.find({
            tourType: req.params.type
        }).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: submissions
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