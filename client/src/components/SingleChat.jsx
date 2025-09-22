import { useEffect, useState, useRef } from "react";
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
  Switch,
  HStack,
  VStack,
} from "@chakra-ui/react";
import { BsEmojiSmile } from "react-icons/bs";
import { AiOutlinePaperClip } from "react-icons/ai";
import { MdTextFields } from "react-icons/md";
import EmojiPicker from "emoji-picker-react";
import io from "socket.io-client";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";
import MarkdownInput from "./MarkdownInput";
import { isFileTypeSupported } from "../utils/fileUtils";

const ENDPOINT = "http://localhost:5001";
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [file, setFile] = useState(null);
  const [useMarkdown, setUseMarkdown] = useState(false); // Toggle for markdown mode
  const [isUploading, setIsUploading] = useState(false); // Upload loading state

  const fileInputRef = useRef();
  const { user, selectedChat, setSelectedChat, notification, setNotification } =
    ChatState();
  const toast = useToast();

  // Fetch messages
  const fetchMessages = async () => {
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

  // Socket setup
  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", (data) => {
      if (data.userId !== user._id) {
        setTypingUsers(prev => {
          if (!prev.find(u => u.userId === data.userId)) {
            return [...prev, { userId: data.userId, userName: data.userName }];
          }
          return prev;
        });
      }
    });
    socket.on("stop typing", (data) => {
      if (data.userId !== user._id) {
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
      }
    });
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchMessages();
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
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    });

    return () => {
      socket.off("message recieved");
    };
  }, [messages, notification, fetchAgain, selectedChatCompare]);

  // Send Message (text or file) - Enhanced to handle both regular and markdown inputs
  const sendMessage = async (e) => {
    // Handle different trigger types
    const shouldSend = 
      (e && e.key === "Enter" && newMessage) || 
      file || 
      (e && e.type === "click") ||
      (e && e.type === "submit");

    if (shouldSend) {
      socket.emit("stop typing", selectedChat._id);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("chatId", selectedChat._id);
        if (newMessage) formData.append("content", newMessage);
        if (file) {
          formData.append("file", file);
          formData.append("fileType", file.type);
          formData.append("fileName", file.name);
        }

        setNewMessage("");
        setFile(null);

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
        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        console.error("Error sending message:", error);
        return toast({
          title: "Error Occurred!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom-right",
          variant: "solid",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Typing handler
  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", { 
        chatId: selectedChat._id, 
        userId: user._id, 
        userName: user.name 
      });
    }

    let lastTypingTime = new Date().getTime();
    let timerLength = 3000;

    setTimeout(() => {
      let timeNow = new Date().getTime();
      let timeDiff = timeNow - lastTypingTime;

      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", { 
          chatId: selectedChat._id, 
          userId: user._id, 
          userName: user.name 
        });
        setTyping(false);
      }
    }, timerLength);
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
                  messages={messages} 
                  isTyping={isTyping} 
                  typingUsers={typingUsers}
                />
              </div>
            )}
            <VStack mt="3" spacing={2} align="stretch">
              {/* Markdown Toggle */}
              <HStack justify="space-between" px={2}>
                <HStack spacing={2}>
                  <MdTextFields size={20} />
                  <Text fontSize="sm" fontWeight="medium">Markdown Mode</Text>
                </HStack>
                <Switch
                  isChecked={useMarkdown}
                  onChange={(e) => setUseMarkdown(e.target.checked)}
                  colorScheme="blue"
                />
              </HStack>

              {/* Conditional Input Area */}
              {useMarkdown ? (
                <MarkdownInput
                  value={newMessage}
                  onChange={setNewMessage}
                  onSend={() => sendMessage({ type: "submit" })}
                  placeholder="Type your message in Markdown..."
                  isDisabled={loading || isUploading}
                  file={file}
                  onFileChange={setFile}
                />
              ) : (
                <FormControl onKeyDown={(e) => sendMessage(e)} isRequired>
                  <Box display="flex" alignItems="center" gap="2">
                    {/* Emoji Button */}
                    <IconButton
                      icon={<BsEmojiSmile />}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    />
                    {showEmojiPicker && (
                      <Box position="absolute" bottom="60px" zIndex="10">
                        <EmojiPicker
                          onEmojiClick={(emojiObj) =>
                            setNewMessage((prev) => prev + emojiObj.emoji)
                          }
                        />
                      </Box>
                    )}

                    {/* File Upload */}
                    <IconButton
                      icon={<AiOutlinePaperClip />}
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.click();
                        }
                      }}
                      aria-label="Upload image"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      accept="image/*,.png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.doc,.docx"
                      onChange={(e) => {
                        const selectedFile = e.target.files[0];
                        if (selectedFile) {
                          if (isFileTypeSupported(selectedFile)) {
                            setFile(selectedFile);
                          } else {
                            toast({
                              title: "Unsupported File Type",
                              description: "Please select a supported file (Images, PDF, Text, Word docs)",
                              status: "warning",
                              duration: 3000,
                              isClosable: true,
                              position: "bottom-right",
                            });
                          }
                        } else {
                          setFile(null);
                        }
                      }}
                    />

                    <Input
                      variant="filled"
                      bg="#E0E0E0"
                      placeholder="Enter a message.."
                      value={newMessage}
                      onChange={(e) => typingHandler(e)}
                      isDisabled={isUploading}
                    />

                    {/* File Display in Regular Mode */}
                    {file && (
                      <Box
                        position="absolute"
                        bottom="60px"
                        right="10px"
                        bg="blue.50"
                        p={2}
                        borderRadius="md"
                        border="1px"
                        borderColor="blue.200"
                        maxW="200px"
                      >
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="blue.700" noOfLines={1}>
                            {file.type.startsWith('image/') ? '🖼️' : '📎'} {file.name}
                          </Text>
                          <Button
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => setFile(null)}
                          >
                            ×
                          </Button>
                        </HStack>
                      </Box>
                    )}

                    {/* Send Button */}
                    <Button 
                      onClick={(e) => sendMessage(e)} 
                      colorScheme="blue"
                      isDisabled={(!newMessage.trim() && !file) || isUploading}
                      isLoading={isUploading}
                      loadingText="Sending..."
                    >
                      Send
                    </Button>
                  </Box>
                </FormControl>
              )}
            </VStack>
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
