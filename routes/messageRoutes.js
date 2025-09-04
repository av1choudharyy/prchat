const express = require("express");
const {
  sendMessage,
  allMessages,
  reactToMessage, // ✅ ADD this controller
} = require("../controllers/messageControllers");

const { protect } = require("../middleware");

const router = express.Router();

// ✅ Message send
router.route("/").post(protect, sendMessage);

// ✅ Get all messages in a chat
router.route("/:chatId").get(protect, allMessages);

// ✅ React to a message (New route)
router.route("/react").post(protect, reactToMessage);

module.exports = router;

// const express = require("express");
// const {
//   sendMessage,
//   allMessages,
// } = require("../controllers/messageControllers");

// const { protect } = require("../middleware");

// const router = express.Router();

// router.route("/").post(protect, sendMessage);
// router.route("/:chatId").get(protect, allMessages); // Fetch all messages for a single chat

// module.exports = router;
