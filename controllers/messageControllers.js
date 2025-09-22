const { Message, Chat } = require("../models");

// @description     Create New Message
// @route           POST /api/Message/
// @access          Protected
const sendMessage = async (req, res) => {
  const { content, chatId, fileType, fileName } = req.body;
  const file = req.file; // File from multer

  if (!chatId) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Chat ID is required",
    });
  }

  // Either content or file should be present
  if (!content && !file) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Either content or file is required",
    });
  }

  try {
    let messageData = {
      sender: req.user._id,
      chat: chatId,
    };

    // Handle text content
    if (content) {
      messageData.content = content;
    }

    // Handle file upload
    if (file) {
      messageData.file = {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        data: file.buffer, // Store file data in buffer
      };
      
      // If no content, use file name as content
      if (!content) {
        messageData.content = `📎 ${file.originalname}`;
      }
    }

    // Create a new message
    let message = await Message.create(messageData);

    message = await (
      await message.populate("sender", "name pic")
    ).populate({
      path: "chat",
      select: "chatName isGroupChat users",
      model: "Chat",
      populate: { path: "users", select: "name email pic", model: "User" },
    });

    // Update latest message
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    return res.status(201).json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
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

module.exports = { sendMessage, allMessages };
