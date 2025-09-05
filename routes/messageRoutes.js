const express = require("express");
const {
  sendMessage,
  allMessages,
  reactToMessage,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware");

const router = express.Router();

router.route("/").post(protect, sendMessage);

router.route("/:chatId").get(protect, allMessages);

router.route("/:messageId/react").post(protect, reactToMessage);

module.exports = router;
