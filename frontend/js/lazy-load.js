/**
 * Enhanced lazy loading script
 * This script improves the native lazy loading by:
 * 1. Adding IntersectionObserver for browsers that support it
 * 2. Providing a fallback for browsers that don't support native lazy loading
 * 3. Progressively enhancing image loading for better user experience
 */

document.addEventListener('DOMContentLoaded', function() {
  // Check if browser supports IntersectionObserver
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // If the image has a data-src attribute, use it
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          
          // If the image has a data-srcset attribute, use it
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute('data-srcset');
          }
          
          // Add a class to fade in the image
          img.classList.add('loaded');
          
          // Stop observing the image
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px', // Start loading images when they're 50px from viewport
      threshold: 0.01 // Trigger when at least 1% of the image is visible
    });
    
    // Get all images with loading="lazy" attribute
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    lazyImages.forEach(img => {
      // Add a placeholder if not already present
      if (!img.src && !img.dataset.src) {
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
      }
      
      // Observe the image
      imageObserver.observe(img);
    });
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    // This will still use native lazy loading if supported
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    lazyImages.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
  }
}); 