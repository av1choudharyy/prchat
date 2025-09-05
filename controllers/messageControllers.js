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

const searchMessages = async (req, res) => {
  const { text, sender, fromDate, toDate } = req.query;

  if (!text && !sender && !fromDate && !toDate) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Please provide at least one search filter",
    });
  }

  try {
    const filters = { chat: req.params.chatId };

    // search by text
    if (text) {
      filters.content = { $regex: text, $options: "i" }; // case-insensitive match
    }

    // filter by sender
    if (sender) {
      filters.sender = sender;
    }

    // filter by date range
    if (fromDate || toDate) {
      filters.createdAt = {};
      if (fromDate) filters.createdAt.$gte = new Date(fromDate);
      if (toDate) filters.createdAt.$lte = new Date(toDate);
    }

    const results = await Message.find(filters)
      .populate("sender", "name pic email")
      .populate("chat");

    // Optionally highlight search term in results
    if (text) {
      results.forEach((msg) => {
        msg._doc.highlightedContent = msg.content.replace(
          new RegExp(`(${text})`, "gi"),
          "**$1**" // highlight keyword in bold (frontend can render as highlighted)
        );
      });
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to search messages",
    });
  }
};

const addReaction = async (req, res) => {
  const { emoji } = req.body;
  const { messageId } = req.params;

  if (!emoji) {
    return res.status(400).json({ message: "Emoji is required" });
  }

  try {
    let message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingReactionIndex > -1) {
      message.reactions[existingReactionIndex].emoji = emoji;
    } else {
      message.reactions.push({ user: req.user._id, emoji });
    }

    await message.save();
    message = await message.populate("reactions.user", "name pic");

    res.status(200).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add reaction" });
  }
};

const removeReaction = async (req, res) => {
  const { messageId } = req.params;

  try {
    let message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    message.reactions = message.reactions.filter(
      (r) => r.user.toString() !== req.user._id.toString()
    );

    await message.save();
    message = await message.populate("reactions.user", "name pic");

    res.status(200).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to remove reaction" });
  }
};

module.exports = { sendMessage, allMessages, searchMessages, addReaction, removeReaction };
