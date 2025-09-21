import { useEffect, useState } from "react";
import { ArrowBackIcon, CloseIcon, SearchIcon } from "@chakra-ui/icons";
import {
  Box,
  FormControl,
  IconButton,
  Spinner,
  Text,
  useToast,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
} from "@chakra-ui/react";
import io from "socket.io-client";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";
import MarkdownEditor from "./MarkdownEditor";
import "../styles/MarkdownChat.css";

const ENDPOINT = "http://localhost:5001"; // Backend is running on port 5001
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);

  const { user, selectedChat, setSelectedChat, notification, setNotification } =
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

  // Add keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        toggleSearch();
      }
      if (e.key === 'Escape' && showSearch) {
        toggleSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

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

  const handleReply = (message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    // Search through messages
    const results = messages.filter((message, index) =>
      message.content?.toLowerCase().includes(query.toLowerCase())
    ).map((message, idx) => ({
      message,
      index: messages.indexOf(message)
    }));

    setSearchResults(results);
    setCurrentSearchIndex(0);

    // Scroll to first result if found
    if (results.length > 0) {
      scrollToMessage(results[0].index);
    }
  };

  const scrollToMessage = (messageIndex) => {
    const messageElements = document.querySelectorAll('.message-item');
    if (messageElements[messageIndex]) {
      messageElements[messageIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // Add highlight effect
      messageElements[messageIndex].classList.add('highlight-message');
      setTimeout(() => {
        messageElements[messageIndex].classList.remove('highlight-message');
      }, 2000);
    }
  };

  const handleNextSearchResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    scrollToMessage(searchResults[nextIndex].index);
  };

  const handlePrevSearchResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex = currentSearchIndex === 0
      ? searchResults.length - 1
      : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    scrollToMessage(searchResults[prevIndex].index);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      // Clear search when closing
      setSearchQuery("");
      setSearchResults([]);
      setCurrentSearchIndex(0);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    socket.emit("stop typing", selectedChat._id);
    const messageToSend = newMessage; // Store message before clearing
    const replyToId = replyingTo?._id; // Store reply ID before clearing

    try {
      setNewMessage(""); // Clear message field immediately for better UX
      setReplyingTo(null); // Clear reply state

      const requestBody = {
        content: messageToSend, // Use stored message
        chatId: selectedChat._id,
      };

      // Add reply reference if replying to a message
      if (replyToId) {
        requestBody.replyTo = replyToId;
      }

      const response = await fetch("/api/message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();

      socket.emit("new message", data);
      setMessages([...messages, data]); // Add new message with existing messages
    } catch (error) {
      setNewMessage(messageToSend); // Restore message on error
      setReplyingTo(replyToId ? { _id: replyToId } : null); // Restore reply state on error
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
                <Flex gap={2}>
                  <IconButton
                    icon={<SearchIcon />}
                    onClick={toggleSearch}
                    variant={showSearch ? "solid" : "ghost"}
                    aria-label="Search messages"
                  />
                  <ProfileModal user={getSenderFull(user, selectedChat.users)} />
                </Flex>
              </>
            ) : (
              <>
                {selectedChat.chatName.toUpperCase()}
                <Flex gap={2}>
                  <IconButton
                    icon={<SearchIcon />}
                    onClick={toggleSearch}
                    variant={showSearch ? "solid" : "ghost"}
                    aria-label="Search messages"
                  />
                  <UpdateGroupChatModal
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                    fetchMessages={fetchMessages}
                  />
                </Flex>
              </>
            )}
          </Text>

          {/* Search Bar */}
          {showSearch && (
            <Box
              p={3}
              mb={2}
              bg="white"
              borderRadius="lg"
              boxShadow="sm"
            >
              <Flex gap={2} align="center">
                <InputGroup flex={1}>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    autoFocus
                  />
                </InputGroup>
                {searchResults.length > 0 && (
                  <>
                    <Badge colorScheme="blue">
                      {currentSearchIndex + 1}/{searchResults.length}
                    </Badge>
                    <IconButton
                      size="sm"
                      icon={<ArrowBackIcon />}
                      onClick={handlePrevSearchResult}
                      aria-label="Previous result"
                    />
                    <IconButton
                      size="sm"
                      icon={<ArrowBackIcon transform="rotate(180deg)" />}
                      onClick={handleNextSearchResult}
                      aria-label="Next result"
                    />
                  </>
                )}
                <IconButton
                  size="sm"
                  icon={<CloseIcon />}
                  onClick={toggleSearch}
                  aria-label="Close search"
                />
              </Flex>
            </Box>
          )}

          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
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
                  messages={messages}
                  isTyping={isTyping}
                  onReply={handleReply}
                  searchQuery={searchQuery}
                />
              </div>
            )}

            {/* Reply Preview */}
            {replyingTo && (
              <Box
                bg="gray.100"
                p={3}
                borderRadius="md"
                borderLeft="4px solid #4A90E2"
                mb={2}
              >
                <Flex justify="space-between" align="center">
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" color="gray.600">
                      Replying to {replyingTo.sender.name}
                    </Text>
                    <Text fontSize="sm" color="gray.700" isTruncated>
                      {replyingTo.content.length > 80
                        ? `${replyingTo.content.substring(0, 80)}...`
                        : replyingTo.content
                      }
                    </Text>
                  </Box>
                  <IconButton
                    icon={<CloseIcon />}
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelReply}
                    aria-label="Cancel reply"
                  />
                </Flex>
              </Box>
            )}

            <FormControl mt="3" isRequired>
              <MarkdownEditor
                value={newMessage}
                onChange={(e) => typingHandler(e)}
                onSend={handleSendMessage}
                placeholder={
                  replyingTo
                    ? "Type your reply in markdown..."
                    : "Type your message in markdown..."
                }
                isLoading={false}
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
