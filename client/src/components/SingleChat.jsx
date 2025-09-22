// client/src/components/SingleChat.jsx
import React, { useEffect, useRef, useState } from "react";
import { ArrowBackIcon, MoonIcon, SunIcon } from "@chakra-ui/icons";
import {
  Box,
  FormControl,
  IconButton,
  Textarea,
  Spinner,
  Text,
  useToast,
  CloseButton,
  HStack,
  Button,
  useColorMode,
  useColorModeValue,
  Input,
} from "@chakra-ui/react";
import {
  FiCopy,
  FiCornerDownLeft,
  FiCornerUpRight,
  FiSend,
  FiPaperclip,
  FiSearch,
} from "react-icons/fi";
import io from "socket.io-client";
import { FaThumbtack, FaTrash, FaSmile } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";
import "../App.css";

const ENDPOINT = "http://localhost:5000";
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  // local state
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const [replyTo, setReplyTo] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);

  // emoji picker
  const [showEmoji, setShowEmoji] = useState(false);

  // preview / editor state
  const [mode, setMode] = useState("write"); // "write" | "preview"
  const textareaRef = useRef(null);

  // search
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [scrollToMessageId, setScrollToMessageId] = useState(null);

  const { user, selectedChat, setSelectedChat, notification, setNotification } =
    ChatState();
  const toast = useToast();

  // Chakra color hooks (top-level only)
  const { colorMode, toggleColorMode } = useColorMode();

  const inputBg = useColorModeValue("#fff", "#1a202c");
  const chatAreaBg = useColorModeValue("#F7F7F8", "#071124");
  const headerBg = useColorModeValue("#ffffff", "#071124");
  const headerText = useColorModeValue("black", "white");
  const replyPreviewBg = useColorModeValue("gray.100", "gray.700");
  const replyPreviewText = useColorModeValue("black", "white");
  const containerBg = useColorModeValue("#f2f2f2", "#071124");

  const actionBarBg = useColorModeValue("gray.100", "gray.800");
  const actionBarBorder = useColorModeValue("gray.200", "gray.700");
  const actionBarText = useColorModeValue("gray.800", "gray.100");
  const dividerBorder = useColorModeValue("gray.200", "gray.700");
  const previewBg = useColorModeValue("white", "gray.800");

  // emoji-picker style tokens
  const pickerBg = useColorModeValue("#ffffff", "#0b1220");
  const pickerShadow = useColorModeValue("rgba(15,23,36,0.06)", "rgba(255,255,255,0.03)");
  const pickerText = useColorModeValue("#111827", "#E6EEF8");

  // search hover background (MUST be a top-level hook call)
  const searchHoverBg = useColorModeValue("gray.100", "gray.700");

  // ----------------------------
  // Socket setup & listeners
  // ----------------------------
  useEffect(() => {
    if (!user) return;
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    socket.on("message_delivered", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, delivered: true } : m))
      );
    });

    socket.on("message_seen", ({ messageId, userId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? {
                ...m,
                seenBy: Array.isArray(m.seenBy)
                  ? Array.from(new Set([...m.seenBy, userId]))
                  : [userId],
              }
            : m
        )
      );
    });

    socket.on("message recieved", (newMessageRecieved) => {
      const incomingChatId =
        newMessageRecieved?.chat && newMessageRecieved.chat[0] && newMessageRecieved.chat[0]._id;
      if (!selectedChatCompare || selectedChatCompare._id !== incomingChatId) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        const deliveredMsg = { ...newMessageRecieved, delivered: true, seenBy: [] };
        setMessages((prev) => [...prev, deliveredMsg]);

        try {
          socket.emit("message_delivered", { messageId: deliveredMsg._id, chatId: selectedChat._id });
          socket.emit("message_seen", { messageId: deliveredMsg._id, chatId: selectedChat._id, userId: user._id });
        } catch {}
      }
    });

    return () => {
      socket?.off("typing");
      socket?.off("stop typing");
      socket?.off("message_delivered");
      socket?.off("message_seen");
      socket?.off("message recieved");
    };
    // eslint-disable-next-line
  }, [user]);

  // fetch messages when selected chat changes
  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
    // eslint-disable-next-line
  }, [selectedChat]);

  // ----------------------------
  // Data fetching & helpers
  // ----------------------------
  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/message/${selectedChat._id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();

      // materialize replyTo objects and set defaults
      const enriched = data.map((m) => {
        if (m.replyTo && typeof m.replyTo === "string") {
          const original = data.find((x) => x._id === m.replyTo);
          if (original) m.replyTo = original;
        }
        m.seenBy = m.seenBy ?? [];
        m.delivered = m.delivered ?? false;
        return m;
      });

      setMessages(enriched);
      setLoading(false);
      socket?.emit("join chat", selectedChat._id);
      markMessagesSeen(enriched);
    } catch (err) {
      setLoading(false);
      toast({
        title: "Error Occured!",
        description: "Failed to load messages",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const markMessagesSeen = (msgs) => {
    if (!msgs || !Array.isArray(msgs)) return;
    msgs.forEach((m) => {
      if (m.sender && m.sender._id !== user._id) {
        try {
          socket.emit("message_seen", { messageId: m._id, chatId: selectedChat._id, userId: user._id });
        } catch {}
      }
    });
  };

  // selection toggles
  const handleToggleSelect = (msg) => {
    setSelectedMessages((prev) =>
      prev.some((m) => m._id === msg._id) ? prev.filter((m) => m._id !== msg._id) : [...prev, msg]
    );
  };
  const handleClearSelection = () => setSelectedMessages([]);

  // delete
  const handleDeleteForMe = (msgs) => {
    setMessages((prev) => prev.filter((m) => !msgs.some((s) => s._id === m._id)));
    handleClearSelection();
    toast({ title: "Deleted for me", status: "info", duration: 1600 });
  };

  const handleDeleteForEveryone = (msgs) => {
    setMessages((prev) =>
      prev.map((m) => (msgs.some((s) => s._id === m._id) ? { ...m, deletedForEveryone: true, content: "" } : m))
    );
    msgs.forEach((s) => {
      try {
        socket.emit("message_deleted_for_everyone", { messageId: s._id, chatId: selectedChat._id });
      } catch {}
    });
    handleClearSelection();
    toast({ title: "Deleted for everyone", status: "success", duration: 1600 });
  };

  // reply
  const handleReply = (msg) => {
    if (!msg) return;
    setReplyTo(msg);
    handleClearSelection();
    setMode("write");
    setTimeout(() => textareaRef.current?.focus(), 0);
  };
  const handleCancelReply = () => setReplyTo(null);

  // copy & forward
  const handleCopy = async (msgs) => {
    const text = msgs.map((m) => m.content).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", status: "success", duration: 1200 });
    } catch {
      toast({ title: "Copy failed", status: "error", duration: 1600 });
    }
    handleClearSelection();
  };
  const handleForward = (msgs) => {
    toast({ title: "Forward clicked", description: "Forward modal not implemented", status: "info" });
    handleClearSelection();
  };

  // pin toggle
  const handlePinToggle = (msgs) => {
    let newPinned = [...pinnedMessages];
    msgs.forEach((msg) => {
      if (newPinned.some((p) => p._id === msg._id)) {
        newPinned = newPinned.filter((p) => p._id !== msg._id);
      } else {
        newPinned.push({ ...msg, pinned: true });
      }
    });
    setPinnedMessages(newPinned);
    setMessages((prev) => prev.map((m) => (msgs.some((s) => s._id === m._id) ? { ...m, pinned: !m.pinned } : m)));
    handleClearSelection();
    toast({ title: "Pin toggled", status: "success", duration: 1200 });
  };

  const handleUnpin = (msg) => {
    setPinnedMessages((prev) => prev.filter((p) => p._id !== msg._id));
    setMessages((prev) => prev.map((m) => (m._id === msg._id ? { ...m, pinned: false } : m)));
    toast({ title: "Message unpinned", status: "info", duration: 1200 });
  };

  // send
  const sendMessage = async () => {
    const trimmed = newMessage?.trim();
    if (!trimmed) return;
    try {
      socket.emit("stop typing", selectedChat._id);
    } catch {}
    try {
      const body = { content: newMessage.trim(), chatId: selectedChat._id };
      if (replyTo) body.replyTo = replyTo._id;

      const res = await fetch("/api/message", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (replyTo) data.replyTo = replyTo;
      data.delivered = false;
      data.seenBy = [];

      socket.emit("new message", data);
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
      setReplyTo(null);

      // close emoji picker on send
      setShowEmoji(false);
    } catch {
      toast({ title: "Send failed", status: "error", duration: 2000 });
    }
  };

  // typing handler + ctrl/cmd+enter to send
  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      try {
        socket.emit("typing", selectedChat._id);
      } catch {}
    }

    const lastTypingTime = new Date().getTime();
    setTimeout(() => {
      const now = new Date().getTime();
      if (now - lastTypingTime >= 3000 && typing) {
        try {
          socket.emit("stop typing", selectedChat._id);
        } catch {}
        setTyping(false);
      }
    }, 3000);
  };

  const onEditorKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  // Emoji click handler
  const onEmojiClick = (emojiObject) => {
    setNewMessage((prev) => (prev ? prev + emojiObject.emoji : emojiObject.emoji));
  };

  // search logic: compute results whenever query or messages change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    setSearchResults(messages.filter((m) => (m.content || "").toLowerCase().includes(q)));
  }, [searchQuery, messages]);

  // when a scroll target is set, clear it after a short delay (scroll/highlight performed by ScrollableChat)
  useEffect(() => {
    if (!scrollToMessageId) return;
    const t = setTimeout(() => setScrollToMessageId(null), 3000);
    return () => clearTimeout(t);
  }, [scrollToMessageId]);

  // ---------- JSX ----------
  return (
    <Box height="100%" display="flex" flexDirection="column" bg={containerBg}>
      {/* Header */}
      <Box
        bg={headerBg}
        color={headerText}
        px={4}
        py={3}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        borderBottom="1px solid"
        borderColor={dividerBorder}
        flexShrink={0}
      >
        <HStack spacing={3}>
          <IconButton
            display={{ base: "flex", md: "none" }}
            icon={<ArrowBackIcon />}
            onClick={() => setSelectedChat("")}
            aria-label="Back"
            size="sm"
            variant="ghost"
          />
          <Box>
            <Text fontWeight="semibold">
              {!selectedChat?.isGroupChat ? getSender(user, selectedChat?.users) : selectedChat?.chatName?.toUpperCase()}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {!selectedChat?.isGroupChat ? getSenderFull(user, selectedChat?.users)?.email : `${selectedChat?.users?.length || 0} members`}
            </Text>
          </Box>
        </HStack>

        <HStack spacing={2}>
          {selectedChat?.isGroupChat ? (
            <UpdateGroupChatModal fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} fetchMessages={fetchMessages} />
          ) : (
            <ProfileModal user={getSenderFull(user, selectedChat?.users)} />
          )}

          {/* search icon/button */}
          <IconButton aria-label="Search" icon={<FiSearch />} onClick={() => setShowSearch((s) => !s)} size="sm" variant="ghost" />

          <IconButton aria-label="Toggle color mode" icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />} onClick={toggleColorMode} size="sm" variant="ghost" />
        </HStack>
      </Box>

      {/* Search overlay (small) */}
      {showSearch && (
        <Box bg={headerBg} borderBottom="1px solid" borderColor={dividerBorder} px={3} py={2}>
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="sm"
            bg={inputBg}
          />
          {searchResults.length > 0 && (
            <Box mt={2} maxH="200px" overflowY="auto">
              {searchResults.map((msg) => (
                <Box
                  key={msg._id}
                  p={2}
                  borderRadius="md"
                  _hover={{ bg: searchHoverBg, cursor: "pointer" }}
                  onClick={() => {
                    setScrollToMessageId(msg._id);
                    setShowSearch(false);
                  }}
                >
                  <Text fontSize="sm" noOfLines={2}>
                    {msg.content || "—"}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {new Date(msg.createdAt).toLocaleString()}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Action bar when messages selected */}
      {selectedMessages.length > 0 && (
        <Box
          bg={actionBarBg}
          borderBottom="1px solid"
          borderColor={actionBarBorder}
          px={3}
          py={2}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexShrink={0}
          color={actionBarText}
        >
          <HStack spacing={2}>
            <Text fontWeight="semibold">{selectedMessages.length} selected</Text>
            <IconButton aria-label="Reply" icon={<FiCornerDownLeft />} size="sm" onClick={() => handleReply(selectedMessages[selectedMessages.length - 1])} />
            <IconButton aria-label="Forward" icon={<FiCornerUpRight />} size="sm" onClick={() => handleForward(selectedMessages)} />
            <IconButton aria-label="Copy" icon={<FiCopy />} size="sm" onClick={() => handleCopy(selectedMessages)} />
            <IconButton aria-label="Pin" icon={<FaThumbtack />} size="sm" onClick={() => handlePinToggle(selectedMessages)} />
            <IconButton aria-label="Delete" icon={<FaTrash />} size="sm" colorScheme="red" onClick={() => handleDeleteForEveryone(selectedMessages)} />
          </HStack>
        </Box>
      )}

      {/* Chat area */}
      <Box flex="1" display="flex" flexDirection="column" p={4} overflow="hidden" bg={chatAreaBg}>
        {loading ? (
          <Spinner size="xl" w="20" h="20" alignSelf="center" margin="auto" />
        ) : (
          <Box flex="1" minHeight={0}>
            <ScrollableChat
              messages={messages}
              pinnedMessages={pinnedMessages}
              isTyping={isTyping}
              selectedMessages={selectedMessages}
              onToggleSelect={handleToggleSelect}
              onUnpin={handleUnpin}
              scrollToMessageId={scrollToMessageId}
            />
          </Box>
        )}

        {/* Reply preview */}
        {replyTo && (
          <Box bg={replyPreviewBg} p={2} borderRadius="md" my={2} color={replyPreviewText}>
            <HStack justify="space-between" alignItems="center">
              <Box>
                <Text fontSize="sm" fontWeight="bold">
                  {replyTo.sender?.name}
                </Text>
                <Text fontSize="sm" noOfLines={1}>
                  {replyTo.content}
                </Text>
              </Box>
              <CloseButton onClick={handleCancelReply} />
            </HStack>
          </Box>
        )}

        {/* Input region */}
        <Box mt={2} borderTop="1px solid" borderColor={dividerBorder} pt={3} flexShrink={0}>
          {mode === "write" ? (
            <FormControl>
              <Box position="relative">
                {/* Textarea */}
                <Textarea
                  id="prchat-input"
                  ref={textareaRef}
                  value={newMessage}
                  onChange={typingHandler}
                  onKeyDown={onEditorKeyDown}
                  placeholder="Write a markdown message. Use Ctrl/Cmd+Enter to send."
                  minH="48px"
                  maxH="300px"
                  resize="auto"
                  bg={inputBg}
                  borderRadius="md"
                />

                {/* File attach placeholder (left of emoji) */}
                <Box position="absolute" right="100px" top="8px" zIndex={20}>
                  <IconButton
                    size="sm"
                    aria-label="Attach File"
                    onClick={() => {
                      console.log("Attach file clicked");
                    }}
                    icon={<FiPaperclip size={26} />}
                    variant="ghost"
                  />
                </Box>

                {/* emoji toggle */}
                <Box position="absolute" right="55px" top="8px" zIndex={30}>
                  <IconButton
                    colorScheme = "Yellow"
                    size="sm"
                    aria-label="Emoji"
                    onClick={() => setShowEmoji((s) => !s)}
                    icon={<FaSmile size={28} />}
                    variant="ghost"

                  />
                </Box>

                {/* Send button */}
                <Box position="absolute" right="3px" top="8px" zIndex={10}>
                  <Button colorScheme="green" onClick={sendMessage} size="sm" isDisabled={!newMessage.trim()}>
                    <FiSend />
                  </Button>
                </Box>

                {/* Emoji picker - appears above input, supports dark/light theme */}
                {showEmoji && (
                  <Box
                    position="absolute"
                    right="3px"
                    bottom="56px"
                    zIndex={200}
                    borderRadius="md"
                    boxShadow={`0 6px 18px ${pickerShadow}`}
                    overflow="hidden"
                    background={pickerBg}
                  >
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      theme={colorMode === "light" ? "light" : "dark"}
                      pickerStyle={{
                        width: "320px",
                        height: "360px",
                        background: pickerBg,
                        color: pickerText,
                        borderRadius: 8,
                        boxShadow: "none",
                      }}
                    />
                  </Box>
                )}
              </Box>

              {/* Bottom controls in single row: Close (if reply preview open), Clear, Write/Preview toggle */}
              <HStack mt={2} justifyContent="space-between" alignItems="center">
                <HStack spacing={2}>
                  {/* If there's a reply preview, show Close for it */}
                  {replyTo && (
                    <Button size="sm" variant="outline" onClick={handleCancelReply}>
                      Close
                    </Button>
                  )}
                  <Button onClick={() => { setNewMessage(""); setMode("write"); }} variant="outline" size="sm">
                    Clear
                  </Button>
                </HStack>

                <HStack spacing={2}>
                  <Button size="sm" variant={mode === "write" ? "solid" : "ghost"} onClick={() => setMode("write")}>
                    Write
                  </Button>
                  <Button size="sm" variant={mode === "preview" ? "solid" : "ghost"} onClick={() => setMode("preview")}>
                    Preview
                  </Button>
                </HStack>
              </HStack>
            </FormControl>
          ) : (
            <Box p={3} borderRadius="md" bg={previewBg}>
              <ScrollableChat
                messages={[
                  {
                    _id: "preview",
                    content: newMessage || "*Nothing to preview*",
                    sender: user,
                    createdAt: new Date().toISOString(),
                  },
                ]}
                pinnedMessages={[]}
                isTyping={false}
                selectedMessages={[]}
                onToggleSelect={() => {}}
                onUnpin={() => {}}
                previewMode
              />
              <HStack mt={2} justifyContent="flex-end">
                <Button onClick={() => setMode("write")} size="sm">
                  Edit
                </Button>
                <Button colorScheme="green" onClick={sendMessage} size="sm" isDisabled={!newMessage.trim()}>
                  Send
                </Button>
              </HStack>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default SingleChat;
