

const { Message, Chat } = require("../models");

// @description     Create New Message
// @route           POST /api/Message/
// @access          Protected
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
    // Create a new message
    let message = await Message.create({
      sender: req.user._id, // Logged in user id,
      content,
      chat: chatId,
      replyTo: replyTo || null,
    });

    message = await (
      await message.populate("sender", "name pic")
    ).populate({
      path: "chat",
      select: "chatName isGroupChat users",
      model: "Chat",
      populate: { path: "users", select: "name email pic", model: "User" },
    });

    // If it's a reply, populate the replyTo message
    if (message.replyTo) {
      message = await message.populate("replyTo", "content sender");
      message = await message.populate("replyTo.sender", "name");
    }

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
      .populate("chat")
      .populate("replyTo", "content sender")
      .populate("replyTo.sender", "name");

    res.status(200).json(messages);
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to fetch all Messages",
    });
  }
};

// @description     Search Messages in a chat
// @route           GET /api/message/search/:chatId
// @access          Protected
const searchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { keyword, startDate, endDate } = req.query;

    // Build search query
    let searchQuery = { chat: chatId };

    // Add keyword search if provided
    if (keyword && keyword.trim() !== "") {
      searchQuery.content = { $regex: keyword, $options: "i" };
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      searchQuery.createdAt = {};
      if (startDate) {
        searchQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        searchQuery.createdAt.$lte = new Date(endDate);
      }
    }

    // Execute search
    const messages = await Message.find(searchQuery)
      .populate("sender", "name pic email")
      .populate("chat")
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
      success: true,
      results: messages,
      count: messages.length,
      keyword: keyword || "",
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to search messages",
      error: error.message
    });
  }
};

module.exports = { sendMessage, allMessages, searchMessages };
