import { useEffect, useState, useRef } from "react";
import { ArrowBackIcon, AddIcon } from "@chakra-ui/icons";
import {
  Box,
  FormControl,
  IconButton,
  Spinner,
  Text,
  useToast,
  useColorMode,
  Tooltip
} from "@chakra-ui/react";
import io from "socket.io-client";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";
import MarkdownMessageInput from "./MarkdownMessageInput";

const ENDPOINT = "http://localhost:5000"; // If you are deploying the app, replace the value with "https://YOUR_DEPLOYED_APPLICATION_URL" then run "npm run build" to create a production build
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchValue, setSearchValue] = useState(""); // Add search state
  const [matchIndexes, setMatchIndexes] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [markdownMessage, setMarkdownMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const fileInputRef = useRef();
  const imageInputRef = useRef();
  const audioInputRef = useRef();
  const markdownInputRef = useRef();
  console.log("check message", markdownMessage, newMessage);
  const { user, selectedChat, setSelectedChat, notification, setNotification } =
    ChatState();
  const toast = useToast();
  const { colorMode } = useColorMode();

  const fetchMessages = async () => {
    if (!selectedChat) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/message/${selectedChat._id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await response.json();

      setMessages(data);
      setLoading(false);

      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      setLoading(false);
      return toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "solid",
      });
    }
  };

  const emojiPickerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    }

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));

    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
  }, []);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
  }, [selectedChat]);

  const fileOptionsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        fileOptionsRef.current &&
        !fileOptionsRef.current.contains(event.target)
      ) {
        setShowFileOptions(false);
      }
    }

    if (showFileOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFileOptions]);

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageRecieved.chat[0]._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    });

  });
  const sendMessage = async (e, messageContent = markdownMessage) => {
    if (e.key === "Enter" && messageContent) {
      socket.emit("stop typing", selectedChat._id);
      try {
        setMarkdownMessage("");
        const response = await fetch("/api/message", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: messageContent,
            chatId: selectedChat._id,
            replyTo: replyTo ? replyTo._id : null,
          }),
        });
        const data = await response.json();
        socket.emit("new message", data);
        setMessages([...messages, data]);
        setReplyTo(null);
        setForwardMessage(null);
      } catch (error) {
        return toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom-right",
          variant: "solid",
        });
      }
    }
  };

  useEffect(() => {
    if (searchValue) {
      const indexes = messages
        .map((msg, i) =>
          msg.content &&
            msg.content.toLowerCase().includes(searchValue.toLowerCase())
            ? i
            : null
        )
        .filter((i) => i !== null);
      setMatchIndexes(indexes);
      setCurrentMatch(0);
    } else {
      setMatchIndexes([]);
      setCurrentMatch(0);
    }
  }, [searchValue, messages]);

  // Handle file/image upload
  const handleFileUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("chatId", selectedChat._id);
      formData.append("file", file);
      formData.append("type", type);
      if (replyTo) formData.append("replyTo", replyTo._id); // ✅ reply for files too

      const response = await fetch("/api/message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      const data = await response.json();

      setShowFileOptions(false);
      socket.emit("new message", data);
      setMessages([...messages, data]);

      setReplyTo(null);
      setForwardMessage(null);
      setNewMessage("");
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to send file/image",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "solid",
      });
    }
  };

  const suggestions = [
    "Hello!",
    "Okay",
    "Thank you",
    "Noted",
    "Will do",
    "Let me check",
    "I'll get back to you",
    "Let's connect soon",
    "I'll update you shortly",
    "Please confirm",
    "Looking forward to your response",
    "Can we schedule a meeting?",
  ];

  const emojiList = [
    "👍",
    "❤️",
    "😂",
    "😮",
    "😢",
    "😡",
    "🎉",
    "🙏",
    "👏",
    "😎",
  ];

  // Copy message handler
  const handleCopyMessage = (msg) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg.content || "");
      toast({
        title: "Copied!",
        description: "Message copied to clipboard.",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
        variant: "solid",
      });
    }
  };

  const handleReplyMessage = (msg) => {
    setReplyTo(msg);
    setNewMessage("");
  };

  const handleForwardMessage = (msg) => {
    setForwardMessage(msg);
    setNewMessage(msg.content || "");
  };

  const insertEmojiAtCursor = (emoji) => {
    const textarea = markdownInputRef.current;
    if (!textarea) {
      setMarkdownMessage((prev) => prev + emoji);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = markdownMessage;
    const before = value.substring(0, start);
    const after = value.substring(end);
    setMarkdownMessage(before + emoji + after);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    }, 0);
  };

  const handleEmojiClick = (emoji) => {
    insertEmojiAtCursor(emoji);
    setShowEmojiPicker(false);
  };

  const exportChatAsMarkdown = () => {
    if (!messages || messages.length === 0) return;
    let md = `# Chat with ${selectedChat.isGroupChat ? selectedChat.chatName : getSender(user, selectedChat.users)}\n\n`;
    messages.forEach(msg => {
      const sender = msg.sender?.name || "Unknown";
      const time = msg.createdAt ? new Date(msg.createdAt).toLocaleString() : "";
      md += `**${sender}** _${time}_\n`;
      md += `${msg.content || ""}\n\n`;
    });
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-history.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (selectedChat) {
      localStorage.setItem("selectedChat", JSON.stringify(selectedChat));
    } else {
      const storedChat = localStorage.getItem("selectedChat");
      if (storedChat) {
        setSelectedChat(JSON.parse(storedChat));
      }
    }
  }, [selectedChat, setSelectedChat]);

  const startRecording = async () => {
    setRecordedAudio(null);
    setAudioChunks([]);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Recording not supported",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new window.MediaRecorder(stream);
      setMediaRecorder(recorder);
      let chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        setAudioChunks([]);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setRecording(true);
    } catch (err) {
      toast({
        title: "Microphone access denied",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const sendRecordedAudio = async () => {
    if (!recordedAudio) return;
    try {
      const formData = new FormData();
      formData.append("chatId", selectedChat._id);
      formData.append("file", recordedAudio, "voice-message.webm");
      formData.append("type", "audio");
      if (replyTo) formData.append("replyTo", replyTo._id);
      const response = await fetch("/api/message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });
      const data = await response.json();
      socket.emit("new message", data);
      setMessages([...messages, data]);
      setReplyTo(null);
      setForwardMessage(null);
      setRecordedAudio(null);
      setAudioChunks([]);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to send audio",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "solid",
      });
    }
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb="3"
            px="2"
            w="100%"
            fontFamily="Work sans"
            display="flex"
            background={colorMode === "dark" ? "gray.700" : "white"}
            justifyContent={{ base: "space-between" }}
            alignItems="center"
            color={colorMode === "dark" ? "whiteAlpha.900" : "black"}
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {!selectedChat.isGroupChat ? (
              <>
                {getSender(user, selectedChat.users)}
                <ProfileModal
                  user={getSenderFull(user, selectedChat.users)}
                  searchValue={searchValue}
                  setSearchValue={setSearchValue}
                  matchIndexes={matchIndexes}
                  currentMatch={currentMatch}
                  setCurrentMatch={setCurrentMatch}
                />
              </>
            ) : (
              <>
                {selectedChat.chatName.toUpperCase()}
                <UpdateGroupChatModal
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                  fetchMessages={fetchMessages}
                  searchValue={searchValue}
                  setSearchValue={setSearchValue}
                  matchIndexes={matchIndexes}
                  currentMatch={currentMatch}
                  setCurrentMatch={setCurrentMatch}
                />
              </>
            )}
          </Text>

          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg={colorMode === "dark" ? "gray.800" : "#E8E8E8"}
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
            color={colorMode === "dark" ? "whiteAlpha.900" : "black"}
          >
            <Tooltip title="Export chat">
              <Box display="flex" justifyContent="flex-end" mb={2}>
                <IconButton
                  icon={<span role="img" aria-label="export">Export</span>}
                  colorScheme="black"
                  variant="outline"
                  onClick={exportChatAsMarkdown}
                  aria-label="Export chat as markdown"
                  size="sm"
                  style={{ paddingInline: 4 }}
                  isDisabled={messages.length === 0}
                />
              </Box>
            </Tooltip>
            {loading ? (
              <Spinner
                size="xl"
                w="20"
                h="20"
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  overflowY: "scroll",
                  flex: 1,
                  scrollbarWidth: "none",
                }}
              >
                <ScrollableChat
                  messages={messages}
                  isTyping={isTyping}
                  searchValue={searchValue}
                  matchIndexes={matchIndexes}
                  currentMatch={currentMatch}
                  onCopyMessage={handleCopyMessage}
                  onReplyMessage={handleReplyMessage}
                  onForwardMessage={handleForwardMessage}
                  onEmojiMessage={setShowEmojiPicker}
                />
              </div>
            )}

            {/* Suggestions Bar */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "8px",
                marginTop: "8px",
              }}
            >
              {suggestions.map((msg, idx) => (
                <button
                  key={idx}
                  style={{
                    background: "#e0e0e0",
                    border: "none",
                    color: "#333",
                    borderRadius: "16px",
                    padding: "4px 12px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                  onClick={() => {
                    setMarkdownMessage(msg);
                    sendMessage({ key: "Enter", preventDefault: () => { } });  // ✅ instantly send
                  }}

                  type="button"
                >
                  {msg}
                </button>
              ))}
            </div>

            {/* Reply/Forward preview above input */}
            {(replyTo || forwardMessage) && (
              <div
                style={{
                  background: "#edf2f7",
                  borderLeft: "4px solid #3182ce",
                  padding: "8px 14px",
                  marginBottom: "6px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontWeight: "bold",
                      marginRight: 8,
                      color: "#3182ce",
                    }}
                  >
                    {replyTo
                      ? `Replying to ${replyTo.sender?.name || "message"}:`
                      : `Forwarding message:`}
                  </span>
                  <span
                    style={{
                      color: "#2d3748",
                      fontStyle: "italic",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {(replyTo || forwardMessage)?.content}
                  </span>
                </div>
                <IconButton
                  icon={<span>&#10005;</span>}
                  size="sm"
                  variant="ghost"
                  colorScheme="blue"
                  aria-label="Cancel"
                  onClick={() => {
                    setReplyTo(null);
                    setForwardMessage(null);
                  }}
                  style={{ marginLeft: 8 }}
                />
              </div>
            )}


            <FormControl
              key={colorMode}
              mt="3"
              isRequired
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                background: colorMode === "dark" ? "gray.700" : "white",
                borderRadius: "8px",
                width: "100%",
              }}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (markdownMessage.trim()) {
                    sendMessage({ key: "Enter", preventDefault: () => { } }, markdownMessage);
                    setMarkdownMessage("");
                  }
                }
              }}
            >

              {/* Plus icon for file/image upload */}
              <IconButton
                icon={<AddIcon />}
                variant="ghost"
                onClick={() => setShowFileOptions((prev) => !prev)}
                aria-label="Add file or image"
                mr={2}
              />
              {/* Emoji picker icon */}
              <IconButton
                icon={
                  <span role="img" aria-label="emoji">
                    😊
                  </span>
                }
                variant="ghost"
                aria-label="Add emoji"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                mr={2}
              />
              {/* Emoji picker dropdown */}
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  style={{
                    position: "absolute",
                    left: 60,
                    bottom: 50,
                    background: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: 6,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    zIndex: 10,
                    padding: "8px 12px",
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  {emojiList.map((emoji, idx) => (
                    <button
                      key={idx}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "22px",
                        cursor: "pointer",
                      }}
                      onClick={() => handleEmojiClick(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              {/* File/Image options dropdown */}
              {showFileOptions && (
                <div
                  ref={fileOptionsRef}
                  style={{
                    position: "absolute",
                    left: 40,
                    bottom: 50,
                    background: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: 6,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    zIndex: 10,
                    padding: "8px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      color: "black",
                    }}
                    onClick={() => imageInputRef.current.click()}
                  >
                    Upload Image
                  </button>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      color: "black",
                    }}
                    onClick={() => fileInputRef.current.click()}
                  >
                    Upload File
                  </button>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      color: "black",
                    }}
                    onClick={startRecording}
                    disabled={recording}
                  >
                    Record Audio
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    style={{ display: "none" }}
                    onChange={(e) => handleFileUpload(e, "image")}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={(e) => handleFileUpload(e, "file")}
                  />
                </div>
              )}
              <Box flex="1" width="70%">
                <MarkdownMessageInput
                  value={markdownMessage}
                  onChange={setMarkdownMessage}
                  placeholder="Type your message here..."
                  // style={{ width: "100%" }}
                  inputRef={markdownInputRef}
                  id="markdown-message-input"
                />
              </Box>
              <IconButton
                icon={<span role="img" aria-label="send">➤</span>}
                colorScheme="blue"
                variant="ghost"
                onClick={() => {
                  if (markdownMessage.trim()) {
                    sendMessage({ key: "Enter", preventDefault: () => { } }, markdownMessage);
                    setMarkdownMessage("");
                  }
                }}
                aria-label="Send message"
                ml={2}
                isDisabled={!markdownMessage.trim()}
              />
            </FormControl>

            {/* Recorder UI */}
            {recording && (
              <div style={{ margin: "8px 0", display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: "#3182ce", fontWeight: "bold" }}>Recording...</span>
                <IconButton
                  icon={<span role="img" aria-label="stop">⏹️</span>}
                  colorScheme="red"
                  variant="outline"
                  onClick={stopRecording}
                  aria-label="Stop recording"
                  size="sm"
                />
              </div>
            )}
            {recordedAudio && (
              <div style={{ margin: "8px 0", display: "flex", alignItems: "center", gap: "12px" }}>
                <audio controls src={recordedAudio ? URL.createObjectURL(recordedAudio) : undefined} style={{ maxWidth: "250px" }} />
                <IconButton
                  icon={<span role="img" aria-label="send">➤</span>}
                  colorScheme="blue"
                  variant="solid"
                  onClick={sendRecordedAudio}
                  aria-label="Send audio"
                  size="sm"
                />
                <IconButton
                  icon={<span role="img" aria-label="cancel">❌</span>}
                  colorScheme="gray"
                  variant="ghost"
                  onClick={() => setRecordedAudio(null)}
                  aria-label="Cancel audio"
                  size="sm"
                />
              </div>
            )}
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
          color={colorMode === "dark" ? "whiteAlpha.900" : "black"}
        >
          <Text fontSize="3xl" pb="3" fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
