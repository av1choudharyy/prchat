import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowBackIcon, AttachmentIcon } from "@chakra-ui/icons";
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

const ENDPOINT = "http://localhost:5000"; // If you are deploying the app, replace the value with "https://YOUR_DEPLOYED_APPLICATION_URL" then run "npm run build" to create a production build
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) => {
      const contentMatch = m.content?.toLowerCase().includes(q);
      const replyContentMatch = m.replyTo?.content?.toLowerCase().includes(q);
      const senderMatch = m.sender?.name?.toLowerCase().includes(q);
      const replySenderMatch = m.replyTo?.sender?.name
        ?.toLowerCase()
        .includes(q);
      return contentMatch || replyContentMatch || senderMatch || replySenderMatch;
    });
  }, [messages, searchQuery]);

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
            replyTo: replyToMessage?._id || null,
          }),
        });
        const data = await response.json();

        socket.emit("new message", data);
        setNewMessage("");
        setReplyToMessage(null);
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

  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/single", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
        body: formData,
      });
      const up = await res.json();
      if (!res.ok) {
        throw new Error(up?.message || "Upload failed");
      }

      const apiBase =
        process.env.REACT_APP_API_BASE ||
        `${window.location.protocol}//${window.location.hostname}:5000`;
      const absoluteUrl = up.url?.startsWith("http") ? up.url : `${apiBase}${up.url}`;

      const attachment = {
        url: absoluteUrl,
        name: up.name,
        size: up.size,
        type: up.mimeType?.startsWith("image/") ? "image" : "file",
      };

      const response = await fetch("/api/message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: "",
          chatId: selectedChat._id,
          attachment,
        }),
      });
      const data = await response.json();
      socket.emit("new message", data);
      setMessages((prev) => [...prev, data]);
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err.message || "Please try again",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom-right",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
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
          </Text>

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
                  messages={filteredMessages}
                  isTyping={isTyping}
                  onReply={(m) => setReplyToMessage(m)}
                  onCopy={(text) => navigator.clipboard.writeText(text)}
                />
              </div>
            )}

            <FormControl mt="3">
              <Input
                variant="outline"
                bg="#FFFFFF"
                placeholder="Search in conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                mb="2"
              />
            </FormControl>

            <FormControl mt="1" onKeyDown={(e) => sendMessage(e)} isRequired>
              {replyToMessage ? (
                <Box
                  mb="2"
                  p="2"
                  bg="#dfe6e9"
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Text fontSize="sm">
                    Replying to {replyToMessage.sender?.name}: {replyToMessage.content}
                  </Text>
                  <IconButton
                    size="sm"
                    ml="2"
                    onClick={() => setReplyToMessage(null)}
                    aria-label="Cancel reply"
                    icon={<span style={{ fontWeight: 700 }}>×</span>}
                  />
                </Box>
              ) : null}
              <Input
                variant="filled"
                bg="#E0E0E0"
                placeholder="Enter a message.."
                value={newMessage}
                onChange={(e) => typingHandler(e)}
              />
              <Box mt="2" display="flex" justifyContent="flex-end">
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: "none" }}
                  onChange={handleFilePick}
                  disabled={uploading}
                />
                <IconButton
                  isLoading={uploading}
                  aria-label="Attach file"
                  size="sm"
                  ml="2"
                  icon={<AttachmentIcon />}
                  onClick={() => fileInputRef.current?.click()}
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
