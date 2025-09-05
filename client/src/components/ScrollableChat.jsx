import { Avatar, Tooltip, Text, Box, HStack } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
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
import MessageActions from "./MessageActions";

const ScrollableChat = ({ messages, isTyping, onReplyToMessage }) => {
  const { user } = ChatState();

  const scrollRef = useRef();

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            <div ref={scrollRef} key={message._id} style={{ display: "flex" }}>
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
                display="flex"
                flexDirection="column"
                maxWidth="75%"
                marginLeft={isSameSenderMargin(
                  messages,
                  message,
                  index,
                  user._id
                )}
                marginTop={isSameUser(messages, message, index, user._id)
                  ? 3
                  : 10}
                position="relative"
                _hover={{
                  "& .message-actions": {
                    opacity: 1
                  }
                }}
              >
                {/* Reply Context */}
                {message.replyTo && (
                  <Box
                    bg="gray.100"
                    p={2}
                    borderRadius="md"
                    borderLeft="3px solid"
                    borderLeftColor="blue.400"
                    mb={2}
                    fontSize="sm"
                  >
                    <Text fontSize="xs" color="gray.600" fontWeight="bold">
                      Replying to {message.replyTo.sender.name}:
                    </Text>
                    <Text fontSize="xs" color="gray.700" noOfLines={1}>
                      {message.replyTo.content}
                    </Text>
                  </Box>
                )}

                <HStack spacing={2} align="flex-start">
                  <span
                    style={{
                      backgroundColor: `${
                        message.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"
                      }`,
                      borderRadius: "20px",
                      padding: "5px 15px",
                      flex: 1,
                    }}
                  >
                    {message.content}
                  </span>
                  <Box
                    className="message-actions"
                    opacity={0}
                    transition="opacity 0.2s"
                    position="absolute"
                    top="5px"
                    right="5px"
                  >
                    <MessageActions
                      message={message}
                      user={user}
                      onReply={onReplyToMessage}
                    />
                  </Box>
                </HStack>
                <Text
                  fontSize="xs"
                  color="gray.500"
                  mt={1}
                  align={message.sender._id === user._id ? "right" : "left"}
                >
                  {formatTime(message.createdAt)}
                </Text>
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
