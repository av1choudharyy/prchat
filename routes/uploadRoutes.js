const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { upload } = require('../config/localStorageConfig');
const protect = require('../middleware/authMiddleware');

// Upload single file endpoint
router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('File:', req.file);

    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Determine media type based on mimetype
    let mediaType = 'file';
    let folderPath = 'files';

    if (req.file.mimetype.startsWith('image/')) {
      mediaType = 'image';
      folderPath = 'images';
    } else if (req.file.mimetype.startsWith('video/')) {
      mediaType = 'video';
      folderPath = 'videos';
    }

    // Build the URL path for accessing the file
    const fileUrl = `/uploads/${folderPath}/${req.file.filename}`;

    // Return file information
    res.json({
      success: true,
      fileData: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        mediaType: mediaType
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message
    });
  }
});

// Delete uploaded file endpoint (optional)
router.delete('/:filename', protect, async (req, res) => {
  try {
    const { filename } = req.params;

    // Try to find and delete the file in all directories
    const directories = ['images', 'videos', 'files'];
    let fileDeleted = false;

    for (const dir of directories) {
      const filePath = path.join(__dirname, '..', 'uploads', dir, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        fileDeleted = true;
        break;
      }
    }

    if (!fileDeleted) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'File deletion failed',
      error: error.message
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 50MB.' });
    }
    return res.status(400).json({ message: error.message });
  } else if (error) {
    return res.status(400).json({ message: error.message });
  }
  next();
});

module.exports = router;