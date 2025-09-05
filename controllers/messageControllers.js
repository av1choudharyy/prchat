const { Message, Chat } = require("../models");

<<<<<<< HEAD
// @description     Create New Message
// @route           POST /api/Message/
// @access          Protected
const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Invalid data passed into request",
    });
  }

  try {
    // Create a new message
    let message = await Message.create({
      sender: req.user._id, // Logged in user id,
      content,
      chat: chatId,
=======
const sendMessage = async (req, res) => {
  const { content, chatId, replyToMessageId } = req.body;
  if (!content || !chatId) return res.status(400).json({ message: "Invalid data" });

  try {
    let message = await Message.create({
      sender: req.user._id,
      content,
      chat: chatId,
      replyToMessageId: replyToMessageId || null,
>>>>>>> 2818aa101d1ec36cc2a78b16e93fce92f1488420
    });

    message = await (
      await message.populate("sender", "name pic")
    ).populate({
      path: "chat",
      select: "chatName isGroupChat users",
      model: "Chat",
      populate: { path: "users", select: "name email pic", model: "User" },
<<<<<<< HEAD
    });

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
=======
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

>>>>>>> 2818aa101d1ec36cc2a78b16e93fce92f1488420
const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
<<<<<<< HEAD
      .populate("chat");

    res.status(200).json(messages);
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to fetch all Messages",
    });
=======
      .populate("chat")
      .populate({
        path: "replyToMessageId",
        select: "content sender",
        populate: { path: "sender", select: "name" },
      });

    res.status(200).json(messages);
  } catch (error) {
    return res.status(400).json({ message: "Failed to fetch messages" });
>>>>>>> 2818aa101d1ec36cc2a78b16e93fce92f1488420
  }
};

module.exports = { sendMessage, allMessages };
