const express = require("express");
const {
  sendMessage,
  allMessages,
  searchMessages,
} = require("../controllers/messageControllers");

const { protect } = require("../middleware");

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.route("/:chatId").get(protect, allMessages); // Fetch all messages for a single chat
router.route("/search/:chatId").get(protect, searchMessages); // Search messages in a chat

module.exports = router;
