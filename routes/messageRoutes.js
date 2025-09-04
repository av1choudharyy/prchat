const express = require("express");
const { sendMessage, allMessages, forwardMessage } = require("../controllers/messageControllers");
const { protect } = require("../middleware");

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.route("/:chatId").get(protect, allMessages);
router.route("/forward").post(protect, forwardMessage);

module.exports = router;
