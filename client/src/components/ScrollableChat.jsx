import { Avatar, Tooltip, Box, Image, Text, HStack, VStack, IconButton, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@chakra-ui/icons";
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

const ScrollableChat = ({ messages, isTyping, onCopy, onReply, onForward }) => {
  const { user } = ChatState();
  const scrollRef = useRef();
  const [hoveredMessage, setHoveredMessage] = useState(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const MessageContent = ({ message }) => {
    if (message.messageType === 'image') {
      return (
        <VStack align="start" spacing={2}>
          <Image
            src={message.fileUrl}
            alt={message.fileName}
            maxW="300px"
            maxH="200px"
            borderRadius="md"
            cursor="pointer"
            onClick={() => window.open(message.fileUrl, '_blank')}
          />
          {message.fileName && (
            <Text fontSize="xs" color="gray.600">
              {message.fileName}
            </Text>
          )}
        </VStack>
      );
    } else if (message.messageType === 'file') {
      return (
        <VStack align="start" spacing={2}>
          <Box
            p={3}
            bg="gray.100"
            borderRadius="md"
            cursor="pointer"
            onClick={() => window.open(message.fileUrl, '_blank')}
            _hover={{ bg: "gray.200" }}
          >
            <HStack spacing={2}>
              <Text>📎</Text>
              <VStack align="start" spacing={0}>
                <Text fontWeight="semibold" fontSize="sm">
                  {message.fileName}
                </Text>
                {message.fileSize && (
                  <Text fontSize="xs" color="gray.600">
                    {formatFileSize(message.fileSize)}
                  </Text>
                )}
              </VStack>
            </HStack>
          </Box>
        </VStack>
      );
    } else {
      return (
        <VStack align="start" spacing={1}>
          {message.replyTo && (
            <Box
              pl={3}
              borderLeft="3px solid"
              borderColor="gray.300"
              bg="gray.50"
              p={2}
              borderRadius="md"
              w="100%"
            >
              <Text fontSize="xs" color="gray.600" fontWeight="bold">
                {message.replyTo.sender?.name}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {message.replyTo.content}
              </Text>
            </Box>
          )}
          
          {message.forwardedFrom && (
            <Text fontSize="xs" color="blue.600" fontStyle="italic">
              Forwarded
            </Text>
          )}
          
          <Text
            style={{
              fontSize: message.fontStyle?.fontSize || '14px',
              fontWeight: message.fontStyle?.fontWeight || 'normal',
              fontStyle: message.fontStyle?.fontStyle || 'normal',
              color: message.fontStyle?.color || (message.sender._id === user._id ? '#000' : '#000'),
            }}
          >
            {message.content}
          </Text>
        </VStack>
      );
    }
  };

  return (
    <>
      <div
        className="hide-scrollbar"
        style={{ overflowX: "hidden", overflowY: "auto" }}
      >
        {messages &&
          messages.map((message, index) => (
            <div 
              ref={scrollRef} 
              key={message._id} 
              style={{ display: "flex", position: "relative" }}
              onMouseEnter={() => setHoveredMessage(message._id)}
              onMouseLeave={() => setHoveredMessage(null)}
            >
              {(isSameSender(messages, message, index, user._id) ||
                isLastMessage(messages, index, user._id)) && (
                <Tooltip
                  label={message.sender.name}
                  placement="bottom-start"
                  hasArrow
                >
                  <Avatar
                    mt="7px"
                    mr="1"
                    size="sm"
                    cursor="pointer"
                    name={message.sender.name}
                    src={message.sender.pic}
                  />
                </Tooltip>
              )}

              <Box
                style={{
                  backgroundColor: `${
                    message.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"
                  }`,
                  borderRadius: "20px",
                  padding: "8px 15px",
                  maxWidth: "75%",
                  marginLeft: isSameSenderMargin(
                    messages,
                    message,
                    index,
                    user._id
                  ),
                  marginTop: isSameUser(messages, message, index, user._id)
                    ? 3
                    : 10,
                  position: "relative",
                }}
              >
                <MessageContent message={message} />
                
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>

                {/* Message Actions */}
                {hoveredMessage === message._id && (
                  <Box
                    position="absolute"
                    top="-10px"
                    right={message.sender._id === user._id ? "-10px" : "auto"}
                    left={message.sender._id !== user._id ? "-10px" : "auto"}
                    bg="white"
                    borderRadius="full"
                    boxShadow="md"
                    zIndex={10}
                  >
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<ChevronDownIcon />}
                        size="xs"
                        variant="ghost"
                        borderRadius="full"
                      />
                      <MenuList>
                        <MenuItem onClick={() => onCopy(message.content)}>
                          📋 Copy
                        </MenuItem>
                        <MenuItem onClick={() => onReply(message)}>
                          ↩️ Reply
                        </MenuItem>
                        <MenuItem onClick={() => onForward(message)}>
                          ➡️ Forward
                        </MenuItem>
                        {message.fileUrl && (
                          <MenuItem onClick={() => window.open(message.fileUrl, '_blank')}>
                            📥 Download
                          </MenuItem>
                        )}
                      </MenuList>
                    </Menu>
                  </Box>
                )}
              </Box>
            </div>
          ))}
      </div>
      
      {isTyping && (
        <div style={{ width: "70px", marginTop: "5px" }}>
          <Lottie animationData={typingAnimation} loop={true} />
        </div>
      )}
    </>
  );
};

export default ScrollableChat;