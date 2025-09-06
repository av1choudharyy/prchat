import {
  Avatar,
  Tooltip,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Text,
  Box,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { CopyIcon, RepeatIcon, ChevronDownIcon } from "@chakra-ui/icons";
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

const ScrollableChat = ({ messages, isTyping, onReplyToMessage }) => {
  const { user } = ChatState();
  const toast = useToast();
  const [hoveredMessage, setHoveredMessage] = useState(null);

  const scrollRef = useRef();

  const handleCopyMessage = async (messageContent) => {
    try {
      await navigator.clipboard.writeText(messageContent);
      toast({
        title: "Message copied!",
        description: "Message content copied to clipboard",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy message to clipboard",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  const handleReplyToMessage = (message) => {
    if (onReplyToMessage) {
      onReplyToMessage(message);
    }
  };

  useEffect(() => {
    // Scroll to the bottom when messeges render or sender is typing
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  return (
    <>
      <div
        className="hide-scrollbar"
        style={{ overflowX: "hidden", overflowY: "auto" }}
      >
        {/* If something inside the messages, render the messages */}
        {messages &&
          messages.map((message, index) => (
            <div
              ref={scrollRef}
              key={message._id}
              style={{ display: "flex" }}
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
                position="relative"
                maxWidth="75%"
                ml={isSameSenderMargin(messages, message, index, user._id)}
                mt={isSameUser(messages, message, index, user._id) ? 1 : 3}
              >
                <Box
                  bg={message.sender._id === user._id ? "#d9fdd3" : "white"}
                  borderRadius="lg"
                  p={3}
                  boxShadow="0 1px 2px rgba(0, 0, 0, 0.1)"
                  border="1px solid"
                  borderColor={
                    message.sender._id === user._id ? "#d9fdd3" : "#e9edef"
                  }
                  position="relative"
                  _before={{
                    content: '""',
                    position: "absolute",
                    top: "10px",
                    [message.sender._id === user._id ? "right" : "left"]:
                      "-8px",
                    width: "0",
                    height: "0",
                    borderTop: "8px solid transparent",
                    borderBottom: "8px solid transparent",
                    [message.sender._id === user._id
                      ? "borderLeft"
                      : "borderRight"]: `8px solid ${
                      message.sender._id === user._id ? "#d9fdd3" : "white"
                    }`,
                  }}
                >
                  {/* Reply Context */}
                  {message.replyTo && (
                    <Box
                      bg={
                        message.sender._id === user._id
                          ? "rgba(0,0,0,0.05)"
                          : "#f0f2f5"
                      }
                      borderLeft="3px solid"
                      borderLeftColor="#25d366"
                      p={2}
                      borderRadius="md"
                      mb={2}
                    >
                      <Text fontSize="xs" color="#667781" fontWeight="medium">
                        {message.replyTo.sender.name}
                      </Text>
                      <Text
                        fontSize="xs"
                        color="#3b4a54"
                        noOfLines={2}
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {message.replyTo.content}
                      </Text>
                    </Box>
                  )}

                  <Text
                    fontSize="sm"
                    color="#3b4a54"
                    lineHeight="1.4"
                    wordBreak="break-word"
                  >
                    {message.content}
                  </Text>
                  <Text
                    fontSize="xs"
                    color="#667781"
                    mt={1}
                    textAlign={
                      message.sender._id === user._id ? "right" : "left"
                    }
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </Box>

                {/* Message Actions Menu - appears on hover */}
                {hoveredMessage === message._id && (
                  <Box
                    position="absolute"
                    top="8px"
                    right={message.sender._id === user._id ? "8px" : "-45px"}
                    zIndex={10}
                  >
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<ChevronDownIcon />}
                        size="sm"
                        variant="ghost"
                        bg="white"
                        shadow="md"
                        border="1px solid"
                        borderColor="#e9edef"
                        _hover={{
                          bg: "#f0f2f5",
                          borderColor: "#d1d7db",
                        }}
                        _active={{ transform: "scale(0.95)" }}
                        transition="all 0.15s"
                        color="#667781"
                      />
                      <MenuList
                        shadow="lg"
                        border="1px solid"
                        borderColor="#e9edef"
                        borderRadius="md"
                        py={1}
                        bg="white"
                        minW="140px"
                      >
                        <MenuItem
                          icon={<CopyIcon />}
                          onClick={() => handleCopyMessage(message.content)}
                          _hover={{ bg: "#f0f2f5", color: "#3b4a54" }}
                          _focus={{ bg: "#f0f2f5", color: "#3b4a54" }}
                          borderRadius="md"
                          mx={1}
                          transition="all 0.15s"
                          fontSize="sm"
                        >
                          <Text fontSize="sm" color="#3b4a54">
                            Copy
                          </Text>
                        </MenuItem>
                        <MenuItem
                          icon={<RepeatIcon />}
                          onClick={() => handleReplyToMessage(message)}
                          _hover={{ bg: "#f0f2f5", color: "#3b4a54" }}
                          _focus={{ bg: "#f0f2f5", color: "#3b4a54" }}
                          borderRadius="md"
                          mx={1}
                          transition="all 0.15s"
                          fontSize="sm"
                        >
                          <Text fontSize="sm" color="#3b4a54">
                            Reply
                          </Text>
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Box>
                )}
              </Box>
            </div>
          ))}
      </div>
      {isTyping ? (
        <div style={{ width: "70px", marginTop: "5px" }}>
          <Lottie animationData={typingAnimation} loop={true} />
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default ScrollableChat;
