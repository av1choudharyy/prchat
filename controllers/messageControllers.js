const { Message, Chat } = require("../models");

// @description     Create New Message
// @route           POST /api/message/
// @access          Protected
const sendMessage = async (req, res) => {
  const { content, chatId, replyTo } = req.body; // replyTo included

  if (!content || !chatId) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Invalid data passed into request",
    });
  }

  try {
    // Create a new message
    let message = await Message.create({
      sender: req.user._id,
      content,
      chat: chatId,
      replyTo: replyTo || null,
    });

    message = await (
      await message.populate("sender", "name pic")
    )
      .populate({
        path: "chat",
        select: "chatName isGroupChat users",
        model: "Chat",
        populate: { path: "users", select: "name email pic", model: "User" },
      })
      .populate({
        path: "replyTo",
        select: "content sender",
        populate: { path: "sender", select: "name pic", model: "User" },
      })
      .populate({
        path: "reactions.user",
        select: "name pic",
        model: "User",
      });

    // Update latest message
    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    return res.status(201).json(message);
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to create New Message",
    });
  }
};

// @description     Get all Messages
// @route           GET /api/message/:chatId
// @access          Protected
const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat")
      .populate({
        path: "replyTo",
        select: "content sender",
        populate: { path: "sender", select: "name pic", model: "User" },
      })
      .populate({
        path: "reactions.user",
        select: "name pic",
        model: "User",
      });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Fetch messages error:", error);
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to fetch all Messages",
    });
  }
};

// @description     React to a Message
// @route           POST /api/message/:messageId/react
// @access          Protected
const reactToMessage = async (req, res) => {
  const { emoji } = req.body;

  try {
    let message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user already reacted
    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingReactionIndex >= 0) {
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        // Remove reaction if same emoji is clicked again
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Update reaction emoji
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      // Add new reaction
      message.reactions.push({ user: req.user._id, emoji });
    }

    await message.save();

    message = await message
      .populate("sender", "name pic")
      .populate("reactions.user", "name pic");

    res.json(message);
  } catch (error) {
    console.error("React to message error:", error);
    res.status(400).json({ message: "Failed to react to message" });
  }
};

module.exports = { sendMessage, allMessages, reactToMessage };
