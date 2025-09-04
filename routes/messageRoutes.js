const express = require("express");
const {
  sendMessage,
  allMessages,
  forwardMessage,
  pinMessage,
  unpinMessage,
  deleteMessage,
  searchMessages
} = require("../controllers/messageControllers");

const { protect } = require("../middleware");
const router = express.Router();

router.route("/").post(protect, sendMessage);
router.route("/:chatId").get(protect, allMessages); // Fetch all messages for a single chat
router.route("/forward").post(protect, forwardMessage);
router.route("/:messageId/pin").put(protect, pinMessage);
router.route("/:messageId/unpin").put(protect, unpinMessage);
router.route("/:messageId").delete(protect, deleteMessage);
router.route("/search/:chatId").get(protect, searchMessages);

module.exports = router;
