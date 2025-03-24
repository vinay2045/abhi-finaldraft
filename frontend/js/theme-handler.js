/**
 * Theme handler script
 * This script handles theme persistence and prevents flashing when navigating between pages
 */

// Immediately apply the saved theme to prevent flashing
(function() {
  // Check if a theme is stored in localStorage
  const storedTheme = localStorage.getItem('theme');
  
  // If a theme is stored, apply it immediately
  if (storedTheme) {
    document.documentElement.setAttribute('data-theme', storedTheme);
  } else {
    // If no theme is stored, check for system preference
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    if (prefersDarkScheme.matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }
})();

// Set up theme toggle functionality once the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.getElementById('theme-toggle');
  
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      // Get the current theme
      const currentTheme = document.documentElement.getAttribute('data-theme');
      
      // Toggle the theme
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      // Apply the new theme
      document.documentElement.setAttribute('data-theme', newTheme);
      
      // Store the new theme in localStorage
      localStorage.setItem('theme', newTheme);
    });
  }
}); 