import { useEffect, useState, useRef } from "react";
import { ArrowBackIcon, MoonIcon, SunIcon } from "@chakra-ui/icons";
import {
  Box,
  FormControl,
  HStack,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
  VStack,
  CloseButton,
  Textarea,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import EmojiPicker from "./EmojiPicker";
import io from "socket.io-client";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";
import MessageSearch from "./MessageSearch";
import MarkdownPreview from "./MarkdownPreview";

const ENDPOINT = "http://localhost:5000"; // If you are deploying the app, replace the value with "https://YOUR_DEPLOYED_APPLICATION_URL" then run "npm run build" to create a production build
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [mode, setMode] = useState('write'); // 'write' or 'preview'
  const textareaRef = useRef(null);

  const { user, selectedChat, setSelectedChat, notification, setNotification } =
    ChatState();
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();
  const chatBg = useColorModeValue("#E8E8E8", "gray.800");
  const previewBg = useColorModeValue("white", "white");
  const previewTextColor = useColorModeValue("black", "black");
  const previewBorderColor = useColorModeValue("gray.300", "gray.400");
  const textareaBg = useColorModeValue("white", "white");
  const textareaTextColor = useColorModeValue("black", "black");
  const textareaBorderColor = useColorModeValue("gray.300", "gray.400");

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
    // Only send message with Ctrl/Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && newMessage.trim()) {
      e.preventDefault();
      await handleSendMessage();
    }
    // Let Enter key work normally for new lines (no preventDefault)
  };

  const handleEmojiSelect = (emoji) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentMessage = newMessage;
      
      // Insert emoji at cursor position
      const newText = currentMessage.substring(0, start) + emoji + currentMessage.substring(end);
      setNewMessage(newText);
      
      // Set cursor position after the emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    socket.emit("stop typing", selectedChat._id);
    try {
      // Wrap long lines before sending
      const messageToSend = wrapLongLines(newMessage);
      setNewMessage(""); // Clear message field before making API call

      const response = await fetch("/api/message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: messageToSend,
          chatId: selectedChat._id,
          replyTo: replyingTo ? replyingTo._id : null,
        }),
      });
      const data = await response.json();

      socket.emit("new message", data);
      setReplyingTo(null); // Clear reply state
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

  // Optimized auto-resize function with debouncing
  const handleTextareaResize = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      // Use requestAnimationFrame for smoother performance
      requestAnimationFrame(() => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
      });
    }
  };

  // Debounced resize function
  const debouncedResize = useRef(null);
  const debouncedHandleResize = () => {
    if (debouncedResize.current) {
      clearTimeout(debouncedResize.current);
    }
    debouncedResize.current = setTimeout(handleTextareaResize, 10);
  };

  // Function to wrap long lines by inserting line breaks
  const wrapLongLines = (text, maxLength = 50) => {
    return text.split('\n').map(line => {
      if (line.length <= maxLength) return line;
      
      // Split long lines into chunks
      const chunks = [];
      for (let i = 0; i < line.length; i += maxLength) {
        chunks.push(line.slice(i, i + maxLength));
      }
      return chunks.join('\n');
    }).join('\n');
  };

  // Reply to message handler
  const handleReplyToMessage = (message) => {
    setReplyingTo(message);
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
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
                <HStack>
                  <MessageSearch 
                    selectedChat={selectedChat} 
                    user={user} 
                  />
                  <IconButton
                    aria-label="Toggle color mode"
                    icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                    onClick={toggleColorMode}
                    size="sm"
                    variant="ghost"
                  />
                  <ProfileModal user={getSenderFull(user, selectedChat.users)} />
                </HStack>
              </>
            ) : (
              <>
                {selectedChat.chatName.toUpperCase()}
                <HStack>
                  <MessageSearch 
                    selectedChat={selectedChat} 
                    user={user} 
                  />
                  <IconButton
                    aria-label="Toggle color mode"
                    icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                    onClick={toggleColorMode}
                    size="sm"
                    variant="ghost"
                  />
                  <UpdateGroupChatModal
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                    fetchMessages={fetchMessages}
                  />
                </HStack>
              </>
            )}
          </Text>

          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg={chatBg}
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
                  onReplyToMessage={handleReplyToMessage}
                />
              </div>
            )}

            {/* Reply UI */}
            {replyingTo && (
              <Box
                bg="blue.50"
                p={4}
                borderRadius="md"
                borderLeft="4px solid"
                borderLeftColor="blue.500"
                border="1px solid"
                borderColor="blue.200"
                mb={2}
                boxShadow="sm"
              >
                <HStack justify="space-between" align="flex-start">
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontSize="sm" color="blue.700" fontWeight="bold">
                      Replying to {replyingTo.sender.name}:
                    </Text>
                    <Text fontSize="sm" color="gray.800" noOfLines={2} fontWeight="medium">
                      {replyingTo.content}
                    </Text>
                  </VStack>
                  <CloseButton size="sm" onClick={cancelReply} />
                </HStack>
              </Box>
            )}

            <FormControl mt="3" isRequired>
              <Tabs 
                index={mode === 'write' ? 0 : 1} 
                onChange={(index) => setMode(index === 0 ? 'write' : 'preview')}
                variant="enclosed"
                size="sm"
              >
                <TabList>
                  <Tab>Write</Tab>
                  <Tab>Preview</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel p={0} pt={2}>
                    <HStack spacing={2} align="flex-end">
                      <Textarea
                        ref={textareaRef}
                        variant="filled"
                        bg={textareaBg}
                        color={textareaTextColor}
                        border="1px solid"
                        borderColor={textareaBorderColor}
                        placeholder={replyingTo ? "Type your reply..." : "Enter a message... Try markdown: **bold**, *italic*, `code`, # headings, - lists"}
                        value={newMessage}
                        onChange={(e) => {
                          typingHandler(e);
                          debouncedHandleResize();
                        }}
                        onKeyDown={(e) => sendMessage(e)}
                        resize="none"
                        minH="40px"
                        maxH="300px"
                        rows={1}
                        _focus={{
                          borderColor: "blue.500",
                          boxShadow: "0 0 0 1px #3182ce"
                        }}
                        _hover={{
                          borderColor: "blue.300"
                        }}
                        _placeholder={{
                          color: "gray.500"
                        }}
                        sx={{
                          backgroundColor: 'white !important',
                          color: 'black !important',
                          '&::-webkit-scrollbar': {
                            width: '4px',
                          },
                          '&::-webkit-scrollbar-track': {
                            width: '6px',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: '#CBD5E0',
                            borderRadius: '24px',
                          },
                        }}
                      />
                      <EmojiPicker 
                        onEmojiSelect={handleEmojiSelect}
                        isDisabled={false}
                      />
                      <Button
                        colorScheme="blue"
                        size="sm"
                        px={6}
                        onClick={handleSendMessage}
                        isDisabled={!newMessage.trim()}
                        _disabled={{
                          opacity: 0.4,
                          cursor: 'not-allowed',
                        }}
                      >
                        Send
                      </Button>
                    </HStack>
                  </TabPanel>
                  <TabPanel p={0} pt={2}>
                    <HStack spacing={2} align="flex-start">
                      <Box
                        minH="40px"
                        maxH="300px"
                        p={3}
                        border="1px solid"
                        borderColor={previewBorderColor}
                        borderRadius="md"
                        bg={previewBg}
                        color={previewTextColor}
                        overflowY="auto"
                        flex={1}
                        sx={{
                          '&::-webkit-scrollbar': {
                            width: '4px',
                          },
                          '&::-webkit-scrollbar-track': {
                            width: '6px',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: '#CBD5E0',
                            borderRadius: '24px',
                          },
                        }}
                      >
                        <MarkdownPreview content={newMessage} />
                      </Box>
                      <EmojiPicker 
                        onEmojiSelect={handleEmojiSelect}
                        isDisabled={false}
                      />
                      <Button
                        colorScheme="blue"
                        size="sm"
                        px={6}
                        onClick={handleSendMessage}
                        isDisabled={!newMessage.trim()}
                        _disabled={{
                          opacity: 0.4,
                          cursor: 'not-allowed',
                        }}
                      >
                        Send
                      </Button>
                    </HStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
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
