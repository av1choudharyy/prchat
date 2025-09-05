import { useEffect, useState } from "react";
import { ArrowBackIcon, SearchIcon } from "@chakra-ui/icons";
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import io from "socket.io-client";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";
import { buildNGramMap, buildTriGramMap, getSuggestions } from "../utils/ngram";

const ENDPOINT = "http://localhost:5000"; // If you are deploying the app, replace the value with "https://YOUR_DEPLOYED_APPLICATION_URL" then run "npm run build" to create a production build
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [bigramMap, setBigramMap] = useState({});
  const [trigramMap, setTrigramMap] = useState({});
  const [suggestions, setSuggestions] = useState([]);

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

  const handleSearch = async (query) => {
    setSearchTerm(query);

    if (!query || query.trim() === "") {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await fetch(
        `/api/message/${selectedChat._id}/search?text=${query}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      const data = await response.json();
      setSearchResults(data);
      setSearching(false);
    } catch (error) {
      setSearching(false);
      return toast({
        title: "Error Occured!",
        description: "Failed to search messages",
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
    const handler = (newMessageRecieved) => {
      if (!selectedChatCompare || selectedChatCompare._id !== newMessageRecieved.chat._id) {
        if (!notification.find((n) => n._id === newMessageRecieved._id)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages((prev) => [...prev, newMessageRecieved]);
      }
    };

    socket.on("message recieved", handler);

    return () => {
      socket.off("message recieved", handler);
    };
  }, [notification, fetchAgain]);

  useEffect(() => {
    if (messages.length > 0) {
      setBigramMap(buildNGramMap(messages));
      setTrigramMap(buildTriGramMap(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (newMessage.trim() !== "" && messages.length > 0) {
      const sugg = getSuggestions(newMessage, bigramMap, trigramMap, 3);
      setSuggestions(sugg);
    } else {
      setSuggestions([]);
    }
  }, [newMessage, messages, bigramMap, trigramMap]);

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
          }),
        });
        const data = await response.json();

        socket.emit("new message", data);
        setNewMessage("");
        setMessages((prev) => [...prev, data]); // Add new message with existing messages
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

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "20px", md: "24px" }}
            pb="3"
            px="2"
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
            bg="white"
            shadow="sm"
            gap="8px"
            borderRadius="md"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
              variant="ghost"
            />
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              w="100%"
            >
              <Box fontWeight="semibold">
                {!selectedChat.isGroupChat
                  ? getSender(user, selectedChat.users)
                  : selectedChat.chatName.toUpperCase()}
              </Box>

              <Box display="flex" alignItems="center" gap={2}>
                {showSearch && (
                  <Input
                    maxW="180px"
                    variant="outline"
                    placeholder="Search messages..."
                    onChange={(e) => handleSearch(e.target.value)}
                    autoFocus
                    transition="width 0.3s ease-in-out"
                    borderRadius="md"
                    _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #3182ce" }}
                  />
                )}
                <IconButton
                  aria-label="Search messages"
                  icon={<SearchIcon />}
                  variant="ghost"
                  _hover={{ bg: "gray.100" }}
                  onClick={() => setShowSearch(!showSearch)}
                />
                {!selectedChat.isGroupChat ? (
                  <ProfileModal user={getSenderFull(user, selectedChat.users)} size="sm" />
                ) : (
                  <UpdateGroupChatModal
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                    fetchMessages={fetchMessages}
                    size="sm"
                  />
                )}
              </Box>
            </Box>
          </Text>

          <Box
            display="flex"
            flexDir="column"
            p={4}
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
            shadow="sm"
            className="chat-bg"
          >
            {/* Scrollable messages area */}
            <Box
              flex="1"
              overflowY="auto"
              mb={2}
              pr={2}
            >
              {loading ? (
                <Spinner size="xl" w="20" h="20" alignSelf="center" margin="auto" />
              ) : searching ? (
                <Spinner size="lg" alignSelf="center" margin="auto" />
              ) : searchTerm ? (
                searchResults.length > 0 ? (
                  <ScrollableChat
                    messages={searchResults.map((msg) => ({
                      ...msg,
                      content: (msg.highlightedContent || msg.content).replace(/\*\*/g, ""),
                    }))}
                    isTyping={false}
                  />
                ) : (
                  <Text textAlign="center" color="gray.500" mt={4}>
                    No results found
                  </Text>
                )
              ) : (
                <ScrollableChat messages={messages} isTyping={isTyping} />
              )}
            </Box>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                {suggestions.map((s, idx) => (
                  <Box
                    key={idx}
                    px={3}
                    py={1}
                    bg="teal.200"
                    color="teal.900"
                    fontWeight="medium"
                    borderRadius="full"
                    cursor="pointer"
                    boxShadow="sm"
                    _hover={{
                      bg: "teal.300",
                      transform: "scale(1.05)",
                      transition: "all 0.15s ease-in-out",
                    }}
                    onClick={() =>
                      setNewMessage((prev) => (prev ? prev + " " + s : s))
                    }
                  >
                    {s}
                  </Box>
                ))}
              </Box>
            )}

            {/* Input box */}
            <FormControl mt={2} onKeyDown={(e) => sendMessage(e)} isRequired>
              <Input
                id="chat-input"
                variant="filled"
                bg="white"
                placeholder="Enter a message.."
                value={newMessage}
                onChange={(e) => typingHandler(e)}
                borderRadius="full"
                _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #3182ce" }}
                p={3}
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
          bg="gray.50"
          borderRadius="lg"
        >
          <Text fontSize="3xl" pb={3} fontFamily="Work sans" color="gray.500">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
