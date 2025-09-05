import { useEffect, useState } from "react";
import { ArrowBackIcon, SearchIcon, AttachmentIcon, MoonIcon, SunIcon } from "@chakra-ui/icons";
import AdvancedSearch from './AdvancedSearch';
import ForwardModal from './ForwardModal';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
  HStack,
  VStack,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Checkbox,
  Select,
  InputGroup,
  InputRightElement,
  Kbd,
} from "@chakra-ui/react";
import io from "socket.io-client";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";
import SkeletonLoader from "./SkeletonLoader";

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
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [showSearch, setShowSearch] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [fontStyle, setFontStyle] = useState({ bold: false, italic: false, fontSize: "14px" });

  const [highlightedMessages, setHighlightedMessages] = useState([]);
  
  const { user, selectedChat, setSelectedChat, notification, setNotification, darkMode, setDarkMode } = ChatState();
  const toast = useToast();
  const { isOpen: isSearchOpen, onOpen: onSearchOpen, onClose: onSearchClose } = useDisclosure();
  const { isOpen: isForwardOpen, onOpen: onForwardOpen, onClose: onForwardClose } = useDisclosure();
  const { isOpen: isStyleOpen, onOpen: onStyleOpen, onClose: onStyleClose } = useDisclosure();
  const { isOpen: isHelpOpen, onOpen: onHelpOpen, onClose: onHelpClose } = useDisclosure();

  useKeyboardShortcuts({
    onSend: () => sendMessage({ key: 'Enter' }),
    onToggleBold: () => setFontStyle(prev => ({ ...prev, bold: !prev.bold })),
    onToggleItalic: () => setFontStyle(prev => ({ ...prev, italic: !prev.italic })),
    onShowHelp: onHelpOpen,
    onEscape: () => {
      setReplyTo(null);
      onSearchClose();
      onForwardClose();
      onStyleClose();
      onHelpClose();
    }
  });

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
    if (e.key === "Enter" && (newMessage || selectedFiles.length > 0)) {
      socket.emit("stop typing", selectedChat._id);
      try {
        let fileUrl = null, fileName = null, fileType = null;
        
        if (selectedFiles.length > 0) {
          const formData = new FormData();
          formData.append('file', selectedFiles[0]);
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${user.token}` },
            body: formData
          });
          
          if (!uploadResponse.ok) {
            throw new Error('File upload failed');
          }
          
          const uploadData = await uploadResponse.json();
          fileUrl = uploadData.url;
          fileName = selectedFiles[0].name;
          fileType = selectedFiles[0].type;
        }

        const response = await fetch("/api/message", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: newMessage || '',
            chatId: selectedChat._id,
            fileUrl,
            fileName,
            fileType,
            replyTo: replyTo?._id,
            fontStyle
          }),
        });
        
        if (!response.ok) {
          throw new Error('Message send failed');
        }
        
        const data = await response.json();

        socket.emit("new message", data);
        setNewMessage("");
        setSelectedFiles([]);
        setReplyTo(null);
        setMessages([...messages, data]);
      } catch (error) {
        console.error('Send message error:', error);
        toast({
          title: "Error Occurred!",
          description: error.message || "Failed to send the message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom-right",
        });
      }
    }
  };

  const searchMessages = async (query = searchTerm) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await fetch(`/api/message/search/${selectedChat._id}?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      toast({ title: "Search failed", status: "error" });
    }
  };

  const handleSearch = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      clearHighlights();
      return;
    }
    
    const results = messages.filter(msg => 
      msg.content && msg.content.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(results);
    if (results.length > 0) {
      setCurrentSearchIndex(0);
      highlightSearchResults(results, 0);
    } else {
      setCurrentSearchIndex(-1);
      clearHighlights();
    }
  };
  
  const navigateSearch = (direction) => {
    if (searchResults.length === 0) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : searchResults.length - 1;
    } else {
      newIndex = currentSearchIndex < searchResults.length - 1 ? currentSearchIndex + 1 : 0;
    }
    
    setCurrentSearchIndex(newIndex);
    highlightSearchResults(searchResults, newIndex);
  };
  
  const highlightSearchResults = (results, currentIndex) => {
    clearHighlights();
    
    results.forEach((msg, index) => {
      const element = document.querySelector(`[data-message-id="${msg._id}"]`);
      if (element) {
        element.classList.add('search-highlight');
        if (index === currentIndex) {
          element.classList.add('search-current');
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
  };
  
  const clearHighlights = () => {
    document.querySelectorAll('.search-highlight, .search-current').forEach(el => {
      el.classList.remove('search-highlight', 'search-current');
    });
  };
  
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setCurrentSearchIndex(-1);
    setShowSearch(false);
    clearHighlights();
  };
  
  const handleDeleteMessage = async (messageId, deleteForEveryone) => {
    try {
      await fetch(`/api/message/${messageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deleteForEveryone })
      });
      
      setMessages(messages.filter(msg => msg._id !== messageId));
      toast({ title: 'Message deleted', status: 'success' });
    } catch (error) {
      toast({ title: 'Delete failed', status: 'error' });
    }
  };
  
  const handlePinMessage = async (messageId, isPinned) => {
    try {
      await fetch(`/api/message/${messageId}/pin`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPinned })
      });
      
      setMessages(messages.map(msg => 
        msg._id === messageId ? { ...msg, isPinned } : msg
      ));
      toast({ title: isPinned ? 'Message pinned' : 'Message unpinned', status: 'success' });
    } catch (error) {
      toast({ title: 'Pin failed', status: 'error' });
    }
  };
  
  const handleReactToMessage = async (messageId, emoji) => {
    try {
      await fetch(`/api/message/${messageId}/react`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emoji, userId: user._id })
      });
      
      setMessages(messages.map(msg => {
        if (msg._id === messageId) {
          const reactions = msg.reactions || [];
          const existingReaction = reactions.find(r => r.emoji === emoji);
          
          if (existingReaction) {
            existingReaction.count += 1;
          } else {
            reactions.push({ emoji, count: 1, users: [user._id] });
          }
          
          return { ...msg, reactions };
        }
        return msg;
      }));
    } catch (error) {
      toast({ title: 'Reaction failed', status: 'error' });
    }
  };
  
  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleReply = (message) => {
    setReplyTo(message);
  };

  const handleForward = (message) => {
    setForwardMessage(message);
    onForwardOpen();
  };

  const forwardToChat = async (chatId) => {
    try {
      await fetch("/api/message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: forwardMessage.content,
          chatId,
          forwardedFrom: forwardMessage._id,
          fileUrl: forwardMessage.fileUrl,
          fileName: forwardMessage.fileName,
          fileType: forwardMessage.fileType
        }),
      });
      toast({ title: "Message forwarded successfully", status: "success" });
    } catch (error) {
      toast({ title: "Forward failed", status: "error" });
      throw error;
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
          <Box 
            w="100%" 
            p={3} 
            bg={darkMode ? "gray.700" : "white"}
            borderBottom="1px"
            borderColor={darkMode ? "gray.600" : "gray.200"}
          >
            <HStack justify="space-between">
              <HStack>
                <IconButton
                  display={{ base: "flex", md: "none" }}
                  icon={<ArrowBackIcon />}
                  onClick={() => setSelectedChat("")}
                  variant="ghost"
                  color={darkMode ? "white" : "black"}
                />
                <Text 
                  fontSize={{ base: "20px", md: "24px" }} 
                  fontFamily="Work sans"
                  color={darkMode ? "gray.100" : "black"}
                  fontWeight="600"
                >
                  {!selectedChat.isGroupChat ? 
                    getSender(user, selectedChat.users) : 
                    selectedChat.chatName.toUpperCase()
                  }
                </Text>
              </HStack>
              <HStack spacing={2}>
                <IconButton 
                  icon={<SearchIcon />} 
                  onClick={() => setShowSearch(!showSearch)}
                  variant="ghost"
                  color={showSearch ? "blue.400" : (darkMode ? "gray.200" : "black")}
                  _hover={{ bg: darkMode ? "gray.600" : "gray.100" }}
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
              </HStack>
            </HStack>
          </Box>

          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            bg={darkMode ? "gray.900" : "#E8E8E8"}
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
            position="relative"
          >
            {showSearch && (
              <Box 
                p={3} 
                bg={darkMode ? "gray.800" : "white"}
                borderBottom="1px solid"
                borderColor={darkMode ? "gray.600" : "gray.200"}
              >
                <HStack spacing={2}>
                  <Input
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    size="sm"
                    bg={darkMode ? "gray.700" : "white"}
                    color={darkMode ? "white" : "black"}
                    borderColor={darkMode ? "gray.600" : "gray.300"}
                  />
                  {searchResults.length > 0 && (
                    <>
                      <Text fontSize="sm" color={darkMode ? "gray.300" : "gray.600"}>
                        {currentSearchIndex + 1}/{searchResults.length}
                      </Text>
                      <IconButton
                        icon={<Text>↑</Text>}
                        size="sm"
                        onClick={() => navigateSearch('prev')}
                        variant="ghost"
                      />
                      <IconButton
                        icon={<Text>↓</Text>}
                        size="sm"
                        onClick={() => navigateSearch('next')}
                        variant="ghost"
                      />
                    </>
                  )}
                  <IconButton
                    icon={<Text>×</Text>}
                    size="sm"
                    onClick={clearSearch}
                    variant="ghost"
                  />
                </HStack>
              </Box>
            )}
            <Box p={3} flex={1} display="flex" flexDir="column" minH={0}>
            {loading ? (
              <SkeletonLoader count={8} />
            ) : (
              <Box
                flex={1}
                overflow="hidden"
                display="flex"
                flexDir="column"
              >
                <ScrollableChat 
                  messages={messages} 
                  isTyping={isTyping} 
                  onReply={handleReply}
                  onForward={handleForward}
                  searchResults={searchResults}
                  currentSearchIndex={currentSearchIndex}
                  onDeleteMessage={handleDeleteMessage}
                  onPinMessage={handlePinMessage}
                  onReactToMessage={handleReactToMessage}
                />
              </Box>
            )}

            <VStack spacing={4} mt={4}>
              {/* Font Style Bar */}
              {isStyleOpen && (
                <Box className="font-style-bar" w="100%">
                  <HStack justify="space-between" align="center">
                    <HStack spacing={4}>
                      <HStack spacing={2}>
                        <Checkbox
                          isChecked={fontStyle.bold}
                          onChange={(e) => setFontStyle({...fontStyle, bold: e.target.checked})}
                          colorScheme="blue"
                          size="sm"
                        >
                          <Text fontWeight="bold" fontSize="sm" color={darkMode ? "white" : "black"}>B</Text>
                        </Checkbox>
                        <Checkbox
                          isChecked={fontStyle.italic}
                          onChange={(e) => setFontStyle({...fontStyle, italic: e.target.checked})}
                          colorScheme="blue"
                          size="sm"
                        >
                          <Text fontStyle="italic" fontSize="sm" color={darkMode ? "white" : "black"}>I</Text>
                        </Checkbox>
                      </HStack>
                      
                      <Select
                        value={fontStyle.fontSize}
                        onChange={(e) => setFontStyle({...fontStyle, fontSize: e.target.value})}
                        bg={darkMode ? "gray.700" : "white"}
                        color={darkMode ? "white" : "black"}
                        borderColor={darkMode ? "gray.600" : "gray.300"}
                        size="sm"
                        w="100px"
                      >
                        <option value="12px">Small</option>
                        <option value="14px">Normal</option>
                        <option value="16px">Large</option>
                        <option value="18px">XL</option>
                      </Select>
                    </HStack>
                    
                    <HStack spacing={2}>
                      <Text fontSize="xs" color={darkMode ? "gray.400" : "gray.500"}>Preview:</Text>
                      <Text
                        fontWeight={fontStyle.bold ? "bold" : "normal"}
                        fontStyle={fontStyle.italic ? "italic" : "normal"}
                        fontSize={fontStyle.fontSize}
                        color={darkMode ? "white" : "black"}
                      >
                        Sample text
                      </Text>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        onClick={onStyleClose}
                        icon={<Text>×</Text>}
                        color={darkMode ? "gray.400" : "gray.500"}
                      />
                    </HStack>
                  </HStack>
                </Box>
              )}
              {replyTo && (
                <Box 
                  w="100%" 
                  p={4} 
                  bg={darkMode ? "gray.700" : "blue.50"} 
                  borderRadius="16px"
                  borderLeft="4px solid"
                  borderColor="blue.500"
                  boxShadow={darkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.1)"}
                  position="relative"
                  _before={{
                    content: '"↪"',
                    position: "absolute",
                    left: "-12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    bg: "blue.500",
                    color: "white",
                    borderRadius: "full",
                    w: "24px",
                    h: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px"
                  }}
                >
                  <HStack justify="space-between">
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" fontWeight="bold" color={darkMode ? "blue.300" : "blue.600"}>
                        Replying to {replyTo.sender.name}
                      </Text>
                      <Text fontSize="sm" color={darkMode ? "gray.300" : "gray.600"} fontStyle="italic">
                        "{replyTo.content || "File attachment"}"
                      </Text>
                    </VStack>
                    <IconButton 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setReplyTo(null)}
                      color={darkMode ? "gray.400" : "gray.500"}
                      borderRadius="full"
                      _hover={{ bg: darkMode ? "gray.600" : "gray.200", transform: "scale(1.1)" }}
                    >
                      ×
                    </IconButton>
                  </HStack>
                </Box>
              )}
              
              {selectedFiles.length > 0 && (
                <Box 
                  w="100%" 
                  p={4} 
                  bg={darkMode ? "gray.700" : "green.50"} 
                  borderRadius="16px"
                  border="2px dashed"
                  borderColor={darkMode ? "green.400" : "green.300"}
                  boxShadow={darkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.1)"}
                  position="relative"
                  _before={{
                    content: '"📎"',
                    position: "absolute",
                    left: "-12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    bg: "green.500",
                    color: "white",
                    borderRadius: "full",
                    w: "24px",
                    h: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px"
                  }}
                >
                  <HStack justify="space-between">
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" fontWeight="bold" color={darkMode ? "green.300" : "green.600"}>
                        File ready to send
                      </Text>
                      <Text fontSize="sm" color={darkMode ? "gray.300" : "gray.600"} fontWeight="medium">
                        {selectedFiles[0].name}
                      </Text>
                      <Text fontSize="xs" color={darkMode ? "gray.400" : "gray.500"}>
                        {(selectedFiles[0].size / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    </VStack>
                    <IconButton 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setSelectedFiles([])}
                      color={darkMode ? "gray.400" : "gray.500"}
                      borderRadius="full"
                      _hover={{ bg: darkMode ? "gray.600" : "gray.200", transform: "scale(1.1)" }}
                    >
                      ×
                    </IconButton>
                  </HStack>
                </Box>
              )}
              
              <Box 
                w="100%" 
                className="chat-input-container"
                bg={darkMode ? "gray.700" : "white"}
                borderRadius="24px"
                border="2px solid"
                borderColor={darkMode ? "gray.600" : "gray.200"}
                p={2}
                boxShadow={darkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.1)"}
              >
                <HStack spacing={3}>
                  <input
                    type="file"
                    id="file-upload"
                    style={{ display: 'none' }}
                    onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                    multiple
                    accept="image/*,application/pdf,.doc,.docx,.txt"
                  />
                  <IconButton
                    icon={<AttachmentIcon />}
                    onClick={() => document.getElementById('file-upload').click()}
                    variant="ghost"
                    size="md"
                    color={darkMode ? "gray.300" : "gray.600"}
                    borderRadius="full"
                    _hover={{ 
                      bg: darkMode ? "gray.600" : "blue.50",
                      color: "blue.500",
                      transform: "scale(1.1)"
                    }}
                    title="Attach file"
                    transition="all 0.2s"
                  />
                  <IconButton
                    icon={<Text fontWeight="bold">Aa</Text>}
                    onClick={onStyleOpen}
                    variant="ghost"
                    size="md"
                    color={darkMode ? "gray.300" : "gray.600"}
                    borderRadius="full"
                    _hover={{ 
                      bg: darkMode ? "gray.600" : "purple.50",
                      color: "purple.500",
                      transform: "scale(1.1)"
                    }}
                    title="Text style"
                    transition="all 0.2s"
                  />
                  <FormControl onKeyDown={(e) => sendMessage(e)} flex={1}>
                    <Input
                      bg="transparent"
                      color={darkMode ? "white" : "black"}
                      border="none"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => typingHandler(e)}
                      _placeholder={{ color: darkMode ? "gray.400" : "gray.500" }}
                      _focus={{ outline: "none", boxShadow: "none" }}
                      fontSize="16px"
                      py={3}
                    />
                  </FormControl>
                  <IconButton
                    onClick={(e) => sendMessage({ key: 'Enter' })}
                    colorScheme="blue"
                    size="md"
                    borderRadius="full"
                    isDisabled={!newMessage && selectedFiles.length === 0}
                    _hover={{ transform: "scale(1.05)" }}
                    transition="all 0.2s"
                    icon={<Text fontSize="18px">➤</Text>}
                  />
                </HStack>
              </Box>
            </VStack>
            </Box>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
          bg={darkMode ? "gray.800" : "white"}
        >
          <Text 
            fontSize="3xl" 
            pb="3" 
            fontFamily="Work sans"
            color={darkMode ? "gray.300" : "gray.600"}
          >
            Click on a user to start chatting
          </Text>
        </Box>
      )}
      
      {/* Search Modal */}
      <Modal isOpen={isSearchOpen} onClose={onSearchClose}>
        <ModalOverlay />
        <ModalContent bg={darkMode ? "gray.800" : "white"} color={darkMode ? "white" : "black"}>
          <ModalHeader>Search Messages</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <InputGroup mb={4}>
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchMessages(e.target.value);
                }}
                onKeyDown={(e) => e.key === 'Enter' && searchMessages()}
                bg={darkMode ? "gray.700" : "white"}
                color={darkMode ? "white" : "black"}
                borderColor={darkMode ? "gray.600" : "gray.300"}
                _placeholder={{ color: darkMode ? "gray.400" : "gray.500" }}
              />
              <InputRightElement>
                <IconButton 
                  icon={<SearchIcon />} 
                  onClick={() => searchMessages()}
                  size="sm"
                  variant="ghost"
                  color={darkMode ? "gray.300" : "gray.600"}
                />
              </InputRightElement>
            </InputGroup>
            <VStack spacing={3} maxH="300px" overflowY="auto">
              {searchResults.map(msg => (
                <Box 
                  key={msg._id} 
                  p={3} 
                  border="1px" 
                  borderColor={darkMode ? "gray.600" : "gray.200"} 
                  borderRadius="md"
                  w="100%"
                  bg={darkMode ? "gray.700" : "gray.50"}
                >
                  <Text fontSize="sm" fontWeight="bold" color={darkMode ? "blue.300" : "blue.600"}>
                    {msg.sender.name}
                  </Text>
                  <Text fontSize="sm" mt={1}>{msg.content}</Text>
                </Box>
              ))}
              {searchResults.length === 0 && searchTerm && (
                <Text color={darkMode ? "gray.400" : "gray.500"}>No messages found</Text>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Forward Modal */}
      <ForwardModal
        isOpen={isForwardOpen}
        onClose={onForwardClose}
        message={forwardMessage}
        onForward={forwardToChat}
      />



      {/* Keyboard Shortcuts Help */}
      <Modal isOpen={isHelpOpen} onClose={onHelpClose}>
        <ModalOverlay />
        <ModalContent bg={darkMode ? "gray.800" : "white"} color={darkMode ? "white" : "black"}>
          <ModalHeader>Keyboard Shortcuts</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="bold" mb={2}>Global</Text>
                <VStack spacing={1} align="stretch">
                  <HStack justify="space-between">
                    <Text>Focus search</Text>
                    <Kbd>/</Kbd>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Open search</Text>
                    <HStack><Kbd>Ctrl</Kbd><Kbd>F</Kbd></HStack>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Close/Escape</Text>
                    <Kbd>Esc</Kbd>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Show shortcuts</Text>
                    <Kbd>?</Kbd>
                  </HStack>
                </VStack>
              </Box>
              
              <Box>
                <Text fontWeight="bold" mb={2}>Composer</Text>
                <VStack spacing={1} align="stretch">
                  <HStack justify="space-between">
                    <Text>Send message</Text>
                    <HStack><Kbd>Alt</Kbd><Kbd>S</Kbd></HStack>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>New line</Text>
                    <HStack><Kbd>Shift</Kbd><Kbd>Enter</Kbd></HStack>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Bold text</Text>
                    <HStack><Kbd>Ctrl</Kbd><Kbd>B</Kbd></HStack>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Italic text</Text>
                    <HStack><Kbd>Ctrl</Kbd><Kbd>I</Kbd></HStack>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SingleChat;
