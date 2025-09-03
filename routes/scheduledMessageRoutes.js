const express = require("express");
const {
    createScheduledMessage,
    getScheduledMessages,
    cancelScheduledMessage,
} = require("../controllers/scheduledMessageControllers");

const { protect } = require("../middleware");

const router = express.Router();

router.route("/").post(protect, createScheduledMessage);
router.route("/:chatId").get(protect, getScheduledMessages);
router.route("/cancel/:messageId").delete(protect, cancelScheduledMessage);

module.exports = router;
