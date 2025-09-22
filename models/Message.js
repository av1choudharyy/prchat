const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    chat: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
    file: {
      filename: { type: String },
      mimetype: { type: String },
      size: { type: Number },
      data: { type: Buffer }, // Store file data as buffer
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
