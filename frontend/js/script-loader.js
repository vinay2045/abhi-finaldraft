/**
 * Script loader for deferring non-critical JavaScript
 * This script helps improve page load performance by:
 * 1. Loading non-critical scripts after the page has loaded
 * 2. Prioritizing critical scripts
 * 3. Providing a simple API for loading scripts
 */

// Create a script loader object
const ScriptLoader = {
  // Store loaded scripts to avoid duplicates
  loadedScripts: {},
  
  // Load a script with a callback
  load: function(src, callback) {
    // If script is already loaded, just call the callback
    if (this.loadedScripts[src]) {
      if (callback) callback();
      return;
    }
    
    // Create a new script element
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    
    // Set up callback
    if (callback) {
      script.onload = callback;
    }
    
    // Add script to the document
    document.body.appendChild(script);
    
    // Mark script as loaded
    this.loadedScripts[src] = true;
  },
  
  // Load multiple scripts in sequence
  loadSequence: function(scripts, finalCallback) {
    if (scripts.length === 0) {
      if (finalCallback) finalCallback();
      return;
    }
    
    const nextScript = scripts.shift();
    this.load(nextScript, () => {
      this.loadSequence(scripts, finalCallback);
    });
  },
  
  // Load scripts after page load
  loadAfterPageLoad: function(scripts) {
    // If the page has already loaded, load scripts immediately
    if (document.readyState === 'complete') {
      scripts.forEach(src => this.load(src));
    } else {
      // Otherwise, wait for the page to load
      window.addEventListener('load', () => {
        // Wait a short time to prioritize other load events
        setTimeout(() => {
          scripts.forEach(src => this.load(src));
        }, 100);
      });
    }
  }
};

// Load non-critical scripts after page load
document.addEventListener('DOMContentLoaded', function() {
  // List of non-critical scripts to load after page load
  const nonCriticalScripts = [
    // Add your non-critical scripts here
    // Example: 'js/analytics.js',
    // Example: 'js/social-media.js',
  ];
  
  // Load non-critical scripts after page load
  ScriptLoader.loadAfterPageLoad(nonCriticalScripts);
}); 