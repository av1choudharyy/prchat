const { Message, Chat } = require("../models");

// @description     Create New Message
// @route           POST /api/Message/
// @access          Protected
const sendMessage = async (req, res) => {
  const { content, chatId, replyTo, mediaUrl, mediaType, fileName, fileSize } = req.body;

  // Allow either content or media (or both)
  if ((!content && !mediaUrl) || !chatId) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Invalid data passed into request",
    });
  }

  try {
    // Create message object
    const messageData = {
      sender: req.user._id, // Logged in user id,
      content: content || '',
      chat: chatId,
    };

    // Add reply reference if provided
    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    // Add media information if provided
    if (mediaUrl) {
      messageData.mediaUrl = mediaUrl;
      messageData.mediaType = mediaType;
      messageData.fileName = fileName;
      messageData.fileSize = fileSize;
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

    // Populate reply information if it exists
    if (message.replyTo) {
      message = await message.populate({
        path: "replyTo",
        select: "content sender createdAt",
        populate: {
          path: "sender",
          select: "name"
        }
      });
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
      .populate({
        path: "replyTo",
        select: "content sender createdAt",
        populate: {
          path: "sender",
          select: "name"
        }
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
