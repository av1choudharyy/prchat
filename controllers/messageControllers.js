const { Message, Chat } = require("../models");

// @description     Create New Message
// @route           POST /api/Message/
// @access          Protected
const sendMessage = async (req, res) => {
  const { content, chatId, type, poll, replyTo } = req.body;

  if (!content && !poll) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Content or poll data is required",
    });
  }

  if (!chatId) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Chat ID is required",
    });
  }

  try {
    // Create a new message
    let message = await Message.create({
      sender: req.user._id,
      content: content || "",
      chat: chatId,
      type: type || "text",
      poll: type === "poll" ? poll : undefined,
      replyTo: replyTo || undefined,
    });

    message = await (
      await message.populate("sender", "name pic")
    ).populate({
      path: "chat",
      select: "chatName isGroupChat users",
      model: "Chat",
      populate: { path: "users", select: "name email pic", model: "User" },
    });

    // Update latest message
    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    return res.status(201).json(message); // Send message we just created now
  } catch (error) {
    console.error("Send message error:", error);
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
      .populate({ path: "replyTo", populate: { path: "sender", select: "name pic" } });

    res.status(200).json(messages);
  } catch (error) {
    console.error("All messages error:", error);
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to fetch all Messages",
    });
  }
};

// @description     Vote on a Poll option
// @route           POST /api/Message/:messageId/vote
// @access          Protected
const voteOnPoll = async (req, res) => {
  const { optionIndex } = req.body;
  const { messageId } = req.params;

  try {
    const message = await Message.findById(messageId).populate("poll.options.votes");
    if (!message || message.type !== "poll") {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (
      typeof optionIndex !== "number" ||
      optionIndex < 0 ||
      optionIndex >= (message.poll?.options?.length || 0)
    ) {
      return res.status(400).json({ message: "Invalid option index" });
    }

    // Remove previous votes from user (one-vote rule)
    message.poll.options = message.poll.options.map((opt, idx) => {
      const filteredVotes = (opt.votes || []).filter(
        (voterId) => String(voterId) !== String(req.user._id)
      );
      if (idx === optionIndex) {
        filteredVotes.push(req.user._id);
      }
      return { ...opt.toObject(), votes: filteredVotes };
    });

    await message.save();

    const updated = await Message.findById(messageId)
      .populate("sender", "name pic email")
      .populate("chat");

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Vote on poll error:", error);
    return res.status(400).json({ message: "Failed to vote on poll" });
  }
};

// @description     Mark messages as read in a chat
// @route           POST /api/Message/:chatId/read
// @access          Protected
const markRead = async (req, res) => {
  try {
    await Message.updateMany(
      { chat: req.params.chatId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );
    const updated = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    return res.status(200).json(updated);
  } catch (e) {
    console.error("Mark read error:", e);
    return res.status(400).json({ message: "Failed to mark as read" });
  }
};

// @description     Edit a message
// @route           PUT /api/Message/:messageId
// @access          Protected
const editMessage = async (req, res) => {
  const { content } = req.body;
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (String(msg.sender) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }
    msg.content = content;
    msg.editedAt = new Date();
    await msg.save();
    const populated = await Message.findById(msg._id)
      .populate("sender", "name pic email")
      .populate("chat");
    return res.status(200).json(populated);
  } catch (e) {
    console.error("Edit message error:", e);
    return res.status(400).json({ message: "Failed to edit message" });
  }
};

// @description     Delete a message
// @route           DELETE /api/Message/:messageId
// @access          Protected
const deleteMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (String(msg.sender) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }
    await msg.deleteOne();
    return res.status(204).send();
  } catch (e) {
    console.error("Delete message error:", e);
    return res.status(400).json({ message: "Failed to delete message" });
  }
};

module.exports = { sendMessage, allMessages, voteOnPoll, markRead, editMessage, deleteMessage };