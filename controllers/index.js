const { registerUser, authUser, allUsers } = require("./userControllers");
const {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
} = require("./chatControllers");
const { sendMessage, allMessages } = require("./messageControllers");
const { uploadFiles, downloadFile, previewFile, deleteFile } = require("./fileControllers");

module.exports = {
  registerUser,
  authUser,
  allUsers,

  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,

  sendMessage,
  allMessages,

  uploadFiles,
  downloadFile,
  previewFile,
  deleteFile,
};
