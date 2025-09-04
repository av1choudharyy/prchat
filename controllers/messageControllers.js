const { Message, Chat } = require("../models");

// @description     Create New Message
// @route           POST /api/Message/
// @access          Protected
const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if ((!content && !req.file) || !chatId) {
    console.log("Invalid data - content:", content, "file:", req.file, "chatId:", chatId);
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Invalid data passed into request",
    });
  }

  try {
    const messageData = {
      sender: req.user._id,
      chat: chatId,
    };

    // Handle text message
    if (content) {
      messageData.content = content;
    }

    // Handle file attachment
    if (req.file) {
      const fileType = req.file.mimetype.startsWith('image/') ? 'image' :
        req.file.mimetype.startsWith('video/') ? 'video' :
          req.file.mimetype.startsWith('audio/') ? 'audio' : 'file';

      messageData.attachment = {
        type: fileType,
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      };
    }

    console.log("Creating message with data:", messageData);

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

    console.log("Message created successfully:", message._id);

    // Update latest message
    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    return res.status(201).json(message); // Send message we just created now
  } catch (error) {
    console.error("Error creating message:", error);
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to create New Message",
      error: error.message
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
