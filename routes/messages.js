const express = require("express");
const multer = require("multer");
const path = require("path");
const Message = require("../models/Message");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.post("/upload", upload.single("file"), async (req, res) => {
  const newMsg = new Message({
    sender: req.body.sender,
    text: req.file.originalname,
    fileUrl: `/uploads/${req.file.filename}`
  });
  await newMsg.save();
  res.json(newMsg);
});

router.get("/search", async (req, res) => {
  const { q } = req.query;
  const results = await Message.find({ text: { $regex: q, $options: "i" } });
  res.json(results);
});

module.exports = router;
