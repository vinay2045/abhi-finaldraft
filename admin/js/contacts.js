/**
 * Admin Contact Submissions Handler
 * Manages fetching, displaying and updating contact form submissions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (window.AdminAuth) {
        window.AdminAuth.checkAuth();
    } else {
        console.error('Auth utilities not found!');
        window.location.href = '/admin/login.html';
        return;
    }

    // Initialize UI
    initializeSidebar();
    setupUserInfo();
    setupEventListeners();
    
    // Load data
    loadContactSubmissions();
});

// Global state
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;
let allSubmissions = [];
let filteredSubmissions = [];
let selectedSubmissionId = null;

/**
 * Initialize sidebar functionality
 */
function initializeSidebar() {
    // Sidebar toggler
    const sidebarToggler = document.querySelector('.sidebar-toggler');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggler) {
        sidebarToggler.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            
            // Store user preference
            const isSidebarCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebar_collapsed', isSidebarCollapsed);
        });
    }
    
    // Check saved state
    const savedState = localStorage.getItem('sidebar_collapsed');
    if (savedState === 'true') {
        sidebar.classList.add('collapsed');
    }
    
    // Handle submenu toggles
    const submenuToggles = document.querySelectorAll('.menu-item.has-submenu > a');
    
    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const parent = this.parentElement;
            parent.classList.toggle('open');
            
            // If the submenu contains an active item, open it by default
            if (parent.querySelector('.submenu .active') && !parent.classList.contains('open')) {
                parent.classList.add('open');
            }
        });
    });
    
    // Auto-open the submenu that contains the active page
    const activeSubmenuItem = document.querySelector('.submenu .active');
    if (activeSubmenuItem) {
        const parentSubmenu = activeSubmenuItem.closest('.menu-item.has-submenu');
        if (parentSubmenu) {
            parentSubmenu.classList.add('open');
        }
    }
    
    // Hamburger menu for mobile
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', function() {
            sidebar.classList.toggle('mobile-open');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (sidebar.classList.contains('mobile-open') && 
            !sidebar.contains(e.target) && 
            !hamburgerMenu.contains(e.target)) {
            sidebar.classList.remove('mobile-open');
        }
    });
}

/**
 * Set up user info in sidebar and header
 */
function setupUserInfo() {
    const userInfo = document.querySelector('.user-info');
    const adminName = document.querySelector('.admin-name');
    
    if (!userInfo && !adminName) return;
    
    const currentUser = window.AdminAuth.getCurrentUser();
    if (currentUser) {
        if (userInfo) {
            const userName = userInfo.querySelector('h5');
            const userRole = userInfo.querySelector('p');
            
            if (userName) {
                userName.textContent = currentUser.name || currentUser.username;
            }
            
            if (userRole) {
                userRole.textContent = currentUser.role || 'Administrator';
            }
        }
        
        if (adminName) {
            adminName.textContent = currentUser.name || currentUser.username;
        }
    }
}

/**
 * Set up event listeners for UI interactions
 */
