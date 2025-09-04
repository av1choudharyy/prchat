import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowBackIcon, AttachmentIcon } from "@chakra-ui/icons";
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
  Tooltip,
} from "@chakra-ui/react";
import io from "socket.io-client";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Popover, PopoverContent, PopoverTrigger, Portal } from "@chakra-ui/react";

const ENDPOINT = "http://localhost:5000"; // If you are deploying the app, replace the value with "https://YOUR_DEPLOYED_APPLICATION_URL" then run "npm run build" to create a production build
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [availableChats, setAvailableChats] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showUserSelection, setShowUserSelection] = useState(false);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const quillContainerRef = useRef(null);
  const quillRef = useRef(null);
  const quickReplies = useMemo(() => ["Okay", "Thank you", "Sounds good", "On it", "Will do", "Let's talk later"], []);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const emojis = useMemo(
    () => [
      "😀","😃","😄","😁","😆","🥹","😂","🤣","😊","😇","🙂","😉","😌","😍","🥰","😘","😗","😙","😚","🤗",
      "🤔","🤨","😐","😑","😶","🙄","😏","😣","😥","😮","🤐","😯","😪","😫","🥱","😴","🤤","😛","😝","😜",
      "🤪","🫠","🤠","😎","🤓"
    ],
    []
  );

  const { user, selectedChat, setSelectedChat, notification, setNotification, chats } =
    ChatState();
  const toast = useToast();

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

  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) => {
      const contentMatch = m.content?.toLowerCase().includes(q);
      const replyContentMatch = m.replyTo?.content?.toLowerCase().includes(q);
      const senderMatch = m.sender?.name?.toLowerCase().includes(q);
      const replySenderMatch = m.replyTo?.sender?.name
        ?.toLowerCase()
        .includes(q);
      return contentMatch || replyContentMatch || senderMatch || replySenderMatch;
    });
  }, [messages, searchQuery]);

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));

    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // Add hover titles to Quill toolbar buttons
    const root = quillContainerRef.current;
    if (!root) return;
    const toolbar = root.querySelector?.('.ql-toolbar');
    if (!toolbar) return;
    const setTitle = (selector, title) => {
      const el = toolbar.querySelector(selector);
      if (el && !el.getAttribute('title')) el.setAttribute('title', title);
    };
    setTitle('.ql-bold', 'Bold');
    setTitle('.ql-italic', 'Italic');
    setTitle('.ql-underline', 'Underline');
    setTitle('.ql-strike', 'Strikethrough');
    setTitle('.ql-color .ql-picker-label', 'Text color');
    setTitle('.ql-background .ql-picker-label', 'Highlight');
    setTitle('.ql-size .ql-picker-label', 'Font size');
    setTitle('.ql-header .ql-picker-label', 'Heading');
    setTitle('.ql-clean', 'Clear formatting');
  }, [selectedChat]);

  useEffect(() => {
    fetchMessages(); // Whenever users switches chat, call the function again
    selectedChatCompare = selectedChat;
    // eslint-disable-next-line
  }, [selectedChat]);

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
    // Check if 'Enter' key is pressed and we have something inside 'newMessage'
    if (e.key === "Enter" && newMessage) {
      await sendMessageContent();
    }
  };

  const sendMessageContent = async () => {
    if (!newMessage.trim() && !replyToMessage) return;
    
    socket.emit("stop typing", selectedChat._id);
    try {
      const messageToSend = newMessage;
      setNewMessage(""); // Clear message field before making API call

      const response = await fetch("/api/message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: messageToSend,
          chatId: selectedChat._id,
          replyTo: replyToMessage?._id || null,
        }),
      });
      const data = await response.json();

      socket.emit("new message", data);
      setNewMessage("");
      setReplyToMessage(null);
      setMessages([...messages, data]); // Add new message with existing messages
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
  };

  const typingHandler = (e) => {
    // This handler is kept for compatibility but not used by ReactQuill
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

  const handleForward = async (message) => {
    setForwardingMessage(message);
    setShowForwardModal(true);
    setShowUserSelection(true);
    
    // Fetch available users for forwarding
    try {
      console.log("Fetching users for forwarding...");
      const response = await fetch("/api/user", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Fetched users data:", data);
      
      if (Array.isArray(data)) {
        setAvailableUsers(data);
        console.log("Set available users:", data.length);
      } else {
        console.error("Invalid users data format:", data);
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Error",
        description: "Failed to load users for forwarding",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
      setAvailableUsers([]);
    }
  };

  const forwardMessage = async (targetUserId) => {
    if (!forwardingMessage || !targetUserId) return;
    
    try {
      // First, create or access a chat with the target user
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: targetUserId,
        }),
      });
      
      if (!chatResponse.ok) {
        throw new Error("Failed to create/access chat");
      }
      
      const chatData = await chatResponse.json();
      const targetChatId = chatData._id;
      
      // Now send the forwarded message
      const messageResponse = await fetch("/api/message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: forwardingMessage.content || "",
          chatId: targetChatId,
          attachment: forwardingMessage.attachment || null,
        }),
      });
      
      if (messageResponse.ok) {
        toast({
          title: "Message forwarded",
          description: "Message has been forwarded successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "bottom-right",
        });
        setShowForwardModal(false);
        setForwardingMessage(null);
        setShowUserSelection(false);
      } else {
        throw new Error("Failed to send forwarded message");
      }
    } catch (error) {
      console.error("Forward error:", error);
      toast({
        title: "Forward failed",
        description: error.message || "Failed to forward the message",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
    }
  };

  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/single", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
        body: formData,
      });
      const up = await res.json();
      if (!res.ok) {
        throw new Error(up?.message || "Upload failed");
      }

      console.log("Upload response:", up); // Debug log

      const apiBase =
        process.env.REACT_APP_API_BASE ||
        `${window.location.protocol}//${window.location.hostname}:5000`;
      const absoluteUrl = up.url?.startsWith("http") ? up.url : `${apiBase}${up.url}`;

      const attachment = {
        url: absoluteUrl,
        name: up.name,
        size: up.size,
        type: up.mimeType?.startsWith("image/") || up.name?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ? "image" : "file",
      };

      console.log("Created attachment:", attachment); // Debug log

      const response = await fetch("/api/message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: "",
          chatId: selectedChat._id,
          attachment,
        }),
      });
      const data = await response.json();
      socket.emit("new message", data);
      setMessages((prev) => [...prev, data]);
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err.message || "Please try again",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom-right",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
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
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {!selectedChat.isGroupChat ? (
              <>
                {getSender(user, selectedChat.users)}
                <ProfileModal user={getSenderFull(user, selectedChat.users)} />
              </>
            ) : (
              <>
                {selectedChat.chatName.toUpperCase()}
                <UpdateGroupChatModal
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                  fetchMessages={fetchMessages}
                />
              </>
            )}
          </Text>

          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg={{ base: "#E8E8E8", _dark: "gray.700" }}
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
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
                  scrollbarWidth: "none",
                }}
              >
                <ScrollableChat
                  messages={filteredMessages}
                  isTyping={isTyping}
                  onReply={(m) => setReplyToMessage(m)}
                  onCopy={(text) => navigator.clipboard.writeText(text)}
                  onForward={handleForward}
                />
              </div>
            )}

            <FormControl mt="3">
              <Input
                variant="outline"
                bg={{ base: "white", _dark: "gray.800" }}
                color={{ base: "gray.800", _dark: "gray.100" }}
                borderColor={{ base: "gray.200", _dark: "gray.600" }}
                _hover={{ borderColor: { base: "gray.300", _dark: "gray.500" } }}
                _focus={{ borderColor: { base: "blue.400", _dark: "blue.300" } }}
                _placeholder={{ color: { base: "gray.500", _dark: "gray.400" } }}
                placeholder="Search in conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                mb="2"
              />
            </FormControl>

            <FormControl mt="1" isRequired>
              {replyToMessage ? (
                <Box
                  mb="2"
                  p="3"
                  bg="#E8F4FD"
                  borderLeft="3px solid #38B2AC"
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box flex="1">
                    <Text fontSize="xs" fontWeight="600" color="#38B2AC" mb="1">
                      Replying to {replyToMessage.sender?.name}
                    </Text>
                    <Text fontSize="sm" color="gray.700" noOfLines={2}>
                      {replyToMessage.attachment?.url ? (
                        replyToMessage.attachment.type === "image" ? (
                          "🖼️ Image"
                        ) : (
                          `📎 ${replyToMessage.attachment.name || "File"}`
                        )
                      ) : (
                        replyToMessage.content || "Message"
                      )}
                    </Text>
                  </Box>
                  <IconButton
                    size="sm"
                    ml="2"
                    onClick={() => setReplyToMessage(null)}
                    aria-label="Cancel reply"
                    icon={<span style={{ fontWeight: 700 }}>×</span>}
                    variant="ghost"
                    colorScheme="blue"
                  />
                </Box>
              ) : null}
              <Box position="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: "none" }}
                  onChange={handleFilePick}
                  disabled={uploading}
                />
                <Box position="absolute" left="2" top="3" zIndex="1" display="flex" gap="2">
                  <Tooltip label="Share document or image" placement="top" hasArrow>
                    <IconButton
                      size="sm"
                      aria-label="Attach file"
                      icon={<AttachmentIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      isLoading={uploading}
                      variant="ghost"
                      colorScheme="gray"
                      _hover={{ bg: "rgba(0,0,0,0.1)" }}
                    />
                  </Tooltip>
                  <Tooltip label={recording ? "Stop recording" : "Record voice message"} placement="top" hasArrow>
                    <IconButton
                      size="sm"
                      aria-label="Record voice"
                      icon={<span>{recording ? "■" : "🎤"}</span>}
                      variant="ghost"
                      colorScheme={recording ? "red" : "gray"}
                      onClick={async () => {
                        if (recording) {
                          try {
                            mediaRecorderRef.current?.stop();
                          } catch {}
                          return;
                        }
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                          const chunks = [];
                          const mr = new MediaRecorder(stream);
                          mediaRecorderRef.current = mr;
                          mr.ondataavailable = (e) => {
                            if (e.data && e.data.size > 0) chunks.push(e.data);
                          };
                          mr.onstop = async () => {
                            setRecording(false);
                            const blob = new Blob(chunks, { type: "audio/webm" });
                            const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
                            const formData = new FormData();
                            formData.append("file", file);
                            try {
                              setUploading(true);
                              const res = await fetch("/api/upload/single", {
                                method: "POST",
                                headers: { Authorization: `Bearer ${user.token}` },
                                body: formData,
                              });
                              const up = await res.json();
                              if (!res.ok) throw new Error(up?.message || "Upload failed");
                              const apiBase =
                                process.env.REACT_APP_API_BASE ||
                                `${window.location.protocol}//${window.location.hostname}:5000`;
                              const absoluteUrl = up.url?.startsWith("http") ? up.url : `${apiBase}${up.url}`;
                              const attachment = { url: absoluteUrl, name: up.name || file.name, size: up.size, type: "audio" };
                              const response = await fetch("/api/message", {
                                method: "POST",
                                headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "application/json" },
                                body: JSON.stringify({ content: "", chatId: selectedChat._id, attachment }),
                              });
                              const data = await response.json();
                              socket.emit("new message", data);
                              setMessages((prev) => [...prev, data]);
                            } catch (err) {
                              toast({ title: "Voice upload failed", description: err.message || "Please try again", status: "error", duration: 4000, isClosable: true, position: "bottom-right" });
                            } finally {
                              setUploading(false);
                              stream.getTracks().forEach((t) => t.stop());
                            }
                          };
                          mr.start();
                          setRecording(true);
                        } catch (err) {
                          toast({ title: "Microphone access denied", description: err.message || "Please allow microphone permissions", status: "error", duration: 4000, isClosable: true, position: "bottom-right" });
                        }
                      }}
                    />
                  </Tooltip>
                  <Popover placement="top-start">
                    <PopoverTrigger>
                      <IconButton size="sm" aria-label="Emoji" variant="ghost" colorScheme="gray" _hover={{ bg: "rgba(0,0,0,0.1)" }} icon={<span>😊</span>} />
                    </PopoverTrigger>
                    <Portal>
                      <PopoverContent w="260px" p="2">
                        <Box display="grid" gridTemplateColumns="repeat(8, 1fr)" gap="1">
                          {emojis.map((e, idx) => (
                            <Box key={idx} as="button" onClick={() => {
                              const quill = quillRef.current?.getEditor?.();
                              if (quill) {
                                const range = quill.getSelection(true);
                                if (range) {
                                  quill.insertText(range.index, e);
                                  quill.setSelection(range.index + e.length, 0);
                                } else {
                                  quill.insertText(quill.getLength() - 1, e);
                                }
                              } else {
                                setNewMessage((prev) => (prev || "") + e);
                              }
                            }} style={{ fontSize: 18, padding: 4 }}>
                              {e}
                            </Box>
                          ))}
                        </Box>
                      </PopoverContent>
                    </Portal>
                  </Popover>
                </Box>
                <Box ref={quillContainerRef} pl="10" pr="12" bg={{ base: "#FFFFFF", _dark: "gray.800" }} borderRadius="md" borderWidth="1px" borderColor={{ base: "gray.200", _dark: "gray.600" }}>
                  {/* Quick reply suggestions */}
                  <Box px="2" pt="2" pb="1" mb="2" display="flex" flexWrap="wrap" gap="2">
                    {quickReplies.map((text) => (
                      <Box
                        key={text}
                        as="button"
                        onClick={() => {
                          const quill = quillRef.current?.getEditor?.();
                          if (quill) {
                            const range = quill.getSelection(true);
                            const insert = text + " ";
                            if (range) {
                              quill.insertText(range.index, insert);
                              quill.setSelection(range.index + insert.length, 0);
                            } else {
                              quill.insertText(quill.getLength() - 1, insert);
                            }
                          } else {
                            setNewMessage((prev) => {
                              const fallback = (prev || "").replace(/<p><br\/><\/p>$/i, "");
                              return fallback + text + " ";
                            });
                          }
                        }}
                        px="2"
                        py="1"
                        bg={{ base: "#F1F5F9", _dark: "gray.700" }}
                        borderRadius={12}
                        fontSize={12}
                        borderWidth="1px"
                        borderColor={{ base: "#E2E8F0", _dark: "gray.600" }}
                        color={{ base: "gray.800", _dark: "gray.100" }}
                        _hover={{ bg: { base: "#E5EAF1", _dark: "gray.600" } }}
                        cursor="pointer"
                      >
                        {text}
                      </Box>
                    ))}
                  </Box>
                  <ReactQuill
                    theme="snow"
                    ref={quillRef}
                    value={newMessage}
                    onChange={(html) => {
                      setNewMessage(html);
                      // Extract plain text for filtering suggestions
                      const textContent = html.replace(/<[^>]*>/g, '').trim();
                      if (textContent.length > 0) {
                        const filtered = quickReplies.filter(reply => 
                          reply.toLowerCase().includes(textContent.toLowerCase())
                        );
                        setFilteredSuggestions(filtered);
                        setShowSuggestions(filtered.length > 0);
                      } else {
                        setShowSuggestions(false);
                        setFilteredSuggestions([]);
                      }
                      // Typing indicator logic for rich editor
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
                    }}
                    placeholder="Write a message..."
                    modules={{
                      toolbar: [
                        [{ header: [false, 1, 2, 3] }],
                        ["bold", "italic", "underline", "strike"],
                        [{ color: [] }, { background: [] }],
                        [{ size: ["small", false, "large", "huge"] }],
                        ["clean"],
                      ],
                    }}
                    formats={[
                      "header",
                      "bold",
                      "italic",
                      "underline",
                      "strike",
                      "color",
                      "background",
                      "size",
                    ]}
                    style={{ minHeight: 80 }}
                  />
                  {/* Smart suggestions based on typed text */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <Box
                      position="absolute"
                      top="-40px"
                      left="10px"
                      right="10px"
                      bg={{ base: "white", _dark: "gray.800" }}
                      borderWidth="1px"
                      borderColor={{ base: "gray.200", _dark: "gray.600" }}
                      borderRadius="md"
                      p="2"
                      boxShadow="md"
                      zIndex="10"
                    >
                      <Text fontSize="xs" color="gray.500" mb="1">Suggestions:</Text>
                      <Box display="flex" flexWrap="wrap" gap="1">
                        {filteredSuggestions.map((suggestion, idx) => (
                          <Box
                            key={idx}
                            as="button"
                            onClick={() => {
                              const quill = quillRef.current?.getEditor?.();
                              if (quill) {
                                const range = quill.getSelection(true);
                                if (range) {
                                  quill.insertText(range.index, suggestion + " ");
                                  quill.setSelection(range.index + suggestion.length + 1, 0);
                                } else {
                                  quill.insertText(quill.getLength() - 1, suggestion + " ");
                                }
                              } else {
                                setNewMessage((prev) => (prev || "") + suggestion + " ");
                              }
                              setShowSuggestions(false);
                            }}
                            px="2"
                            py="1"
                            bg={{ base: "blue.50", _dark: "blue.900" }}
                            color={{ base: "blue.700", _dark: "blue.200" }}
                            borderRadius="sm"
                            fontSize="xs"
                            _hover={{ bg: { base: "blue.100", _dark: "blue.800" } }}
                            cursor="pointer"
                          >
                            {suggestion}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
                <Tooltip label="Send" placement="top" hasArrow>
                  <IconButton
                    position="absolute"
                    right="2"
                    top="1"
                    size="sm"
                    colorScheme="blue"
                    aria-label="Send message"
                    icon={<span style={{ fontSize: "18px", fontWeight: "bold" }}>→</span>}
                    onClick={sendMessageContent}
                    isDisabled={(!newMessage || !newMessage.replace(/<(.|\n)*?>/g, "").trim()) && !replyToMessage}
                    _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                    _hover={{ transform: "scale(1.1)" }}
                    transition="all 0.2s"
                  />
                </Tooltip>
              </Box>
            </FormControl>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="3xl" pb="3" fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}

      {/* Forward Modal */}
      {showForwardModal && forwardingMessage && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="rgba(0,0,0,0.5)"
          zIndex="1000"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            bg="white"
            p="6"
            borderRadius="lg"
            maxW="400px"
            w="90%"
            maxH="80vh"
            overflowY="auto"
          >
            <Text fontSize="lg" fontWeight="bold" mb="4">
              Forward Message
            </Text>
            
            {/* Message Preview */}
            <Box
              p="3"
              bg="gray.100"
              borderRadius="md"
              mb="4"
              borderLeft="3px solid #38B2AC"
            >
              <Text fontSize="sm" color="gray.600" mb="1">
                {forwardingMessage.sender?.name}
              </Text>
              <Text fontSize="sm">
                {forwardingMessage.attachment?.url ? (
                  forwardingMessage.attachment.type === "image" ? (
                    "🖼️ Image"
                  ) : (
                    `📎 ${forwardingMessage.attachment.name || "File"}`
                  )
                ) : (
                  forwardingMessage.content || "Message"
                )}
              </Text>
            </Box>

            {/* Chat Selection */}
            <Text fontSize="sm" fontWeight="semibold" mb="2">
              Select a user to forward to:
            </Text>
            
            {/* Debug Button */}
            <Box mb="2" textAlign="center">
              <IconButton
                size="sm"
                onClick={async () => {
                  console.log("Manual fetch triggered");
                  console.log("User token:", user.token ? "Present" : "Missing");
                  console.log("Current user:", user);
                  console.log("Available users:", availableUsers);
                  console.log("Available users length:", availableUsers?.length);
                  
                  try {
                    const response = await fetch("/api/user", {
                      method: "GET",
                      headers: {
                        Authorization: `Bearer ${user.token}`,
                      },
                    });
                    
                    console.log("Response status:", response.status);
                    console.log("Response headers:", response.headers);
                    
                    if (!response.ok) {
                      const errorText = await response.text();
                      console.error("Response not OK:", response.status, errorText);
                      throw new Error(`HTTP ${response.status}: ${errorText}`);
                    }
                    
                    const data = await response.json();
                    console.log("Manual fetch result:", data);
                    console.log("Data type:", typeof data);
                    console.log("Is array:", Array.isArray(data));
                    console.log("Data length:", data?.length);
                    
                    setAvailableUsers(data || []);
                  } catch (error) {
                    console.error("Manual fetch error:", error);
                    toast({
                      title: "Fetch Error",
                      description: error.message,
                      status: "error",
                      duration: 5000,
                      isClosable: true,
                      position: "bottom-right",
                    });
                  }
                }}
                aria-label="Debug fetch users"
                icon={<span>🔄</span>}
                variant="outline"
                colorScheme="gray"
              />
              <Text fontSize="xs" color="gray.500">Debug: Refresh users</Text>
            </Box>
            
            {/* Show available users */}
            <Box maxH="200px" overflowY="auto">
              {availableUsers && availableUsers.length > 0 ? (
                availableUsers.map((userItem) => (
                  <Box
                    key={userItem._id}
                    p="3"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    mb="2"
                    cursor="pointer"
                    _hover={{ bg: "gray.50" }}
                    onClick={() => forwardMessage(userItem._id)}
                  >
                    <Box display="flex" alignItems="center">
                      <Box
                        w="8"
                        h="8"
                        borderRadius="full"
                        bg="gray.300"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        mr="3"
                      >
                        {userItem.pic ? (
                          <img
                            src={userItem.pic}
                            alt={userItem.name}
                            style={{ width: "100%", height: "100%", borderRadius: "50%" }}
                          />
                        ) : (
                          <Text fontSize="sm" fontWeight="bold">
                            {userItem.name?.charAt(0)?.toUpperCase()}
                          </Text>
                        )}
                      </Box>
                      <Box>
                        <Text fontWeight="medium">{userItem.name}</Text>
                        <Text fontSize="sm" color="gray.600">{userItem.email}</Text>
                      </Box>
                    </Box>
                  </Box>
                ))
              ) : (
                <Box p="3" textAlign="center" color="gray.500">
                  <Text>Loading users...</Text>
                  <Text fontSize="xs">If this persists, try refreshing the page</Text>
                </Box>
              )}
            </Box>

            {/* Close Button */}
            <Box mt="4" textAlign="center">
              <IconButton
                onClick={() => {
                  setShowForwardModal(false);
                  setForwardingMessage(null);
                }}
                aria-label="Close forward modal"
                icon={<span style={{ fontWeight: 700 }}>×</span>}
                variant="ghost"
                size="lg"
              />
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
