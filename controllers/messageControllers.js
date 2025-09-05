const { Message, Chat } = require("../models");

// @description     Create New Message
// @route           POST /api/Message/
// @access          Protected

const sendMessage = async (req, res) => {
  const { content, chatId, replyTo } = req.body;

  if (!content && !req.file) {
    return res.status(400).send("Invalid data passed into request");
  }

  let newMessage = {
    sender: req.user._id,
    content: content || "",
    chat: chatId,
    file: req.file ? `/uploads/${req.file.filename}` : null,
    fileType: req.file
      ? req.file.mimetype.startsWith("image")
        ? "image"
        : "file"
      : null,
    replyTo: replyTo || null, // ✅ support replies
  };

  try {
    let message = await Message.create(newMessage);

    // ✅ populate sender
    message = await message.populate("sender", "name pic");

    // ✅ populate chat and its users
    message = await message.populate({
      path: "chat",
      populate: { path: "users", select: "name email pic" },
    });

    // ✅ populate replied-to message
    if (message.replyTo) {
      message = await message.populate({
        path: "replyTo",
        populate: { path: "sender", select: "name pic" },
      });
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// @description     Get all Messages
// @route           GET /api/Message/:chatId
// @access          Protected
const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat")
      .populate({
        path: "replyTo", // ✅ populate replyTo here as well
        populate: { path: "sender", select: "name pic" },
      });

    res.status(200).json(messages);
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to fetch all Messages",
    });
  }
};

module.exports = { sendMessage, allMessages };
