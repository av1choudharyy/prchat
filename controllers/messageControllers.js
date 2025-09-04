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
    console.log("Creating message with data:", {
      sender: req.user._id,
      content,
      chat: chatId,
      replyTo: replyTo || null,
    });

    // Create a new message
    let message = await Message.create({
      sender: req.user._id, // Logged in user id,
      content,
      chat: chatId,
      replyTo: replyTo || null, // Add replyTo field
    });

    console.log("Message created successfully:", message._id);

    // Populate sender
    message = await message.populate("sender", "name pic");
    
    // Populate chat with users
    message = await message.populate({
      path: "chat",
      select: "chatName isGroupChat users",
      model: "Chat",
      populate: { path: "users", select: "name email pic", model: "User" },
    });
    
    // Populate replyTo if it exists
    if (message.replyTo) {
      message = await message.populate({
        path: "replyTo",
        select: "content sender",
        model: "Message",
        populate: { path: "sender", select: "name", model: "User" },
      });
    }

    // Update latest message
    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    return res.status(201).json(message); // Send message we just created now
  } catch (error) {
    console.error("Error creating message:", error);
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to create New Message",
      error: error.message,
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
      .populate({
        path: "replyTo",
        select: "content sender",
        model: "Message",
        populate: { path: "sender", select: "name", model: "User" },
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

// @description     Search Messages
// @route           GET /api/Message/search/:chatId?q=searchTerm
// @access          Protected
const searchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { q: searchTerm } = req.query;

    if (!searchTerm || !chatId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Search term and chat ID are required",
      });
    }

    // Search for messages containing the search term (case-insensitive)
    const messages = await Message.find({
      chat: chatId,
      content: { $regex: searchTerm, $options: "i" },
    })
      .populate("sender", "name pic email")
      .populate("chat")
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
      success: true,
      results: messages,
      searchTerm: searchTerm,
      count: messages.length,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to search messages",
    });
  }
};

module.exports = { sendMessage, allMessages, searchMessages };
