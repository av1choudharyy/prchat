const express = require("express");
const {
  sendMessage,
  allMessages,
  voteOnPoll,
  markRead,
  editMessage,
  deleteMessage,
} = require("../controllers/messageControllers");

const { protect } = require("../middleware");

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.route("/:chatId").get(protect, allMessages); // Fetch all messages for a single chat
router.route("/:messageId/vote").post(protect, voteOnPoll);
router.route("/:chatId/read").post(protect, markRead);
router.route("/:messageId").put(protect, editMessage).delete(protect, deleteMessage);

module.exports = router;
