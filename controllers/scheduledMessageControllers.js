const { ScheduledMessage, Message, Chat } = require("../models");

// @description     Create Scheduled Message
// @route           POST /api/scheduled-message/
// @access          Protected
const createScheduledMessage = async (req, res) => {
    const { content, chatId, scheduledTime, messageType, location, isRecurring, recurringPattern } = req.body;

    console.log("Received schedule request:", { content, chatId, scheduledTime, messageType, isRecurring, recurringPattern });

    if (!content || !chatId || !scheduledTime) {
        console.log("Validation failed - missing required fields");
        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: "Content, chatId, and scheduledTime are required",
        });
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledTime);
    if (scheduledDate <= new Date()) {
        console.log("Validation failed - scheduled time is in the past");
        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: "Scheduled time must be in the future",
        });
    }

    try {
        const scheduledMessageData = {
            sender: req.user._id,
            content,
            chat: chatId,
            scheduledTime: scheduledDate,
            messageType: messageType || "text",
            isRecurring: isRecurring || false
        };

        // Only add recurringPattern if message is recurring
        if (isRecurring && recurringPattern) {
            scheduledMessageData.recurringPattern = recurringPattern;
        }

        if (messageType === "location" && location) {
            scheduledMessageData.location = location;
        }

        console.log("Creating scheduled message with data:", scheduledMessageData);

        const scheduledMessage = await ScheduledMessage.create(scheduledMessageData);

        const populatedMessage = await scheduledMessage.populate("sender", "name pic");

        console.log("Successfully created scheduled message:", populatedMessage._id);

        return res.status(201).json(populatedMessage);
    } catch (error) {
        console.error("Error creating scheduled message:", error);
        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: "Failed to schedule message: " + error.message,
        });
    }
};

// @description     Get Scheduled Messages for a chat
// @route           GET /api/scheduled-message/:chatId
// @access          Protected
const getScheduledMessages = async (req, res) => {
    try {
        console.log("Fetching scheduled messages for chat:", req.params.chatId);
        const scheduledMessages = await ScheduledMessage.find({
            chat: req.params.chatId,
            status: "pending"
        })
            .populate("sender", "name pic")
            .sort({ scheduledTime: 1 });

        console.log("Successfully fetched scheduled messages:", scheduledMessages.length);
        res.status(200).json(scheduledMessages);
    } catch (error) {
        console.error("Error fetching scheduled messages:", error);
        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: "Failed to fetch scheduled messages: " + error.message,
        });
    }
};

// @description     Cancel Scheduled Message
// @route           DELETE /api/scheduled-message/:messageId
// @access          Protected
const cancelScheduledMessage = async (req, res) => {
    try {
        console.log("Cancelling scheduled message:", req.params.messageId);
        const scheduledMessage = await ScheduledMessage.findById(req.params.messageId);

        if (!scheduledMessage) {
            console.log("Scheduled message not found:", req.params.messageId);
            return res.status(404).json({
                success: false,
                statusCode: 404,
                message: "Scheduled message not found",
            });
        }

        // Check if user is the sender
        if (scheduledMessage.sender.toString() !== req.user._id.toString()) {
            console.log("Unauthorized to cancel message:", req.params.messageId);
            return res.status(403).json({
                success: false,
                statusCode: 403,
                message: "Not authorized to cancel this message",
            });
        }

        scheduledMessage.status = "cancelled";
        await scheduledMessage.save();

        console.log("Successfully cancelled scheduled message:", req.params.messageId);
        res.status(200).json({
            success: true,
            message: "Scheduled message cancelled successfully",
        });
    } catch (error) {
        console.error("Error cancelling scheduled message:", error);
        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: "Failed to cancel scheduled message: " + error.message,
        });
    }
};

module.exports = {
    createScheduledMessage,
    getScheduledMessages,
    cancelScheduledMessage
};
