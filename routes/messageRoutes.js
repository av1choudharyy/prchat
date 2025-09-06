const express = require("express");
const {
  sendMessage,
  allMessages,
  searchMessages,
  advancedSearchMessages,
  reactToMessage,
  pinMessage,
  deleteMessage,
} = require("../controllers/messageControllers");

const { protect } = require("../middleware");

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.route("/:chatId").get(protect, allMessages); // Fetch all messages for a single chat
router.route("/search/:chatId").get(protect, searchMessages); // Search messages in a chat
router.route("/advanced-search/:chatId").post(protect, advancedSearchMessages); // Advanced search
router.route("/:messageId/react").put(protect, reactToMessage); // React to message
router.route("/:messageId/pin").put(protect, pinMessage); // Pin/unpin message
router.route("/:messageId").delete(protect, deleteMessage); // Delete message

module.exports = router;
