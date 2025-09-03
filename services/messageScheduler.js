const cron = require('node-cron');
const { ScheduledMessage, Message, Chat } = require('../models');

class MessageScheduler {
    constructor(io) {
        this.io = io;
        this.init();
    }

    init() {
        // Check for scheduled messages every minute
        cron.schedule('* * * * *', () => {
            this.processScheduledMessages();
        });

        console.log('Message scheduler initialized');
    }

    async processScheduledMessages() {
        try {
            const now = new Date();

            // Find all pending scheduled messages that are due
            const dueMessages = await ScheduledMessage.find({
                status: 'pending',
                scheduledTime: { $lte: now }
            }).populate('sender', 'name pic').populate('chat');

            for (const scheduledMsg of dueMessages) {
                await this.sendScheduledMessage(scheduledMsg);
            }
        } catch (error) {
            console.error('Error processing scheduled messages:', error);
        }
    }

    async sendScheduledMessage(scheduledMsg) {
        try {
            // Create the actual message
            const messageData = {
                sender: scheduledMsg.sender._id,
                content: scheduledMsg.content,
                chat: scheduledMsg.chat._id,
                messageType: scheduledMsg.messageType || 'text'
            };

            if (scheduledMsg.messageType === 'location' && scheduledMsg.location) {
                messageData.location = scheduledMsg.location;
            }

            const message = await Message.create(messageData);

            // Populate the message
            const populatedMessage = await message.populate('sender', 'name pic')
                .populate({
                    path: 'chat',
                    select: 'chatName isGroupChat users',
                    model: 'Chat',
                    populate: { path: 'users', select: 'name email pic', model: 'User' }
                });

            // Update latest message in chat
            await Chat.findByIdAndUpdate(scheduledMsg.chat._id, {
                latestMessage: populatedMessage
            });

            // Emit the message via Socket.io
            this.io.to(scheduledMsg.chat._id.toString()).emit('message recieved', populatedMessage);

            // Update scheduled message status
            if (scheduledMsg.isRecurring) {
                await this.scheduleNextRecurrence(scheduledMsg);
            } else {
                scheduledMsg.status = 'sent';
                await scheduledMsg.save();
            }

            console.log(`Scheduled message sent: ${scheduledMsg._id}`);
        } catch (error) {
            console.error(`Error sending scheduled message ${scheduledMsg._id}:`, error);

            // Mark as failed but don't retry to avoid spam
            scheduledMsg.status = 'cancelled';
            await scheduledMsg.save();
        }
    }

    async scheduleNextRecurrence(scheduledMsg) {
        try {
            const nextTime = this.calculateNextRecurrence(
                scheduledMsg.scheduledTime,
                scheduledMsg.recurringPattern
            );

            if (nextTime) {
                // Create new scheduled message for next occurrence
                const nextScheduledMsg = new ScheduledMessage({
                    sender: scheduledMsg.sender,
                    content: scheduledMsg.content,
                    chat: scheduledMsg.chat,
                    scheduledTime: nextTime,
                    messageType: scheduledMsg.messageType,
                    location: scheduledMsg.location,
                    isRecurring: true,
                    recurringPattern: scheduledMsg.recurringPattern,
                    status: 'pending'
                });

                await nextScheduledMsg.save();
            }

            // Mark current one as sent
            scheduledMsg.status = 'sent';
            await scheduledMsg.save();
        } catch (error) {
            console.error('Error scheduling next recurrence:', error);
        }
    }

    calculateNextRecurrence(currentTime, pattern) {
        const next = new Date(currentTime);

        switch (pattern) {
            case 'daily':
                next.setDate(next.getDate() + 1);
                break;
            case 'weekly':
                next.setDate(next.getDate() + 7);
                break;
            case 'monthly':
                next.setMonth(next.getMonth() + 1);
                break;
            default:
                return null;
        }

        return next;
    }

    // Method to cancel all pending scheduled messages for a chat
    async cancelChatScheduledMessages(chatId) {
        try {
            await ScheduledMessage.updateMany(
                { chat: chatId, status: 'pending' },
                { status: 'cancelled' }
            );
        } catch (error) {
            console.error('Error cancelling chat scheduled messages:', error);
        }
    }
}

module.exports = MessageScheduler;
