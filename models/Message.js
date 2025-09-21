const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" }, // should be single ref, not array
    file: { type: String, default: null }, // for any file (pdf, doc, etc.)
    fileType: { type: String, default: null }, // store MIME type (e.g., "image/png", "application/pdf")
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
