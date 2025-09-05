const { Message, Chat } = require("../models");

// @description     Create New Message
// @route           POST /api/Message/
// @access          Protected

// Create New Message
const sendMessage = async (req, res) => {
  const { content, chatId, replyTo } = req.body;
  if (!content || !chatId) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Invalid data passed into request",
    });
  }
  try {
    let message = await Message.create({
      sender: req.user._id, // Logged in user id,
      content,
      chat: chatId,
      replyTo: replyTo || null,
    });

    message = await Message.findById(message._id)
      .populate("sender", "name pic email")
      .populate("chat")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "name pic" },
      });
     // Update latest message
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    req.io.to(chatId.toString()).emit("new message", message);

    return res.status(201).json(message); // Send message we just created now
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to create New Message",
    });
  }
};

// @description     Get all Messages
// @route           GET /api/Message/:chatId
// @access          Protected
// Get all Messages
const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "name pic" },
      })
      .populate("reactions.user", "name pic");
    res.status(200).json(messages);
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to fetch all Messages",
    });
  }
};

// Add / Remove emoji reaction
const addReaction = async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    if (!messageId || !emoji) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "MessageId and emoji are required",
      });
    }
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Message not found",
      });
    }
    const existing = message.reactions.find(
      (r) =>
        r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );
    if (existing) {
      message.reactions = message.reactions.filter(
        (r) =>
          !(
            r.user.toString() === req.user._id.toString() &&
            r.emoji === emoji
          )
      );
    } else {
      message.reactions.push({ user: req.user._id, emoji });
    }
    await message.save();
    const populated = await Message.findById(message._id)
      .populate("sender", "name pic email")
      .populate("chat")
      .populate("reactions.user", "name pic");
    req.io.to(message.chat._id.toString()).emit("reaction added", populated);
    res.json(populated);
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message,
    });
  }
};

module.exports = { sendMessage, allMessages, addReaction };
