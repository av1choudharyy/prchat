import { useEffect, useState, useCallback } from "react";
import { ArrowBackIcon, ArrowForwardIcon } from "@chakra-ui/icons";
import axios from "axios";
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

const ENDPOINT = "http://localhost:5000";
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  const { user, selectedChat, setSelectedChat, notification, setNotification } =
    ChatState();
  const toast = useToast();

  const fetchMessages = useCallback(async () => {
    if (!selectedChat) return;

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
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "solid",
      });
    }
  }, [selectedChat, user.token, toast]);

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
  }, [user]);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
  }, [selectedChat, fetchMessages]);

  useEffect(() => {
    const messageListener = (newMessageRecieved) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageRecieved.chat[0]._id
      ) {
        if (!notification.some((n) => n._id === newMessageRecieved._id)) {
          setNotification((prev) => [newMessageRecieved, ...prev]);
          setFetchAgain((prev) => !prev);
        }
      } else {
        setMessages((prev) => [...prev, newMessageRecieved]);
      }
    };

    socket.on("message recieved", messageListener);

    return () => {
      socket.off("message recieved", messageListener);
    };
  }, [notification, fetchAgain, setNotification, setFetchAgain]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    socket.emit("stop typing", selectedChat._id);
    try {
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
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
    } catch (error) {
      toast({
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

  const sendMessage = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };
const onReact = async (messageId, emoji) => {
  try {
    const { data: updatedMessage } = await axios.post(
      "/api/message/react",
      { messageId, emoji },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg._id === updatedMessage._id ? updatedMessage : msg
      )
    );
  } catch (err) {
    console.error("Failed to react:", err);
  }
};

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }

    const lastTypingTime = new Date().getTime();
    const timerLength = 3000;

    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;

    const match = messages.find((msg) =>
      msg.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (match) {
      setHighlightedMessageId(match._id);
      setTimeout(() => setHighlightedMessageId(null), 3000);
    } else {
      setHighlightedMessageId(null);
    }
    if (!match) {
  toast({
    title: "No match found",
    status: "info",
    duration: 3000,
    isClosable: true,
    position: "bottom-right",
  });
}

  };

  return (
    <>
      {selectedChat ? (
        <>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            px="2"
            pb="3"
            w="100%"
            gap="12px"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />

            <Box
              display="flex"
              alignItems="center"
              gap="8px"
              flex="1"
              justifyContent="flex-start"
            >
              {!selectedChat.isGroupChat ? (
                <>
                  <ProfileModal user={getSenderFull(user, selectedChat.users)} />
                  <Text fontSize={{ base: "20px", md: "24px" }} fontFamily="Work sans">
                    {getSender(user, selectedChat.users)}
                  </Text>
                </>
              ) : (
                <>
                  <UpdateGroupChatModal
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                    fetchMessages={fetchMessages}
                  />
                  <Text fontSize={{ base: "20px", md: "24px" }} fontFamily="Work sans">
                    {selectedChat.chatName.toUpperCase()}
                  </Text>
                </>
              )}
            </Box>

            <FormControl maxW="300px" display="flex" gap="6px">
  <Input
    placeholder="Search message..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") handleSearch();
    }}
    bg="#E0E0E0"
    variant="filled"
    size="sm"
  />
  <IconButton
    icon={<ArrowForwardIcon />}
    colorScheme="teal"
    size="sm"
    onClick={handleSearch}
    aria-label="Search message"
  />
</FormControl>

          </Box>

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
                  highlightedMessageId={highlightedMessageId}
                  onReact={onReact}

                />
              </div>
            )}

            <FormControl mt="3" isRequired>
              <Box display="flex" gap="8px">
                <Input
                  variant="filled"
                  bg="#E0E0E0"
                  placeholder="Enter a message..."
                  value={newMessage}
                  onChange={typingHandler}
                  onKeyDown={sendMessage}
                />
                <IconButton
                  colorScheme="blue"
                  icon={<ArrowForwardIcon />}
                  onClick={handleSendMessage}
                />
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
    </>
  );
};

export default SingleChat;