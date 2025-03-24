const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const { v4: uuidv4 } = require('uuid');

/**
 * Configure file upload middleware
 */
const uploadMiddleware = fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    useTempFiles: true,
    tempFileDir: path.join(__dirname, '../temp/'),
    abortOnLimit: true,
    createParentPath: true,
    safeFileNames: true,
    preserveExtension: true,
    debug: process.env.NODE_ENV === 'development'
});

/**
 * Upload a file to the server
 * @param {Object} file - The file object from express-fileupload
 * @param {String} subdir - Subdirectory to store the file in (e.g., 'carousel', 'tours')
 * @returns {Promise<String>} - The path to the uploaded file
 */
const uploadFile = async (file, subdir = 'uploads') => {
    if (!file) throw new Error('No file provided');
    
    // Create directory if not exists
    const uploadDir = path.join(__dirname, '../uploads', subdir);
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Generate unique filename
    const fileExt = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Move file to upload directory
    await file.mv(filePath);
    
    // Return path relative to the server root
    return `/uploads/${subdir}/${fileName}`;
};

/**
 * Delete a file from the server
 * @param {String} filePath - The path to the file to delete
 * @returns {Promise<void>}
 */
const deleteFile = async (filePath) => {
    if (!filePath) return;
    
    try {
        // Remove leading slash if present
        const relativePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        const fullPath = path.join(__dirname, '..', relativePath);
        
        // Check if file exists
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};

/**
 * Route handler for uploading files
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleFileUpload = async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files were uploaded'
            });
        }
        
        // Get file and subdirectory
        const file = req.files.file || req.files.image;
        const subdir = req.body.directory || 'uploads';
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'
            });
        }
        
        // Upload file
        const fileUrl = await uploadFile(file, subdir);
        
        res.json({
            success: true,
            message: 'File uploaded successfully',
            fileUrl
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload file'
        });
    }
};

module.exports = {
    uploadMiddleware,
    uploadFile,
    deleteFile,
    handleFileUpload
}; 