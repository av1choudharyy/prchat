const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

// ✅ Send new message
const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  let newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
    let message = await Message.create(newMessage);
    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    res.json(message);
  } catch (error) {
    res.status(500).send({ message: "Message send failed", error });
  }
};

// ✅ Get all messages of a chat
const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");

    res.json(messages);
  } catch (error) {
    res.status(500).send({ message: "Fetching messages failed", error });
  }
};

// ✅ React to a message (NEW FUNCTION)
const reactToMessage = async (req, res) => {
  const { messageId, emoji } = req.body;
  const userId = req.user._id;

  try {
    const message = await Message.findById(messageId);

    if (!message) return res.status(404).json({ message: "Message not found" });

    // check if this user already reacted
    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === userId.toString()
    );

    if (existingReactionIndex !== -1) {
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        // Same emoji clicked again => remove
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Change the emoji
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      // Add new reaction
      message.reactions.push({ user: userId, emoji });
    }

    await message.save();

    const updatedMessage = await Message.findById(message._id)
      .populate("sender", "name pic email")
      .populate("chat")
      .populate("reactions.user", "name pic email");

    res.json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: "Reacting to message failed", error });
  }
};

module.exports = { sendMessage, allMessages, reactToMessage };

