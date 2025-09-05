const express = require("express");
const multer = require("multer");
const {
  sendMessage,
  allMessages,
} = require("../controllers/messageControllers");

const { protect } = require("../middleware");
const upload = multer();

const router = express.Router();

router.route("/").post(protect, upload.none(), sendMessage);
router.route("/:chatId").get(protect, allMessages); // Fetch all messages for a single chat
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
