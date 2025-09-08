import React, { useEffect, useRef } from "react";
import {
  Avatar,
  Tooltip,
  HStack,
  Text,
  Box,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import {
  ChevronDownIcon,
  CopyIcon,
  RepeatIcon,
  ArrowForwardIcon,
} from "@chakra-ui/icons";
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

// Function to generate suggestions dynamically
export const getLastMessageSuggestions = (lastMessage, userId) => {
  if (!lastMessage) return [];

  // If message was from self, no suggestions needed
  if (lastMessage.sender._id === userId) return [];

  const content = lastMessage.content.toLowerCase();

  if (content.includes("thank"))
    return ["You're welcome 😊", "No problem", "Anytime!"];
  if (content.includes("ok") || content.includes("okay"))
    return ["👍", "Sure", "Alright"];
  if (content.includes("?")) return ["Yes", "No", "I'll check and get back"];

  return ["Okay", "Thank you 🙏", "Got it ✅"];
};

const ScrollableChat = ({
  messages,
  typingUsers,
  searchQuery,
  setReplyMessage,
  scrollToMessage,
  onForwardMessage,
}) => {
  const { user } = ChatState();
  const scrollRef = useRef();
  const toast = useToast();
  const refsMap = useRef({});

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typingUsers]);

  // Highlight search query
  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          style={{
            backgroundColor: "#FFFB91",
            borderRadius: "3px",
            padding: "0 2px",
          }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Message copied",
      status: "success",
      duration: 2000,
      isClosable: true,
      position: "top",
    });
  };

  return (
    <div
      className="hide-scrollbar"
      style={{ overflowX: "hidden", overflowY: "auto" }}
    >
      {messages &&
        messages.map((message, index) => {
          const isLast = isLastMessage(messages, index, user._id);
          const isSelf = message.sender._id === user._id;

          if (!refsMap.current[message._id]) {
            refsMap.current[message._id] = React.createRef();
          }

          return (
            <div
              key={message._id}
              ref={isLast ? scrollRef : refsMap.current[message._id]}
              style={{
                display: "flex",
                justifyContent: isSelf ? "flex-end" : "flex-start",
                position: "relative",
              }}
            >
              {(isSameSender(messages, message, index, user._id) || isLast) &&
                !isSelf && (
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
                bg={isSelf ? "#BEE3F8" : "#B9F5D0"}
                borderRadius="20px"
                px="4"
                py="2"
                maxW="75%"
                ml={isSameSenderMargin(messages, message, index, user._id)}
                mt={isSameUser(messages, message, index, user._id) ? 1 : 3}
                wordBreak="break-word"
                position="relative"
              >
                {/* Forwarded badge */}
                {message.isForwarded && (
                  <Text fontSize="xs" color="gray.500" mb="1">
                    Forwarded
                  </Text>
                )}

                {/* Replied message */}
                {message.replyTo && (
                  <Box
                    bg={isSelf ? "#90CDF4" : "#9AE6B4"}
                    px="2"
                    py="1"
                    borderRadius="md"
                    mb="1"
                    cursor="pointer"
                    onClick={() => {
                      const ref = refsMap.current[message.replyTo._id];
                      if (ref && ref.current) {
                        ref.current.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                        ref.current.style.border = "1px solid #FFB800";
                        setTimeout(
                          () => (ref.current.style.border = "none"),
                          2000
                        );
                      }
                    }}
                  >
                    <Text fontSize="xs" color="gray.700">
                      Replying to: {message.replyTo.sender.name}
                    </Text>
                    <Text fontSize="sm" fontStyle="italic" noOfLines={1}>
                      {message.replyTo.content}
                    </Text>
                  </Box>
                )}

                {/* Message content */}
                <Text
                  fontFamily="'Comic Sans MS', sans-serif"
                  fontSize="md"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {highlightText(message.content, searchQuery)}
                </Text>

                {/* Dropdown */}
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<ChevronDownIcon />}
                    size="xs"
                    variant="ghost"
                    position="absolute"
                    top="2px"
                    right={isSelf ? "2px" : "auto"}
                    left={!isSelf ? "2px" : "auto"}
                    aria-label="Options"
                  />
                  <MenuList>
                    <MenuItem onClick={() => handleCopy(message.content)}>
                      <CopyIcon mr={2} /> Copy
                    </MenuItem>
                    <MenuItem onClick={() => setReplyMessage(message)}>
                      <RepeatIcon mr={2} /> Reply
                    </MenuItem>
                    <MenuItem onClick={() => onForwardMessage(message)}>
                      <ArrowForwardIcon mr={2} /> Forward
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Box>
            </div>
          );
        })}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <HStack mt={2}>
          {typingUsers.map((typingUser) => (
            <HStack key={typingUser._id} spacing={1}>
              <Avatar size="xs" name={typingUser.name} src={typingUser.pic} />
              <Text fontSize="sm" color="gray.500">
                {typingUser.name} is typing...
              </Text>
              <div style={{ width: "40px" }}>
                <Lottie animationData={typingAnimation} loop={true} />
              </div>
            </HStack>
          ))}
        </HStack>
      )}
    </div>
  );
};

export default ScrollableChat;
