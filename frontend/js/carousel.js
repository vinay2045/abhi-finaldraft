/**
 * Carousel Component
 * Fetches and displays carousel items from the database
 */

// Initialize the carousel when the DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    initCarousel();
});

// Initialize the carousel
async function initCarousel() {
    try {
        // Fetch carousel items from API
        const carouselItems = await fetchCarouselItems();
        
        // Create carousel structure
        createCarousel(carouselItems);
        
        // Setup carousel controls
        setupControls();
        
        // Start automatic slide rotation
        startAutoRotation();
        
        // Setup touch events for mobile
        setupTouchEvents();
        
    } catch (error) {
        console.error('Error initializing carousel:', error);
        // If there's an error, still create the carousel with default items
        createCarousel(getFallbackItems());
    }
}

// Fetch carousel items from API
async function fetchCarouselItems() {
    try {
        const response = await fetch('/api/carousel/active');
        
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        return data || [];
        
    } catch (error) {
        console.error('Error fetching carousel items:', error);
        throw error;
    }
}

// Create the carousel with items
function createCarousel(items) {
    if (!items || items.length === 0) {
        items = getFallbackItems();
    }
    
    const carouselContainer = document.querySelector('.carousel-container');
    if (!carouselContainer) return;
    
    // Create slides
    const slidesHTML = items.map((item, index) => {
        return `
            <div class="carousel-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                <div class="carousel-image">
                    <img src="${item.image}" alt="${item.title}" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMThweCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2UgUGxhY2Vob2xkZXI8L3RleHQ+PC9zdmc+'" loading="lazy">
                </div>
                <div class="carousel-content">
                    <h2>${item.heading}</h2>
                    <p>${item.subheading}</p>
                </div>
            </div>
        `;
    }).join('');
    
    // Create indicators
    const indicatorsHTML = items.map((_, index) => {
        return `
            <div class="carousel-indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
        `;
    }).join('');
    
    // Set carousel HTML
    carouselContainer.innerHTML = `
        <div class="carousel-slides">
            ${slidesHTML}
        </div>
        <div class="carousel-nav">
            <button class="carousel-prev" aria-label="Previous slide">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
            </button>
            <div class="carousel-indicators">
                ${indicatorsHTML}
            </div>
            <button class="carousel-next" aria-label="Next slide">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
            </button>
        </div>
    `;
}

// Setup carousel controls
function setupControls() {
    const prevButton = document.querySelector('.carousel-prev');
    const nextButton = document.querySelector('.carousel-next');
    const indicators = document.querySelectorAll('.carousel-indicator');
    
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            navigateCarousel('prev');
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            navigateCarousel('next');
        });
    }
    
    indicators.forEach(indicator => {
        indicator.addEventListener('click', () => {
            const index = parseInt(indicator.dataset.index);
            navigateCarousel(index);
        });
    });
}

// Navigate carousel to specific direction or index
function navigateCarousel(target) {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.carousel-indicator');
    
    if (!slides.length) return;
    
    // Find current active slide index
    let currentIndex = 0;
    const activeSlide = document.querySelector('.carousel-slide.active');
    
    if (activeSlide) {
        currentIndex = parseInt(activeSlide.dataset.index);
    }
    
    // Calculate next index
    let nextIndex;
    
    if (target === 'next') {
        nextIndex = (currentIndex + 1) % slides.length;
    } else if (target === 'prev') {
        nextIndex = (currentIndex - 1 + slides.length) % slides.length;
    } else if (typeof target === 'number') {
        nextIndex = target;
    }
    
    // Update active classes
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));
    
    slides[nextIndex].classList.add('active');
    indicators[nextIndex].classList.add('active');
    
    // Reset auto-rotation timer
    resetAutoRotation();
}

// Auto-rotation variables
let autoRotationInterval;
const autoRotationDelay = 5000; // 5 seconds

// Start automatic carousel rotation
function startAutoRotation() {
    // Clear any existing interval
    if (autoRotationInterval) {
        clearInterval(autoRotationInterval);
    }
    
    // Set new interval
    autoRotationInterval = setInterval(() => {
        navigateCarousel('next');
    }, autoRotationDelay);
}

// Reset auto-rotation timer
function resetAutoRotation() {
    startAutoRotation();
}

// Setup touch events for mobile devices
function setupTouchEvents() {
    const carousel = document.querySelector('.carousel-container');
    
    if (!carousel) return;
    
    let touchStartX = 0;
    let touchEndX = 0;
    
    carousel.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
    }, false);
    
    carousel.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].clientX;
        handleSwipe();
    }, false);
    
    function handleSwipe() {
        const threshold = 50; // Minimum distance required for swipe
        
        if (touchEndX < touchStartX - threshold) {
            // Swipe left (next)
            navigateCarousel('next');
        } else if (touchEndX > touchStartX + threshold) {
            // Swipe right (previous)
            navigateCarousel('prev');
        }
    }
}

// Get fallback items if API fails
function getFallbackItems() {
    return [
        {
            title: "Welcome",
            heading: "Welcome to Our Company",
            subheading: "We provide the best services for your needs",
            image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEyMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMzQ4OGZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIzNnB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5XZWxjb21lIHRvIE91ciBDb21wYW55PC90ZXh0Pjwvc3ZnPg=="
        },
        {
            title: "Services",
            heading: "Our Premium Services",
            subheading: "Discover what we can do for you",
            image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEyMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMjdjMDczIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIzNnB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5PdXIgUHJlbWl1bSBTZXJ2aWNlczwvdGV4dD48L3N2Zz4="
        },
        {
            title: "Contact",
            heading: "Get in Touch",
            subheading: "We're here to help you",
            image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEyMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjZTgzNDI4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIzNnB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5HZXQgaW4gVG91Y2g8L3RleHQ+PC9zdmc+"
        }
    ];
} 