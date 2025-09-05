const express = require("express");
<<<<<<< HEAD
const {
  sendMessage,
  allMessages,
} = require("../controllers/messageControllers");

=======
const { sendMessage, allMessages, forwardMessage } = require("../controllers/messageControllers");
>>>>>>> 2818aa101d1ec36cc2a78b16e93fce92f1488420
const { protect } = require("../middleware");

const router = express.Router();

router.route("/").post(protect, sendMessage);
<<<<<<< HEAD
router.route("/:chatId").get(protect, allMessages); // Fetch all messages for a single chat
=======
router.route("/:chatId").get(protect, allMessages);
router.route("/forward").post(protect, forwardMessage);
>>>>>>> 2818aa101d1ec36cc2a78b16e93fce92f1488420

module.exports = router;