function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutDropdownBtn = document.getElementById('logoutDropdownBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.AdminAuth.logout();
        });
    }
    
    if (logoutDropdownBtn) {
        logoutDropdownBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.AdminAuth.logout();
        });
    }
    
    // Admin dropdown toggle
    const adminDropdownToggle = document.querySelector('.admin-dropdown-toggle');
    if (adminDropdownToggle) {
        adminDropdownToggle.addEventListener('click', function() {
            const dropdown = this.nextElementSibling;
            dropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!adminDropdownToggle.contains(e.target)) {
                const dropdown = document.querySelector('.admin-dropdown-menu');
                if (dropdown && dropdown.classList.contains('show')) {
                    dropdown.classList.remove('show');
                }
            }
        });
    }
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterAndDisplaySubmissions();
        });
    }
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterAndDisplaySubmissions();
        });
    }
    
    // Items per page
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', function() {
            itemsPerPage = parseInt(this.value);
            currentPage = 1; // Reset to first page
            filterAndDisplaySubmissions();
        });
    }
    
    // Modal close button
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            const modal = document.getElementById('submissionModal');
            modal.classList.remove('show');
        });
    }
    
    // Update status button
    const updateStatusBtn = document.getElementById('updateStatusBtn');
    if (updateStatusBtn) {
        updateStatusBtn.addEventListener('click', function() {
            updateSubmissionStatus();
        });
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('submissionModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    }
}

/**
 * Load contact form submissions from API
 */
async function loadContactSubmissions() {
    const tableBody = document.querySelector('#contactSubmissionsTable tbody');
    if (!tableBody) return;
    
    try {
        // Show loading state
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="loading-spinner"></div>
                    <p>Loading contact submissions...</p>
                </td>
            </tr>
        `;
        
        // Fetch submissions from API
        const response = await window.AdminAuth.apiRequest('/submissions/contact');
        allSubmissions = response.submissions || [];
        
        // Initialize filtered submissions with all submissions
        filteredSubmissions = [...allSubmissions];
        
        // Display submissions
        filterAndDisplaySubmissions();
        
    } catch (error) {
        console.error('Error loading contact submissions:', error);
        
        // Show error message
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="error-message">
                        <i class='bx bx-error-circle'></i>
                        <p>Failed to load submissions. Please try again.</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

/**
 * Filter and display submissions based on search and filter criteria
 */
function filterAndDisplaySubmissions() {
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchInput');
    const tableBody = document.querySelector('#contactSubmissionsTable tbody');
    
    if (!tableBody) return;
    
    // Get filter values
    const statusValue = statusFilter ? statusFilter.value : 'all';
    const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
    
    // Apply filters
    filteredSubmissions = allSubmissions.filter(submission => {
        // Status filter
        if (statusValue !== 'all' && submission.status !== statusValue) {
            return false;
        }
        
        // Search filter
        if (searchValue) {
            const searchFields = [
                submission.name,
                submission.email,
                submission.phone,
                submission.subject,
                submission._id
            ].map(field => field ? field.toString().toLowerCase() : '');
            
            return searchFields.some(field => field.includes(searchValue));
        }
        
        return true;
    });
    
    // Update pagination
    totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
    if (currentPage > totalPages) {
        currentPage = totalPages || 1;
    }
    
    // Calculate pagination slice
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageSubmissions = filteredSubmissions.slice(startIndex, endIndex);
    
    // Display submissions
    if (currentPageSubmissions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <p>No submissions match your criteria.</p>
                </td>
            </tr>
        `;
    } else {
        tableBody.innerHTML = '';
        
        currentPageSubmissions.forEach(submission => {
            const row = document.createElement('tr');
            
            // Format date
            const submissionDate = new Date(submission.createdAt);
            const formattedDate = submissionDate.toLocaleDateString() + ' ' + 
                                 submissionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Get status badge class
            let statusBadge = 'bg-info';
            let statusText = 'New';
            
            if (submission.status === 'in-progress') {
                statusBadge = 'bg-warning';
                statusText = 'In Progress';
            } else if (submission.status === 'resolved') {
                statusBadge = 'bg-success';
                statusText = 'Resolved';
            }
            
            row.innerHTML = `
                <td>${submission._id}</td>
                <td>${submission.name}</td>
                <td>${submission.email}</td>
                <td>${submission.phone || 'N/A'}</td>
                <td>${submission.subject || 'N/A'}</td>
                <td>${formattedDate}</td>
                <td><span class="badge ${statusBadge}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="view-btn" data-id="${submission._id}">
                            <i class='bx bx-show'></i>
                        </button>
                        <button class="delete-btn" data-id="${submission._id}">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners to buttons
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(button => {
            button.addEventListener('click', function() {
                const submissionId = this.getAttribute('data-id');
                viewSubmissionDetails(submissionId);
            });
        });
        
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const submissionId = this.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this submission?')) {
                    deleteSubmission(submissionId);
                }
            });
        });
    }
    
    // Update pagination UI
    updatePaginationUI();
}

/**
 * Update pagination UI
 */
function updatePaginationUI() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                ${currentPage === 1 ? 'disabled' : ''} 
                data-page="${currentPage - 1}">
            <i class='bx bx-chevron-left'></i>
        </button>
    `;
    
    // Page buttons
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4 && totalPages > 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                    data-page="${i}">
                ${i}
            </button>
        `;
    }
    
    // Next button
    paginationHTML += `
        <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                ${currentPage === totalPages ? 'disabled' : ''} 
                data-page="${currentPage + 1}">
            <i class='bx bx-chevron-right'></i>
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
    
    // Add event listeners to pagination buttons
    const paginationButtons = pagination.querySelectorAll('.pagination-btn:not(.disabled)');
    paginationButtons.forEach(button => {
        button.addEventListener('click', function() {
            const page = parseInt(this.getAttribute('data-page'));
            if (page !== currentPage) {
                currentPage = page;
                filterAndDisplaySubmissions();
                
                // Scroll to top of table
                const table = document.getElementById('contactSubmissionsTable');
                if (table) {
                    table.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

/**
 * View submission details
 * @param {string} submissionId - The ID of the submission to view
 */
async function viewSubmissionDetails(submissionId) {
    const modal = document.getElementById('submissionModal');
    const submissionDetails = document.getElementById('submissionDetails');
    const statusSelect = document.getElementById('statusSelect');
    const notesText = document.getElementById('notesText');
    
    if (!modal || !submissionDetails) return;
    
    try {
        // Show loading state
        submissionDetails.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Loading submission details...</p>
        `;
        
        // Show modal
        modal.classList.add('show');
        
        // Fetch submission details
        const response = await window.AdminAuth.apiRequest(`/submission/contact/${submissionId}`);
        const submission = response.submission;
        
        if (!submission) {
            submissionDetails.innerHTML = `
                <div class="error-message">
                    <i class='bx bx-error-circle'></i>
                    <p>Submission not found.</p>
                </div>
            `;
            return;
        }
        
        // Store selected submission ID
        selectedSubmissionId = submissionId;
        
        // Format date
        const submissionDate = new Date(submission.createdAt);
        const formattedDate = submissionDate.toLocaleDateString() + ' ' + 
                             submissionDate.toLocaleTimeString();
        
        // Display submission details
        submissionDetails.innerHTML = `
            <div class="detail-row">
                <div class="detail-label">ID:</div>
                <div class="detail-value">${submission._id}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Name:</div>
                <div class="detail-value">${submission.name}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Email:</div>
                <div class="detail-value">${submission.email}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Phone:</div>
                <div class="detail-value">${submission.phone || 'N/A'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Subject:</div>
                <div class="detail-value">${submission.subject || 'N/A'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Date:</div>
                <div class="detail-value">${formattedDate}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status:</div>
                <div class="detail-value">
                    <span class="badge ${submission.status === 'resolved' ? 'bg-success' : submission.status === 'in-progress' ? 'bg-warning' : 'bg-info'}">
                        ${submission.status === 'resolved' ? 'Resolved' : submission.status === 'in-progress' ? 'In Progress' : 'New'}
                    </span>
                </div>
            </div>
            <div class="detail-row full-width">
                <div class="detail-label">Message:</div>
                <div class="detail-value message-content">${submission.message}</div>
            </div>
            ${submission.notes ? `
                <div class="detail-row full-width">
                    <div class="detail-label">Notes:</div>
                    <div class="detail-value notes-content">${submission.notes}</div>
                </div>
            ` : ''}
        `;
        
        // Set current status in select
        if (statusSelect) {
            statusSelect.value = submission.status;
        }
        
        // Set current notes
        if (notesText) {
            notesText.value = submission.notes || '';
        }
        
    } catch (error) {
        console.error('Error fetching submission details:', error);
        
        submissionDetails.innerHTML = `
            <div class="error-message">
                <i class='bx bx-error-circle'></i>
                <p>Failed to load submission details. Please try again.</p>
            </div>
        `;
    }
}

/**
 * Update submission status
 */
async function updateSubmissionStatus() {
    if (!selectedSubmissionId) return;
    
    const statusSelect = document.getElementById('statusSelect');
    const notesText = document.getElementById('notesText');
    const updateBtn = document.getElementById('updateStatusBtn');
    
    if (!statusSelect || !notesText || !updateBtn) return;
    
    const status = statusSelect.value;
    const notes = notesText.value;
    
    try {
        // Show loading state
        updateBtn.textContent = 'Updating...';
        updateBtn.disabled = true;
        
        // Send update request
        await window.AdminAuth.apiRequest(`/submission/contact/${selectedSubmissionId}/status`, {
            method: 'PUT',
            body: JSON.stringify({
                status,
                notes
            })
        });
        
        // Update local data
        const submissionIndex = allSubmissions.findIndex(s => s._id === selectedSubmissionId);
        if (submissionIndex !== -1) {
            allSubmissions[submissionIndex].status = status;
            allSubmissions[submissionIndex].notes = notes;
        }
        
        // Reset UI
        updateBtn.textContent = 'Update Status';
        updateBtn.disabled = false;
        
        // Show success message
        alert('Submission status updated successfully.');
        
        // Refresh table
        filterAndDisplaySubmissions();
        
        // Close modal
        const modal = document.getElementById('submissionModal');
        if (modal) {
            modal.classList.remove('show');
        }
        
    } catch (error) {
        console.error('Error updating submission status:', error);
        
        // Reset UI
        updateBtn.textContent = 'Update Status';
        updateBtn.disabled = false;
        
        // Show error message
        alert('Failed to update submission status. Please try again.');
    }
}

/**
 * Delete a submission
 * @param {string} submissionId - The ID of the submission to delete
 */
async function deleteSubmission(submissionId) {
    try {
        // Send delete request
        await window.AdminAuth.apiRequest(`/submission/contact/${submissionId}`, {
            method: 'DELETE'
        });
        
        // Remove from local data
        allSubmissions = allSubmissions.filter(s => s._id !== submissionId);
        
        // Refresh table
        filterAndDisplaySubmissions();
        
        // Show success message
        alert('Submission deleted successfully.');
        
    } catch (error) {
        console.error('Error deleting submission:', error);
        
        // Show error message
        alert('Failed to delete submission. Please try again.');
    }
} 