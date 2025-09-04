const { Message, Chat } = require("../models");

const sendMessage = async (req, res) => {
  const { content, chatId, replyToMessageId } = req.body;
  if (!content || !chatId) return res.status(400).json({ message: "Invalid data" });

  try {
    let message = await Message.create({
      sender: req.user._id,
      content,
      chat: chatId,
      replyToMessageId: replyToMessageId || null,
    });

    message = await (
      await message.populate("sender", "name pic")
    ).populate({
      path: "chat",
      select: "chatName isGroupChat users",
      model: "Chat",
      populate: { path: "users", select: "name email pic", model: "User" },
    }).populate({
      path: "replyToMessageId",
      select: "content sender",
      populate: { path: "sender", select: "name" },
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });
    return res.status(201).json(message);
  } catch (error) {
    return res.status(400).json({ message: "Failed to create message" });
  }
};

const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat")
      .populate({
        path: "replyToMessageId",
        select: "content sender",
        populate: { path: "sender", select: "name" },
      });

    res.status(200).json(messages);
  } catch (error) {
    return res.status(400).json({ message: "Failed to fetch messages" });
  }
};

module.exports = { sendMessage, allMessages };
