const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    chat: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
    messageType: { 
      type: String, 
      enum: ['text', 'image', 'file'], 
      default: 'text' 
    },
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    replyTo: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Message" 
    },
    forwardedFrom: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Message" 
    },
    fontStyle: {
      fontSize: { type: String, default: '14px' },
      fontWeight: { type: String, default: 'normal' },
      fontStyle: { type: String, default: 'normal' },
      color: { type: String, default: '#000000' }
    }
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;