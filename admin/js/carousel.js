/**
 * Carousel Management Script
 * Handles CRUD operations for carousel items directly with base64 encoded images
 */

// Global variables
let carouselItems = [];
let currentItemId = null;
let originalImageData = null;
let deleteItemId = null;

// Global variable to store all carousel items for preview navigation
let allCarouselItems = [];
let currentPreviewIndex = 0;

// DOM elements - initialized in DOMContentLoaded
let carouselModal;
let modalTitle;
let carouselForm;
let imagePreview;
let imageSizeControls;
let addCarouselBtn;
let saveCarouselBtn;
let reorderBtn;
let saveOrderBtn;
let confirmDeleteBtn;
let imageUpload;
let carouselItemsList;
let reorderList;
let carouselItemsTable;
let sortableItems;
let confirmModal;
let reorderModal;
let dragDropArea;

// Placeholder image for when no image is provided
const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMThweCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2UgUGxhY2Vob2xkZXI8L3RleHQ+PC9zdmc+';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing carousel admin');
    
    // Initialize DOM element references
    carouselModal = document.getElementById('carouselModal');
    modalTitle = document.getElementById('modalTitle');
    carouselForm = document.getElementById('carouselForm');
    imagePreview = document.getElementById('imagePreview');
    addCarouselBtn = document.getElementById('addCarouselBtn');
    saveCarouselBtn = document.getElementById('saveCarouselBtn');
    reorderBtn = document.getElementById('reorderBtn');
    saveOrderBtn = document.getElementById('saveOrderBtn');
    confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    imageUpload = document.getElementById('imageUpload');
    carouselItemsList = document.getElementById('carouselItems');
    reorderList = document.getElementById('reorderList');
    carouselItemsTable = document.getElementById('carouselItemsTable');
    sortableItems = document.getElementById('sortableItems');
    confirmModal = document.getElementById('confirmModal');
    reorderModal = document.getElementById('reorderModal');
    dragDropArea = document.getElementById('dragDropArea');
    
    console.log('DOM elements initialized:', {
        carouselModal: !!carouselModal,
        modalTitle: !!modalTitle,
        carouselForm: !!carouselForm,
        imagePreview: !!imagePreview,
        addCarouselBtn: !!addCarouselBtn,
        saveCarouselBtn: !!saveCarouselBtn,
        reorderBtn: !!reorderBtn,
        saveOrderBtn: !!saveOrderBtn,
        confirmDeleteBtn: !!confirmDeleteBtn,
        imageUpload: !!imageUpload,
        carouselItemsList: !!carouselItemsList,
        reorderList: !!reorderList,
        carouselItemsTable: !!carouselItemsTable,
        sortableItems: !!sortableItems,
        confirmModal: !!confirmModal,
        reorderModal: !!reorderModal,
        dragDropArea: !!dragDropArea
    });
    
    // Set up event listeners
    addEventListeners();
    
    // Load carousel items
    loadCarouselItems();
    
    // Setup drag & drop for image upload
    setupDragDrop();
    
    // Add other event listeners
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            hideModal(carouselModal);
            
            // Hide other modals if they exist
            const reorderModal = document.getElementById('reorderModal');
            const confirmModal = document.getElementById('confirmModal');
            
            if (reorderModal) hideModal(reorderModal);
            if (confirmModal) hideModal(confirmModal);
        });
    });
    
    // Reorder button
    if (reorderBtn) {
        reorderBtn.addEventListener('click', showReorderModal);
    }
    
    // Confirm delete button
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteCarouselItem);
    }
    
    // Image upload
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }
    
    // Set up form reset when modal is closed
    if (carouselModal) {
        carouselModal.addEventListener('click', function(e) {
            if (e.target === carouselModal || e.target.classList.contains('modal-backdrop')) {
                hideModal(carouselModal);
            }
        });
    }
    
    console.log('Carousel admin initialization complete');
});

