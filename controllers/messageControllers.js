const { Message, Chat } = require("../models");

// @desc Create New Message
const sendMessage = async (req, res) => {
  const { content, chatId, fileUrl, fileType, fileName } = req.body;

  if ((!content && !fileUrl) || !chatId) {
    return res.status(400).json({ message: "Invalid data" });
  }

  try {
    let message = await Message.create({
      sender: req.user._id,
      content,
      chat: chatId,
      fileUrl,
      fileType,
      fileName,
    });

    message = await (
      await message.populate("sender", "name pic")
    ).populate({
      path: "chat",
      select: "chatName isGroupChat users",
      model: "Chat",
      populate: { path: "users", select: "name email pic", model: "User" },
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    return res.status(201).json(message);
  } catch (error) {
    return res.status(400).json({ message: "Failed to create message" });
  }
};

// @desc Get all messages
const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    res.status(200).json(messages);
  } catch (error) {
    return res.status(400).json({ message: "Failed to fetch messages" });
  }
};

// @desc Search messages in a chat
// GET /api/message/search?chatId=xxx&query=yyy
const searchMessages = async (req, res) => {
  console.log("Hi");
  try {
    const { chatId, query } = req.query;

    if (!chatId || !query) {
      return res.status(400).json({ message: "chatId and query required" });
    }

    const regex = new RegExp(query, "i");

    const messages = await Message.find({
      chat: chatId,
      $or: [
        { content: { $regex: regex } },   // ✅ text messages
        { fileName: { $regex: regex } },  // ✅ file names
      ],
    })
      .populate("sender", "name pic email")
      .populate("chat");

    res.status(200).json(messages || []);
    
  } catch (error) {
    res.status(400).json({ message: "Failed to search messages" });
  }
};



module.exports = { sendMessage, allMessages, searchMessages };
