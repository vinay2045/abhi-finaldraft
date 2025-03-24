const mongoose = require('mongoose');

const flightSubmissionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    tripType: {
        type: String,
        required: true
    },
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    departureDate: {
        type: Date,
        required: [true, 'Departure date is required']
       
    },
    returnDate: {
        type: Date,
        required: false
    },
    passengers: {
        type: String,
        required: true
    },
    travelClass: {
        type: String,
        required: true
    },
    additionalInfo: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('FlightSubmission', flightSubmissionSchema); 