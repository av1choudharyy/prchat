const express = require("express");
const protect = require("../middleware/authMiddleware");
const { sendMessage, allMessages } = require("../controllers/messageControllers");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.route("/").post(protect, upload.single('file'), sendMessage);
router.route("/:chatId").get(protect, allMessages);

module.exports = router;
