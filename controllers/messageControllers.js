const { Message, Chat } = require("../models");

// @description     Create New Message
// @route           POST /api/Message/
// @access          Protected
const sendMessage = async (req, res) => {
  try {
    const { content, chatId, replyToId } = req.body;

    if (!content || !chatId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Invalid data passed into request",
      });
    }

    // Create message object
    const messageData = {
      sender: req.user._id, // Logged in user id,
      content,
      chat: chatId,
    };

    // Add replyTo if provided
    if (replyToId) {
      messageData.replyTo = replyToId;
    }

    // Create a new message
    let message = await Message.create(messageData);

    // Populate the message with sender and chat info
    message = await message.populate("sender", "name pic");
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
        select: "content sender createdAt",
        populate: {
          path: "sender",
          select: "name pic"
        }
      });
    }

    // Update latest message
    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    return res.status(201).json(message); // Send message we just created now
  } catch (error) {
    console.error("Send Message Error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Failed to create New Message",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
        select: "content sender createdAt",
        populate: {
          path: "sender",
          select: "name pic"
        }
      })
      .sort({ createdAt: 1 }); // Sort by creation time ascending

    res.status(200).json(messages);
  } catch (error) {
    console.error("Fetch Messages Error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Failed to fetch all Messages",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = { sendMessage, allMessages };
