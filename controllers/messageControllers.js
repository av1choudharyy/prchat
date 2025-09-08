const { Message, Chat } = require("../models");

// @description     Create New Message
// @route           POST /api/message/
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
    // Create a new message object
    let messageData = {
      sender: req.user._id,
      content,
      chat: chatId,
    };

    if (replyTo) messageData.replyTo = replyTo;

    // Create message
    let message = await Message.create(messageData);

    // Populate message details
    message = await Message.findById(message._id)
      .populate("sender", "name pic email")
      .populate({
        path: "chat",
        select: "chatName isGroupChat users latestMessage",
        populate: { path: "users", select: "name email pic" },
      })
      .populate({
        path: "replyTo",
        select: "content sender",
        populate: { path: "sender", select: "name pic email" },
      });

    // Update latestMessage in chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    return res.status(201).json(message);
  } catch (error) {
    console.error(error);
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
      .populate({
        path: "chat",
        select: "chatName isGroupChat users",
        populate: { path: "users", select: "name email pic" },
      })
      .populate({
        path: "replyTo",
        select: "content sender",
        populate: { path: "sender", select: "name pic email" },
      });

    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to fetch all Messages",
    });
  }
};

module.exports = { sendMessage, allMessages };