// Load carousel items from API
async function loadCarouselItems() {
    try {
        showTableLoading();
        console.log('Loading carousel items from API...');
        
        const response = await window.AdminAuth.apiRequest('/api/carousel/all', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Carousel items loaded:', response);
        
        if (Array.isArray(response)) {
            carouselItems = response; 
        } else {
            console.warn('Invalid carousel items response:', response);
            carouselItems = [];
        }
        
        renderCarouselItemsTable(carouselItems);
    } catch (error) {
        console.error('Error loading carousel items:', error);
        showToast(`Failed to load: ${error.message || 'Unknown error'}`, 'error');
        renderEmptyTable('Failed to load carousel items. Please try again.');
    }
}

// Function to render the table of carousel items
function renderCarouselItemsTable(carouselItems) {
    console.log('Rendering carousel items table', carouselItems);
    
    // Sort items by order
    carouselItems.sort((a, b) => a.order - b.order);
    allCarouselItems = carouselItems;
    
    // Display summary of total items and order range
    const carouselSummary = document.getElementById('carouselSummary');
    if (carouselSummary) {
        if (carouselItems.length > 0) {
            const minOrder = Math.min(...carouselItems.map(item => item.order));
            const maxOrder = Math.max(...carouselItems.map(item => item.order));
            carouselSummary.innerHTML = `
                <div class="alert alert-info summary-box">
                    <i class="fas fa-info-circle mr-2"></i>
                    <strong>Total items:</strong> ${carouselItems.length}
                    (Order ranges from ${minOrder} to ${maxOrder})
                </div>
            `;
            } else {
            carouselSummary.innerHTML = `
                <div class="alert alert-warning summary-box">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    <strong>No carousel items found.</strong> Add your first item!
                </div>
            `;
        }
    }
    
    const tableBody = document.getElementById('carouselItemsBody');
    if (!tableBody) {
        console.error('Carousel items table body not found');
        return;
    }
    
    tableBody.innerHTML = '';
    
    if (carouselItems.length === 0) {
        const noItemsRow = document.createElement('tr');
        noItemsRow.innerHTML = `<td colspan="6" class="text-center py-4">No carousel items found. Click the "Add Carousel Item" button to get started!</td>`;
        tableBody.appendChild(noItemsRow);
        return;
    }
    
    carouselItems.forEach(item => {
        const row = document.createElement('tr');
        
        // Check if image is base64 and show appropriate thumbnail
        const thumbnailSrc = item.image && item.image.startsWith('data:image') 
            ? item.image 
            : item.image || '/admin/assets/placeholder-image.jpg';
            
        row.innerHTML = `
            <td class="text-center">${item.order}</td>
            <td>
                <img src="${thumbnailSrc}" alt="${item.title}" class="img-thumbnail" style="width: 60px; height: 60px; object-fit: cover;">
            </td>
            <td>${item.title || 'No title'}</td>
            <td>${item.heading || 'No heading'}</td>
            <td class="text-center">${item.active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-secondary">Inactive</span>'}</td>
            <td class="text-right">
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-info edit-item" data-id="${item._id}" data-toggle="tooltip" title="Edit item">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary preview-item" data-id="${item._id}" data-toggle="tooltip" title="Preview item">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-item" data-id="${item._id}" data-toggle="tooltip" title="Delete item">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
        
        // Add event listeners to the action buttons
        row.querySelector('.edit-item').addEventListener('click', () => editCarouselItem(item._id));
        row.querySelector('.preview-item').addEventListener('click', () => previewCarouselItem(item._id));
        row.querySelector('.delete-item').addEventListener('click', () => showDeleteConfirmation(item._id));
        
        // Initialize tooltips
        $(row).find('[data-toggle="tooltip"]').tooltip();
    });
}

// Show loading state in table
function showTableLoading() {
    if (!carouselItemsTable) return;
    
    carouselItemsTable.querySelector('tbody').innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="loading-spinner" style="margin: 20px auto;"></div>
                    <p>Loading carousel items...</p>
                </td>
            </tr>
        `;
}

// Render empty table with message
function renderEmptyTable(message) {
    if (!carouselItemsTable) return;
    
    carouselItemsTable.querySelector('tbody').innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                <p>${message}</p>
                    </td>
                </tr>
            `;
}

// Initialize event listeners
function addEventListeners() {
    console.log('Setting up event listeners');
    
    // Add carousel button
    if (addCarouselBtn) {
        console.log('Found add carousel button');
        addCarouselBtn.addEventListener('click', () => showCarouselModal());
    } else {
        console.error('Add carousel button not found');
    }
    
    // Save carousel button - with debug logging
    if (saveCarouselBtn) {
        console.log('Found save carousel button');
        
        // Remove any existing event listeners first
        const newSaveBtn = saveCarouselBtn.cloneNode(true);
        saveCarouselBtn.parentNode.replaceChild(newSaveBtn, saveCarouselBtn);
        saveCarouselBtn = newSaveBtn;
        
        // Add the new event listener with explicit preventDefault
        saveCarouselBtn.addEventListener('click', function(e) {
            console.log('Save button clicked');
            e.preventDefault();
            saveCarouselItem(e);
        });
    } else {
        console.error('Save carousel button not found');
    }
    
    // Save order button
    if (saveOrderBtn) {
        console.log('Found save order button');
        saveOrderBtn.addEventListener('click', saveItemsOrder);
    } else {
        console.error('Save order button not found');
    }
    
    console.log('Event listeners setup complete');
}

// Setup drag & drop functionality
function setupDragDrop() {
    if (!dragDropArea) {
        console.error('Drag & drop area not found');
        dragDropArea = document.getElementById('dragDropArea');
        if (!dragDropArea) {
            console.error('Could not find drag & drop area even with getElementById');
            return;
        }
    }
    
    if (!imageUpload) {
        console.error('Image upload element not found');
        imageUpload = document.getElementById('imageUpload');
        if (!imageUpload) {
            console.error('Could not find image upload element even with getElementById');
            return;
        }
    }
    
    console.log('Setting up drag & drop functionality');
    
    // Click to browse files
    const browseLink = dragDropArea.querySelector('.browse-link');
    if (browseLink) {
        // Remove any existing event listeners by cloning and replacing
        const newBrowseLink = browseLink.cloneNode(true);
        if (browseLink.parentNode) {
            browseLink.parentNode.replaceChild(newBrowseLink, browseLink);
        }
        
        newBrowseLink.addEventListener('click', (e) => {
            console.log('Browse link clicked');
            e.preventDefault();
            e.stopPropagation(); // Prevent the dragDropArea click event
            imageUpload.click();
        });
    } else {
        console.error('Browse link not found in drag & drop area');
    }
    
    // Remove any existing event listeners by cloning and replacing
    const newDragDropArea = dragDropArea.cloneNode(true);
    if (dragDropArea.parentNode) {
        dragDropArea.parentNode.replaceChild(newDragDropArea, dragDropArea);
    }
    dragDropArea = newDragDropArea;
    
    // Re-add browse link event listener after cloning
    const newBrowseLink = dragDropArea.querySelector('.browse-link');
    if (newBrowseLink) {
        newBrowseLink.addEventListener('click', (e) => {
            console.log('Browse link clicked');
            e.preventDefault();
            e.stopPropagation(); // Prevent the dragDropArea click event
            imageUpload.click();
        });
    }
    
    dragDropArea.addEventListener('click', () => {
        console.log('Drag & drop area clicked');
        imageUpload.click();
    });
    
    // Drag events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dragDropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Add active class when dragging over
    ['dragenter', 'dragover'].forEach(eventName => {
        dragDropArea.addEventListener(eventName, () => {
            console.log('File dragged over');
            dragDropArea.classList.add('active');
        }, false);
    });
    
    // Remove active class when drag leaves
    ['dragleave', 'drop'].forEach(eventName => {
        dragDropArea.addEventListener(eventName, () => {
            console.log('File drag left or dropped');
            dragDropArea.classList.remove('active');
        }, false);
    });
    
    // Handle dropped files
    dragDropArea.addEventListener('drop', (e) => {
        console.log('File dropped');
        const files = e.dataTransfer.files;
        if (files.length) {
            // Update the file input with the dropped file
            imageUpload.files = files;
            
            // Show the user that the file was accepted
            const fileName = files[0]?.name || 'Unknown file';
            dragDropArea.innerHTML = `
                <i class='bx bx-check-circle' style="font-size: 2rem; margin-bottom: 10px; color: #28a745;"></i>
                <p>File selected: ${fileName}</p>
                <p class="small text-muted">Click here to choose a different file</p>
            `;
            
            // Process the file
            handleImageUpload({ target: { files } });
        }
    }, false);
    
    // Make sure the image upload input has its event listener
    imageUpload.addEventListener('change', handleImageUpload);
    
    console.log('Drag & drop setup complete');
}

// Handle image upload by converting to base64
function handleImageUpload(e) {
    const file = e.target?.files?.[0];
    if (!file) {
        console.error('No file selected');
            return;
        }
        
    console.log('Handling image upload:', file.name, file.type, `${(file.size / 1024).toFixed(2)} KB`);
    
    // Update the drag area to show the selected file
    if (dragDropArea) {
        const fileName = file.name;
        dragDropArea.innerHTML = `
            <i class='bx bx-check-circle' style="font-size: 2rem; margin-bottom: 10px; color: #28a745;"></i>
            <p>File selected: ${fileName}</p>
            <p class="small text-muted">Click here to choose a different file</p>
        `;
    }
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
        showToast('Please select an image file (JPG, PNG, GIF)', 'error');
        return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showToast('Image size should be less than 2MB', 'error');
        return;
    }
    
    // Show loading state in image preview
    if (imagePreview) {
        imagePreview.innerHTML = `
            <div style="text-align: center; color: #6c757d;">
                <div class="loading-spinner" style="margin: 20px auto;"></div>
                <p>Processing image...</p>
            </div>
        `;
    }
    
    // Convert to base64
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Store original image data for reference
            originalImageData = {
                src: e.target.result,
                width: img.width,
                height: img.height
            };
            
            console.log('Image loaded with dimensions:', img.width, 'x', img.height);
            
            // Display image
            if (imagePreview) {
                imagePreview.innerHTML = '';
                const imgElement = document.createElement('img');
                imgElement.src = e.target.result;
                imgElement.alt = 'Preview';
                imgElement.style.maxHeight = '300px';
                imagePreview.appendChild(imgElement);
            }
            
            showToast('Image uploaded successfully', 'success');
        };
        
        img.onerror = function() {
            console.error('Failed to process image');
            showToast('Failed to process image. Please try another file.', 'error');
            
            if (imagePreview) {
                imagePreview.innerHTML = `
                    <div style="text-align: center; color: #dc3545;">
                        <i class='bx bx-error-circle' style="font-size: 3rem;"></i>
                        <p>Failed to process image</p>
                    </div>
                `;
            }
        };
        
        img.src = e.target.result;
    };
    
    reader.onerror = function(error) {
        console.error('Error reading file:', error);
        showToast('Error reading file. Please try again.', 'error');
    };
    
    reader.readAsDataURL(file);
}

// Display image preview
function displayImage(src) {
    if (!imagePreview) return;
    
    // Create a new image element
    const img = new Image();
    
    // Set up onload handler
    img.onload = function() {
        // Set image preview
        imagePreview.innerHTML = '';
        imagePreview.appendChild(img);
        console.log('Image displayed successfully');
    };
    
    // Set error handler
    img.onerror = function() {
        console.error('Failed to load image:', src);
        
        // Set fallback image
        imagePreview.innerHTML = `
            <div style="text-align: center; color: #dc3545;">
                <i class='bx bx-image' style="font-size: 3rem;"></i>
                <p>Failed to load image</p>
            </div>
        `;
    };
    
    // Set alt and max-height for better display
    img.alt = 'Preview';
    img.style.maxHeight = '300px';
    
    // Set the source last (this triggers the load)
    img.src = src;
}

// Show carousel modal for add/edit
function showCarouselModal(itemId = null) {
    console.log('Opening carousel modal', itemId ? 'Edit mode' : 'Add mode');
    
    if (!carouselModal) {
        console.error('Carousel modal element not found');
        alert('Error: Could not open modal. Please refresh the page and try again.');
        return;
    }
    
    if (!modalTitle) {
        console.error('Modal title element not found');
        modalTitle = document.querySelector('#carouselModal .modal-header h5');
        if (!modalTitle) {
            console.error('Could not find modal title even with querySelector');
            return;
        }
    }
    
    modalTitle.textContent = itemId ? 'Edit Carousel Item' : 'Add New Item';
    currentItemId = itemId;
    
    // Reset form
    if (carouselForm) {
        carouselForm.reset();
        } else {
        console.error('Carousel form not found');
        carouselForm = document.getElementById('carouselForm');
        if (!carouselForm) {
            console.error('Could not find carousel form even with getElementById');
            return;
        }
    }
    
    if (!imagePreview) {
        console.error('Image preview element not found');
        imagePreview = document.getElementById('imagePreview');
    }
    
    if (imagePreview) {
        imagePreview.innerHTML = '';
    }
    
    originalImageData = null;
    
    // Reset the drag-drop area if it exists
    if (dragDropArea) {
        dragDropArea.innerHTML = `
            <i class='bx bx-cloud-upload' style="font-size: 2rem; margin-bottom: 10px;"></i>
            <p>Drag & drop an image here or <span class="browse-link">browse</span></p>
            <p class="small text-muted">Max file size: 2MB | Supported formats: JPG, PNG, GIF</p>
            `;
        } else {
        console.error('Drag drop area not found');
        dragDropArea = document.getElementById('dragDropArea');
    }
    
    // Check for required form fields
    const titleInput = document.getElementById('title');
    const headingInput = document.getElementById('heading');
    const subheadingInput = document.getElementById('subheading');
    const tagsInput = document.getElementById('tags');
    const orderInput = document.getElementById('order');
    const activeInput = document.getElementById('active');
    const carouselIdInput = document.getElementById('carouselId');
    
    // Get total number of slides
    const totalSlides = carouselItems.length;
    
    // Log which elements we found
    console.log('Form elements found:', {
        titleInput: !!titleInput,
        headingInput: !!headingInput,
        subheadingInput: !!subheadingInput,
        tagsInput: !!tagsInput,
        orderInput: !!orderInput,
        activeInput: !!activeInput,
        carouselIdInput: !!carouselIdInput,
        totalSlides
    });
    
    // Set hidden ID field
    if (carouselIdInput) {
        carouselIdInput.value = itemId || '';
    }
    
    // Update the order field label to show total slides
    const orderLabel = document.querySelector('label[for="order"]');
    if (orderLabel) {
        orderLabel.textContent = `Order (0-${totalSlides}${itemId ? '' : ' - new item'})`;
    }
    
    if (itemId) {
        // Edit mode - populate form with item data
        const item = carouselItems.find(item => item._id === itemId);
        console.log('Editing item:', item);
        
        if (item) {
            if (titleInput) titleInput.value = item.title || '';
            if (headingInput) headingInput.value = item.heading || '';
            if (subheadingInput) subheadingInput.value = item.subheading || '';
            if (tagsInput) tagsInput.value = item.tags?.join(', ') || '';
            if (orderInput) orderInput.value = item.order || 0;
            if (activeInput) activeInput.checked = item.active ?? true;
            
            // Show image preview if available and store for saving later
            if (item.image && imagePreview) {
                displayImage(item.image);
                originalImageData = { src: item.image };
            }
        } else {
            console.error('Item not found:', itemId);
        }
    } else {
        // Show placeholder image in preview
        if (imagePreview) {
            displayImage(placeholderImage);
        }
        
        // For new items, suggest the last position (end of carousel)
        if (orderInput) {
            orderInput.value = totalSlides;
        }
    }
    
    // Ensure event listeners are set up for the browse link
    setupDragDrop();
    
    // Force reflow to ensure CSS transitions work
    carouselModal.offsetHeight;
    
    showModal(carouselModal);
    
    // Double check modal visibility
    setTimeout(() => {
        if (!carouselModal.classList.contains('show')) {
            console.log('Modal not showing, attempting to fix...');
            carouselModal.classList.add('show');
        }
    }, 100);
}

// Save carousel item (create or update)
async function saveCarouselItem(e) {
    if (e) e.preventDefault(); // Prevent form submission
    
    console.log('saveCarouselItem function called');
    
    try {
        // Get form elements
        const titleInput = document.getElementById('title');
        const headingInput = document.getElementById('heading');
        const subheadingInput = document.getElementById('subheading');
        const tagsInput = document.getElementById('tags');
        const orderInput = document.getElementById('order');
        const activeInput = document.getElementById('active');
        
        if (!titleInput || !headingInput || !subheadingInput) {
            console.error('Required form elements not found');
            showToast('Form elements not found. Please refresh the page.', 'error');
            return;
        }
        
        // Validate form
        const title = titleInput.value.trim();
        const heading = headingInput.value.trim();
        const subheading = subheadingInput.value.trim();
        
        // Get image from originalImageData or placeholder
        const image = originalImageData?.src || placeholderImage;
        
        const tagsInputValue = tagsInput?.value.trim() || '';
        const order = parseInt(orderInput?.value || '0') || 0;
        const active = activeInput?.checked || false;
        
        console.log('Form values:', {
            title, heading, subheading, 
            image: image.substring(0, 30) + '...', // Don't log the entire base64 string
            tagsInputValue, order, active,
            currentItemId
        });
        
        if (!title || !heading || !subheading) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        // Parse tags
        const tags = tagsInputValue ? tagsInputValue.split(',').map(tag => tag.trim()) : [];
        
        // Prepare data
        const data = {
            title,
            heading,
            subheading,
            image,
            tags,
            order,
            active
        };
        
        console.log(`Preparing to ${currentItemId ? 'update' : 'create'} carousel item`);
        
        // Determine if creating or updating
        let endpoint, method;
        if (currentItemId) {
            endpoint = `/api/carousel/${currentItemId}`;
            method = 'PUT';
            console.log(`Updating carousel item ${currentItemId}`);
        } else {
            endpoint = '/api/carousel';
            method = 'POST';
            console.log('Creating new carousel item');
        }
        
        // Sanitize data to ensure clean JSON
        const sanitizedData = {
            title: data.title,
            heading: data.heading,
            subheading: data.subheading,
            image: data.image,
            tags: Array.isArray(data.tags) ? data.tags : [],
            order: typeof data.order === 'number' ? data.order : parseInt(data.order) || 0,
            active: Boolean(data.active)
        };
        
        // Log size for debugging
        const imageLength = sanitizedData.image ? sanitizedData.image.length : 0;
        console.log(`Image data length: ${imageLength} characters`);
        
        // Log all data fields except image (too large)
        console.log('Sending data:', {
            title: sanitizedData.title,
            heading: sanitizedData.heading,
            subheading: sanitizedData.subheading,
            imageLength,
            tags: sanitizedData.tags,
            order: sanitizedData.order,
            active: sanitizedData.active
        });
        
        // Save to API
        try {
            console.log(`Sending ${method} request to ${endpoint}`);
            
            // Don't stringify the data here, let the API request function handle it
            const response = await window.AdminAuth.apiRequest(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: sanitizedData // Send the object directly, not JSON string
            });
            
            console.log('API response:', response);
            
            // Hide modal and reload data
            hideModal(carouselModal);
            showToast(currentItemId ? 'Carousel item updated successfully' : 'New carousel item added successfully', 'success');
            
            // Reload carousel items
            await loadCarouselItems();
            
        } catch (apiError) {
            console.error('API Error:', apiError);
            showToast(`API Error: ${apiError.message || 'Unknown error'}`, 'error');
            throw apiError;
        }
        
    } catch (error) {
        console.error('Error saving carousel item:', error);
        showToast(`Failed to save: ${error.message || 'Unknown error'}`, 'error');
    }
}

// Edit carousel item
function editCarouselItem(itemId) {
    if (!itemId) {
        console.error('No item ID provided for editing');
        return;
    }
    
    console.log('Editing carousel item:', itemId);
    showCarouselModal(itemId);
}

// Preview carousel item
function previewCarouselItem(itemId) {
    console.log('Previewing carousel item', itemId);
    
    // Find the item index in the allCarouselItems array
    currentPreviewIndex = allCarouselItems.findIndex(item => item._id === itemId);
    if (currentPreviewIndex === -1) {
        console.error('Carousel item not found for preview', itemId);
        return;
    }
    
    updatePreviewContent();
    
    // Display the preview modal
    $('#previewModal').modal('show');
    
    // Set up event listeners for navigation
    document.getElementById('prevItemBtn').addEventListener('click', navigateToPrevItem);
    document.getElementById('nextItemBtn').addEventListener('click', navigateToNextItem);
    document.getElementById('previewEditBtn').addEventListener('click', () => {
        $('#previewModal').modal('hide');
        editCarouselItem(allCarouselItems[currentPreviewIndex]._id);
    });
    
    // Create indicator dots
    createPreviewIndicators();
}

// Function to update preview content based on current index
function updatePreviewContent() {
    const item = allCarouselItems[currentPreviewIndex];
    
    // Update preview elements
    document.getElementById('preview-img').src = item.image || '/admin/assets/placeholder-image.jpg';
    document.getElementById('preview-heading').textContent = item.heading || '';
    document.getElementById('preview-title').textContent = item.title || 'No Title';
    document.getElementById('preview-subheading').textContent = item.subheading || '';
    document.getElementById('preview-order').textContent = item.order;
    document.getElementById('preview-status').textContent = item.active ? 'Active' : 'Inactive';
    document.getElementById('preview-tags').textContent = item.tags || 'No tags';
    
    // Update modal title
    document.getElementById('previewModalLabel').textContent = `Carousel Preview (${currentPreviewIndex + 1} of ${allCarouselItems.length})`;
    
    // Update navigation buttons state
    document.getElementById('prevItemBtn').disabled = currentPreviewIndex === 0;
    document.getElementById('nextItemBtn').disabled = currentPreviewIndex === allCarouselItems.length - 1;
    
    // Update active indicator
    updateActiveIndicator();
}

// Navigation functions
function navigateToPrevItem() {
    if (currentPreviewIndex > 0) {
        currentPreviewIndex--;
        updatePreviewContent();
    }
}

function navigateToNextItem() {
    if (currentPreviewIndex < allCarouselItems.length - 1) {
        currentPreviewIndex++;
        updatePreviewContent();
    }
}

// Create indicator dots
function createPreviewIndicators() {
    const indicatorsContainer = document.getElementById('carouselIndicators');
    indicatorsContainer.innerHTML = '';
    
    // Only create indicators if we have more than 1 item
    if (allCarouselItems.length > 1) {
        allCarouselItems.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'carousel-dot' + (index === currentPreviewIndex ? ' active' : '');
            dot.dataset.index = index;
            dot.addEventListener('click', () => {
                currentPreviewIndex = parseInt(dot.dataset.index);
                updatePreviewContent();
            });
            indicatorsContainer.appendChild(dot);
        });
    }
}

// Update active indicator
function updateActiveIndicator() {
    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, index) => {
        if (index === currentPreviewIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Show delete confirmation modal
function showDeleteConfirmation(itemId) {
    deleteItemId = itemId;
    showModal(confirmModal);
}

// Delete carousel item
async function deleteCarouselItem() {
    if (!deleteItemId) {
        console.error('No delete item ID set');
        return;
    }
    
    try {
        console.log('Deleting carousel item:', deleteItemId);
        
        const response = await window.AdminAuth.apiRequest(`/api/carousel/${deleteItemId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Delete response:', response);
        
        // Hide confirmation modal
        const confirmModal = document.getElementById('confirmModal');
        if (confirmModal) {
            hideModal(confirmModal);
        }
        
            showToast('Carousel item deleted successfully', 'success');
            
        // Reload carousel items
        await loadCarouselItems();
        
    } catch (error) {
        console.error('Error deleting carousel item:', error);
        showToast(`Failed to delete: ${error.message || 'Unknown error'}`, 'error');
    }
    
    // Reset delete item ID
    deleteItemId = null;
}

// Show reorder modal
function showReorderModal() {
    if (carouselItems.length < 2) {
        showToast('You need at least two items to reorder', 'info');
        return;
    }
    
    // Populate sortable list
    sortableItems.innerHTML = '';
    
    carouselItems.forEach(item => {
        const listItem = document.createElement('li');
        listItem.className = 'sortable-item';
        listItem.dataset.id = item._id;
        
        listItem.innerHTML = `
            <div class="handle">
                <i class='bx bx-menu'></i>
            </div>
            <div class="item-image">
                <img src="${item.image || placeholderImage}" alt="${item.title}" onerror="this.src='${placeholderImage}'">
            </div>
            <div class="item-info">
                <h5>${item.title}</h5>
                <p>${item.heading}</p>
            </div>
            <div class="item-status">
                <span class="badge ${item.active ? 'bg-success' : 'bg-secondary'}">
                    ${item.active ? 'Active' : 'Inactive'}
                </span>
            </div>
        `;
        
        sortableItems.appendChild(listItem);
    });
    
    // Initialize sortable
    if (typeof Sortable !== 'undefined') {
        new Sortable(sortableItems, {
            animation: 150,
            handle: '.handle',
            ghostClass: 'sortable-ghost',
            dragClass: 'dragging'
        });
        } else {
        console.warn('Sortable library not loaded');
    }
    
    showModal(reorderModal);
}

// Save reordered carousel items
async function saveItemsOrder() {
    try {
        if (!sortableItems) {
            console.error('Sortable items element not found');
            return;
        }
        
        // Get all items
        const itemElements = sortableItems.querySelectorAll('li');
        if (itemElements.length === 0) {
            showToast('No items to reorder', 'error');
            return;
        }
        
        // Create ordered array of item ids
        const items = Array.from(itemElements).map((element, index) => {
            return {
                id: element.getAttribute('data-id'),
                order: index
            };
        });
        
        console.log('Saving carousel order:', items);
        
        // Save to API
        try {
            const response = await window.AdminAuth.apiRequest('/api/carousel-order', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ items })
            });
            
            console.log('Order update response:', response);
            
            // Hide modal and reload data
            const reorderModal = document.getElementById('reorderModal');
            if (reorderModal) hideModal(reorderModal);
            
            showToast('Carousel order updated successfully', 'success');
            
            // Reload carousel items
            await loadCarouselItems();
        } catch (apiError) {
            console.error('API error when saving order:', apiError);
            showToast(`API Error: ${apiError.message || 'Unknown error'}`, 'error');
        }
        
    } catch (error) {
        console.error('Error saving carousel items order:', error);
        showToast(`Failed to update order: ${error.message || 'Unknown error'}`, 'error');
    }
}

