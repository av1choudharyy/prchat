const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    chat: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
    attachment: {
      url: { type: String, default: null },
      type: { type: String, enum: ["image", "file", null], default: null },
      name: { type: String, default: null },
      size: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
