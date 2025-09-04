import { useEffect, useState } from "react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import {
  Box,
  FormControl,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
  Text,
  useToast,
  HStack,
  useColorMode,
} from "@chakra-ui/react";
import io from "socket.io-client";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";
import EmojiPickerComponent from "./EmojiPicker";
import MessageScheduler from "./MessageScheduler";
import FileAttachment from "./FileAttachment";

const ENDPOINT = "http://localhost:5000"; // If you are deploying the app, replace the value with "https://YOUR_DEPLOYED_APPLICATION_URL" then run "npm run build" to create a production build
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const { user, selectedChat, setSelectedChat, notification, setNotification } =
    ChatState();
  const toast = useToast();
  const { colorMode } = useColorMode();

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

  const sendMessage = async (e, file = null) => {
    // Check if 'Enter' key is pressed and we have something inside 'newMessage' or a file is selected
    if ((e && e.key === "Enter" && (newMessage || selectedFile)) || file) {
      socket.emit("stop typing", selectedChat._id);
      try {
        setIsUploading(true);
        const fileToSend = file || selectedFile;

        const formData = new FormData();
        if (newMessage) {
          formData.append('content', newMessage);
        }
        if (fileToSend) {
          formData.append('file', fileToSend);
        }
        formData.append('chatId', selectedChat._id);

        setNewMessage(""); // Clear message field before making API call
        setSelectedFile(null); // Clear selected file

        const response = await fetch("/api/message", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data._id) {
          throw new Error("Invalid response data from server");
        }

        socket.emit("new message", data);
        setMessages([...messages, data]); // Add new message with existing messages
        setIsUploading(false);
      } catch (error) {
        console.error("Send message error:", error);
        setIsUploading(false);
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

  const handleEmojiClick = (emojiObject) => {
    setNewMessage((prevMessage) => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    // Auto-send file if no text message
    if (!newMessage) {
      sendMessage(null, file);
    }
  };

  const handleScheduleMessage = async (scheduleData) => {
    try {
      console.log("Sending schedule request:", {
        ...scheduleData,
        chatId: selectedChat._id,
      });

      const response = await fetch("/api/scheduled-message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...scheduleData,
          chatId: selectedChat._id,
        }),
      });

      console.log("Response status:", response.status);

      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to schedule message");
      }

      handleScheduleSuccess();
      return responseData;
    } catch (error) {
      console.error("Schedule message error:", error);
      throw error;
    }
  };

  const openScheduler = () => {
    setShowScheduler(true);
  };

  const handleScheduleSuccess = () => {
    // Clear the message input after successful scheduling
    setNewMessage("");
    setShowScheduler(false);
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
            color={colorMode === "light" ? "black" : "white"}
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            <HStack>
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
          </Text>

          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg={colorMode === "light" ? "#E8E8E8" : "gray.700"}
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
                <ScrollableChat messages={messages} isTyping={isTyping} />
              </div>
            )}

            <FormControl mt="3" onKeyDown={(e) => sendMessage(e)} isRequired>
              <InputGroup>
                <Input
                  variant="filled"
                  bg={colorMode === "light" ? "#E0E0E0" : "#4F4F4F"}
                  placeholder="Enter a message.."
                  value={newMessage}
                  onChange={(e) => typingHandler(e)}
                  pr="160px"
                  color={colorMode === "light" ? "black" : "white"}
                />
                <InputRightElement width="160px">
                  <Box display="flex" gap={1}>
                    <FileAttachment
                      onFileSelect={handleFileSelect}
                      isUploading={isUploading}
                    />
                    <IconButton
                      aria-label="Schedule message"
                      icon={<span style={{ fontSize: "18px" }}>⏰</span>}
                      size="sm"
                      variant="ghost"
                      onClick={openScheduler}
                      _hover={{ bg: "gray.100" }}
                    />
                    <EmojiPickerComponent
                      onEmojiClick={handleEmojiClick}
                      isOpen={showEmojiPicker}
                      onToggle={toggleEmojiPicker}
                    />
                  </Box>
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <MessageScheduler
              isOpen={showScheduler}
              onClose={() => setShowScheduler(false)}
              onSchedule={handleScheduleMessage}
              currentMessage={newMessage}
            />
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
