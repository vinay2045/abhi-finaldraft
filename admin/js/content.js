/**
 * Page Content Management Script
 * Handles CRUD operations for page content items
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
    
    // Setup section mappings
    setupSectionMappings();
    
    // Setup event listeners
    setupEventListeners();
});

// Section mappings for each page
let sectionMappings = {};

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
 * Setup section mappings for each page
 */
function setupSectionMappings() {
    sectionMappings = {
        'home': [
            { id: 'hero', name: 'Hero Section' },
            { id: 'services', name: 'Services Section' },
            { id: 'featured', name: 'Featured Packages' },
            { id: 'testimonials', name: 'Testimonials' },
            { id: 'partners', name: 'Partners' }
        ],
        'flights': [
            { id: 'hero', name: 'Hero Section' },
            { id: 'features', name: 'Features' },
            { id: 'offers', name: 'Flight Offers' },
            { id: 'faqs', name: 'FAQs' }
        ],
        'visa': [
            { id: 'hero', name: 'Hero Section' },
            { id: 'types', name: 'Visa Types' },
            { id: 'process', name: 'Visa Process' },
            { id: 'requirements', name: 'Requirements' },
            { id: 'countries', name: 'Countries' }
        ],
        'passport': [
            { id: 'hero', name: 'Hero Section' },
            { id: 'types', name: 'Passport Types' },
            { id: 'process', name: 'Application Process' },
            { id: 'requirements', name: 'Requirements' }
        ],
        'forex': [
            { id: 'hero', name: 'Hero Section' },
            { id: 'services', name: 'Forex Services' },
            { id: 'rates', name: 'Exchange Rates' },
            { id: 'faqs', name: 'FAQs' }
        ],
        'domestic': [
            { id: 'hero', name: 'Hero Section' },
            { id: 'popular', name: 'Popular Destinations' },
            { id: 'packages', name: 'Tour Packages' },
            { id: 'faqs', name: 'FAQs' }
        ],
        'international': [
            { id: 'hero', name: 'Hero Section' },
            { id: 'popular', name: 'Popular Destinations' },
            { id: 'packages', name: 'Tour Packages' },
            { id: 'faqs', name: 'FAQs' }
        ],
        'honeymoon': [
            { id: 'hero', name: 'Hero Section' },
            { id: 'destinations', name: 'Popular Destinations' },
            { id: 'packages', name: 'Honeymoon Packages' },
            { id: 'testimonials', name: 'Testimonials' }
        ],
        'about': [
            { id: 'hero', name: 'Hero Section' },
            { id: 'story', name: 'Our Story' },
            { id: 'team', name: 'Our Team' },
            { id: 'values', name: 'Our Values' }
        ],
        'contact': [
            { id: 'hero', name: 'Hero Section' },
            { id: 'info', name: 'Contact Information' },
            { id: 'locations', name: 'Our Locations' },
            { id: 'map', name: 'Map' }
        ]
    };
    
    // Set up page selector event
    const pageSelector = document.getElementById('pageName');
    if (pageSelector) {
        pageSelector.addEventListener('change', function() {
            updateSectionSelector(this.value);
        });
    }
}

/**
 * Update section selector based on selected page
 */
function updateSectionSelector(pageName) {
    const sectionSelector = document.getElementById('sectionId');
    if (!sectionSelector) return;
    
    // Clear existing options
    sectionSelector.innerHTML = '<option value="">Select a section</option>';
    
    // Disable section selector if no page is selected
    if (!pageName) {
        sectionSelector.disabled = true;
        document.getElementById('loadContentBtn').disabled = true;
        document.getElementById('addContentBtn').disabled = true;
        return;
    }
    
    // Get sections for the selected page
    const sections = sectionMappings[pageName] || [];
    
    // Add options for each section
    sections.forEach(section => {
        const option = document.createElement('option');
        option.value = section.id;
        option.textContent = section.name;
        sectionSelector.appendChild(option);
    });
    
    // Enable section selector
    sectionSelector.disabled = false;
    
    // Enable load button if a section is selected
    sectionSelector.addEventListener('change', function() {
        document.getElementById('loadContentBtn').disabled = !this.value;
    });
}

/**
 * Setup all event listeners for content management
 */
