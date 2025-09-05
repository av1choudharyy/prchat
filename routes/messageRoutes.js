const express = require("express");
const { sendMessage, allMessages, searchMessages } = require("../controllers/messageControllers");
const { protect } = require("../middleware");

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.get("/search", protect, searchMessages);
router.route("/:chatId").get(protect, allMessages);


module.exports = router;
