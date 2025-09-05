const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    content: { 
      type: String, 
      trim: true 
    },
    chat: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Chat", 
      required: true 
    },
    repliedToMessage: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Message', 
      default: null 
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;