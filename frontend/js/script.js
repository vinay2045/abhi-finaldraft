// Menu functionality for the travel blog
document.addEventListener('DOMContentLoaded', function() {
    // Track page visibility to handle tab switching
    let pageVisible = true;
    
    // Add visibility change detection
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            pageVisible = false;
            console.log('Page hidden, slideshow paused');
            // We don't stop the slideshow here, just track visibility
        } else {
            pageVisible = true;
            console.log('Page visible again, ensuring slideshow is running');
            // Restart slideshow in all carousel instances
            const carouselTracks = document.querySelectorAll('.hero-carousel-track');
            if (carouselTracks.length > 0) {
                setupHeroCarousel();
            }
        }
    });
    
    // Hero Carousel Setup
    setupHeroCarousel();
    
    // Rest of the code...
    
    // Setup all other features
    setupMenuAndUI();
    
    // Handle form submissions
    setupFormSubmissions();

    // Initialize booking buttons
    setupBookNowButtons();

    loadCarouselData();
});

// Make sure carousel and menu are set up even if DOMContentLoaded has issues
window.addEventListener('load', function() {
    const carouselTrack = document.getElementById('carouselTrack');
    // Check if carousel was already set up during DOMContentLoaded
    if (carouselTrack && carouselTrack.children.length === 0) {
        console.log('Fallback: Setting up carousel on window.load');
        setupHeroCarousel();
    }
    
    // Ensure menu is set up correctly regardless of how page was loaded
    const menuButton = document.getElementById('nav-part1');
    if (menuButton) {
        // If setupMenuAndUI hasn't been called yet, or we need to reinitialize
        setupMenuAndUI();
    }
    
    // Ensure booking buttons are set up
    setupBookNowButtons();
});

// Hero Carousel Setup Function
function setupHeroCarousel() {
    // Carousel data with images and their associated content
    const localCarouselItems = [
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

    const carouselTrack = document.getElementById('carouselTrack');
    const indicatorsContainer = document.getElementById('carouselIndicators');
    const slideTemplate = document.getElementById('slide-template');
    
    if (!carouselTrack || !indicatorsContainer) {
        console.error('Carousel elements not found');
        return;
    }
    
    // Clear existing content
    carouselTrack.innerHTML = '';
    indicatorsContainer.innerHTML = '';
    
    // Create slides using the template
    localCarouselItems.forEach((item, index) => {
        // Create a new element from the template
        const slide = document.createElement('div');
        slide.className = 'hero-carousel-slide fade';
        slide.style.backgroundImage = `url('${item.image}')`;
        slide.style.display = 'none'; // Hide all slides initially
        
        // Create the content structure
        const content = `
            <div class="numbertext">${index + 1} / ${localCarouselItems.length}</div>
            <div class="hero-content">
               <h1>${item.heading}</h1>
                <h4>${item.subheading}</h4>
                <div class="card-content-white-bg">

                     <div class="card-title">${item.title}</div>
                
               
                   <div class="card-tags"></div>
                    <div class="read-more">→</div>
                </div>
            </div>
             <div class="hero-highlight">
                <h3>Book Your Seats Now                        </h3>
               
                <button class="cta-btn">Book now</button>
            </div>
           
        `;
        
        slide.innerHTML = content;
        
        // Add tags
        const tagsContainer = slide.querySelector('.card-tags');
        item.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'tag';
            tagSpan.textContent = tag;
            tagsContainer.appendChild(tagSpan);
        });
        
        // Add the slide to the carousel
        carouselTrack.appendChild(slide);
        
        // Create indicator dot
        const indicator = document.createElement('span');
        indicator.className = 'hero-carousel-indicator';
        indicator.dataset.slideIndex = index;
        indicatorsContainer.appendChild(indicator);
    });
    
    // Add CSS for fade animation
    if (!document.getElementById('fade-animation-style')) {
        const fadeStyle = document.createElement('style');
        fadeStyle.id = 'fade-animation-style';
        fadeStyle.textContent = `
            @keyframes fade {
                from {opacity: 0.4}
                to {opacity: 1}
            }
            
            .fade {
                animation-name: fade;
                animation-duration: 1.5s;
            }
        `;
        document.head.appendChild(fadeStyle);
    }
    
    // Get all carousel elements
    const slides = carouselTrack.querySelectorAll('.hero-carousel-slide');
    const dots = indicatorsContainer.querySelectorAll('.hero-carousel-indicator');
    const prevButton = document.querySelector('.hero-carousel-nav.prev');
    const nextButton = document.querySelector('.hero-carousel-nav.next');
    const carouselContainer = document.querySelector('.hero-carousel-container');
    
    if (slides.length === 0) {
        console.error('No slides found');
        return;
    }
    
    // Global variables for slideshow control
    let slideIndex = 0;
    let slideInterval = null;
    
    // Function to show a specific slide
    function showSlide(n) {
        if (!slides || slides.length === 0) return;
        
        // Wrap around if we go beyond bounds
        if (n > slides.length) {
            slideIndex = 1;
        } else if (n < 1) {
            slideIndex = slides.length;
        } else {
            slideIndex = n;
        }
        
        console.log(`Showing slide ${slideIndex} of ${slides.length}`);
        
        // Hide all slides
        slides.forEach(slide => {
            slide.style.display = 'none';
        });
        
        // Remove active class from all indicators
        dots.forEach(indicator => {
            indicator.classList.remove('active');
        });
        
        // Show the current slide and activate its indicator
        slides[slideIndex - 1].style.display = 'block';
        if (dots[slideIndex - 1]) {
            dots[slideIndex - 1].classList.add('active');
        }
    }
    
    // Start the automatic slideshow
    function startSlideshow() {
        // Clear any existing interval first
        stopSlideshow();
        
        // Set the slide interval
        slideInterval = setInterval(function() {
            // Calculate next slide index (not incrementing slideIndex directly)
            const nextIndex = (slideIndex % slides.length) + 1;
            
            showSlide(nextIndex);
            console.log('Auto-advancing to slide:', nextIndex);
        }, 5000); // 5 seconds between slides
        
        console.log('Slideshow interval started with ID:', slideInterval);
    }
    
    // Function to stop the slideshow
    function stopSlideshow() {
        if (slideInterval) {
            clearInterval(slideInterval);
            slideInterval = null;
        }
    }
    
    // Initialize the first slide and ensure it's visible
    showSlide(0);
    
    // Make sure our first slide is actually visible
    slides[0].style.display = "block";
    dots[0].classList.add("active");
    
    // Force the slideshow to start after a small delay to ensure DOM is ready
    window.setTimeout(function() {
        startSlideshow();
        console.log('Forced slideshow start after timeout');
        
        // Test the slideshow is working by advancing to next slide after 2 seconds
        window.setTimeout(function() {
            if (slideIndex === 0) {
                // If still on first slide after 2 seconds, force advance to next slide
                slideIndex++;
                showSlide(slideIndex);
                console.log('Forced first slide change');
            }
        }, 2000);
    }, 500);
    
    // Previous button click handler
    if (prevButton) {
        prevButton.addEventListener('click', function() {
            stopSlideshow();
            showSlide(slideIndex - 1);
            startSlideshow();
        });
    }
    
    // Next button click handler
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            stopSlideshow();
            showSlide(slideIndex + 1);
            startSlideshow();
        });
    }
    
    // Indicator dots click handlers
    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            stopSlideshow();
            showSlide(index + 1);
            startSlideshow();
        });
    });
    
    // Pause slideshow on hover
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', stopSlideshow);
        
        // Resume slideshow when mouse leaves
        carouselContainer.addEventListener('mouseleave', startSlideshow);
    }
    
    // Debug info
    console.log('Slideshow initialized with ' + slides.length + ' slides');
}

