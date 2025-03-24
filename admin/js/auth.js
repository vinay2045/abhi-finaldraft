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
            const response = await fetch('/api/auth/admin-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            // Handle non-OK responses first
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage;
                try {
                    // Try to parse error as JSON
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || `Login failed (${response.status})`;
                } catch (e) {
                    // If not JSON, use status text
                    errorMessage = `Login failed: ${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            // For successful responses, parse JSON
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Login failed');
            }

            if (!data.token) {
                throw new Error('Invalid server response: Authentication token missing');
            }

            // Store token and user data
            localStorage.setItem(TOKEN_KEY, data.token);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));

            return data.user;
        } catch (error) {
            console.error('Login error:', error);
            // Rethrow with a more user-friendly message if it's a network error
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new Error('Unable to connect to the server. Please check your internet connection.');
            }
            throw error;
        }
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