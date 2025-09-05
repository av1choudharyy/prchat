const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    chat: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
    attachment: {
      type: {
        type: String,
        enum: ['image', 'file', 'video', 'audio'],
        required: false
      },
      filename: { type: String, required: false },
      originalName: { type: String, required: false },
      path: { type: String, required: false },
      size: { type: Number, required: false },
      mimetype: { type: String, required: false }
    }
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
