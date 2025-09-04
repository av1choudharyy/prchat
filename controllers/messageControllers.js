const { Message, Chat } = require("../models");

const OLLAMA_API = process.env.OLLAMA_API_URL || "http://localhost:11434";

// @description     Create New Message
// @route           POST /api/Message/
// @access          Protected
const sendMessage = async (req, res) => {
  const { content, chatId, isAiInteraction } = req.body;

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

    // if (isAiInteraction) {
    //   console.log("inside ai interaction");
    //   const prompt = content.replace("@prai", "").trim();

    //   const aiResponse = await fetch(`${process.env.OLLAMA_API_URL}/api/generate`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       model: "tinyllama",
    //       prompt,
    //       stream: false,
    //     }),
    //   });

    //   // if (!aiResponse.ok) {
    //   //   const errorText = await aiResponse.text();
    //   //   console.error("Ollama error:", errorText);
    //   //   return res.status(400).json({ error: errorText });
    //   // }

    //   const data = await aiResponse.json();
    //   console.log("aiResponse", data);

    //   // const aiMessage = await Message.create({
    //   //   sender: null, // or a system user id for AI
    //   //   content: data.response,
    //   //   chat: chatId,
    //   // });

    //   return res.status(201).json(data);
    // }

    // console.log("response in sendMessage", json(message));
    return res.status(201).json(message);
  } catch (error) {
    // console.error("sendMessage error:", error);
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Failed to create New Message",
    });
  }
};

// @description     Create New Message
// @route           POST /api/message/forwardMessage
// @access          Protected
const forwardMessage = async (req, res) => {
  const { content, selectedForwardOptionsIds } = req.body;

  if (!content || !selectedForwardOptionsIds) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Invalid data passed into request",
    });
  }

  try {
    // Create a new message
    let message;
    selectedForwardOptionsIds.map(async (ids) => {
      message = await Message.create({
        sender: req.user._id, // Logged in user id,
        content,
        chat: ids,
      });

      message = await (
        await message.populate("sender", "name pic")
      ).populate({
        path: "chat",
        select: "chatName isGroupChat users",
        model: "Chat",
        populate: { path: "users", select: "name email pic", model: "User" },
      });

    })

    return res.status(201).json("message forwarded"); // Send message we just created now
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

module.exports = { sendMessage, allMessages, forwardMessage };
