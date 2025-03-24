/**
 * Admin Dashboard Script
 * Handles sidebar, dashboard statistics and recent submissions
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

    // Initialize UI elements
    initializeSidebar();
    setupUserInfo();
    fetchDashboardStats();
    fetchRecentSubmissions();
});

/**
 * Initialize sidebar functionality
 */
function initializeSidebar() {
    // Sidebar toggler
    const sidebarToggler = document.querySelector('.sidebar-toggler');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
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
        });
    });
    
    // Set active menu item based on current page
    setActiveMenuItem();
}

/**
 * Set up user info in sidebar
 */
function setupUserInfo() {
    const userInfo = document.querySelector('.user-info');
    if (!userInfo) return;
    
    const currentUser = window.AdminAuth.getCurrentUser();
    if (currentUser) {
        const userName = userInfo.querySelector('h5');
        const userRole = userInfo.querySelector('p');
        
        if (userName) {
            userName.textContent = currentUser.name || currentUser.username;
        }
        
        if (userRole) {
            userRole.textContent = currentUser.role || 'Administrator';
        }
    }
}

/**
 * Set active menu item based on current URL
 */
function setActiveMenuItem() {
    const currentPath = window.location.pathname;
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        const link = item.querySelector('a');
        if (link && link.getAttribute('href')) {
            const linkPath = link.getAttribute('href');
            if (currentPath.endsWith(linkPath)) {
                item.classList.add('active');
                
                // If in submenu, open parent
                const parentSubmenu = item.closest('.submenu');
                if (parentSubmenu) {
                    const parentItem = parentSubmenu.closest('.menu-item');
                    if (parentItem) {
                        parentItem.classList.add('open');
                    }
                }
            } else {
                item.classList.remove('active');
            }
        }
    });
}

/**
 * Fetch dashboard statistics from API
 */
async function fetchDashboardStats() {
    const statCards = {
        'contacts': document.getElementById('contactsCount'),
        'flights': document.getElementById('flightsCount'),
        'domesticTours': document.getElementById('domesticToursCount'),
        'internationalTours': document.getElementById('internationalToursCount'),
        'visa': document.getElementById('visaCount'),
        'passport': document.getElementById('passportCount'),
        'forex': document.getElementById('forexCount'),
        'honeymoon': document.getElementById('honeymoonCount')
    };
    
    try {
        // Show loading state
        Object.values(statCards).forEach(card => {
            if (card) {
                card.innerHTML = '<div class="loading-spinner"></div>';
            }
        });
        
        // Fetch stats from API
        const stats = await window.AdminAuth.apiRequest('/stats');
        
        // Update UI with stats
        if (stats) {
            if (statCards.contacts) {
                statCards.contacts.textContent = stats.contacts || 0;
            }
            
            if (statCards.flights) {
                statCards.flights.textContent = stats.flights || 0;
            }
            
            if (statCards.domesticTours) {
                statCards.domesticTours.textContent = stats.domesticTours || 0;
            }
            
            if (statCards.internationalTours) {
                statCards.internationalTours.textContent = stats.internationalTours || 0;
            }
            
            if (statCards.visa) {
                statCards.visa.textContent = stats.visa || 0;
            }
            
            if (statCards.passport) {
                statCards.passport.textContent = stats.passport || 0;
            }
            
            if (statCards.forex) {
                statCards.forex.textContent = stats.forex || 0;
            }
            
            if (statCards.honeymoon) {
                statCards.honeymoon.textContent = stats.honeymoon || 0;
            }

            // Update page with console.log for debugging
            console.log('Dashboard stats loaded:', stats);
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
        
        // Show error state
        Object.values(statCards).forEach(card => {
            if (card) {
                card.innerHTML = '<span class="text-danger">Error</span>';
            }
        });
    }
}

/**
 * Fetch recent submissions for dashboard
 */
async function fetchRecentSubmissions() {
    const tableBody = document.querySelector('#recentSubmissionsTable tbody');
    if (!tableBody) return;
    
    try {
        // Show loading state
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="loading-spinner" style="margin: 20px auto;"></div>
                    <p>Loading recent submissions...</p>
                </td>
            </tr>
        `;
        
        // Fetch recent submissions
        const response = await window.AdminAuth.apiRequest('/recent-submissions');
        const submissions = response.submissions || [];
        
        // If no submissions
        if (!submissions || submissions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <p>No recent submissions found.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Render submissions
        tableBody.innerHTML = '';
        
        submissions.forEach((submission, index) => {
            const row = document.createElement('tr');
            
            // Format date and time separately
            const submissionDate = new Date(submission.createdAt);
            const formattedDate = submissionDate.toLocaleDateString();
            const formattedTime = submissionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Get type badge class
            let badgeClass = 'bg-primary';
            if (submission.type === 'contact') badgeClass = 'bg-info';
            if (submission.type === 'flight') badgeClass = 'bg-warning';
            if (submission.type === 'domestic') badgeClass = 'bg-success';
            if (submission.type === 'international') badgeClass = 'bg-secondary';
            if (submission.type === 'visa') badgeClass = 'bg-danger';
            if (submission.type === 'passport') badgeClass = 'bg-dark';
            if (submission.type === 'forex') badgeClass = 'bg-primary';
            if (submission.type === 'honeymoon') badgeClass = 'bg-info text-dark';
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${submission.name || 'N/A'}</td>
                <td>${submission.phone || 'N/A'}</td>
                <td>${submission.email || 'N/A'}</td>
                <td>
                    <span class="badge ${badgeClass}">${submission.type}</span>
                </td>
                <td>${formattedDate}</td>
                <td>${formattedTime}</td>
                <td>
                    <div class="action-buttons">
                        <button type="button" class="btn btn-primary view-btn" data-id="${submission.id}" data-type="${submission.type}" title="View Details">
                            <i class='bx bx-show'></i>
                        </button>
                        <button type="button" class="btn btn-danger delete-btn" data-id="${submission.id}" data-type="${submission.type}" title="Delete">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners for view buttons
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const type = this.getAttribute('data-type');
                
                // Navigate to the view submission page with both id and type parameters
                window.location.href = `/admin/view.html?id=${id}&type=${type}`;
            });
        });
        
        // Add event listeners for delete buttons
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', async function() {
                if (confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
                    const id = this.getAttribute('data-id');
                    const type = this.getAttribute('data-type');
                    
                    try {
                        // Call the delete API endpoint
                        const response = await window.AdminAuth.apiRequest(`/submission/${type}/${id}`, {
                            method: 'DELETE'
                        });
                        
                        if (response && response.success) {
                            // Refresh the submissions list
                            fetchRecentSubmissions();
                            alert('Submission deleted successfully');
                        } else {
                            alert('Failed to delete submission');
                        }
                    } catch (error) {
                        console.error('Error deleting submission:', error);
                        alert('Error deleting submission: ' + error.message);
                    }
                }
            });
        });
        
    } catch (error) {
        console.error('Error fetching submissions:', error);
        
        // Show error state
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <p class="text-danger">Error loading submissions: ${error.message}</p>
                </td>
            </tr>
        `;
    }
}

/**
 * Handle logout button click
 */
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'logoutBtn') {
        e.preventDefault();
        window.AdminAuth.logout();
    }
}); 