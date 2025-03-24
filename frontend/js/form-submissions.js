// API base URL
const API_BASE_URL = 'http://localhost:9999';

document.addEventListener('DOMContentLoaded', function() {
    setupFormSubmissions();
});

function setupFormSubmissions() {
    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitFormData(this, '/api/forms/contact');
        });
    }
    
    // Flight booking form
    const flightForm = document.getElementById('flightForm');
    if (flightForm) {
        flightForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitFormData(this, '/api/forms/flight');
        });
    }
    
    // Visa form
    const visaForm = document.getElementById('visaForm');
    if (visaForm) {
        visaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitFormData(this, '/api/forms/visa');
        });
    }
    
    // Honeymoon form
    const honeymoonForm = document.getElementById('honeymoonForm');
    if (honeymoonForm) {
        honeymoonForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitFormData(this, '/api/forms/honeymoon');
        });
    }
    
    // Forex form
    const forexForm = document.getElementById('forexForm');
    if (forexForm) {
        forexForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitFormData(this, '/api/forms/forex');
        });
    }
    
    // Domestic Tour form
    const domesticTourForm = document.getElementById('domesticTourForm');
    if (domesticTourForm) {
        domesticTourForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitFormData(this, '/api/forms/tour/domestic');
        });
    }
    
    // International Tour form
    const internationalTourForm = document.getElementById('internationalTourForm');
    if (internationalTourForm) {
        internationalTourForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitFormData(this, '/api/forms/tour/international');
        });
    }
    
    // Generic Tour form (backward compatibility)
    const tourForm = document.getElementById('tourForm');
    if (tourForm) {
        tourForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Check if there's a type field to determine domestic or international
            const typeField = this.querySelector('[name="type"]');
            const endpoint = typeField && typeField.value === 'international' ? 
                '/api/forms/tour/international' : '/api/forms/tour/domestic';
            submitFormData(this, endpoint);
        });
    }
    
    // Passport application form
    const passportForm = document.getElementById('passportForm');
    if (passportForm) {
        passportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitFormData(this, '/api/forms/passport');
        });
    }
}

function submitFormData(form, endpoint) {
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    // Collect form data
    const formData = new FormData(form);
    const formObject = {};
    
    formData.forEach((value, key) => {
        if (key.includes('Date') && value) {
            // Convert date inputs to ISO format for proper handling in backend
            formObject[key] = new Date(value).toISOString();
        } else {
            formObject[key] = value;
        }
    });
    
    // Submit the form
    fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formObject)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Show success message
            showMessage(form, 'Thank you for your submission! We will contact you soon.', 'success');
            form.reset();
        } else {
            // Show error message
            showMessage(form, data.message || 'Something went wrong. Please try again later.', 'error');
        }
    })
    .catch(error => {
        console.error('Error submitting form:', error);
        showMessage(form, 'An error occurred. Please try again later.', 'error');
    })
    .finally(() => {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

function showMessage(form, message, type) {
    // Look for existing message container or create one
    let messageContainer = form.querySelector('.form-message');
    
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.className = 'form-message';
        form.appendChild(messageContainer);
    }
    
    // Set message and styling
    messageContainer.textContent = message;
    messageContainer.className = `form-message ${type}`;
    
    // Auto-hide message after 5 seconds
    setTimeout(() => {
        messageContainer.classList.add('hiding');
        setTimeout(() => {
            messageContainer.textContent = '';
            messageContainer.className = 'form-message';
        }, 500);
    }, 5000);
} 