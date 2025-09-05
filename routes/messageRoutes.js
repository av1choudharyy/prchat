const express = require("express");
const {
  sendMessage,
  allMessages,
  searchMessages,
  addReaction,
  removeReaction,
} = require("../controllers/messageControllers");

const { protect } = require("../middleware");

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.route("/:chatId").get(protect, allMessages); // Fetch all messages for a single chat
router.route("/:chatId/search").get(protect, searchMessages);
router.route("/:messageId/reaction").post(protect, addReaction); // Add/update reaction
router.route("/:messageId/reaction").delete(protect, removeReaction); // Remove reaction

module.exports = router;
