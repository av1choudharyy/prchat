import { Avatar, Tooltip, Box, Text, IconButton, Menu, MenuButton, MenuList, MenuItem, Image, HStack, VStack, Button, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Input } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { CopyIcon, RepeatIcon, DeleteIcon, StarIcon } from "@chakra-ui/icons";
import Lottie from "lottie-react";

import "../App.css";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../context/ChatProvider";
import typingAnimation from "../animations/typing.json";

const ScrollableChat = ({ messages, isTyping, onReply, onForward, searchResults, currentSearchIndex, onDeleteMessage, onPinMessage, onReactToMessage }) => {
  const { user, darkMode } = ChatState();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const { isOpen: isLocationOpen, onOpen: onLocationOpen, onClose: onLocationClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [messageToDelete, setMessageToDelete] = useState(null);

  const scrollRef = useRef();
  const chatContainerRef = useRef();
  
  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];
  
  const scrollToMessage = (messageId) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add highlight effect
      messageElement.classList.add('highlight-search-result');
      setTimeout(() => {
        messageElement.classList.remove('highlight-search-result');
      }, 3000);
    }
  };

  useEffect(() => {
    // Only scroll to bottom if not searching
    if (!searchResults || searchResults.length === 0) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isTyping, searchResults]);
  
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
      }
    };
    
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);
  
  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };
  
  const handleReaction = (messageId, emoji) => {
    onReactToMessage(messageId, emoji);
  };
  
  const handleDeleteMessage = (message, deleteForEveryone = false) => {
    onDeleteMessage(message._id, deleteForEveryone);
    onDeleteClose();
  };
  
  const handlePinMessage = (message) => {
    onPinMessage(message._id, !message.isPinned);
  };
  
  const shareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocationData({ latitude, longitude });
          onLocationOpen();
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };
  
  const renderLinkPreview = (url) => {
    // Simple URL detection and preview
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = url.match(urlRegex);
    
    if (!urls) return null;
    
    return urls.map((link, index) => (
      <Box key={index} className="link-preview" onClick={() => window.open(link, '_blank')}>
        <Box p={3}>
          <Text fontSize="sm" fontWeight="bold" color={darkMode ? "blue.300" : "blue.600"}>
            🔗 Link Preview
          </Text>
          <Text fontSize="xs" color={darkMode ? "gray.400" : "gray.600"} noOfLines={1}>
            {link}
          </Text>
        </Box>
      </Box>
    ));
  };
  
  const renderMessageStatus = (message) => {
    if (message.sender._id !== user._id) return null;
    
    const status = message.status || 'sent';
    const statusIcons = {
      sent: '✓',
      delivered: '✓✓',
      read: '✓✓',
      failed: '❌'
    };
    
    return (
      <Text 
        className={`message-status status-${status}`}
        fontSize="12px"
      >
        {statusIcons[status]}
      </Text>
    );
  };

  return (
    <>
      <div
        ref={chatContainerRef}
        className="hide-scrollbar chat-timeline"
        style={{ 
          overflowX: "hidden", 
          overflowY: "auto",
          height: "100%",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* If something inside the messages, render the messages */}
        {messages &&
          messages.map((message, index) => (
            <Box 
              ref={scrollRef} 
              key={message._id} 
              className="message-container message-bubble" 
              data-message-id={message._id}
              display="flex"
              justifyContent={message.sender._id === user._id ? "flex-end" : "flex-start"}
              mb={1}
              px={4}
            >
              {message.sender._id !== user._id && (
                <Avatar
                  size="xs"
                  src={message.sender.pic}
                  name={message.sender.name}
                  mr={2}
                  mt="auto"
                  display={isSameUser(messages, message, index, user._id) ? "none" : "flex"}
                />
              )}

              <Box 
                position="relative" 
                _hover={{ "& .message-actions": { opacity: 1 } }}
                maxW="70%"
                display="flex"
                flexDirection="column"
                alignItems={message.sender._id === user._id ? "flex-end" : "flex-start"}
                className={message.isPinned ? "pinned-message" : ""}
              >
                {message.sender._id !== user._id && !isSameUser(messages, message, index, user._id) && (
                  <Text fontSize="xs" color={darkMode ? "gray.400" : "gray.600"} mb={1} ml={2}>
                    {message.sender.name}
                  </Text>
                )}
                
                <Box
                  bg={message.sender._id === user._id ? 
                    (darkMode ? "#005c4b" : "#dcf8c6") : 
                    (darkMode ? "#262d31" : "white")
                  }
                  color={message.sender._id === user._id ? 
                    (darkMode ? "white" : "black") : 
                    (darkMode ? "#e9edef" : "black")
                  }
                  borderRadius="7.5px"
                  p="6px 7px 8px 9px"
                  position="relative"
                  boxShadow="0 1px 0.5px rgba(0,0,0,.13)"
                >
                  {message.replyTo && (
                    <Box 
                      bg={message.sender._id === user._id ? 
                        (darkMode ? "blue.700" : "blue.400") : 
                        (darkMode ? "gray.700" : "gray.50")
                      }
                      p={3} mb={3} borderRadius="12px" fontSize="sm"
                      borderLeft="4px solid"
                      borderColor={message.sender._id === user._id ? "white" : "blue.500"}
                      position="relative"
                      cursor="pointer"
                      onClick={() => scrollToMessage(message.replyTo._id)}
                      _hover={{
                        transform: "scale(1.02)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                      }}
                      transition="all 0.2s"
                      title="Click to go to original message"
                    >
                      <Text fontWeight="bold" fontSize="xs" 
                        color={message.sender._id === user._id ? "blue.100" : (darkMode ? "blue.300" : "blue.600")}
                      >
                        ↪ {message.replyTo.sender?.name}
                      </Text>
                      <Text fontSize="xs" opacity={0.9} mt={1}>
                        {message.replyTo.content || "File attachment"}
                      </Text>
                    </Box>
                  )}
                  {message.forwardedFrom && (
                    <Box display="flex" alignItems="center" mb={2}>
                      <Text fontSize="xs" opacity={0.7} fontStyle="italic" color={message.sender._id === user._id ? "blue.100" : "gray.500"}>
                        ➤ Forwarded
                      </Text>
                    </Box>
                  )}
                  {message.fileUrl ? (
                    message.fileType?.startsWith('image/') ? (
                      <Box>
                        <Box 
                          borderRadius="12px" 
                          overflow="hidden" 
                          bg={darkMode ? "gray.700" : "gray.100"}
                          p={1}
                        >
                          <Image 
                            src={message.fileUrl} 
                            maxW="250px" 
                            maxH="300px"
                            borderRadius="8px" 
                            objectFit="cover"
                          />
                        </Box>
                        {message.content && (
                          <Text mt={3} fontSize="sm" lineHeight="1.4">{message.content}</Text>
                        )}
                      </Box>
                    ) : (
                      <Box>
                        <Box 
                          p={4} 
                          bg={message.sender._id === user._id ? 
                            (darkMode ? "blue.700" : "blue.400") : 
                            (darkMode ? "gray.700" : "gray.100")
                          }
                          borderRadius="12px" 
                          border="2px dashed" 
                          borderColor={message.sender._id === user._id ? "white" : (darkMode ? "gray.500" : "gray.300")}
                          transition="all 0.2s"
                          _hover={{ transform: "scale(1.02)" }}
                        >
                          <Box display="flex" alignItems="center" mb={2}>
                            <Text fontSize="20px" mr={2}>📎</Text>
                            <Text fontSize="sm" fontWeight="bold" 
                              color={message.sender._id === user._id ? "white" : (darkMode ? "gray.200" : "gray.700")}
                            >
                              {message.fileName}
                            </Text>
                          </Box>
                          <Text 
                            as="a" 
                            href={message.fileUrl} 
                            download 
                            target="_blank" 
                            color={message.sender._id === user._id ? "blue.100" : (darkMode ? "blue.300" : "blue.600")}
                            fontSize="sm"
                            fontWeight="semibold"
                            textDecoration="underline"
                            _hover={{ 
                              color: message.sender._id === user._id ? "white" : (darkMode ? "blue.200" : "blue.800"),
                              transform: "translateY(-1px)"
                            }}
                            transition="all 0.2s"
                          >
                            ⬇ Download File
                          </Text>
                        </Box>
                        {message.content && (
                          <Text mt={3} fontSize="sm" lineHeight="1.4">{message.content}</Text>
                        )}
                      </Box>
                    )
                  ) : (
                    <Text
                      fontWeight={message.fontStyle?.bold ? "bold" : "normal"}
                      fontStyle={message.fontStyle?.italic ? "italic" : "normal"}
                      fontSize={message.fontStyle?.fontSize || "14px"}
                      lineHeight="1.4"
                      wordBreak="break-word"
                    >
                      {message.content}
                    </Text>
                  )}
                  
                  {/* Link Preview */}
                  {message.content && renderLinkPreview(message.content)}
                  

                  
                  {/* Message Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <Box className="reaction-container">
                      {message.reactions.map((reaction, idx) => (
                        <Box key={idx} className="reaction-item" onClick={() => handleReaction(message._id, reaction.emoji)}>
                          <Text>{reaction.emoji}</Text>
                          <Text fontSize="10px">{reaction.count}</Text>
                        </Box>
                      ))}
                    </Box>
                  )}
                  
                  <Box display="flex" alignItems="flex-end" justifyContent="flex-end" mt={1}>
                    <Text 
                      fontSize="11px"
                      color={message.sender._id === user._id ? 
                        (darkMode ? "rgba(233, 237, 239, 0.6)" : "rgba(0, 0, 0, 0.45)") : 
                        (darkMode ? "rgba(233, 237, 239, 0.6)" : "rgba(0, 0, 0, 0.45)")
                      }
                      mr={message.sender._id === user._id ? 1 : 0}
                    >
                      {new Date(message.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                    {renderMessageStatus(message)}
                  </Box>
                </Box>
                
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<Text fontSize="14px">⋮</Text>}
                    size="xs"
                    variant="ghost"
                    className="message-actions"
                    opacity={0}
                    transition="all 0.2s"
                    position="absolute"
                    top="0"
                    right={message.sender._id === user._id ? "-25px" : "auto"}
                    left={message.sender._id !== user._id ? "-25px" : "auto"}
                    color={darkMode ? "gray.400" : "gray.500"}
                    _hover={{ 
                      bg: darkMode ? "gray.600" : "gray.200",
                      opacity: 1
                    }}
                  />
                  <MenuList 
                    bg={darkMode ? "#233138" : "white"} 
                    borderColor={darkMode ? "gray.600" : "gray.200"}
                    boxShadow="0 2px 8px rgba(0,0,0,0.26)"
                    borderRadius="3px"
                    py={1}
                    minW="120px"
                  >
                    <MenuItem 
                      icon={<CopyIcon />} 
                      onClick={() => {
                        const textToCopy = message.content || (message.fileName ? `File: ${message.fileName}` : 'Message');
                        navigator.clipboard.writeText(textToCopy);
                      }}
                      fontSize="14px"
                      py={2}
                      color={darkMode ? "#e9edef" : "black"}
                      _hover={{ bg: darkMode ? "#182229" : "#f5f5f5" }}
                    >
                      Copy
                    </MenuItem>
                    <MenuItem 
                      icon={<RepeatIcon />} 
                      onClick={() => onReply(message)}
                      fontSize="14px"
                      py={2}
                      color={darkMode ? "#e9edef" : "black"}
                      _hover={{ bg: darkMode ? "#182229" : "#f5f5f5" }}
                    >
                      Reply
                    </MenuItem>
                    <MenuItem 
                      onClick={() => onForward(message)}
                      fontSize="14px"
                      py={2}
                      color={darkMode ? "#e9edef" : "black"}
                      _hover={{ bg: darkMode ? "#182229" : "#f5f5f5" }}
                    >
                      Forward
                    </MenuItem>
                    <MenuItem 
                      icon={<StarIcon />}
                      onClick={() => handlePinMessage(message)}
                      fontSize="14px"
                      py={2}
                      color={darkMode ? "#e9edef" : "black"}
                      _hover={{ bg: darkMode ? "#182229" : "#f5f5f5" }}
                    >
                      {message.isPinned ? 'Unpin' : 'Pin'}
                    </MenuItem>
                    <MenuItem 
                      icon={<DeleteIcon />}
                      onClick={() => {
                        setMessageToDelete(message);
                        onDeleteOpen();
                      }}
                      fontSize="14px"
                      py={2}
                      color={darkMode ? "#e9edef" : "black"}
                      _hover={{ bg: darkMode ? "#182229" : "#f5f5f5" }}
                    >
                      Delete
                    </MenuItem>
                    {/* Reaction Menu */}
                    <Box p={2} borderTop="1px solid" borderColor={darkMode ? "gray.600" : "gray.200"}>
                      <HStack spacing={1}>
                        {reactions.map((emoji) => (
                          <Button
                            key={emoji}
                            size="xs"
                            variant="ghost"
                            onClick={() => handleReaction(message._id, emoji)}
                            _hover={{ bg: darkMode ? "gray.600" : "gray.100" }}
                            minW="auto"
                            h="24px"
                            p={1}
                            fontSize="14px"
                          >
                            {emoji}
                          </Button>
                        ))}
                      </HStack>
                    </Box>
                  </MenuList>
                </Menu>
              </Box>
            </Box>
          ))}
        
        {isTyping && (
          <Box display="flex" alignItems="center" mt={3} ml={12}>
            <Box 
              bg={darkMode ? "gray.600" : "gray.200"}
              borderRadius="20px 20px 20px 5px"
              p={3}
              display="flex"
              alignItems="center"
              gap={1}
            >
              <Box w="8px" h="8px" bg={darkMode ? "gray.400" : "gray.500"} borderRadius="full" className="typing-dot" />
              <Box w="8px" h="8px" bg={darkMode ? "gray.400" : "gray.500"} borderRadius="full" className="typing-dot" />
              <Box w="8px" h="8px" bg={darkMode ? "gray.400" : "gray.500"} borderRadius="full" className="typing-dot" />
            </Box>
          </Box>
        )}
        
        <div ref={scrollRef} />
      </div>
      
      {/* Auto-scroll to bottom button */}
      {showScrollButton && (
        <Box className="scroll-to-bottom" onClick={scrollToBottom}>
          ↓
        </Box>
      )}
      
      {/* Delete Message Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent bg={darkMode ? "gray.800" : "white"} color={darkMode ? "white" : "black"}>
          <ModalHeader>Delete Message</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Text>Are you sure you want to delete this message?</Text>
              <HStack spacing={4}>
                <Button 
                  colorScheme="red" 
                  onClick={() => handleDeleteMessage(messageToDelete, false)}
                >
                  Delete for me
                </Button>
                {messageToDelete?.sender._id === user._id && (
                  <Button 
                    colorScheme="red" 
                    variant="outline"
                    onClick={() => handleDeleteMessage(messageToDelete, true)}
                  >
                    Delete for everyone
                  </Button>
                )}
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* Location Share Modal */}
      <Modal isOpen={isLocationOpen} onClose={onLocationClose}>
        <ModalOverlay />
        <ModalContent bg={darkMode ? "gray.800" : "white"} color={darkMode ? "white" : "black"}>
          <ModalHeader>Share Location</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {locationData && (
              <VStack spacing={4}>
                <Text>Share your current location?</Text>
                <Text fontSize="sm" color={darkMode ? "gray.400" : "gray.600"}>
                  Lat: {locationData.latitude.toFixed(4)}, Lng: {locationData.longitude.toFixed(4)}
                </Text>
                <Button colorScheme="blue" onClick={() => {
                  // Send location message
                  onLocationClose();
                }}>
                  Share Location
                </Button>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export { ScrollableChat as default };
