router.post('/submissions/:type', (req, res) => {
    // API key validation
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== 'travel_api_key_2024') {
        console.log('API key validation failed:', apiKey);
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Invalid or missing API key'
        });
    }

    console.log('Received form submission:', req.params.type);
    console.log('Form data:', req.body);

    // Get the form type from route params
    const formType = req.params.type;
    
    // Additional validation for specific form types
    if (formType === 'forex' && !req.body.serviceType) {
        return res.status(400).json({
            success: false,
            message: 'Service type is required'
        });
    }
    
    // Process the form data
    try {
        // Store in database
        const submission = {
            type: formType,
            data: req.body,
            date: new Date()
        };
        
        // In a real application, you'd save this to your database
        console.log('Saving submission to database:', submission);
        
        // Return success response
        res.json({
            success: true,
            message: 'Form submitted successfully',
            data: {
                id: Date.now(), // Simulating an ID
                type: formType
            }
        });
    } catch (error) {
        console.error('Error processing form submission:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing your submission'
        });
    }
}); 