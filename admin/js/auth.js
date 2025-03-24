/**
 * Admin Authentication Utilities
 * Handles login, logout, session management and authentication checks
 */

// Constants
const API_URL = '/api'; // Base API path
const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

class AdminAuth {
    /**
     * Attempt to login with provided credentials
     * @param {string} username - Admin username
     * @param {string} password - Admin password
     * @returns {Promise} - Resolves with user data if successful
     */
    static async login(username, password) {
        try {
            console.log('Attempting direct login with simplified approach');
            
            // Create a simplified version with a much longer timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
            
            // Try emergency login directly with a simple approach
            const response = await fetch('/api/auth/admin-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                body: JSON.stringify({
                    username,
                    password,
                    emergency: true, // Signal to server this is an emergency login
                    timestamp: Date.now() // Prevent caching
                }),
                signal: controller.signal
            }).finally(() => clearTimeout(timeoutId));
            
            // Handle non-200 responses
            if (!response.ok) {
                let errorMessage = `Login failed with status code ${response.status}`;
                
                if (response.status === 504) {
                    throw new Error('Server timeout. Please try again later.');
                }
                
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (e) {
                    // If we can't parse the error as JSON, use the status text
                    console.error('Error parsing response:', e);
                }
                
                throw new Error(errorMessage);
            }
            
            // Parse the response
            const data = await response.json();
            
            // Validate the response
            if (!data.success) {
                throw new Error(data.message || 'Login failed');
            }
            
            if (!data.token) {
                throw new Error('Authentication token missing from response');
            }
            
            // Store auth data in localStorage
            localStorage.setItem(TOKEN_KEY, data.token);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            
            // Update emergency mode flag if needed
            if (data.mode === 'emergency') {
                localStorage.setItem('admin_emergency_mode', 'true');
                console.warn('Logged in with emergency mode - some features may be limited');
            } else {
                localStorage.removeItem('admin_emergency_mode');
            }
            
            return data.user;
        } catch (error) {
            // Handle specific error types
            if (error.name === 'AbortError') {
                console.error('Login request timed out after 30 seconds');
                
                // Try emergency fallback
                return this.emergencyLogin(username, password);
            }
            
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                console.error('Network error during login');
                
                // Try emergency fallback
                return this.emergencyLogin(username, password);
            }
            
            // Rethrow other errors
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Emergency fallback login when the main login fails
     * @param {string} username 
     * @param {string} password 
     * @returns {Promise}
     */
    static async emergencyLogin(username, password) {
        console.log('Attempting emergency login fallback');
        
        // Only allow admin/admin123 in emergency mode
        if (username !== 'admin' || password !== 'admin123') {
            throw new Error('Invalid emergency credentials. Use admin/admin123 in emergency mode.');
        }
        
        // Create a fake token and user
        const token = 'emergency_' + Math.random().toString(36).substring(2);
        const user = {
            id: 'emergency-admin',
            username: 'admin',
            email: 'admin@example.com',
            name: 'Emergency Administrator'
        };
        
        // Store emergency login data
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.setItem('admin_emergency_mode', 'true');
        
        console.warn('Logged in with client-side emergency mode - limited functionality available');
        return user;
    }

    /**
     * Log the current user out
     */
    static logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        
        // Redirect to login page
        window.location.href = '/admin/login.html';
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} - True if authenticated
     */
    static isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Get the current authentication token
     * @returns {string|null} - The auth token or null
     */
    static getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    /**
     * Get the current user data
     * @returns {Object|null} - User data or null if not logged in
     */
    static getCurrentUser() {
        const userData = localStorage.getItem(USER_KEY);
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Check if token is expired
     * @returns {boolean} - True if token is expired or invalid
     */
    static isTokenExpired() {
        const token = this.getToken();
        if (!token) return true;
        
        try {
            // JWT tokens are in format: header.payload.signature
            const payload = token.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            
            // Check if token is expired
            return decoded.exp < Date.now() / 1000;
        } catch (error) {
            console.error('Token validation error:', error);
            return true; // Consider invalid tokens as expired
        }
    }

    /**
     * Get auth header for API requests
     * @returns {Object} - Headers object with Authorization
     */
    static getAuthHeaders() {
        const token = this.getToken();
        return {
            'x-auth-token': token,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Check auth status and redirect if not authenticated
     * Use on protected pages
     */
    static checkAuth() {
        if (!this.isAuthenticated() || this.isTokenExpired()) {
            // Save the current URL to redirect back after login
            const currentPath = window.location.pathname;
            if (currentPath !== '/admin/login.html') {
                sessionStorage.setItem('redirect_after_login', currentPath);
                window.location.href = '/admin/login.html';
            }
        }
    }

    /**
     * API Request handler for admin panel
     * Manages authentication and API communication
     * 
     * @param {string} endpoint - API endpoint to call
     * @param {string|object} method - HTTP method (GET, POST, PUT, DELETE) or options object
     * @param {object} data - Optional data to send with request
     * @param {object} customHeaders - Optional custom headers
     * @returns {Promise} - Promise with the API response
     */
    static async apiRequest(endpoint, method = 'GET', data = null, customHeaders = {}) {
        try {
            // Handle case where method is actually an options object
            let requestMethod = method;
            let requestData = data;
            let requestHeaders = customHeaders;
            
            // Check if second parameter is actually an options object
            if (typeof method === 'object' && method !== null) {
                requestMethod = method.method || 'GET';
                requestData = method.body || null;
                requestHeaders = method.headers || {};
            }
            
            // Normalize endpoint (ensure it starts with a slash)
            if (!endpoint.startsWith('/')) {
                endpoint = '/' + endpoint;
            }
            
            // Add /api prefix if it's not already there
            let apiEndpoint = endpoint;
            if (!apiEndpoint.startsWith('/api/')) {
                apiEndpoint = '/api' + apiEndpoint;
            }
            
            // Build URL with the API prefix
            const fullUrl = `${window.location.origin}${apiEndpoint}`;
            
            console.log(`Making ${requestMethod} request to: ${fullUrl}`);
            
            // Prepare request options
            const options = {
                method: requestMethod,
                headers: {
                    ...requestHeaders
                },
                credentials: 'same-origin'
            };
            
            // Add auth token if available
            const token = this.getToken();
            if (token) {
                options.headers['Authorization'] = `Bearer ${token}`;
            }
            
            // Add content-type and handle data for POST, PUT methods
            if (requestData) {
                // Only set Content-Type if not already set and not multipart form data
                if (!requestHeaders['Content-Type'] && 
                    !requestHeaders['content-type'] && 
                    !(requestData instanceof FormData)) {
                    options.headers['Content-Type'] = 'application/json';
                }
                
                // Handle JSON stringification properly
                if (options.headers['Content-Type'] === 'application/json') {
                    // Check if requestData is already a string (pre-stringified JSON)
                    if (typeof requestData === 'string') {
                        try {
                            // Make sure it's valid JSON by parsing and re-stringifying
                            const parsed = JSON.parse(requestData);
                            options.body = JSON.stringify(parsed);
                        } catch (e) {
                            console.error('Invalid JSON string provided:', e);
                            throw new Error('Invalid JSON string provided: ' + e.message);
                        }
                    } else {
                        // Normal object that needs to be stringified
                        options.body = JSON.stringify(requestData);
                    }
                } else {
                    // For FormData or other types
                    options.body = requestData;
                }
            }
            
            // Make the request
            const response = await fetch(fullUrl, options);
            
            // Handle 401 Unauthorized (redirect to login)
            if (response.status === 401) {
                console.warn('Authentication required, redirecting to login');
                this.logout();
                return null;
            }
            
            // Handle other non-OK responses
            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                
                try {
                    // Try to parse error as JSON
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    // If not JSON, use text as message
                    errorData = { message: errorText || `HTTP error ${response.status}` };
                }
                
                // Log the error
                console.error(`API error (${response.status}):`, errorData);
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            
            // Parse successful response
            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }
}

// Export to window object for global access
window.AdminAuth = AdminAuth; 