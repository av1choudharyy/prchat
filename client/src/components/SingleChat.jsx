import { useEffect, useState } from "react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
  Button,
  HStack,
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
  const [replyMessage, setReplyMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions] = useState(["Okay", "Thank you", "Sure", "👍"]);

  const { user, selectedChat, setSelectedChat, notification } = ChatState();
  const toast = useToast();

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
      toast({ title: "Error", description: "Failed to load messages", status: "error", duration: 5000, isClosable: true });
    }
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
      if (!selectedChatCompare || selectedChatCompare._id !== newMessageRecieved.chat._id) {
        if (!notification.includes(newMessageRecieved)) {
          // Add to notifications
        }
      } else setMessages([...messages, newMessageRecieved]);
    });
  });

  const sendMessageHandler = async (e, msg = newMessage) => {
    if ((e.key === "Enter" || msg !== newMessage) && msg) {
      socket.emit("stop typing", selectedChat._id);
      try {
        setNewMessage("");
        const response = await fetch("/api/message", {
          method: "POST",
          headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            content: msg,
            chatId: selectedChat._id,
            replyToMessageId: replyMessage?._id || null,
          }),
        });
        const data = await response.json();
        socket.emit("new message", data);
        setMessages([...messages, data]);
        setReplyMessage(null);
      } catch (error) {
        toast({ title: "Error", description: "Failed to send message", status: "error", duration: 5000, isClosable: true });
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
    setTimeout(() => {
      let timeNow = new Date().getTime();
      if (timeNow - lastTypingTime >= 3000 && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, 3000);
  };

  const filteredMessages = messages.filter((msg) =>
    msg.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {selectedChat ? (
        <>
          <Text fontSize={{ base: "28px", md: "30px" }} pb="3" px="2" display="flex" justifyContent="space-between" alignItems="center">
            <IconButton display={{ base: "flex", md: "none" }} icon={<ArrowBackIcon />} onClick={() => setSelectedChat("")} />
            {!selectedChat.isGroupChat ? (
              <ProfileModal user={getSenderFull(user, selectedChat.users)}>{getSender(user, selectedChat.users)}</ProfileModal>
            ) : (
              <>
                {selectedChat.chatName.toUpperCase()}
                <UpdateGroupChatModal fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} fetchMessages={fetchMessages} />
              </>
            )}
          </Text>

          {/* Search Input */}
          <Input placeholder="Search messages..." mb={2} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

          {/* Suggestions */}
          <HStack mb={2}>
            {suggestions.map((s, i) => (
              <Button key={i} size="sm" onClick={() => sendMessageHandler(null, s)}>{s}</Button>
            ))}
          </HStack>

          <Box display="flex" flexDir="column" justifyContent="flex-end" p={3} bg="#E8E8E8" w="100%" h="100%" borderRadius="lg" overflowY="hidden">
            {loading ? (
              <Spinner size="xl" w="20" h="20" alignSelf="center" margin="auto" />
            ) : (
              <ScrollableChat messages={filteredMessages} user={user} setReplyMessage={setReplyMessage} />
            )}

            {replyMessage && (
              <Box p={2} bg="gray.200" mb={2} borderRadius="md">
                Replying to: <Text fontWeight="bold">{replyMessage.sender.name}</Text> - {replyMessage.content}
                <Button size="xs" ml={2} onClick={() => setReplyMessage(null)}>Cancel</Button>
              </Box>
            )}

            <FormControl mt="3" onKeyDown={(e) => sendMessageHandler(e)} isRequired>
              <Input variant="filled" bg="#E0E0E0" placeholder="Enter a message.." value={newMessage} onChange={typingHandler} />
            </FormControl>
          </Box>
        </>
      ) : (
        <Box display="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb="3">Click on a user to start chatting</Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
