const mongoose = require('mongoose');
const Carousel = require('./models/carouselModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/abhi-travels', { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log('MongoDB connected for seeding'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Initial carousel data based on what was in frontend/js/script.js
const carouselItems = [
    {
        image: '../images/photo-1739606944848-97662c0430f0 (1).avif',
        title: 'Manali & Kashmir - ₹16,999',
        heading: 'Explore the Paradise',
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
        image: '../images/photo-1661929242720-140374d97c94.avif',
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

// Function to seed the database
const seedDatabase = async () => {
    try {
        // First, delete all existing carousel items
        await Carousel.deleteMany({});
        console.log('Cleared existing carousel items');
        
        // Insert new carousel items
        await Carousel.insertMany(carouselItems);
        console.log('Successfully seeded carousel items');
        
        // Disconnect from the database
        mongoose.disconnect();
        console.log('MongoDB disconnected');
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

// Run the seeder
seedDatabase(); 