function setupEventListeners() {
    // Load content button
    const loadBtn = document.getElementById('loadContentBtn');
    if (loadBtn) {
        loadBtn.addEventListener('click', loadContent);
    }
    
    // Add new content item button
    const addBtn = document.getElementById('addContentBtn');
    if (addBtn) {
        addBtn.addEventListener('click', openAddModal);
    }
    
    // Save button in modal
    const saveBtn = document.getElementById('saveContentBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveContentItem);
    }
    
    // Close modal buttons
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });
    
    // Image upload preview
    const imageUpload = document.getElementById('imageUpload');
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }
    
    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteContentItem);
    }
}

/**
 * Load content for selected page and section
 */
async function loadContent() {
    const pageName = document.getElementById('pageName').value;
    const sectionId = document.getElementById('sectionId').value;
    
    if (!pageName || !sectionId) {
        showToast('Please select both page and section', 'warning');
        return;
    }
    
    const tableBody = document.querySelector('#contentItemsTable tbody');
    if (!tableBody) return;
    
    try {
        // Show loading state
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <div class="loading-spinner" style="margin: 20px auto;"></div>
                    <p>Loading content items...</p>
                </td>
            </tr>
        `;
        
        // Update section title
        const sectionName = getSelectedSectionName(pageName, sectionId);
        document.getElementById('contentSectionTitle').textContent = `Content for ${sectionName}`;
        
        // Enable add button
        document.getElementById('addContentBtn').disabled = false;
        
        // Fetch content items
        const response = await window.AdminAuth.apiRequest(`/content/${pageName}/${sectionId}`);
        const contentItems = response.data || [];
        
        // If no content items
        if (!contentItems || contentItems.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <p>No content items found for this section. Add your first item.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Render content items
        tableBody.innerHTML = '';
        
        contentItems.forEach((item, index) => {
            const row = document.createElement('tr');
            
            const imageHTML = item.image
                ? `<div class="table-image"><img src="${item.image}" alt="${item.title}"></div>`
                : '<span class="no-image">No Image</span>';
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${imageHTML}</td>
                <td>${item.title}</td>
                <td>${item.contentType}</td>
                <td>
                    <div class="action-buttons">
                        <button type="button" class="btn btn-primary edit-btn" data-id="${item._id}">
                            <i class='bx bx-edit-alt'></i>
                        </button>
                        <button type="button" class="btn btn-danger delete-btn" data-id="${item._id}">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners for edit and delete buttons
        addTableButtonListeners();
        
    } catch (error) {
        console.error('Error fetching content items:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <div class="alert alert-danger">
                        <p>Error loading content items: ${error.message}</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

/**
 * Get section name for display
 */
function getSelectedSectionName(pageName, sectionId) {
    const page = sectionMappings[pageName] || [];
    const section = page.find(s => s.id === sectionId);
    return section ? `${section.name} (${pageName})` : `${sectionId} (${pageName})`;
}

/**
 * Add event listeners to table buttons
 */
function addTableButtonListeners() {
    // Edit buttons
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            openEditModal(id);
        });
    });
    
    // Delete buttons
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            openDeleteConfirmation(id);
        });
    });
}

/**
 * Open modal for adding a new content item
 */
function openAddModal() {
    // Reset form
    document.getElementById('contentForm').reset();
    document.getElementById('contentId').value = '';
    document.getElementById('imagePreview').innerHTML = '';
    
    // Set hidden fields
    document.getElementById('modalPageName').value = document.getElementById('pageName').value;
    document.getElementById('modalSectionId').value = document.getElementById('sectionId').value;
    
    // Set modal title
    document.getElementById('modalTitle').textContent = 'Add Content Item';
    
    // Open modal
    document.getElementById('contentModal').classList.add('show');
}

/**
 * Open modal for editing a content item
 */
async function openEditModal(id) {
    try {
        // Fetch content item details
        const response = await window.AdminAuth.apiRequest(`/content/item/${id}`);
        const item = response.data;
        
        if (!item) {
            showToast('Item not found', 'error');
            return;
        }
        
        // Fill form with item details
        document.getElementById('contentId').value = item._id;
        document.getElementById('modalPageName').value = item.pageName;
        document.getElementById('modalSectionId').value = item.sectionId;
        document.getElementById('contentType').value = item.contentType || '';
        document.getElementById('title').value = item.title || '';
        document.getElementById('heading').value = item.heading || '';
        document.getElementById('description').value = item.description || '';
        document.getElementById('imageUrl').value = item.image || '';
        document.getElementById('category').value = item.category || '';
        document.getElementById('order').value = item.order || 0;
        
        // Handle price & duration
        document.getElementById('price').value = item.price || '';
        document.getElementById('duration').value = item.duration || '';
        
        // Handle tags
        if (item.tags && Array.isArray(item.tags)) {
            document.getElementById('tags').value = item.tags.join(', ');
        } else {
            document.getElementById('tags').value = '';
        }
        
        // Show image preview
        const previewContainer = document.getElementById('imagePreview');
        if (item.image) {
            previewContainer.innerHTML = `
                <img src="${item.image}" alt="Preview" style="max-width: 100%; max-height: 150px;">
            `;
        } else {
            previewContainer.innerHTML = '';
        }
        
        // Set modal title
        document.getElementById('modalTitle').textContent = 'Edit Content Item';
        
        // Open modal
        document.getElementById('contentModal').classList.add('show');
        
    } catch (error) {
        console.error('Error fetching content item:', error);
        showToast('Failed to load item details', 'error');
    }
}

/**
 * Open delete confirmation modal
 */
function openDeleteConfirmation(id) {
    // Store ID in the confirm delete button
    document.getElementById('confirmDeleteBtn').setAttribute('data-id', id);
    
    // Show confirmation modal
    document.getElementById('confirmModal').classList.add('show');
}

/**
 * Close any open modal
 */
function closeModal() {
    document.getElementById('contentModal').classList.remove('show');
    document.getElementById('confirmModal').classList.remove('show');
}

/**
 * Handle image upload and preview
 */
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = function(event) {
        const previewContainer = document.getElementById('imagePreview');
        previewContainer.innerHTML = `
            <img src="${event.target.result}" alt="Preview" style="max-width: 100%; max-height: 150px;">
        `;
    };
    
    reader.readAsDataURL(file);
}

/**
 * Save content item (create new or update existing)
 */
async function saveContentItem() {
    try {
        // Validate form
        const form = document.getElementById('contentForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Gather form data
        const id = document.getElementById('contentId').value;
        
        const itemData = {
            pageName: document.getElementById('modalPageName').value,
            sectionId: document.getElementById('modalSectionId').value,
            contentType: document.getElementById('contentType').value,
            title: document.getElementById('title').value,
            heading: document.getElementById('heading').value || undefined,
            description: document.getElementById('description').value || undefined,
            image: document.getElementById('imageUrl').value || undefined,
            category: document.getElementById('category').value || undefined,
            price: document.getElementById('price').value || undefined,
            duration: document.getElementById('duration').value || undefined,
            order: document.getElementById('order').value || undefined
        };
        
        // Handle tags
        const tagsInput = document.getElementById('tags').value;
        if (tagsInput) {
            itemData.tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
        } else {
            itemData.tags = [];
        }
        
        // Handle image upload if present
        const imageFile = document.getElementById('imageUpload').files[0];
        if (imageFile) {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('directory', itemData.pageName);
            
            // Upload the image first
            const uploadResponse = await window.AdminAuth.apiRequest('/upload', {
                method: 'POST',
                body: formData,
                headers: {} // Let the browser set content-type with boundary
            });
            
            if (uploadResponse.success && uploadResponse.fileUrl) {
                itemData.image = uploadResponse.fileUrl;
            } else {
                throw new Error('Failed to upload image');
            }
        }
        
        let response;
        
        // Create new or update existing
        if (id) {
            // Update existing
            response = await window.AdminAuth.apiRequest(`/content/${id}`, {
                method: 'PUT',
                body: JSON.stringify(itemData)
            });
            
            if (response.success) {
                showToast('Content item updated successfully', 'success');
            }
        } else {
            // Create new
            response = await window.AdminAuth.apiRequest('/content', {
                method: 'POST',
                body: JSON.stringify(itemData)
            });
            
            if (response.success) {
                showToast('Content item created successfully', 'success');
            }
        }
        
        // Close modal and refresh list
        closeModal();
        loadContent();
        
    } catch (error) {
        console.error('Error saving content item:', error);
        showToast(`Failed to save: ${error.message}`, 'error');
    }
}

/**
 * Delete a content item
 */
async function deleteContentItem() {
    const id = this.getAttribute('data-id');
    
    try {
        const response = await window.AdminAuth.apiRequest(`/content/${id}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            showToast('Content item deleted successfully', 'success');
            
            // Close modal and refresh list
            closeModal();
            loadContent();
        } else {
            throw new Error(response.message || 'Failed to delete item');
        }
    } catch (error) {
        console.error('Error deleting content item:', error);
        showToast(`Failed to delete: ${error.message}`, 'error');
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Create toast element if not exists
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.classList.add('toast-container');
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.classList.add('toast', `toast-${type}`);
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
} 