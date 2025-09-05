const express = require("express");
const {
  sendMessage,
  allMessages,
  forwardMessage,
  fileMessage
} = require("../controllers/messageControllers");

const { protect } = require("../middleware");

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.route("/:chatId").get(protect, allMessages); // Fetch all messages for a single chat
router.route("/forwardMessage").post(protect, forwardMessage);
router.route("/sendFile").post(protect, fileMessage);

module.exports = router;
