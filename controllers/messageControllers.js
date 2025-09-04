const expressAsyncHandler = require("express-async-handler");
const Message = require("../models/Message");
const User = require("../models/User");
const Chat = require("../models/Chat");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = expressAsyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat")
      .populate("replyTo")
      .populate("forwardedFrom");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = expressAsyncHandler(async (req, res) => {
  const { content, chatId, replyTo, fontStyle } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: [chatId],
  };

  if (replyTo) {
    newMessage.replyTo = replyTo;
  }

  if (fontStyle) {
    newMessage.fontStyle = fontStyle;
  }

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await message.populate("replyTo");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Search Messages
//@route           GET /api/Message/search/:chatId
//@access          Protected
const searchMessages = expressAsyncHandler(async (req, res) => {
  const { q } = req.query;
  const { chatId } = req.params;

  if (!q) {
    return res.status(400).json({ message: "Search query is required" });
  }

  try {
    const messages = await Message.find({
      chat: chatId,
      content: { $regex: q, $options: 'i' }
    })
      .populate("sender", "name pic email")
      .populate("chat")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Upload File
//@route           POST /api/Message/upload
//@access          Protected
const uploadFile = expressAsyncHandler(async (req, res) => {
  const { chatId } = req.body;
  
  if (!req.file || !chatId) {
    return res.status(400).json({ message: "File and chatId are required" });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  const messageType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';

  try {
    var newMessage = {
      sender: req.user._id,
      content: req.file.originalname,
      chat: [chatId],
      messageType: messageType,
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    };

    var message = await Message.create(newMessage);
    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Forward Message
//@route           POST /api/Message/forward
//@access          Protected
const forwardMessage = expressAsyncHandler(async (req, res) => {
  const { messageId, targetChatIds } = req.body;

  if (!messageId || !targetChatIds || !Array.isArray(targetChatIds)) {
    return res.status(400).json({ message: "Message ID and target chat IDs are required" });
  }

  try {
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ message: "Original message not found" });
    }

    const forwardedMessages = [];

    for (const chatId of targetChatIds) {
      const newMessage = {
        sender: req.user._id,
        content: originalMessage.content,
        chat: [chatId],
        messageType: originalMessage.messageType,
        fileUrl: originalMessage.fileUrl,
        fileName: originalMessage.fileName,
        fileSize: originalMessage.fileSize,
        forwardedFrom: messageId,
      };

      let message = await Message.create(newMessage);
      message = await message.populate("sender", "name pic");
      message = await message.populate("chat");
      message = await message.populate("forwardedFrom");
      message = await User.populate(message, {
        path: "chat.users",
        select: "name pic email",
      });

      await Chat.findByIdAndUpdate(chatId, { latestMessage: message });
      forwardedMessages.push(message);
    }

    res.json(forwardedMessages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = {
  allMessages,
  sendMessage,
  searchMessages,
  uploadFile,
  forwardMessage,
};