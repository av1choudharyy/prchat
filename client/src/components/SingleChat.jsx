import { useEffect, useState, useCallback, useRef } from "react";
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
  Collapse,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Button,
} from "@chakra-ui/react";
import io from "socket.io-client";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";
import MessageInput from "./MessageInput"; // ✅ new component

const ENDPOINT = "http://localhost:5000";
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [typing, setTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);

  const [forwardMessage, setForwardMessage] = useState(null);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);

  const toast = useToast();
  const {
    user,
    selectedChat,
    setSelectedChat,
    notification,
    setNotification,
    chats,
  } = ChatState();
  const typingTimeout = useRef(null);

  // Scroll to message helper
  const scrollToMessage = (id) => {
    const element = document.getElementById(`message-${id}`);
    if (element)
      element.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!selectedChat) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/message/${selectedChat._id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      setMessages(data);
      setFilteredMessages(data);
      setLoading(false);
      socket.emit("join chat", selectedChat._id);
    } catch (err) {
      setLoading(false);
      toast({
        title: "Error loading messages",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [selectedChat, user, toast]);

  // Socket setup
  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));

    socket.on("typing", (userData) => {
      if (userData._id !== user._id) {
        setTypingUsers((prev) =>
          prev.find((u) => u._id === userData._id) ? prev : [...prev, userData]
        );
      }
    });

    socket.on("stop typing", (userData) => {
      setTypingUsers((prev) => prev.filter((u) => u._id !== userData._id));
    });

    socket.on("message recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages((prev) => [...prev, newMessageRecieved]);
      }
    });

    return () => socket.disconnect();
  }, [user, fetchAgain, notification, setNotification, setFetchAgain]);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
  }, [selectedChat, fetchMessages]);

  useEffect(() => {
    if (!searchQuery) setFilteredMessages(messages);
    else
      setFilteredMessages(
        messages.filter((msg) =>
          msg.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
  }, [searchQuery, messages]);

  // Send message
  const sendMessage = async (e) => {
    if (e.key === "Enter" && newMessage.trim()) {
      e.preventDefault();
      socket.emit("stop typing", { _id: user._id, chatId: selectedChat._id });

      try {
        const content = newMessage;
        const replyTo = replyMessage ? replyMessage._id : null;
        setNewMessage("");
        setReplyMessage(null);

        const res = await fetch("/api/message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ content, chatId: selectedChat._id, replyTo }),
        });

        const data = await res.json();
        socket.emit("new message", data);
        setMessages((prev) => [...prev, data]);
      } catch (err) {
        toast({
          title: "Error sending message",
          status: "error",
          duration: 3000,
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
      socket.emit("typing", {
        _id: user._id,
        name: user.name,
        pic: user.pic,
        chatId: selectedChat._id,
      });
    }

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stop typing", { _id: user._id, chatId: selectedChat._id });
      setTyping(false);
    }, 1500);
  };

  const handleForwardMessage = (message) => {
    setForwardMessage(message);
    setForwardModalOpen(true);
  };

  const forwardToChat = async (chatId) => {
    try {
      await fetch("/api/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          content: forwardMessage.content,
          chatId,
          isForwarded: true,
        }),
      });
      toast({ title: "Message forwarded", status: "success", duration: 2000 });
      setForwardModalOpen(false);
      setForwardMessage(null);
      fetchMessages();
    } catch (err) {
      toast({ title: "Error forwarding message", status: "error" });
    }
  };

  return selectedChat ? (
    <>
      {/* Top bar */}
      <HStack justifyContent="space-between" w="100%" pb="3" px="2">
        <HStack>
          <IconButton
            display={{ base: "flex", md: "none" }}
            icon={<ArrowBackIcon />}
            onClick={() => setSelectedChat("")}
          />
          {!selectedChat.isGroupChat ? (
            <>
              <Text fontSize={{ base: "28px", md: "30px" }}>
                {getSender(user, selectedChat.users)}
              </Text>
              <ProfileModal user={getSenderFull(user, selectedChat.users)} />
            </>
          ) : (
            <>
              <Text fontSize={{ base: "28px", md: "30px" }}>
                {selectedChat.chatName.toUpperCase()}
              </Text>
              <UpdateGroupChatModal
                fetchAgain={fetchAgain}
                setFetchAgain={setFetchAgain}
                fetchMessages={fetchMessages}
              />
            </>
          )}
        </HStack>

        <IconButton
          icon={searchVisible ? <CloseIcon /> : <SearchIcon />}
          onClick={() => setSearchVisible(!searchVisible)}
          variant="ghost"
        />
      </HStack>

      {/* Search input */}
      <Collapse in={searchVisible} animateOpacity>
        <FormControl mb={3}>
          <Input
            variant="filled"
            bg="#F0F0F0"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </FormControl>
      </Collapse>

      {/* Messages */}
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
          <Spinner size="xl" alignSelf="center" margin="auto" />
        ) : (
          <ScrollableChat
            messages={filteredMessages}
            searchQuery={searchQuery}
            typingUsers={typingUsers}
            setReplyMessage={setReplyMessage}
            scrollToMessage={scrollToMessage}
            onForwardMessage={handleForwardMessage}
          />
        )}

        {/* ✅ Input component */}
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendMessage={sendMessage}
          typingHandler={typingHandler}
          replyMessage={replyMessage}
          setReplyMessage={setReplyMessage}
          messages={messages} // pass for quick replies
          user={user}
        />
      </Box>

      {/* Forward modal */}
      <Modal
        isOpen={forwardModalOpen}
        onClose={() => setForwardModalOpen(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Forward Message</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={2} align="stretch">
              {chats
                .filter((c) => c._id !== selectedChat._id)
                .map((chat) => (
                  <Button
                    key={chat._id}
                    onClick={() => forwardToChat(chat._id)}
                  >
                    {chat.chatName ||
                      chat.users.find((u) => u._id !== user._id).name}
                  </Button>
                ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  ) : (
    <Box display="flex" alignItems="center" justifyContent="center" h="100%">
      <Text fontSize="3xl" pb="3">
        Click on a user to start chatting
      </Text>
    </Box>
  );
};

export default SingleChat;
