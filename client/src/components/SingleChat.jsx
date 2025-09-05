import { useEffect, useState } from "react";
import { ArrowBackIcon, SearchIcon, AttachmentIcon } from "@chakra-ui/icons";
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
  Flex,
  Collapse,
} from "@chakra-ui/react";
import io from "socket.io-client";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";
import MessageSearch from "./MessageSearch";
import ReplyInput from "./ReplyInput";
import FileUpload from "./FileUpload";

const ENDPOINT = "http://localhost:5000"; // If you are deploying the app, replace the value with "https://YOUR_DEPLOYED_APPLICATION_URL" then run "npm run build" to create a production build
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // New states for enhanced features
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [replyToMessage, setReplyToMessage] = useState(null);
  
  // File upload state
  const [showFileUpload, setShowFileUpload] = useState(false);

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

    // Cleanup function
    return () => {
      socket.emit("leave chat", selectedChat?._id);
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchMessages(); // Whenever users switches chat, call the function again
    selectedChatCompare = selectedChat;

    // Leave the previous chat room when switching
    return () => {
      if (selectedChatCompare) {
        socket.emit("leave chat", selectedChatCompare._id);
      }
    };
    // eslint-disable-next-line
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message received", (newMessageReceived) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageReceived.chat._id
      ) {
        if (!notification.includes(newMessageReceived)) {
          setNotification([newMessageReceived, ...notification]);
          setFetchAgain(!fetchAgain); // Fetch all the chats again
        }
      } else {
        setMessages([...messages, newMessageReceived]);
      }
    });

    return () => {
      socket.off("message received");
    };
    // eslint-disable-next-line
  });

  const sendMessage = async (e) => {
    // Check if 'Enter' key is pressed and we have something inside 'newMessage'
    if (e.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const messageToSend = newMessage;
        const replyToId = replyToMessage?._id;
        
        setNewMessage(""); // Clear message field before making API call
        setReplyToMessage(null); // Clear reply state

        const requestBody = {
          content: messageToSend,
          chatId: selectedChat._id,
        };

        // Add replyToId if replying to a message
        if (replyToId) {
          requestBody.replyToId = replyToId;
        }

        const response = await fetch("/api/message", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
        const data = await response.json();

        socket.emit("new message", data);
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

  // Handle file upload completion
  const handleFilesUploaded = (uploadedFiles) => {
    // Add uploaded file messages to the chat
    uploadedFiles.forEach((fileData) => {
      setMessages(prevMessages => [...prevMessages, fileData.message]);
      
      // Emit file upload event for real-time updates
      socket.emit("file uploaded", fileData);
    });

    setFetchAgain(!fetchAgain); // Refresh chat list to update latest message
    setShowFileUpload(false);
  };

  // New function to handle reply
  const handleReply = (message) => {
    setReplyToMessage(message);
    // Focus on input field would be nice here
  };

  // Function to handle search results
  const handleSearchResults = (results) => {
    setSearchResults(results);
  };

  // Function to highlight specific message
  const handleHighlightMessage = (messageId) => {
    setHighlightedMessageId(messageId);
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
          {/* Chat Header */}
          <Flex
            fontSize={{ base: "28px", md: "30px" }}
            pb="3"
            px="2"
            w="100%"
            fontFamily="Work sans"
            justifyContent="space-between"
            alignItems="center"
          >
            <Flex alignItems="center">
              <IconButton
                display={{ base: "flex", md: "none" }}
                icon={<ArrowBackIcon />}
                onClick={() => setSelectedChat("")}
                mr={2}
              />
              {!selectedChat.isGroupChat ? (
                <>
                  {getSender(user, selectedChat.users)}
                </>
              ) : (
                <>
                  {selectedChat.chatName.toUpperCase()}
                </>
              )}
            </Flex>

            <Flex alignItems="center" gap={2}>
              {/* Search Toggle Button */}
              <IconButton
                icon={<SearchIcon />}
                onClick={() => setShowSearch(!showSearch)}
                variant="ghost"
                aria-label="Toggle search"
                size="sm"
              />
              
              {!selectedChat.isGroupChat ? (
                <ProfileModal user={getSenderFull(user, selectedChat.users)} />
              ) : (
                <UpdateGroupChatModal
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                  fetchMessages={fetchMessages}
                />
              )}
            </Flex>
          </Flex>

          {/* Search Component */}
          <Collapse in={showSearch} animateOpacity>
            <MessageSearch
              messages={messages}
              onSearchResults={handleSearchResults}
              onHighlightMessage={handleHighlightMessage}
              currentResultIndex={currentSearchIndex}
              setCurrentResultIndex={setCurrentSearchIndex}
            />
          </Collapse>

          {/* Chat Messages Area */}
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
                  onReply={handleReply}
                  filteredMessages={searchResults.length > 0 ? searchResults : null}
                  highlightedMessageId={highlightedMessageId}
                />
              </div>
            )}

            {/* Reply Input or Regular Input */}
            {replyToMessage ? (
              <ReplyInput
                replyToMessage={replyToMessage}
                onCancelReply={() => setReplyToMessage(null)}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                onSendMessage={sendMessage}
                onTyping={(e) => typingHandler(e)}
              />
            ) : (
              <Box position="relative">
                {/* File Upload Component */}
                <FileUpload
                  chatId={selectedChat._id}
                  onFilesUploaded={handleFilesUploaded}
                  replyTo={replyToMessage?._id}
                  isVisible={showFileUpload}
                  onClose={() => setShowFileUpload(false)}
                />
                
                <FormControl mt="3" onKeyDown={(e) => sendMessage(e)} isRequired>
                  <Flex alignItems="center">
                    <IconButton
                      icon={<AttachmentIcon />}
                      onClick={() => setShowFileUpload(!showFileUpload)}
                      variant="ghost"
                      size="sm"
                      mr={2}
                      title="Attach files"
                    />
                    <Input
                      variant="filled"
                      bg="#E0E0E0"
                      placeholder="Enter a message.."
                      value={newMessage}
                      onChange={(e) => typingHandler(e)}
                      flex={1}
                    />
                  </Flex>
                </FormControl>
              </Box>
            )}
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
