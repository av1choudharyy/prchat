const { Message, Chat } = require("../models");


// @description     Create New Message
// @route           POST /api/Message/
// @access          Protected
const sendMessage = async (req, res) => {
  const { content, chatId, repliedToMessageId } = req.body;

  if (!content || !chatId) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Invalid data passed into request",
    });
  }

   const newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
    repliedToMessage: repliedToMessageId || null, // Add the repliedToMessageId
  };

  
     try {
    let message = await Message.create(newMessage);

      message = await Message.findById(message._id)
      .populate("sender", "name pic email")
      .populate({
        path: "chat",
        populate: {
          path: "users",
          select: "name pic email",
        },
      })
       .populate({
        path: "repliedToMessage",
        populate: {
          path: "sender",
          select: "name",
        },
      });
//    

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
      .populate("chat")
      .populate({
        
        path: 'repliedToMessage',
        model: 'Message', 
        select: 'content sender', 
        populate: {
          path: 'sender',
          model: 'User',
          select: 'name',
        }
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

let messages = [];

const messageController = (io, socket) => {
  // Text message
  socket.on("sendMessage", ({ id, text, replyTo }) => {
    const msg = { id, text, replyTo: replyTo || null };
    messages.push(msg);
    io.emit("message", msg);
  });

  // File message
  socket.on("sendFile", (file) => {
    const fileMsg = {
      id: file.id,
      name: file.name,
      data: file.data,
    };
    messages.push(fileMsg);
    io.emit("fileMessage", fileMsg);
  });
};


module.exports = { sendMessage, allMessages, messageController };
