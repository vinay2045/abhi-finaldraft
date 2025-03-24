/**
 * Form debugging utility
 * This script helps debug form submissions by adding validation indicators and error messages
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Form debugging initialized');
  setupDebugMode();
});

function setupDebugMode() {
  // Check if debug mode is enabled via URL
  const urlParams = new URLSearchParams(window.location.search);
  const debugMode = urlParams.get('debug') === 'true';
  
  if (debugMode) {
    console.log('Form debug mode enabled');
    addDebugStyles();
    
    // Add validation indicators to all forms
    document.querySelectorAll('form[data-submit="ajax"]').forEach(form => {
      addFormValidation(form);
    });
  }
}

function addFormValidation(form) {
  // Add a submit event listener to check validation before the main submission handler
  form.addEventListener('submit', function(e) {
    // Don't prevent default here - let the main handler do that
    
    console.group('Form Pre-submission Validation');
    console.log('Form:', form.id || form.className || 'unnamed form');
    
    // Check all required fields
    const requiredFields = form.querySelectorAll('[required]');
    let valid = true;
    
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        valid = false;
        console.warn(`Missing required field: ${field.name || field.id || 'unnamed field'}`);
        highlightField(field, true);
      } else {
        highlightField(field, false);
      }
    });
    
    // Check email fields for valid email format
    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (field.value && !emailRegex.test(field.value)) {
        valid = false;
        console.warn(`Invalid email format: ${field.name || field.id || 'unnamed field'}`);
        highlightField(field, true);
      }
    });
    
    // Log form data that would be sent
    const formData = new FormData(form);
    const formObject = {};
    formData.forEach((value, key) => {
      formObject[key] = value;
    });
    
    console.log('Form data to be submitted:', formObject);
    console.log('Form validation passed:', valid ? 'Yes' : 'No');
    console.groupEnd();
    
    // Add debug info to form
    const debugInfo = document.createElement('div');
    debugInfo.className = 'debug-info';
    debugInfo.innerHTML = `
      <h4>Debug Info</h4>
      <p>Form type: ${formObject.formType || 'Not specified'}</p>
      <p>Action: ${form.getAttribute('action') || 'Default'}</p>
      <p>Required fields: ${requiredFields.length}</p>
      <p>Valid: ${valid ? 'Yes' : 'No'}</p>
    `;
    
    // Remove any existing debug info
    form.querySelectorAll('.debug-info').forEach(el => el.remove());
    
    // Add the new debug info
    form.appendChild(debugInfo);
  }, true); // Use capturing phase to run before main handler
}

function highlightField(field, isError) {
  if (isError) {
    field.classList.add('debug-error');
    
    // Add error message if it doesn't exist
    let errorMsg = field.nextElementSibling;
    if (!errorMsg || !errorMsg.classList.contains('debug-error-msg')) {
      errorMsg = document.createElement('div');
      errorMsg.className = 'debug-error-msg';
      errorMsg.textContent = `Required: ${field.name || field.id || 'this field'}`;
      field.parentNode.insertBefore(errorMsg, field.nextSibling);
    }
  } else {
    field.classList.remove('debug-error');
    
    // Remove error message if it exists
    const errorMsg = field.nextElementSibling;
    if (errorMsg && errorMsg.classList.contains('debug-error-msg')) {
      errorMsg.remove();
    }
  }
}

function addDebugStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .debug-error {
      border: 2px solid red !important;
      background-color: rgba(255, 0, 0, 0.05) !important;
    }
    
    .debug-error-msg {
      color: red;
      font-size: 12px;
      margin-top: 5px;
    }
    
    .debug-info {
      margin-top: 20px;
      padding: 10px;
      background-color: #f8f9fa;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .debug-info h4 {
      margin-top: 0;
      margin-bottom: 10px;
    }
    
    .debug-info p {
      margin: 5px 0;
    }
  `;
  document.head.appendChild(style);
} 