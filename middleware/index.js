const { notFound, errorHandler } = require("./errorMiddleware");
const protect = require("./authMiddleware");
const { upload, handleMulterError, getFileCategory, formatFileSize, uploadsDir } = require("./uploadMiddleware");

module.exports = { 
  notFound, 
  errorHandler, 
  protect,
  upload,
  handleMulterError,
  getFileCategory,
  formatFileSize,
  uploadsDir,
};
