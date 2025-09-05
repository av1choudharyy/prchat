const { Message, Chat } = require("../models");

// @description     Create New Message
// @route           POST /api/Message/
// @access          Protected
const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

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
      sender: req.user._id, // Logged in user id,
      content,
      chat: chatId,
    });

    message = await (
      await message.populate("sender", "name pic")
    ).populate({
      path: "chat",
      select: "chatName isGroupChat users",
      model: "Chat",
      populate: { path: "users", select: "name email pic", model: "User" },
    });

    // Update latest message
    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

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
const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");

    res.status(200).json(messages);
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to fetch all Messages",
    });
  }
};
// @description     Add emoji reaction to a message
// @route           PUT /api/message/:messageId/react
// @access          Protected
const reactToMessage = async (req, res) => {
  const { emoji } = req.body;
  const { messageId } = req.params;

  if (!emoji) {
    return res.status(400).json({ message: "Emoji is required" });
  }

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user already reacted
    const existingIndex = message.reactions.findIndex(
      (r) => r.reactedBy.toString() === req.user._id.toString()
    );

    if (existingIndex !== -1) {
      // Update existing reaction
      message.reactions[existingIndex].emoji = emoji;
      message.reactions[existingIndex].reactedAt = Date.now();
    } else {
      // Add new reaction
      message.reactions.push({
        emoji,
        reactedBy: req.user._id,
      });
    }

    await message.save();

    const updatedMessage = await Message.findById(message._id)
      .populate("sender", "name pic")
      .populate("reactions.reactedBy", "name pic");

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.error("Reaction error:", error);
    res.status(400).json({ message: "Failed to react to message" });
  }
};
module.exports = { sendMessage, allMessages,reactToMessage };