const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    chat:{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" }, // new drop
    pinned: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
