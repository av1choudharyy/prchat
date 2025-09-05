import { useEffect, useState, useRef } from "react";
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  Button,
  useToast,
  HStack,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Fade,
} from "@chakra-ui/react";
import { ArrowBackIcon, CopyIcon, RepeatIcon, ChatIcon, RepeatClockIcon, ChevronDownIcon } from "@chakra-ui/icons";
import io from "socket.io-client";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";

const ENDPOINT = "http://localhost:5000";
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollRef = useRef();
  const chatContainerRef = useRef();
  const { user, selectedChat, setSelectedChat, notification, setNotification, chats } = ChatState();
  const toast = useToast();

  // --- Fetch messages with pagination ---
  const fetchMessages = async (loadMore = false) => {
    if (!selectedChat) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/message/${selectedChat._id}?page=${loadMore ? page : 1}&limit=20`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (data.length < 20) setHasMore(false);

      if (loadMore) {
        const currentScrollHeight = chatContainerRef.current.scrollHeight;
        setMessages((prev) => [...data, ...prev]); // prepend older messages
        const newScrollHeight = chatContainerRef.current.scrollHeight;
        chatContainerRef.current.scrollTop = newScrollHeight - currentScrollHeight;
        setPage((prev) => prev + 1);
      } else {
        setMessages(data);
        scrollToBottom();
        setPage(2);
      }
      setLoading(false);
      socket.emit("join chat", selectedChat._id);
    } catch (err) {
      setLoading(false);
      toast({ title: "Error", description: "Failed to load messages", status: "error", duration: 5000 });
    }
  };

  // --- Socket setup ---
  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
  }, [user]);

  // --- Fetch messages when chat changes ---
  useEffect(() => {
    setMessages([]);
    setPage(1);
    setHasMore(true);
    fetchMessages();
    selectedChatCompare = selectedChat;
  }, [selectedChat]);

  // --- Listen for new messages ---
  useEffect(() => {
    socket.on("message recieved", (newMsg) => {
      if (!selectedChatCompare || selectedChatCompare._id !== newMsg.chat[0]._id) {
        if (!notification.includes(newMsg)) {
          setNotification([newMsg, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages((prev) => [...prev, newMsg]);
        scrollToBottom();
      }
    });
  }, [notification, fetchAgain]);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
  };

  // --- Infinite scroll + bottom detection ---
  const handleScroll = () => {
    if (!chatContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;

    // Infinite scroll for older messages
    if (scrollTop === 0 && hasMore && !loading) fetchMessages(true);

    // Detect if user is at bottom
    setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 10); // 10px tolerance
  };

  // --- Send message ---
  const sendMessage = async (e) => {
    if ((e.key === "Enter" || e.type === "click") && newMessage.trim()) {
      try {
        const content = newMessage.trim();
        const replyTo = replyMessage ? replyMessage : null;
        setReplyMessage(null);
        setNewMessage("");

        const res = await fetch("/api/message", {
          method: "POST",
          headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ content, chatId: selectedChat._id, replyTo }),
        });
        const data = await res.json();
        socket.emit("new message", data);
        setMessages((prev) => [...prev, data]);
        scrollToBottom();
      } catch (err) {
        toast({ title: "Error", description: "Failed to send message", status: "error", duration: 5000 });
      }
    }
  };

  // --- Typing handler ---
  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;
    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    setTimeout(() => {
      if (new Date().getTime() - lastTypingTime >= 3000 && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, 3000);
    handleSearch(e.target.value);
  };

  // --- Search messages ---
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term) {
      setSearchResults([]);
      return;
    }
    const results = messages.filter((msg) =>
      msg.content.toLowerCase().includes(term.toLowerCase())
    );
    setSearchResults(results);
  };

  // --- Highlight matched word ---
  const highlightMatch = (text) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, idx) =>
      regex.test(part) ? <Text as="mark" bg="yellow.200" key={idx}>{part}</Text> : part
    );
  };

  const scrollToMsg = (msgId) => {
    const msgElement = document.getElementById(msgId);
    if (msgElement) {
      msgElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setSearchResults([]);
      setSearchTerm("");
    }
  };

  const handleCopy = (msg) => {
    navigator.clipboard.writeText(msg);
    toast({ title: "Copied!", status: "success", duration: 2000 });
  };

  const handleForward = (msg) => setForwardMsg(msg);

  const forwardToUser = async (contact) => {
    if (!forwardMsg) return;
    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: `Fwd: ${forwardMsg.content}`, chatId: contact._id }),
      });
      const data = await res.json();
      socket.emit("new message", data);
      toast({ title: "Message forwarded!", status: "success", duration: 2000 });
      setForwardMsg(null);
    } catch (err) {
      toast({ title: "Error", description: "Failed to forward message", status: "error", duration: 5000 });
    }
  };

  return (
    <>
      {selectedChat ? (
        <>
          {/* Header */}
          <Text fontSize={{ base: "28px", md: "30px" }} pb="3" px="2" w="100%" display="flex" justifyContent="space-between" alignItems="center">
            <IconButton display={{ base: "flex", md: "none" }} icon={<ArrowBackIcon />} onClick={() => setSelectedChat("")} />
            {!selectedChat.isGroupChat ? (
              <>
                {getSender(user, selectedChat.users)}
                <ProfileModal user={getSenderFull(user, selectedChat.users)} />
              </>
            ) : (
              <>
                {selectedChat.chatName.toUpperCase()}
                <UpdateGroupChatModal fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} fetchMessages={fetchMessages} />
              </>
            )}
          </Text>

          {/* Search */}
          <FormControl mb={2} position="relative">
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              bg="white"
            />
            {searchResults.length > 0 && (
              <VStack
                position="absolute"
                top="40px"
                left={0}
                right={0}
                bg="white"
                border="1px solid gray"
                borderRadius="md"
                maxH="200px"
                overflowY="auto"
                zIndex={20}
                spacing={1}
                p={2}
              >
                {searchResults.map((msg) => (
                  <Box
                    key={msg._id}
                    cursor="pointer"
                    p={2}
                    _hover={{ bg: "gray.100" }}
                    onClick={() => scrollToMsg(msg._id)}
                  >
                    <Text fontSize="sm">
                      <b>{msg.sender.name}: </b>
                      {highlightMatch(msg.content)}
                    </Text>
                  </Box>
                ))}
              </VStack>
            )}
          </FormControl>

          {/* Chat container */}
          <Box
            ref={chatContainerRef}
            display="flex"
            flexDir="column"
            justifyContent="flex-start"
            p={3}
            bg="#E5DDD5"
            w="100%"
            h="calc(100% - 120px)"
            borderRadius="lg"
            overflowY="auto"
            onScroll={handleScroll}
            position="relative"
          >
            {loading && messages.length === 0 && <Spinner size="xl" alignSelf="center" margin="auto" />}
            {messages.map((msg) => {
              const isOwn = msg.sender._id === user._id;
              return (
                <Box
                  id={msg._id}
                  key={msg._id}
                  alignSelf={isOwn ? "flex-end" : "flex-start"}
                  bg={isOwn ? "#DCF8C6" : "white"}
                  px={3}
                  py={2}
                  m={1}
                  borderRadius="20px"
                  borderTopRightRadius={isOwn ? "4px" : "20px"}
                  borderTopLeftRadius={isOwn ? "20px" : "4px"}
                  position="relative"
                  onMouseEnter={() => setHoveredMsg(msg._id)}
                  onMouseLeave={() => setHoveredMsg(null)}
                >
                  {msg.replyTo && (
                    <Box bg={isOwn ? "#BDF0C6" : "#F0F0F0"} px={2} py={1} borderRadius="md" mb={1}>
                      <Text fontSize="xs" color="gray.500">{msg.replyTo.sender.name}</Text>
                      <Text fontSize="sm" noOfLines={1}>{msg.replyTo.content}</Text>
                    </Box>
                  )}
                  <Text>{msg.content}</Text>
                  <Text fontSize="xs" color="gray.500" alignSelf="flex-end" mt={1}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  {hoveredMsg === msg._id && (
                    <Fade in={hoveredMsg === msg._id}>
                      <HStack spacing={1} position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" bg="gray.100" borderRadius="md" p={1} boxShadow="md" zIndex={10}>
                        <IconButton size="xs" icon={<CopyIcon />} onClick={() => handleCopy(msg.content)} aria-label="Copy" />
                        <IconButton size="xs" icon={<RepeatIcon />} onClick={() => setReplyMessage(msg)} aria-label="Reply" />
                        <IconButton size="xs" icon={<RepeatClockIcon />} onClick={() => handleForward(msg)} aria-label="Forward" />
                      </HStack>
                    </Fade>
                  )}
                </Box>
              );
            })}
            <div ref={scrollRef} />
          </Box>

          {/* Scroll to bottom button */}
          {!isAtBottom && (
            <Button
              position="absolute"
              bottom="80px"
              right="20px"
              colorScheme="teal"
              size="sm"
              borderRadius="full"
              onClick={scrollToBottom}
              zIndex={30}
              boxShadow="md"
              leftIcon={<ChevronDownIcon />}
            >
              Latest
            </Button>
          )}

          {/* Reply preview */}
          {replyMessage && (
            <Box bg="gray.200" p={2} borderRadius="md" mb={2}>
              Replying to: <Text as="span" fontWeight="bold">@{replyMessage.sender.name}</Text> - {replyMessage.content}
              <Button size="xs" ml={2} onClick={() => setReplyMessage(null)}>x</Button>
            </Box>
          )}

          {/* Input */}
          <FormControl mt="3" position="relative" isRequired>
            <Input
              variant="filled"
              bg="#E0E0E0"
              placeholder="Enter a message.."
              value={newMessage}
              onChange={typingHandler}
              onKeyDown={sendMessage}
              pr="12"
            />
            <IconButton
              icon={<ChatIcon />}
              colorScheme="teal"
              size="sm"
              aria-label="Send message"
              position="absolute"
              right="2"
              top="50%"
              transform="translateY(-50%)"
              onClick={sendMessage}
            />
          </FormControl>

          {/* Forward modal */}
          <Modal isOpen={forwardMsg != null} onClose={() => setForwardMsg(null)}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Select Contact to Forward</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={2} align="stretch">
                  {chats.filter(c => c._id !== selectedChat._id).map(contact => (
                    <Button key={contact._id} onClick={() => forwardToUser(contact)}>
                      {contact.isGroupChat ? contact.chatName : getSender(user, contact.users)}
                    </Button>
                  ))}
                </VStack>
              </ModalBody>
            </ModalContent>
          </Modal>
        </>
      ) : (
        <Box display="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl">Click on a user to start chatting</Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
