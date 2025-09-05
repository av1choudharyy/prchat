const mongoose = require("mongoose");

const ScheduledMessageSchema = mongoose.Schema(
    {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, trim: true, required: true },
        chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
        scheduledTime: { type: Date, required: true },
        messageType: {
            type: String,
            enum: ["text", "location"],
            default: "text"
        },
        location: {
            latitude: { type: Number },
            longitude: { type: Number },
            address: { type: String }
        },
        status: {
            type: String,
            enum: ["pending", "sent", "cancelled"],
            default: "pending"
        },
        isRecurring: { type: Boolean, default: false },
        recurringPattern: {
            type: String,
            enum: ["daily", "weekly", "monthly"],
            required: false
        }
    },
    { timestamps: true }
);

// Index for efficient querying of pending messages
ScheduledMessageSchema.index({ scheduledTime: 1, status: 1 });

const ScheduledMessage = mongoose.model("ScheduledMessage", ScheduledMessageSchema);
module.exports = ScheduledMessage;