// Show a modal
function showModal(modal) {
    if (!modal) {
        console.error('Cannot show modal: modal element is null');
        return;
    }
    
    console.log('Showing modal:', modal.id);
    
    // Ensure the modal has the necessary classes
    modal.classList.add('show');
    
    // Add a backdrop if it doesn't exist
    let backdrop = modal.querySelector('.modal-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        modal.appendChild(backdrop);
    }
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Add click event to backdrop to close modal
    backdrop.addEventListener('click', function(e) {
        if (e.target === backdrop) {
            hideModal(modal);
        }
    });
    
    // Add escape key handler
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            hideModal(modal);
            // Remove this event listener after hiding
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

// Hide a modal
function hideModal(modal) {
    if (!modal) {
        console.error('Cannot hide modal: modal element is null');
        return;
    }
    
    console.log('Hiding modal:', modal.id);
    modal.classList.remove('show');
    
    // Restore body scrolling
    document.body.style.overflow = '';
    
    // Reset current item ID if closing the carousel modal
    if (modal === carouselModal) {
        currentItemId = null;
    }
    
    // Reset delete item ID if closing the confirm modal
    if (modal === confirmModal) {
        deleteItemId = null;
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    // Set message
    toastMessage.textContent = message;
    
    // Set type
    toast.className = 'toast';
    toast.classList.add(`toast-${type}`);
    
    // Set icon
    const toastIcon = toast.querySelector('.toast-icon');
    if (toastIcon) {
        toastIcon.className = 'bx toast-icon';
        
        switch (type) {
            case 'success':
                toastIcon.classList.add('bx-check-circle');
                break;
            case 'error':
                toastIcon.classList.add('bx-x-circle');
                break;
            case 'warning':
                toastIcon.classList.add('bx-error');
                break;
            default:
                toastIcon.classList.add('bx-info-circle');
        }
    }
    
    // Show toast
    toast.classList.add('show');
    
    // Animate progress bar
    const progressBar = toast.querySelector('.toast-progress-bar');
    if (progressBar) {
        progressBar.style.width = '0%';
        setTimeout(() => {
            progressBar.style.width = '100%';
        }, 100);
    }
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
} 