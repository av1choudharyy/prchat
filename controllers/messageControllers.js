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
    let message = await Message.create({
      sender: req.user._id,
      content,
      chat: chatId,
      replyTo: replyTo || null,  // ✅ store reply if present
    });

    message = await message.populate("sender", "name pic");
    message = await message.populate({
      path: "chat",
      select: "chatName isGroupChat users",
      model: "Chat",
      populate: { path: "users", select: "name email pic", model: "User" },
    });

    if (message.replyTo) {
      await message.populate("replyTo", "content sender");
      await message.populate({ path: "replyTo.sender", select: "name" });
    }

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    return res.status(201).json(message);
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
         populate: { path: "sender", select: "name pic email" }
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

// @description     Forward an Existing Message to another chat
// @route           POST /api/message/forward
// @access          Protected
const forwardMessage = async (req, res) => {
  const { messageId, targetChatId } = req.body;
  if (!messageId || !targetChatId) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "messageId and targetChatId are required",
    });
  }

  try {
    const original = await Message.findById(messageId).populate("sender", "name pic");
    if (!original) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Original message not found",
      });
    }

    let forwarded = await Message.create({
      sender: req.user._id,          
      content: original.content,     
      chat: targetChatId,
     
    });

    forwarded = await (await forwarded.populate("sender", "name pic")).populate({
      path: "chat",
      select: "chatName isGroupChat users",
      model: "Chat",
      populate: { path: "users", select: "name email pic", model: "User" },
    });

    await Chat.findByIdAndUpdate(targetChatId, { latestMessage: forwarded });

    return res.status(201).json(forwarded);
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to forward Message",
    });
  }
};

module.exports = { sendMessage, allMessages, forwardMessage };

