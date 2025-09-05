import { useEffect, useState, useRef } from "react";
import { ArrowBackIcon, SearchIcon, AttachmentIcon } from "@chakra-ui/icons";
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
  HStack,
  VStack,
  Button,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
  Flex,
  Badge,
  Divider,
} from "@chakra-ui/react";
import io from "socket.io-client";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";

const ENDPOINT = "http://localhost:5000";
let socket, selectedChatCompare;

const suggestions = [
  "Hello!",
  "Thank you",
  "Okay",
  "Great!",
  "Sure",
  "No problem",
  "See you later",
  "Good morning",
  "Good night",
  "How are you?",
];

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fontStyle, setFontStyle] = useState({
    fontSize: "14px",
    fontWeight: "normal",
    fontStyle: "normal",
    color: "#000000",
  });

  const { user, selectedChat, setSelectedChat, notification, setNotification, chats } = ChatState();
  const toast = useToast();
  const fileInputRef = useRef();
  const { isOpen: isForwardOpen, onOpen: onForwardOpen, onClose: onForwardClose } = useDisclosure();
  const { isOpen: isStyleOpen, onOpen: onStyleOpen, onClose: onStyleClose } = useDisclosure();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [forwardTargets, setForwardTargets] = useState([]);

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/message/${selectedChat._id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await response.json();
      setMessages(data);
      setLoading(false);
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      setLoading(false);
      toast({
        title: "Error Occurred!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
      });
    }
  };

  const searchMessages = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `/api/message/search/${selectedChat._id}?q=${encodeURIComponent(searchQuery)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search messages",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatId", selectedChat._id);

    try {
      const response = await fetch("/api/message/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
        body: formData,
      });
      const data = await response.json();

      socket.emit("new message", data);
      setMessages([...messages, data]);
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to upload file",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const forwardMessage = async () => {
    if (!selectedMessage || forwardTargets.length === 0) return;

    try {
      const response = await fetch("/api/message/forward", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId: selectedMessage._id,
          targetChatIds: forwardTargets,
        }),
      });

      if (response.ok) {
        toast({
          title: "Message Forwarded",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        onForwardClose();
        setForwardTargets([]);
        setSelectedMessage(null);
      }
    } catch (error) {
      toast({
        title: "Forward Error",
        description: "Failed to forward message",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const handleReply = (message) => {
    setReplyTo(message);
  };

  const sendSuggestion = (suggestion) => {
    setNewMessage(suggestion);
    setShowSuggestions(false);
  };

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

  const sendMessage = async (e) => {
    if (e.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        setNewMessage("");
        const response = await fetch("/api/message", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: newMessage,
            chatId: selectedChat._id,
            replyTo: replyTo?._id,
            fontStyle: fontStyle,
          }),
        });
        const data = await response.json();

        socket.emit("new message", data);
        setMessages([...messages, data]);
        setReplyTo(null);
      } catch (error) {
        toast({
          title: "Error Occurred!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

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
          {/* Chat Header */}
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb="3"
            px="2"
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <HStack>
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
            </HStack>
            
            <HStack>
              <IconButton
                icon={<SearchIcon />}
                onClick={() => setShowSearch(!showSearch)}
              />
              <IconButton
                icon={<AttachmentIcon />}
                onClick={() => fileInputRef.current.click()}
              />
              <Button size="sm" onClick={onStyleOpen}>
                Style
              </Button>
            </HStack>
          </Text>

          {/* Search Bar */}
          {showSearch && (
            <Box p={3} bg="gray.100">
              <InputGroup>
                <InputLeftElement>
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && searchMessages()}
                />
                <InputRightElement>
                  <Button size="sm" onClick={searchMessages}>
                    Search
                  </Button>
                </InputRightElement>
              </InputGroup>
              
              {searchResults.length > 0 && (
                <Box mt={2} maxH="200px" overflowY="auto">
                  {searchResults.map((msg) => (
                    <Box key={msg._id} p={2} bg="white" mb={1} borderRadius="md">
                      <Text fontSize="sm" color="gray.600">
                        {msg.sender.name}
                      </Text>
                      <Text fontSize="sm">{msg.content}</Text>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* Reply Preview */}
          {replyTo && (
            <Box p={2} bg="blue.50" borderLeft="4px solid blue.500">
              <HStack justify="space-between">
                <VStack align="start" spacing={0}>
                  <Text fontSize="xs" color="blue.600" fontWeight="bold">
                    Replying to {replyTo.sender.name}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {replyTo.content}
                  </Text>
                </VStack>
                <IconButton
                  size="xs"
                  onClick={() => setReplyTo(null)}
                  aria-label="Cancel reply"
                >
                  ✕
                </IconButton>
              </HStack>
            </Box>
          )}

          {/* Suggestions */}
          {showSuggestions && (
            <Box p={2} bg="green.50">
              <Flex wrap="wrap" gap={2}>
                {suggestions.map((suggestion, index) => (
                  <Badge
                    key={index}
                    colorScheme="green"
                    cursor="pointer"
                    onClick={() => sendSuggestion(suggestion)}
                    _hover={{ bg: "green.200" }}
                    p={2}
                    borderRadius="md"
                  >
                    {suggestion}
                  </Badge>
                ))}
              </Flex>
            </Box>
          )}

          {/* Messages Container */}
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
              <Spinner size="xl" w="20" h="20" alignSelf="center" margin="auto" />
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
                  onCopy={copyToClipboard}
                  onReply={handleReply}
                  onForward={(message) => {
                    setSelectedMessage(message);
                    onForwardOpen();
                  }}
                />
              </div>
            )}

            {/* Input Container */}
            <HStack mt="3" spacing={2}>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                💡
              </Button>
              <FormControl onKeyDown={sendMessage} isRequired>
                <Input
                  variant="filled"
                  bg="#E0E0E0"
                  placeholder="Enter a message.."
                  value={newMessage}
                  onChange={typingHandler}
                  style={{
                    fontSize: fontStyle.fontSize,
                    fontWeight: fontStyle.fontWeight,
                    fontStyle: fontStyle.fontStyle,
                    color: fontStyle.color,
                  }}
                />
              </FormControl>
            </HStack>
          </Box>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) uploadFile(file);
            }}
            accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
          />

          {/* Forward Modal */}
          <Modal isOpen={isForwardOpen} onClose={onForwardClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Forward Message</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={4}>
                  <Text>Select chats to forward to:</Text>
                  {chats
                    .filter((chat) => chat._id !== selectedChat._id)
                    .map((chat) => (
                      <Box
                        key={chat._id}
                        w="100%"
                        p={3}
                        bg={forwardTargets.includes(chat._id) ? "blue.100" : "gray.100"}
                        borderRadius="md"
                        cursor="pointer"
                        onClick={() => {
                          if (forwardTargets.includes(chat._id)) {
                            setForwardTargets(forwardTargets.filter(id => id !== chat._id));
                          } else {
                            setForwardTargets([...forwardTargets, chat._id]);
                          }
                        }}
                      >
                        <Text>
                          {!chat.isGroupChat
                            ? getSender(user, chat.users)
                            : chat.chatName}
                        </Text>
                      </Box>
                    ))}
                  <HStack spacing={4}>
                    <Button onClick={onForwardClose}>Cancel</Button>
                    <Button
                      colorScheme="blue"
                      onClick={forwardMessage}
                      isDisabled={forwardTargets.length === 0}
                    >
                      Forward
                    </Button>
                  </HStack>
                </VStack>
              </ModalBody>
            </ModalContent>
          </Modal>

          {/* Font Style Modal */}
          <Modal isOpen={isStyleOpen} onClose={onStyleClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Message Style</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={4}>
                  <Box w="100%">
                    <Text mb={2}>Font Size:</Text>
                    <Select
                      value={fontStyle.fontSize}
                      onChange={(e) =>
                        setFontStyle({ ...fontStyle, fontSize: e.target.value })
                      }
                    >
                      <option value="12px">Small</option>
                      <option value="14px">Normal</option>
                      <option value="16px">Large</option>
                      <option value="18px">Extra Large</option>
                    </Select>
                  </Box>

                  <Box w="100%">
                    <Text mb={2}>Font Weight:</Text>
                    <Select
                      value={fontStyle.fontWeight}
                      onChange={(e) =>
                        setFontStyle({ ...fontStyle, fontWeight: e.target.value })
                      }
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </Select>
                  </Box>

                  <Box w="100%">
                    <Text mb={2}>Font Style:</Text>
                    <Select
                      value={fontStyle.fontStyle}
                      onChange={(e) =>
                        setFontStyle({ ...fontStyle, fontStyle: e.target.value })
                      }
                    >
                      <option value="normal">Normal</option>
                      <option value="italic">Italic</option>
                    </Select>
                  </Box>

                  <Box w="100%">
                    <Text mb={2}>Text Color:</Text>
                    <Input
                      type="color"
                      value={fontStyle.color}
                      onChange={(e) =>
                        setFontStyle({ ...fontStyle, color: e.target.value })
                      }
                    />
                  </Box>

                  <Text
                    p={3}
                    bg="gray.100"
                    borderRadius="md"
                    style={{
                      fontSize: fontStyle.fontSize,
                      fontWeight: fontStyle.fontWeight,
                      fontStyle: fontStyle.fontStyle,
                      color: fontStyle.color,
                    }}
                  >
                    Preview: This is how your messages will look
                  </Text>

                  <Button colorScheme="blue" onClick={onStyleClose} w="100%">
                    Apply Style
                  </Button>
                </VStack>
              </ModalBody>
            </ModalContent>
          </Modal>
        </>
      ) : (
        <Box display="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb="3" fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;