const { Message, Chat, User } = require("../models");

// @description     Create New Message
// @route           POST /api/Message/
// @access          Protected
const sendMessage = async (req, res) => {
  const { content, chatId, fileUrl, fileName, fileType, replyTo, forwardedFrom, fontStyle } = req.body;

  if ((!content && !fileUrl) || !chatId) {
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
      fileUrl,
      fileName,
      fileType,
      replyTo,
      forwardedFrom,
      fontStyle
    });

    message = await message.populate([
      { path: "sender", select: "name pic" },
      { path: "replyTo", populate: { path: "sender", select: "name" } },
      { path: "forwardedFrom", populate: { path: "sender", select: "name" } },
      {
        path: "chat",
        select: "chatName isGroupChat users",
        model: "Chat",
        populate: { path: "users", select: "name email pic", model: "User" },
      }
    ]);

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
      .populate("replyTo")
      .populate("forwardedFrom")
      .populate("chat");

    res.status(200).json(messages);
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to fetch all Messages",
    });
  }
};

// @description     Get all users for forwarding
// @route           GET /api/user/all
// @access          Protected
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("name email pic")
      .limit(50);
    
    res.status(200).json(users);
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to fetch users",
    });
  }
};

// @description     Search Messages
// @route           GET /api/Message/search/:chatId
// @access          Protected
const searchMessages = async (req, res) => {
  try {
    const { query } = req.query;
    const messages = await Message.find({
      chat: req.params.chatId,
      content: { $regex: query, $options: "i" }
    })
      .populate("sender", "name pic")
      .sort({ createdAt: -1 });

    res.status(200).json(messages);
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to search messages",
    });
  }
};

// @description     Advanced Search Messages
// @route           POST /api/Message/advanced-search/:chatId
// @access          Protected
const advancedSearchMessages = async (req, res) => {
  try {
    const { text, sender, hasFile, before, after } = req.body;
    const chatId = req.params.chatId;
    
    let query = { chat: chatId };
    
    // Text search with fuzzy matching
    if (text) {
      query.content = { $regex: text, $options: "i" };
    }
    
    // File filter
    if (hasFile) {
      query.fileUrl = { $exists: true, $ne: null };
    }
    
    // Date filters
    if (before || after) {
      query.createdAt = {};
      if (before) query.createdAt.$lt = new Date(before);
      if (after) query.createdAt.$gt = new Date(after);
    }
    
    let messages = await Message.find(query)
      .populate("sender", "name pic")
      .populate("replyTo")
      .sort({ createdAt: -1 });
    
    // Sender filter (after population)
    if (sender) {
      messages = messages.filter(msg => 
        msg.sender.name.toLowerCase().includes(sender.toLowerCase())
      );
    }
    
    res.status(200).json(messages);
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to perform advanced search",
    });
  }
};

// @description     React to Message
// @route           PUT /api/message/:messageId/react
// @access          Protected
const reactToMessage = async (req, res) => {
  try {
    const { emoji, userId } = req.body;
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    // Initialize reactions array if it doesn't exist
    if (!message.reactions) {
      message.reactions = [];
    }
    
    // Find existing reaction with same emoji
    const existingReaction = message.reactions.find(r => r.emoji === emoji);
    
    if (existingReaction) {
      // Check if user already reacted with this emoji
      if (existingReaction.users.includes(userId)) {
        // Remove user's reaction
        existingReaction.users = existingReaction.users.filter(id => id.toString() !== userId);
        existingReaction.count = existingReaction.users.length;
        
        // Remove reaction if no users left
        if (existingReaction.count === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        // Add user's reaction
        existingReaction.users.push(userId);
        existingReaction.count = existingReaction.users.length;
      }
    } else {
      // Create new reaction
      message.reactions.push({
        emoji,
        users: [userId],
        count: 1
      });
    }
    
    await message.save();
    res.status(200).json(message);
  } catch (error) {
    res.status(400).json({ message: "Failed to react to message" });
  }
};

// @description     Pin/Unpin Message
// @route           PUT /api/message/:messageId/pin
// @access          Protected
const pinMessage = async (req, res) => {
  try {
    const { isPinned } = req.body;
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      { isPinned },
      { new: true }
    ).populate("sender", "name pic");
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    res.status(200).json(message);
  } catch (error) {
    res.status(400).json({ message: "Failed to pin message" });
  }
};

// @description     Delete Message
// @route           DELETE /api/message/:messageId
// @access          Protected
const deleteMessage = async (req, res) => {
  try {
    const { deleteForEveryone } = req.body;
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    // Check if user can delete for everyone
    if (deleteForEveryone && message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages for everyone" });
    }
    
    if (deleteForEveryone) {
      // Delete message completely
      await Message.findByIdAndDelete(req.params.messageId);
    } else {
      // Mark as deleted for this user only
      if (!message.deletedFor) {
        message.deletedFor = [];
      }
      if (!message.deletedFor.includes(req.user._id)) {
        message.deletedFor.push(req.user._id);
        await message.save();
      }
    }
    
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete message" });
  }
};

module.exports = { sendMessage, allMessages, searchMessages, advancedSearchMessages, getAllUsers, reactToMessage, pinMessage, deleteMessage };
