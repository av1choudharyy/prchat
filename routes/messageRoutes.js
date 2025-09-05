const express = require("express");
const {
  sendMessage,
  allMessages,
  reactToMessage
} = require("../controllers/messageControllers");

const { protect } = require("../middleware");

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.route("/:chatId").get(protect, allMessages); // Fetch all messages for a single chat
router.put("/:messageId/react", protect, reactToMessage);

module.exports = router;