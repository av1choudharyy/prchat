import { useEffect, useState, useRef } from "react";
import { ArrowBackIcon, AddIcon } from "@chakra-ui/icons";
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
  useColorMode,
} from "@chakra-ui/react";
import io from "socket.io-client";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";

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
  const fileInputRef = useRef();
  const imageInputRef = useRef();

  const { user, selectedChat, setSelectedChat, notification, setNotification } =
    ChatState();
  const toast = useToast();
  const { colorMode } = useColorMode();

  const fetchMessages = async () => {
    // If no chat is selected, don't do anything
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

  const emojiPickerRef = useRef(null); // 👈 ref for emoji dropdown

  // Close emoji picker on outside click
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
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchMessages(); // Whenever users switches chat, call the function again
    selectedChatCompare = selectedChat;
    // eslint-disable-next-line
  }, [selectedChat]);

  // Add ref for file options dropdown
  const fileOptionsRef = useRef(null);

  // Close file options on outside click
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
          setFetchAgain(!fetchAgain); // Fetch all the chats again
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    });

    // eslint-disable-next-line
  });
  const sendMessage = async (e) => {
    if (e.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const messageContent = newMessage;
        setNewMessage("");

        const response = await fetch("/api/message", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: messageContent,
            chatId: selectedChat._id,
            replyTo: replyTo ? replyTo._id : null, // ✅ include replyTo if set
          }),
        });

        const data = await response.json();

        socket.emit("new message", data);
        setMessages([...messages, data]);

        // ✅ Clear reply/forward after sending
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

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    // Typing Indicator Logic
    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }

    let lastTypingTime = new Date().getTime();
    let timerLength = 3000;

    setTimeout(() => {
      let timeNow = new Date().getTime();
      let timeDiff = timeNow - lastTypingTime;

      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  // Update matchIndexes and currentMatch when searchValue or messages change
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

      // ✅ Clear reply/forward after sending
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

  // Reply handler
  const handleReplyMessage = (msg) => {
    setReplyTo(msg);
    setNewMessage("");
  };

  // Forward handler (simple: set message to forward, then send as new message)
  const handleForwardMessage = (msg) => {
    setForwardMessage(msg);
    setNewMessage(msg.content || "");
  };

  // Emoji handler
  const handleEmojiClick = (emoji) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
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
  setNewMessage(msg);
  sendMessage({ key: "Enter", preventDefault: () => {} });  // ✅ instantly send
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
              onKeyDown={(e) => sendMessage(e)}
              isRequired
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                background: colorMode === "dark" ? "gray.700" : "white",
                borderRadius: "8px",
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
                       color:"black",
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
                      color:"black",
                    }}
                    onClick={() => fileInputRef.current.click()}
                  >
                    Upload File
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
              <Input
                variant="filled"
                bg={colorMode === "dark" ? "gray.700" : "#E0E0E0"}
                color={colorMode === "dark" ? "whiteAlpha.900" : "black"}
                placeholder="Enter a message.."
                value={newMessage}
                onChange={(e) => typingHandler(e)}
                onKeyDown={(e) => sendMessage(e)}
                style={{ flex: 1 }}
                aria-label="Type your message"
              />
              <IconButton
                icon={
                  <span role="img" aria-label="send">
                    ➤
                  </span>
                }
                colorScheme="blue"
                variant="ghost"
                onClick={() =>
                  newMessage.trim() &&
                  sendMessage({ key: "Enter", preventDefault: () => {} })
                }
                aria-label="Send message"
                ml={2}
              />
            </FormControl>
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
