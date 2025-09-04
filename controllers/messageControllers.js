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

const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.messageId);
    res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete message" });
  }
};

// Make sure you have: const { Message, Chat } = require("../models");

const resolveChatId = (chat) => {
  // chat could be an object, an ObjectId, or an array
  if (!chat) return null;
  if (Array.isArray(chat)) return chat[0]?._id || chat[0];
  return chat._id || chat;
};

// PIN
const pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    // 1) find the message & figure out the chat id
    let msg = await Message.findById(messageId).populate({
      path: "chat",
      select: "_id users",
      model: "Chat",
    });
    if (!msg) return res.status(404).json({ message: "Message not found" });

    const chatId = resolveChatId(msg.chat);
    if (!chatId) return res.status(400).json({ message: "Chat not resolved" });

    // 2) unpin any existing pinned message in this chat
    await Message.updateMany({ chat: chatId, pinned: true }, { $set: { pinned: false } });

    // 3) pin this message and populate for UI/sockets
    let updated = await Message.findByIdAndUpdate(
      messageId,
      { pinned: true },
      { new: true }
    );

    updated = await (await updated.populate("sender", "name pic")).populate({
      path: "chat",
      select: "chatName isGroupChat users",
      model: "Chat",
      populate: { path: "users", select: "name email pic", model: "User" },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(400).json({ message: "Failed to pin message" });
  }
};

// UNPIN
const unpinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    let updated = await Message.findByIdAndUpdate(
      messageId,
      { pinned: false },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Message not found" });

    updated = await (await updated.populate("sender", "name pic")).populate({
      path: "chat",
      select: "chatName isGroupChat users",
      model: "Chat",
      populate: { path: "users", select: "name email pic", model: "User" },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(400).json({ message: "Failed to unpin message" });
  }
};

// @desc    Search messages in a chat
// @route   GET /api/message/search/:chatId
// @access  Protected
const searchMessages = async (req, res) => {
  try {
    const { query } = req.query; // keyword from ?query=
    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const messages = await Message.find({
      chat: req.params.chatId,
      content: { $regex: query, $options: "i" }, // case-insensitive search
    })
      .populate("sender", "name pic email")
      .populate("chat");

    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: "Failed to search messages" });
  }
};

module.exports = { sendMessage, allMessages,forwardMessage,pinMessage, unpinMessage, deleteMessage, searchMessages,};