/**
 * Setup navigation menu and UI elements
 */
function setupMenuAndUI() {
    // Get the menu button and containers
    const menuButton = document.getElementById('nav-part1');
    const desktopMenu = document.getElementById('nav-part3');
    
    // Remove any existing dropdown menus to prevent duplication
    const existingMenus = document.querySelectorAll('.dropdown-menu');
    existingMenus.forEach(menu => menu.remove());
    
    // Create mobile dropdown menu
    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'dropdown-menu-js';
    mobileMenu.style.display = 'none';
    
    // Define common menu structure for both mobile and desktop
    const menuItems = [
        { type: 'link', text: 'Home', url: '/', icon: 'bx bxs-home-alt-2' },
        { type: 'link', text: 'About Us', url: '/aboutus', icon: 'bx bxs-invader' },
        { 
            type: 'dropdown', 
            text: 'Our Services', 
            id: 'ourservices',
            icon: 'bx bxs-invader',
            items: [
                { text: 'Flight Tickets', url: '/Flight Tickets', icon: 'bx bxs-plane-alt' },
                { text: 'Apply For Passport Application', url: '/Apply For Passport Application', icon: 'bx bxs-id-card' },
                { text: 'Visa For All Countries', url: '/visa for all countries', icon: 'bx bxs-file-doc' },
                { text: 'Honeymoon Packages', url: '/honeymoonpackages', icon: 'bx bxs-heart' },
                { text: 'Forex Services', url: '/forex', icon: 'bx bx-money' }
            ]
        },
        { 
            type: 'dropdown', 
            text: 'Trips', 
            id: 'trips',
            icon: 'bx bxl-airbnb',
            items: [
                { text: 'Domestic Tours', url: '/Domestic Tours', icon: 'bx bxs-map' },
                { text: 'International Tours', url: '/International Tours', icon: 'bx bx-globe' }
            ]
        },
        { type: 'link', text: 'Contact Us', url: '/contactus', icon: 'bx bx-mail-send' }
    ];

    // Update URL paths to ensure spaces are properly encoded
    menuItems.forEach(item => {
        if (item.url) {
            item.url = item.url.replace(/ /g, '%20');
        }
        if (item.items) {
            item.items.forEach(subItem => {
                if (subItem.url) {
                    subItem.url = subItem.url.replace(/ /g, '%20');
                }
            });
        }
    });
    
    // Functions to generate menu HTML
    function generateMobileMenuHTML() {
        let html = '<div class="menu-section">';
        
        menuItems.forEach(item => {
            if (item.type === 'link') {
                html += `<a href="${item.url}" class="menu-item">${item.text}</a>`;
            } else if (item.type === 'dropdown') {
                html += `
                    <div class="menu-item has-submenu">
                        <span>${item.text}</span>
                        <div class="submenu" style="display: none;">
                `;
                
                item.items.forEach(subItem => {
                    html += `<a href="${subItem.url}" class="submenu-item"><i class='${subItem.icon}'></i> ${subItem.text}</a>`;
                });
                
                html += `
                        </div>
                    </div>
                `;
            }
        });
        
        html += '</div>';
        return html;
    }
    
    function generateDesktopMenuHTML() {
        let html = '';
        
        menuItems.forEach(item => {
            if (item.type === 'link') {
                html += `<a href="${item.url}"><h3><span>${item.text}</span> <span><i class='${item.icon}'></i></span></h3></a>`;
            } else if (item.type === 'dropdown') {
                html += `<h3 id="${item.id}"><span>${item.text}</span> <span><i class='${item.icon}'></i></span></h3>`;
            }
        });
        
        return html;
    }
    
    // Populate mobile menu
    mobileMenu.innerHTML = generateMobileMenuHTML();
    
    // Populate desktop menu
    desktopMenu.innerHTML = generateDesktopMenuHTML();
    
    // Insert dropdown menu after the navigation
    const nav = document.querySelector('nav');
    nav.parentNode.insertBefore(mobileMenu, nav.nextSibling);
    
    // Add CSS for consistent menu styling
    const menuStyles = document.createElement('style');
    menuStyles.textContent = `
        /* Desktop Menu Styles */
        #nav-part3.desktop-menu {
            display: flex;
            align-items: center;
            gap: 8px;
            max-width: 60%;
            flex-wrap: wrap;
            justify-content: flex-end;
        }
        
        #nav-part3.desktop-menu a i {
            font-size: 1.3rem;
            color: var(--text-color);
            font-weight: 900;
            margin-left: .5rem;
        }
        
        #nav-part3.desktop-menu a h3 {
            display: flex;
            align-items: center;
        }
        
        nav h3 {
            border: 1.5px solid var(--text-color);
            color: var(--text-color);
            font-weight: 500;
            padding: 5px 10px;
            border-radius: 50px;
            cursor: pointer;
        }
        
        /* Mobile Menu Styles */
        .dropdown-menu-js {
            position: fixed;
            background-color: var(--bg-color);
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            z-index: 999;
            padding: 12px;
            transition: all 0.3s ease;
            border: 1px solid var(--border-color);
            max-height: calc(80vh - 70px);
            overflow-y: auto;
            width: 250px;
        }
        
        .menu-section {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .menu-item {
            display: block;
            padding: 8px 12px;
            color: var(--text-color);
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            font-size: 15px;
            transition: background-color 0.3s ease;
            position: relative;
        }
        
        .menu-item:hover {
            background-color: var(--card-bg);
        }
        
        .has-submenu {
            cursor: pointer;
            position: relative;
        }
        
        .has-submenu > span {
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
        }
        
        .has-submenu > span::after {
            content: '›';
            font-size: 18px;
            transform: rotate(90deg);
            transition: transform 0.3s ease;
        }
        
        .has-submenu.open > span::after {
            transform: rotate(270deg);
        }
        
        .submenu {
            position: relative;
            left: 0;
            top: 5px;
            background-color: var(--bg-color);
            border-radius: 6px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            padding: 8px;
            width: 100%;
            border: 1px solid var(--border-color);
            margin-left: 10px;
            max-height: calc(60vh - 70px);
            overflow-y: auto;
        }
        
        .submenu-item {
            display: block;
            padding: 6px 12px;
            color: var(--text-color);
            text-decoration: none;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .submenu-item:hover {
            background-color: var(--card-bg);
        }
        
        /* Desktop Dropdowns */
        .desktop-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            background-color: var(--bg-color);
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            padding: 15px;
            min-width: 220px;
            z-index: 1000;
            margin-top: 10px;
            display: none;
            border: 1px solid var(--border-color);
        }
        
        .desktop-dropdown a {
            display: block;
            padding: 10px 15px;
            color: var(--text-color);
            text-decoration: none;
            border-radius: 5px;
            margin: 5px 0;
            transition: all 0.2s ease;
        }
        
        .desktop-dropdown a:hover {
            background-color: rgba(26, 138, 158, 0.1);
            color: #1a8a9e;
            transform: translateX(5px);
        }
        
        #ourservices, #trips {
            cursor: pointer;
            position: relative;
        }
        
        #ourservices::after, #trips::after {
            content: '▼';
            font-size: 10px;
            margin-left: 5px;
            display: inline-block;
            transition: transform 0.3s ease;
        }
        
        #ourservices.active::after, #trips.active::after {
            transform: rotate(180deg);
        }
        
        /* Responsive Styles */
        @media (max-width: 1024px) {
            #nav-part1 {
                display: flex !important;
                align-items: center;
                cursor: pointer;
            }
            
            #nav-part3.desktop-menu {
                display: none !important;
            }
            
            /* Ensure dropdown menu has correct z-index */
            .dropdown-menu-js {
                z-index: 1010;
            }
        }
        
        @media (min-width: 1025px) {
            #nav-part1 {
                display: none !important;
            }
            
            .dropdown-menu-js {
                display: none !important;
            }
            
            #nav-part3.desktop-menu {
                display: flex !important;
            }
        }
        
        @media (max-width: 768px) {
            .dropdown-menu-js {
                width: 240px;
                top: 65px;
                left: 15px;
            }
        }
        
        @media (max-width: 480px) {
            .dropdown-menu-js {
                width: 220px;
                left: 10px;
            }
        }
    `;
    
    document.head.appendChild(menuStyles);
    
    // Create desktop dropdowns
    const ourServicesDropdown = document.createElement('div');
    ourServicesDropdown.className = 'desktop-dropdown services-dropdown';
    
    const tripsDropdown = document.createElement('div');
    tripsDropdown.className = 'desktop-dropdown trips-dropdown';
    
    // Generate dropdowns content
    let ourServicesHTML = '<div class="Section-ourservices">';
    menuItems[2].items.forEach(item => {
        ourServicesHTML += `<a href="${item.url}">${item.text}</a>`;
    });
    ourServicesHTML += '</div>';
    
    let tripsHTML = '<div class="Section-trips">';
    menuItems[3].items.forEach(item => {
        tripsHTML += `<a href="${item.url}">${item.text}</a>`;
    });
    tripsHTML += '</div>';
    
    ourServicesDropdown.innerHTML = ourServicesHTML;
    tripsDropdown.innerHTML = tripsHTML;
    
    // Append dropdowns to the body
    document.body.appendChild(ourServicesDropdown);
    document.body.appendChild(tripsDropdown);
    
    // Toggle mobile menu
    menuButton.addEventListener('click', function(event) {
        event.stopPropagation();
        const isVisible = mobileMenu.style.display === 'block';
        
        // Toggle menu visibility
        mobileMenu.style.display = isVisible ? 'none' : 'block';
        
        // Position the menu - fixed positioning relative to menu button
        if (!isVisible) {
            const buttonRect = menuButton.getBoundingClientRect();
            const navRect = nav.getBoundingClientRect();
            
            // Set fixed position relative to the nav element
            mobileMenu.style.position = 'fixed';
            mobileMenu.style.top = `${buttonRect.bottom}px`;
            
            // Adjust left position based on screen size
            if (window.innerWidth <= 480) {
                mobileMenu.style.left = '10px';
            } else if (window.innerWidth <= 768) {
                mobileMenu.style.left = '15px';
            } else {
                mobileMenu.style.left = '20px';
            }
        }
    });
    
    // Update menu position when scrolling
    window.addEventListener('scroll', function() {
        if (mobileMenu.style.display === 'block') {
            const buttonRect = menuButton.getBoundingClientRect();
            mobileMenu.style.top = `${buttonRect.bottom}px`;
        }
    });
    
    // Handle mobile submenu toggles
    const mobileSubmenus = mobileMenu.querySelectorAll('.has-submenu');
    mobileSubmenus.forEach(submenu => {
        submenu.addEventListener('click', function(event) {
            event.stopPropagation();
            const submenuContent = this.querySelector('.submenu');
            const hasOpenClass = this.classList.contains('open');
            
            // Close other submenus
            mobileSubmenus.forEach(item => {
                if (item !== this) {
                    item.classList.remove('open');
                    item.querySelector('.submenu').style.display = 'none';
                }
            });
            
            // Toggle current submenu
            if (!hasOpenClass) {
                this.classList.add('open');
                submenuContent.style.display = 'block';
            } else {
                this.classList.remove('open');
                submenuContent.style.display = 'none';
            }
        });
    });
    
    // Handle desktop menu dropdowns
    const ourservices = document.getElementById('ourservices');
    const trips = document.getElementById('trips');
    
    if (ourservices) {
        ourservices.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Position dropdown
            const rect = this.getBoundingClientRect();
            ourServicesDropdown.style.left = rect.left + 'px';
            ourServicesDropdown.style.top = (rect.bottom + window.scrollY) + 'px';
            
            // Toggle dropdown
            this.classList.toggle('active');
            trips.classList.remove('active');
            
            const isVisible = ourServicesDropdown.style.display === 'block';
            ourServicesDropdown.style.display = isVisible ? 'none' : 'block';
            tripsDropdown.style.display = 'none';
        });
    }
    
    if (trips) {
        trips.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Position dropdown
            const rect = this.getBoundingClientRect();
            tripsDropdown.style.left = rect.left + 'px';
            tripsDropdown.style.top = (rect.bottom + window.scrollY) + 'px';
            
            // Toggle dropdown
            this.classList.toggle('active');
            ourservices.classList.remove('active');
            
            const isVisible = tripsDropdown.style.display === 'block';
            tripsDropdown.style.display = isVisible ? 'none' : 'block';
            ourServicesDropdown.style.display = 'none';
        });
    }
    
    // Close all menus when clicking outside
    document.addEventListener('click', function(event) {
        // Close mobile menu and submenus
        if (!menuButton.contains(event.target) && !mobileMenu.contains(event.target)) {
            mobileMenu.style.display = 'none';
            mobileSubmenus.forEach(item => {
                item.classList.remove('open');
                item.querySelector('.submenu').style.display = 'none';
            });
        }
        
        // Close desktop dropdowns
        if (ourservices && !ourservices.contains(event.target) && !ourServicesDropdown.contains(event.target)) {
            ourServicesDropdown.style.display = 'none';
            ourservices.classList.remove('active');
        }
        
        if (trips && !trips.contains(event.target) && !tripsDropdown.contains(event.target)) {
            tripsDropdown.style.display = 'none';
            trips.classList.remove('active');
        }
    });
    
    // Create and add WhatsApp floating button
    const whatsappButton = document.createElement('a');
    whatsappButton.href = 'https://wa.me/+918886226565'; // Abhi Tours & Travels WhatsApp number
    whatsappButton.target = '_blank';
    whatsappButton.className = 'whatsapp-float';
    whatsappButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.073.043.423-.101.827z"/>
        </svg>
    `;

    // Add styles for the WhatsApp button
    const whatsappStyle = document.createElement('style');
    whatsappStyle.textContent = `
        .whatsapp-float {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background-color: #25D366;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            z-index: 1000;
            margin: 15px;
        }

        .whatsapp-float:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
            background-color: #22c15e;
        }

        .whatsapp-float svg {
            width: 28px;
            height: 28px;
            transition: all 0.3s ease;
        }

        .whatsapp-float:hover svg {
            transform: scale(1.1);
        }

        @media (max-width: 768px) {
            .whatsapp-float {
                bottom: 15px;
                right: 15px;
                width: 45px;
                height: 45px;
                margin: 10px;
            }

            .whatsapp-float svg {
                width: 24px;
                height: 24px;
            }
        }

        @media (min-width: 1200px) {
            .whatsapp-float {
                right: calc((100vw - 1200px) / 2 + 30px);
            }
        }
    `;

    document.head.appendChild(whatsappStyle);
    document.body.appendChild(whatsappButton);

    // Add a function to initialize contact buttons
    setupContactButtons();

    // Also update resize event handler
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1024) {
            // Hide mobile menu
            mobileMenu.style.display = 'none';
            
            // Show desktop navigation
            if (desktopMenu) {
                desktopMenu.style.display = 'flex';
            }
        } else if (mobileMenu.style.display === 'block') {
            // Reposition the menu if it's visible during resize
            const buttonRect = menuButton.getBoundingClientRect();
            mobileMenu.style.top = `${buttonRect.bottom}px`;
            
            // Adjust left position based on new screen size
            if (window.innerWidth <= 480) {
                mobileMenu.style.left = '10px';
            } else if (window.innerWidth <= 768) {
                mobileMenu.style.left = '15px';
            } else {
                mobileMenu.style.left = '20px';
            }
        }
    });
}

/**
 * Handle form submissions with AJAX
 */
function setupFormSubmissions() {
    const forms = document.querySelectorAll('form[data-submit="ajax"]');
    
    forms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const formObject = {};
            
            // Convert FormData to object
            formData.forEach((value, key) => {
                formObject[key] = value;
            });
            
            // Add formType if not present
            if (!formObject.formType) {
                if (form.action.includes('/contact')) {
                    formObject.formType = 'contact';
                }
            }
            
            // Add missing required fields for contact form
            if (form.id === 'contactForm' || form.action.includes('/contact')) {
                // Ensure subject field exists (it's required by the backend)
                if (!formObject.subject && !form.querySelector('[name="subject"]')) {
                    formObject.subject = 'General Inquiry';
                }
            }
            
            console.log('Submitting form data:', formObject);
            console.log('Form action:', form.action);
            
            try {
                const response = await fetch(form.action, {
                    method: form.method || 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': 'travel_api_key_2024' // Add the API key expected by the backend
                    },
                    body: JSON.stringify(formObject)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    console.log('Form submission successful:', result);
                    showAlert('success', 'Thank you for your submission. Our team will contact you shortly.');
                    form.reset();
                    
                    // Close modal/popup if present
                    const modal = form.closest('.modal');
                    const popup = form.closest('.contact-popup');
                    
                    if (modal) modal.style.display = 'none';
                    if (popup) popup.style.display = 'none';
                } else {
                    console.error('Form submission error:', result.errors || result.message);
                    
                    let errorMessage = 'Error submitting form. ';
                    if (result.errors && Array.isArray(result.errors)) {
                        errorMessage += result.errors.map(err => err.msg || err.message).join(', ');
                    } else if (result.message) {
                        errorMessage += result.message;
                    }
                    
                    showAlert('error', errorMessage);
                }
            } catch (error) {
                console.error('Form submission error:', error);
                showAlert('error', 'An error occurred during submission. Please try again later.');
            }
            });
        });
}

/**
 * Show a notification message to the user
 * @param {string} type - 'success' or 'error'
 * @param {string} message - The message to display
 */
function showAlert(type, message) {
    // First remove any existing notifications
    document.querySelectorAll('.notification').forEach(notification => {
        notification.remove();
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class='bx ${type === 'success' ? 'bx-check-circle' : 'bx-x-circle'}'></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Style the notification
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
    notification.style.color = type === 'success' ? '#155724' : '#721c24';
    notification.style.border = type === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    notification.style.zIndex = '10000';
    notification.style.minWidth = '320px';
    notification.style.display = 'flex';
    notification.style.justifyContent = 'space-between';
    notification.style.alignItems = 'center';
    notification.style.fontWeight = '500';
    
    // Style for the icon
    const icon = notification.querySelector('i');
    icon.style.marginRight = '10px';
    icon.style.fontSize = '24px';
    icon.style.color = type === 'success' ? '#28a745' : '#dc3545';
    
    // Style for the close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.marginLeft = '10px';
    closeBtn.style.color = type === 'success' ? '#155724' : '#721c24';
    
    // Add the notification to the document
    document.body.appendChild(notification);
    
    // Set up the close button
    closeBtn.addEventListener('click', function() {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(50px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    });
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(50px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

/**
 * Set up Book Now buttons to trigger booking popups
 */
function setupBookNowButtons() {
    // Skip setup for honeymoon page - it has its own handlers
    if (window.location.href.includes('honeymoonpackages.html')) {
        console.log('Skipping setupBookNowButtons for honeymoon page - using page-specific handlers');
        return;
    }

    // Get all book now buttons across the site with various selectors
    const bookButtons = document.querySelectorAll('.book-now-btn, button[data-tour], a.book-now, .tour-card-btn, .cta-btn, .book-btn, .honeymoon-card-btn, .honeymoon-submit-btn');
    
    console.log(`Found ${bookButtons.length} book now buttons`);
    
    if (bookButtons.length === 0) {
        // Add a fallback to find buttons by content text
        const allButtons = document.querySelectorAll('button');
        const bookNowButtons = Array.from(allButtons).filter(btn => 
            btn.textContent.toLowerCase().includes('book now') || 
            btn.textContent.toLowerCase().includes('book') || 
            btn.closest('.honeymoon-card') !== null
        );
        
        console.log(`Found ${bookNowButtons.length} book now buttons by text content`);
        
        bookNowButtons.forEach(btn => {
            btn.addEventListener('click', handleBookButtonClick);
        });
    } else {
        bookButtons.forEach(button => {
            button.addEventListener('click', handleBookButtonClick);
        });
    }
    
    // Separate function to handle click events to avoid code duplication
    function handleBookButtonClick(e) {
        e.preventDefault();
        console.log('Book now button clicked');
        
        // Get tour details from button attributes or parent elements
        const tourCard = this.closest('.tour-card, .honeymoon-card, .package-card, .card');
        const tourSection = this.closest('.destination-card, section');
        
        const tourName = this.getAttribute('data-tour') || 
                        tourCard?.querySelector('.tour-card-title, .tour-title, .honeymoon-card-title, h3')?.textContent ||
                        tourSection?.querySelector('h2, h3')?.textContent ||
                        '';
        
        const tourPrice = this.getAttribute('data-price') || 
                         tourCard?.querySelector('.tour-card-price, .tour-price, .honeymoon-card-price, .price, [class*="price"]')?.textContent ||
                         tourSection?.querySelector('.price, .per-person, [class*="price"]')?.textContent ||
                         '';
        
        console.log('Tour details:', { tourName, tourPrice });
        
        // Find the booking popup modal - search for various modal IDs
        let bookingModal;
        if (this.getAttribute('data-target')) {
            // If the button has a specific target modal
            bookingModal = document.querySelector(this.getAttribute('data-target'));
        } else {
            // Look for any booking modal using various possible IDs
            bookingModal = document.getElementById('bookingPopup') || 
                          document.getElementById('bookingModal') || 
                          document.querySelector('.booking-modal, .contact-popup, .modal');
        }
        
        console.log('Looking for booking modal...', bookingModal);
        
        // If we found a modal, populate it with tour details
        if (bookingModal) {
            console.log('Booking modal found:', bookingModal);
            
            // Force display block for all modals for consistency
            bookingModal.style.display = 'block';
            
            // Set minimum date for travel date input to tomorrow
            const travelDateInput = bookingModal.querySelector('#travel-date, [name="travelDates"]');
            if (travelDateInput) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                travelDateInput.min = tomorrow.toISOString().split('T')[0];
            }
            
            // Set the tour name in the modal if there's a place for it
            const tourNameField = bookingModal.querySelector('#booking-tour, #destination') || 
                                 bookingModal.querySelector('.tour-name') || 
                                 bookingModal.querySelector('[name="tourName"]') ||
                                 bookingModal.querySelector('[name="destination"]');
            
            if (tourNameField && tourName) {
                console.log('Setting tour name to:', tourName);
                if (tourNameField.tagName === 'INPUT' || tourNameField.tagName === 'SELECT') {
                    // For selects, try to find a matching option
                    if (tourNameField.tagName === 'SELECT') {
                        let matchFound = false;
                        
                        // Try to find an exact match
                        for (let i = 0; i < tourNameField.options.length; i++) {
                            if (tourNameField.options[i].text === tourName || 
                                tourNameField.options[i].value === tourName) {
                                tourNameField.selectedIndex = i;
                                matchFound = true;
                                break;
                            }
                        }
                        
                        // If no exact match, look for a partial match
                        if (!matchFound) {
                            for (let i = 0; i < tourNameField.options.length; i++) {
                                if (tourName.includes(tourNameField.options[i].text) || 
                                    tourNameField.options[i].text.includes(tourName) ||
                                    tourNameField.options[i].value.includes(tourName.split(' ')[0])) {
                                    tourNameField.selectedIndex = i;
                                    matchFound = true;
                                    break;
                                }
                            }
                        }
                        
                        // If still no match, set the first non-empty option
                        if (!matchFound) {
                            for (let i = 0; i < tourNameField.options.length; i++) {
                                if (tourNameField.options[i].value) {
                                    tourNameField.selectedIndex = i;
                                    break;
                                }
                            }
                        }
                    } else {
                        // For regular inputs
                        tourNameField.value = tourName;
                    }
                } else {
                    tourNameField.textContent = tourName;
                }
            }
            
            // Make sure the formType is set to honeymoon if we're on the honeymoon page
            if (window.location.href.includes('honeymoon') || tourName.toLowerCase().includes('honeymoon') || 
                document.querySelector('.honeymoon-card') !== null) {
                
                let formTypeField = bookingModal.querySelector('input[name="formType"]');
                if (!formTypeField) {
                    const form = bookingModal.querySelector('form');
                    if (form) {
                        formTypeField = document.createElement('input');
                        formTypeField.type = 'hidden';
                        formTypeField.name = 'formType';
                        formTypeField.value = 'honeymoon';
                        form.appendChild(formTypeField);
                        console.log('Added formType field to form');
                    }
                } else {
                    formTypeField.value = 'honeymoon';
                    console.log('Set existing formType field to honeymoon');
                }
            }
            
        } else {
            console.error('No booking modal found on the page');
        }
    }
    
    // Set up close functionality for all modals
    const closeButtons = document.querySelectorAll('.close-modal, .modal .close-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal, .booking-modal, #bookingModal, #bookingPopup');
            if (modal) {
                console.log('Closing modal');
                modal.style.display = 'none';
            }
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal') || 
            event.target.id === 'bookingModal' || 
            event.target.id === 'bookingPopup') {
            event.target.style.display = 'none';
            console.log('Closing modal from outside click');
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const modals = document.querySelectorAll('.modal, .booking-modal, #bookingModal, #bookingPopup');
            modals.forEach(modal => {
                if (modal && modal.style.display !== 'none') {
                    modal.style.display = 'none';
                    console.log('Closing modal with escape key');
                }
            });
        }
    });
}

// Add fallback data objects at the beginning of the file before the DOMContentLoaded event
const carouselItems = [
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

const blogItems = [
    {
        image: '../images/photo-1645629022405-a3b40f0287e6.avif',
        title: 'Shimla & Kullu - ₹15,999',
        tags: ['Mountains', 'Nature', 'Adventure']
    },
    {
        image: '../images/photo-1590001155093-a3c66ab0c3ff.avif',
        title: 'Maldives - ₹65,999',
        tags: ['Beach', 'Ocean', 'Luxury']
    },
    {
        image: '../images/premium_photo-1661929242720-140374d97c94.avif',
        title: 'Thailand - ₹31,999',
        tags: ['Travel', 'Culture', 'Adventure']
    }
];

const tourItems = [
    {
        image: '../images/photo-1645629022405-a3b40f0287e6.avif',
        title: 'Shimla & Kullu',
        price: '₹15,999',
        duration: '5 Days, 4 Nights',
        tags: ['Mountains', 'Nature', 'Adventure']
    },
    {
        image: '../images/photo-1565967511849-763d3e14c3b8.avif',
        title: 'Kerala Tour',
        price: '₹25,999',
        duration: '6 Days, 5 Nights',
        tags: ['Beaches', 'Nature', 'Backwaters']
    }
];

const honeymoonItems = [
    {
        image: '../images/photo-1590001155093-a3c66ab0c3ff.avif',
        title: 'Maldives Special',
        price: '₹65,999',
        duration: '7 Days, 6 Nights',
        tags: ['Romantic', 'Beach', 'Private']
    },
    {
        image: '../images/photo-1520250497591-112f2f40a3f4.avif',
        title: 'Bali Honeymoon',
        price: '₹55,999',
        duration: '8 Days, 7 Nights',
        tags: ['Romantic', 'Beach', 'Luxury']
    }
];

const heroSections = {
    home: {
        heading: 'Explore the World with Us',
        subheading: 'Your journey begins here',
        background: '../images/photo-1510414842594-a61c69b5ae57.avif'
    }
};

// Function to load carousel data from the backend API
function loadCarouselData() {
    console.log("Loading carousel data from API");
    
    fetch('/api/carousel/active')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Carousel data received:", data);
            if (data && Array.isArray(data) && data.length > 0) {
                // Data is directly an array of carousel items
                updateHeroCarousel(data);
            } else if (data && data.success && data.data && data.data.length > 0) {
                // Data is wrapped in a success object
                updateHeroCarousel(data.data);
            } else {
                console.log("No carousel items returned from API, using local data");
                // Keep using the current carousel setup with static data
            }
        })
        .catch(error => {
            console.error("Error fetching carousel data:", error);
            // Keep using the current carousel setup on error
        });
}

// Function to update hero carousel with dynamic data
function updateHeroCarousel(items) {
    if (!items || items.length === 0) return;
    
    const carouselTrack = document.getElementById('carouselTrack');
    const indicatorsContainer = document.getElementById('carouselIndicators');
    
    if (!carouselTrack || !indicatorsContainer) {
        console.error('Carousel elements not found');
        return;
    }
    
    // Clear existing content
    carouselTrack.innerHTML = '';
    indicatorsContainer.innerHTML = '';
    
    // Create slides using the data
    items.forEach((item, index) => {
        // Create a new slide
        const slide = document.createElement('div');
        slide.className = 'hero-carousel-slide fade';
        slide.style.backgroundImage = `url('${item.image}')`;
        slide.style.display = index === 0 ? 'block' : 'none'; // Show first slide
        
        // Create the content structure
        const content = `
            <div class="numbertext">${index + 1} / ${items.length}</div>
            <div class="hero-content">
               <h1>${item.heading}</h1>
                <h4>${item.subheading}</h4>
                <div class="card-content-white-bg">
                     <div class="card-title">${item.title}</div>
                   <div class="card-tags"></div>
                    <div class="read-more">→</div>
            </div>
                </div>
             <div class="hero-highlight">
                <h3>Book Your Seats Now</h3>
                <button class="cta-btn">Book now</button>
            </div>
        `;
        
        slide.innerHTML = content;
        
        // Add tags
        const tagsContainer = slide.querySelector('.card-tags');
        if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'tag';
                tagSpan.textContent = tag;
                tagsContainer.appendChild(tagSpan);
            });
        }
        
        // Add the slide to the carousel
        carouselTrack.appendChild(slide);
        
        // Create indicator dot
            const indicator = document.createElement('span');
        indicator.className = 'hero-carousel-indicator';
        indicator.dataset.slideIndex = index;
        if (index === 0) indicator.classList.add('active');
        indicatorsContainer.appendChild(indicator);
    });
    
    // Reinitialize the carousel behavior
    initializeCarouselBehavior();
}

// Function to initialize the carousel behavior
function initializeCarouselBehavior() {
    const slides = document.querySelectorAll('.hero-carousel-slide');
    const indicators = document.querySelectorAll('.hero-carousel-indicator');
    const prevButton = document.querySelector('.hero-carousel-nav.prev');
    const nextButton = document.querySelector('.hero-carousel-nav.next');
    
    if (!slides.length) return;
    
    let slideIndex = 0;
    let slideInterval = null;
    
    // Start automatic slideshow
    startSlideshow();
    
    // Function to show a specific slide
    function showSlide(n) {
        if (!slides || slides.length === 0) return;
        
        // Wrap around if we go beyond bounds
        if (n > slides.length) {
            slideIndex = 1;
        } else if (n < 1) {
            slideIndex = slides.length;
        } else {
            slideIndex = n;
        }
        
        console.log(`Showing slide ${slideIndex} of ${slides.length}`);
        
        // Hide all slides
        slides.forEach(slide => {
            slide.style.display = 'none';
        });
        
        // Remove active class from all indicators
        indicators.forEach(indicator => {
            indicator.classList.remove('active');
        });
        
        // Show the current slide and activate its indicator
        slides[slideIndex - 1].style.display = 'block';
        if (indicators[slideIndex - 1]) {
            indicators[slideIndex - 1].classList.add('active');
        }
    }
    
    // Function to move to next/prev slide
    function moveSlide(n) {
        showSlide(slideIndex + n);
        resetSlideshow();
    }
    
    // Add click events to indicators
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            showSlide(index + 1);
            resetSlideshow();
        });
    });
    
    // Add click events to prev/next buttons
    if (prevButton) prevButton.addEventListener('click', () => moveSlide(-1));
    if (nextButton) nextButton.addEventListener('click', () => moveSlide(1));
    
    // Start automatic slideshow
    function startSlideshow() {
        // Clear any existing interval first
        if (slideInterval) clearInterval(slideInterval);
        
        // Set new interval
        slideInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                moveSlide(1);
            }
        }, 5000); // Change slide every 5 seconds
    }
    
    // Reset the slideshow timer
    function resetSlideshow() {
        if (slideInterval) clearInterval(slideInterval);
        startSlideshow();
    }
    
    // Show first slide
    showSlide(0);
}

function determineFormType(form) {
    // First check if there's a hidden formType field
    const formTypeInput = form.querySelector('input[name="formType"]');
    if (formTypeInput && formTypeInput.value) {
        return formTypeInput.value;
    }
    
    // Check form action URL for clues
    const formAction = form.getAttribute('action') || '';
    if (formAction.includes('/contact')) return 'contact';
    if (formAction.includes('/flight')) return 'flight';
    if (formAction.includes('/visa')) return 'visa';
    if (formAction.includes('/passport')) return 'passport';
    if (formAction.includes('/tour')) return 'tour';
    if (formAction.includes('/forex')) return 'forex';
    if (formAction.includes('/honeymoon')) return 'honeymoon';
    
    // Check form classes and IDs
    if (form.classList.contains('contact-form') || form.id.includes('contact')) return 'contact';
    if (form.classList.contains('flight-form') || form.id.includes('flight')) return 'flight';
    if (form.classList.contains('visa-form') || form.id.includes('visa')) return 'visa';
    if (form.classList.contains('passport-form') || form.id.includes('passport')) return 'passport';
    if (form.classList.contains('tour-form') || form.id.includes('tour')) return 'tour';
    if (form.classList.contains('forex-form') || form.id.includes('forex')) return 'forex';
    if (form.classList.contains('honeymoon-form') || form.id.includes('honeymoon')) return 'honeymoon';
    
    // Check for specific form fields that would indicate the type
    if (form.querySelector('select[name="visaType"]')) return 'visa';
    if (form.querySelector('select[name="passportType"]') || form.querySelector('select[name="applicationType"]')) return 'passport';
    if (form.querySelector('input[name="departureDate"]') && form.querySelector('input[name="from"]')) return 'flight';
    if (form.querySelector('select[name="destination"]') && form.querySelector('select[name="duration"]')) return 'tour';
    
    // Default to contact if no matches
    return 'contact';
}

// Add a function to initialize contact buttons
function setupContactButtons() {
    // Set up the contact popup button
    const contactBtn = document.getElementById('contactBtn');
    const contactPopup = document.getElementById('contactPopup');
    const closeContactPopup = document.getElementById('closeContactPopup');
    
    if (contactBtn && contactPopup) {
        console.log('Contact button and popup found, setting up event listeners');
        contactBtn.addEventListener('click', function(e) {
            e.preventDefault();
            contactPopup.style.display = 'flex';
            console.log('Contact popup opened');
        });
        
        if (closeContactPopup) {
            closeContactPopup.addEventListener('click', function() {
                contactPopup.style.display = 'none';
                console.log('Contact popup closed via close button');
            });
        }
        
        // Close when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === contactPopup) {
                contactPopup.style.display = 'none';
                console.log('Contact popup closed via outside click');
            }
        });
    } else {
        console.log('Contact button or popup not found on this page');
    }
    
    // Also handle floating contact buttons with different IDs
    const floatingContactBtns = document.querySelectorAll('.contact-float, .email-btn, [data-target="#contactPopup"]');
    floatingContactBtns.forEach(btn => {
        if (btn && btn !== contactBtn && contactPopup) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                contactPopup.style.display = 'flex';
                console.log('Contact popup opened via alternative button');
            });
        }
    });
}