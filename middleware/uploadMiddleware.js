const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");
const { v4: uuidv4 } = require("uuid");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
fs.ensureDirSync(uploadsDir);

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create date-based subdirectory
    const dateDir = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const fullPath = path.join(uploadsDir, dateDir);
    fs.ensureDirSync(fullPath);
    cb(null, fullPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp|svg/;
  const allowedDocTypes = /pdf|doc|docx|txt|rtf|xls|xlsx|ppt|pptx/;
  const allowedArchiveTypes = /zip|rar|7z|tar|gz/;
  const allowedVideoTypes = /mp4|avi|mov|wmv|flv|webm/;
  const allowedAudioTypes = /mp3|wav|flac|aac|ogg/;
  
  const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
  const mimeType = file.mimetype.toLowerCase();
  
  // Check if file type is allowed
  const isAllowedType = 
    allowedImageTypes.test(fileExtension) ||
    allowedDocTypes.test(fileExtension) ||
    allowedArchiveTypes.test(fileExtension) ||
    allowedVideoTypes.test(fileExtension) ||
    allowedAudioTypes.test(fileExtension) ||
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/') ||
    mimeType === 'application/pdf';
  
  if (isAllowedType) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${fileExtension}. Allowed types: images, documents, archives, videos, audio files.`), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 5 // Max 5 files per upload
  }
});

// Error handling middleware
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 5 files per upload.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (error.message.includes('File type not allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Helper function to get file type category
const getFileCategory = (mimeType, originalName) => {
  const ext = path.extname(originalName).toLowerCase();
  
  if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(ext)) {
    return 'image';
  }
  
  if (mimeType.startsWith('video/') || /\.(mp4|avi|mov|wmv|flv|webm)$/i.test(ext)) {
    return 'video';
  }
  
  if (mimeType.startsWith('audio/') || /\.(mp3|wav|flac|aac|ogg)$/i.test(ext)) {
    return 'audio';
  }
  
  return 'file';
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = {
  upload,
  handleMulterError,
  getFileCategory,
  formatFileSize,
  uploadsDir
};
