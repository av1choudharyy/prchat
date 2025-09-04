import { useEffect, useState } from "react";
import { ArrowBackIcon, SearchIcon, CloseIcon } from "@chakra-ui/icons";
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
  HStack,
} from "@chakra-ui/react";
import io from "socket.io-client";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";
import MessageSearch from "./MessageSearch";
import QuickSuggestions from "./QuickSuggestions";

const ENDPOINT = "http://localhost:5000"; // If you are deploying the app, replace the value with "https://YOUR_DEPLOYED_APPLICATION_URL" then run "npm run build" to create a production build
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
      socket.emit("stop typing", selectedChat._id);
      try {
        setNewMessage(""); // Clear message field before making API call (won't affect API call as the function is asynchronous)

        const response = await fetch("/api/message", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: newMessage,
            chatId: selectedChat._id,
            replyTo: replyingTo ? replyingTo._id : null, // Send replyTo ID
          }),
        });
        const data = await response.json();

        socket.emit("new message", data);
        setNewMessage("");
        setReplyingTo(null); // Clear reply state
        setShowSuggestions(false); // Hide suggestions after sending
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
    }
  };

  const typingHandler = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Show suggestions when input is empty or very short
    setShowSuggestions(value.length === 0);

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

  const handleReplyToMessage = (message) => {
    setReplyingTo(message);
  };

  const handleSuggestionClick = (suggestion) => {
    setNewMessage(suggestion);
    setShowSuggestions(false);
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Box
            bg="white"
            borderBottom="1px solid"
            borderColor="#e9edef"
            p={4}
            borderRadius="lg"
            mb={2}
            boxShadow="0 2px 4px rgba(0, 0, 0, 0.05)"
          >
            <HStack justify="space-between" align="center">
              <HStack spacing={3} align="center">
                <IconButton
                  display={{ base: "flex", md: "none" }}
                  icon={<ArrowBackIcon />}
                  onClick={() => setSelectedChat("")}
                  size="sm"
                  variant="ghost"
                  color="#667781"
                  _hover={{ bg: "#f0f2f5" }}
                />
                <Box>
                  <Text
                    fontSize="lg"
                    fontWeight="semibold"
                    color="#3b4a54"
                    fontFamily="system-ui, -apple-system, sans-serif"
                  >
                    {!selectedChat.isGroupChat
                      ? getSender(user, selectedChat.users)
                      : selectedChat.chatName}
                  </Text>
                  {!selectedChat.isGroupChat && (
                    <Text fontSize="xs" color="#667781" mt={-1}>
                      Online
                    </Text>
                  )}
                </Box>
              </HStack>
              <HStack spacing={1}>
                <IconButton
                  icon={<SearchIcon />}
                  onClick={() => setIsSearchOpen(true)}
                  size="sm"
                  variant="ghost"
                  color="#667781"
                  _hover={{ bg: "#f0f2f5" }}
                  aria-label="Search messages"
                />
                {!selectedChat.isGroupChat ? (
                  <ProfileModal
                    user={getSenderFull(user, selectedChat.users)}
                  />
                ) : (
                  <UpdateGroupChatModal
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                    fetchMessages={fetchMessages}
                  />
                )}
              </HStack>
            </HStack>
          </Box>

          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={0}
            bg="#f0f2f5"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
            position="relative"
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
              <Box
                flex={1}
                overflowY="auto"
                px={4}
                py={2}
                css={{
                  "&::-webkit-scrollbar": {
                    width: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "transparent",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "#c1c7cd",
                    borderRadius: "3px",
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    background: "#a8b2ba",
                  },
                }}
              >
                <ScrollableChat
                  messages={messages}
                  isTyping={isTyping}
                  onReplyToMessage={handleReplyToMessage}
                />
              </Box>
            )}

            {replyingTo && (
              <Box
                bg="#f0f0f0"
                borderLeft="4px solid"
                borderLeftColor="#25d366"
                p={3}
                mb={2}
                position="relative"
                animation="slideIn 0.2s ease-out"
                sx={{
                  "@keyframes slideIn": {
                    "0%": {
                      opacity: 0,
                      transform: "translateY(-5px)",
                    },
                    "100%": {
                      opacity: 1,
                      transform: "translateY(0)",
                    },
                  },
                }}
              >
                <HStack justify="space-between" align="flex-start" spacing={3}>
                  <Box flex={1}>
                    <HStack mb={1} spacing={2}>
                      <Box w={1} h={1} bg="#25d366" borderRadius="full" />
                      <Text
                        fontSize="xs"
                        color="#667781"
                        fontWeight="medium"
                        textTransform="uppercase"
                        letterSpacing="0.5px"
                      >
                        Replying to {replyingTo.sender.name}
                      </Text>
                    </HStack>
                    <Box
                      bg="white"
                      p={2}
                      borderRadius="md"
                      border="1px solid"
                      borderColor="#e9edef"
                      mt={1}
                    >
                      <Text
                        fontSize="sm"
                        color="#3b4a54"
                        noOfLines={2}
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {replyingTo.content}
                      </Text>
                    </Box>
                  </Box>
                  <IconButton
                    icon={<CloseIcon />}
                    size="sm"
                    variant="ghost"
                    color="#667781"
                    _hover={{
                      bg: "#e9edef",
                      color: "#3b4a54",
                    }}
                    _active={{ transform: "scale(0.95)" }}
                    onClick={() => setReplyingTo(null)}
                    aria-label="Cancel reply"
                    transition="all 0.15s"
                    minW="auto"
                    h="auto"
                    p={1}
                  />
                </HStack>
              </Box>
            )}
            <Box bg="white" p={4} borderTop="1px solid" borderColor="#e9edef">
              <QuickSuggestions
                onSuggestionClick={handleSuggestionClick}
                isVisible={showSuggestions && !replyingTo}
              />
              <FormControl onKeyDown={(e) => sendMessage(e)} isRequired>
                <HStack spacing={2} align="end">
                  <Input
                    variant="outline"
                    bg="white"
                    border="1px solid"
                    borderColor="#e9edef"
                    placeholder={
                      replyingTo ? "Type a message..." : "Type a message..."
                    }
                    value={newMessage}
                    onChange={(e) => typingHandler(e)}
                    _hover={{
                      borderColor: "#d1d7db",
                    }}
                    _focus={{
                      borderColor: "#25d366",
                      boxShadow: "0 0 0 1px #25d366",
                    }}
                    transition="all 0.15s"
                    fontSize="sm"
                    borderRadius="xl"
                    color="#3b4a54"
                    _placeholder={{
                      color: "#667781",
                      fontSize: "sm",
                    }}
                    minH="40px"
                    resize="none"
                  />
                  <IconButton
                    colorScheme="green"
                    bg="#25d366"
                    _hover={{ bg: "#20ba5a" }}
                    _active={{ bg: "#1ea952" }}
                    size="md"
                    borderRadius="full"
                    onClick={(e) => sendMessage(e)}
                    disabled={!newMessage.trim()}
                    opacity={newMessage.trim() ? 1 : 0.5}
                    transition="all 0.15s"
                    aria-label="Send message"
                  >
                    <Text fontSize="lg" color="white">
                      ➤
                    </Text>
                  </IconButton>
                </HStack>
              </FormControl>
            </Box>
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
      <MessageSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};

export default SingleChat;
