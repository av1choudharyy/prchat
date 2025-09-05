const express = require("express");
const router = express.Router();
const { protect, upload, handleMulterError } = require("../middleware");
const { uploadFiles, downloadFile, previewFile, deleteFile } = require("../controllers/fileControllers");

// @route   POST /api/files/upload
// @desc    Upload files and create message
// @access  Protected
router.post(
  "/upload",
  protect,
  upload.array('files', 5), // Allow up to 5 files
  handleMulterError,
  uploadFiles
);

// @route   GET /api/files/download/:filename
// @desc    Download file
// @access  Protected
router.get("/download/:filename", protect, downloadFile);

// @route   GET /api/files/preview/:filename
// @desc    Get file preview/thumbnail
// @access  Protected
router.get("/preview/:filename", protect, previewFile);

// @route   DELETE /api/files/:messageId
// @desc    Delete file message
// @access  Protected
router.delete("/:messageId", protect, deleteFile);

module.exports = router;
