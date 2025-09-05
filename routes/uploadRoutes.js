const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { protect } = require("../middleware");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_");
    cb(null, `${timestamp}-${safeName}`);
  },
});

const fileFilter = (req, file, cb) => {
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 25 * 1024 * 1024 } });

router.post("/single", protect, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  const publicUrl = `/uploads/${req.file.filename}`;
  return res.status(201).json({
    success: true,
    url: publicUrl,
    name: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
  });
});

module.exports = router;


