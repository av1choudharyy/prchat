const asyncHandler = require("express-async-handler");
const path = require("path");
const fs = require("fs-extra");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const { getFileCategory, formatFileSize } = require("../middleware");

// @desc    Upload files and create message
// @route   POST /api/files/upload
// @access  Protected
const uploadFiles = asyncHandler(async (req, res) => {
  try {
    const { chatId, replyTo } = req.body;
    
    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "Chat ID is required"
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded"
      });
    }
    
    // Verify user is part of the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }
    
    if (!chat.users.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "User not authorized to send messages to this chat"
      });
    }
    
    const uploadedFiles = [];
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Process each uploaded file
    for (const file of req.files) {
      const fileCategory = getFileCategory(file.mimetype, file.originalname);
      const fileUrl = `${baseUrl}/api/files/download/${path.basename(file.path)}`;
      
      const fileData = {
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileUrl: fileUrl
      };
      
      // Create message for each file
      const messageType = fileCategory === 'image' ? 'image' : 'file';
      
      const message = await Message.create({
        sender: req.user._id,
        content: `Shared ${fileCategory}: ${file.originalname}`,
        messageType: messageType,
        fileData: fileData,
        chat: chatId,
        replyTo: replyTo || null
      });
      
      const populatedMessage = await Message.findById(message._id)
        .populate("sender", "name profilePic email")
        .populate("chat")
        .populate({
          path: "replyTo",
          populate: {
            path: "sender",
            select: "name"
          }
        });
      
      uploadedFiles.push({
        message: populatedMessage,
        file: {
          ...fileData,
          category: fileCategory,
          formattedSize: formatFileSize(file.size)
        }
      });
    }
    
    // Update chat's latest message
    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: uploadedFiles[uploadedFiles.length - 1].message
    });
    
    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      data: uploadedFiles
    });
    
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during file upload",
      error: error.message
    });
  }
});

// @desc    Download file
// @route   GET /api/files/download/:filename
// @access  Protected
const downloadFile = asyncHandler(async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: "Filename is required"
      });
    }
    
    // Find message with this file
    const message = await Message.findOne({
      "fileData.fileName": filename
    }).populate("chat");
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }
    
    // Check if user has access to this chat
    if (!message.chat.users.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    
    const filePath = message.fileData.filePath;
    
    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server"
      });
    }
    
    // Set appropriate headers
    res.set({
      'Content-Type': message.fileData.mimeType,
      'Content-Disposition': `attachment; filename="${message.fileData.originalName}"`,
      'Content-Length': message.fileData.fileSize
    });
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error("File download error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during file download",
      error: error.message
    });
  }
});

// @desc    Get file preview/thumbnail (for images)
// @route   GET /api/files/preview/:filename
// @access  Protected
const previewFile = asyncHandler(async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: "Filename is required"
      });
    }
    
    // Find message with this file
    const message = await Message.findOne({
      "fileData.fileName": filename
    }).populate("chat");
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }
    
    // Check if user has access to this chat
    if (!message.chat.users.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    
    const filePath = message.fileData.filePath;
    
    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server"
      });
    }
    
    // For images, serve directly for preview
    if (message.fileData.mimeType.startsWith('image/')) {
      res.set({
        'Content-Type': message.fileData.mimeType,
        'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
      });
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } else {
      // For non-images, return file info
      res.json({
        success: true,
        data: {
          originalName: message.fileData.originalName,
          mimeType: message.fileData.mimeType,
          fileSize: message.fileData.fileSize,
          formattedSize: formatFileSize(message.fileData.fileSize),
          category: getFileCategory(message.fileData.mimeType, message.fileData.originalName)
        }
      });
    }
    
  } catch (error) {
    console.error("File preview error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during file preview",
      error: error.message
    });
  }
});

// @desc    Delete file
// @route   DELETE /api/files/:messageId
// @access  Protected
const deleteFile = asyncHandler(async (req, res) => {
  try {
    const { messageId } = req.params;
    
    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: "Message ID is required"
      });
    }
    
    const message = await Message.findById(messageId).populate("chat");
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }
    
    // Check if user is the sender or chat admin
    const isOwner = message.sender.toString() === req.user._id.toString();
    const isGroupAdmin = message.chat.groupAdmin && 
                        message.chat.groupAdmin.toString() === req.user._id.toString();
    
    if (!isOwner && !isGroupAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this file"
      });
    }
    
    // Delete file from disk if it exists
    if (message.fileData && message.fileData.filePath) {
      try {
        if (fs.existsSync(message.fileData.filePath)) {
          fs.unlinkSync(message.fileData.filePath);
        }
      } catch (fileError) {
        console.error("Error deleting file from disk:", fileError);
      }
    }
    
    // Delete message from database
    await Message.findByIdAndDelete(messageId);
    
    res.json({
      success: true,
      message: "File deleted successfully"
    });
    
  } catch (error) {
    console.error("File deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during file deletion",
      error: error.message
    });
  }
});

module.exports = {
  uploadFiles,
  downloadFile,
  previewFile,
  deleteFile
};
