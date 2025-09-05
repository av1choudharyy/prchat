import { useEffect, useState, useRef } from "react";
import { ArrowBackIcon, SunIcon, MoonIcon } from "@chakra-ui/icons";
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import io from "socket.io-client";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";

const ENDPOINT = "http://localhost:5000";
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(null);

  const quickResponses = ["👌 Okay", "🙏 Thanks", "👍 Sure", "✅ Got it"];

  const { user, selectedChat, setSelectedChat, notification, setNotification } =
    ChatState();
  const toast = useToast();

  const { colorMode, toggleColorMode } = useColorMode();
  const chatBg = useColorModeValue("#E8E8E8", "#1A202C");
  const inputBg = useColorModeValue("#E0E0E0", "#2D3748");

  // ------------------ Socket & Messages ------------------
  const handleQuickResponse = async (text) => {
    if (!text) return;
    setNewMessage("");
    socket.emit("stop typing", selectedChat._id);

    try {
      const response = await fetch("/api/message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: text, chatId: selectedChat._id }),
      });
      const data = await response.json();
      socket.emit("new message", data);
      setMessages([...messages, data]);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: "Failed to send the Message",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "solid",
      });
    }
  };

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
    fetchMessages();
    selectedChatCompare = selectedChat;
    setSearchResults([]);
    setCurrentMatchIndex(null);
    setSearchQuery("");
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
          setFetchAgain(!fetchAgain);
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
        setNewMessage("");
        const response = await fetch("/api/message", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: newMessage, chatId: selectedChat._id }),
        });
        const data = await response.json();
        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occurred!",
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
    if (!socketConnected) return;
    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    let timerLength = 3000;
    setTimeout(() => {
      let timeNow = new Date().getTime();
      if (timeNow - lastTypingTime >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  // ------------------ Search ------------------
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      setCurrentMatchIndex(null);
      return;
    }
    const results = messages
      .map((msg, index) =>
        msg.content.toLowerCase().includes(query.toLowerCase()) ? index : null
      )
      .filter((i) => i !== null);
    setSearchResults(results);
    setCurrentMatchIndex(results.length > 0 ? 0 : null);
  };

  const goToNextMatch = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % searchResults.length;
    setCurrentMatchIndex(nextIndex);
  };

  const goToPrevMatch = () => {
    if (searchResults.length === 0) return;
    const prevIndex = (currentMatchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentMatchIndex(prevIndex);
  };

  // ------------------ Render ------------------
  return (
    <>
      {selectedChat ? (
        <>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            pb="3"
            px="2"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {!selectedChat.isGroupChat ? (
              <>
                <Text fontSize={{ base: "28px", md: "30px" }} fontFamily="Work sans">
                  {getSender(user, selectedChat.users)}
                </Text>
                <ProfileModal user={getSenderFull(user, selectedChat.users)} />
              </>
            ) : (
              <>
                <Text fontSize={{ base: "28px", md: "30px" }} fontFamily="Work sans">
                  {selectedChat.chatName.toUpperCase()}
                </Text>
                <UpdateGroupChatModal
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                  fetchMessages={fetchMessages}
                />
              </>
            )}

            {/* -------- Dark/Light Mode Toggle -------- */}
            <IconButton
              ml="3"
              aria-label="Toggle Dark/Light Mode"
              icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              size="sm"
              colorScheme={colorMode === "light" ? "gray" : "yellow"}
              borderRadius="full"
            />
          </Box>

          {/* -------- Search -------- */}
          <Box px="2" pb="2">
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchResults.length > 0 && (
              <Text fontSize="sm" mt="1">
                {searchResults.length} match{searchResults.length > 1 ? "es" : ""} |{" "}
                <span
                  style={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={goToPrevMatch}
                >
                  Prev
                </span>{" "}
                |{" "}
                <span
                  style={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={goToNextMatch}
                >
                  Next
                </span>
              </Text>
            )}
          </Box>

          {/* -------- Messages + Quick Responses + Input -------- */}
          <Box
            display="flex"
            flexDir="column"
            justifyContent="space-between"
            p={3}
            bg={chatBg}
            w="100%"
            h="100%"
            borderRadius="lg"
            overflow="hidden"
          >
            {loading ? (
              <Spinner size="xl" w="20" h="20" alignSelf="center" margin="auto" />
            ) : (
              <ScrollableChat
                messages={messages.map((msg) => {
                  if (!searchQuery) return msg;
                  const regex = new RegExp(`(${searchQuery})`, "gi");
                  return {
                    ...msg,
                    highlightedContent: msg.content.replace(
                      regex,
                      '<span style="background-color:orange;color:black;">$1</span>'
                    ),
                  };
                })}
                isTyping={isTyping}
                scrollToIndex={currentMatchIndex != null ? searchResults[currentMatchIndex] : null}
              />
            )}

            {/* Quick Responses */}
            <Box display="flex" gap="2" mb="2" px="1" overflowX="auto" justifyContent="flex-start">
              {quickResponses.map((resp, index) => (
                <Box
                  key={index}
                  as="button"
                  px="3"
                  py="1"
                  bg="gray.100"
                  color="gray.800"
                  fontWeight="medium"
                  borderRadius="2xl"
                  whiteSpace="nowrap"
                  boxShadow="sm"
                  _hover={{ bg: "gray.200", transform: "scale(1.05)" }}
                  _active={{ bg: "gray.300", transform: "scale(0.95)" }}
                  transition="all 0.2s ease"
                  onClick={() => handleQuickResponse(resp)}
                >
                  {resp}
                </Box>
              ))}
            </Box>

            <FormControl mt="1" onKeyDown={sendMessage} isRequired>
              <Input
                variant="filled"
                bg={inputBg}
                placeholder="Enter a message.."
                value={newMessage}
                onChange={typingHandler}
              />
            </FormControl>
          </Box>
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