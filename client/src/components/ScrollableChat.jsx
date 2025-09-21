import { Avatar, Tooltip, Box, Text, IconButton } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { BiReply } from "react-icons/bi";
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
import MarkdownMessage from "./MarkdownMessage";

const ScrollableChat = ({ messages, isTyping, onReply, searchQuery }) => {
  const { user } = ChatState();

  const scrollRef = useRef();

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
          messages.map((message, index) => {
            const isHighlighted = searchQuery &&
              message.content?.toLowerCase().includes(searchQuery.toLowerCase());

            return (
            <div
              ref={scrollRef}
              key={message._id}
              className={`message-item ${isHighlighted ? 'search-highlight' : ''}`}
              style={{ display: "flex" }}
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
                  padding: "5px 15px",
                  maxWidth: "75%",
                  position: "relative",
                  marginLeft: isSameSenderMargin(
                    messages,
                    message,
                    index,
                    user._id
                  ),
                  marginTop: isSameUser(messages, message, index, user._id)
                    ? 3
                    : 10,
                }}
                className="message-box"
              >
                {/* Reply Information */}
                {message.replyTo && (
                  <Box
                    bg="rgba(0,0,0,0.1)"
                    p={2}
                    borderRadius="8px"
                    mb={2}
                    borderLeft="3px solid #4A90E2"
                    position="relative"
                  >
                    <Text fontSize="xs" fontWeight="bold" color="purple.700">
                      ↩ {message.replyTo.sender.name}
                    </Text>
                    <Text fontSize="sm" color="gray.800" fontStyle="italic" isTruncated>
                      {message.replyTo.content.length > 50
                        ? `${message.replyTo.content.substring(0, 50)}...`
                        : message.replyTo.content
                      }
                    </Text>
                  </Box>
                )}

                <MarkdownMessage
                  content={message.content}
                  timestamp={message.createdAt}
                />

                {/* Reply Button */}
                <IconButton
                  icon={<BiReply />}
                  size="xs"
                  variant="ghost"
                  position="absolute"
                  top="2px"
                  right="2px"
                  opacity={0}
                  className="reply-button"
                  onClick={() => onReply && onReply(message)}
                  aria-label="Reply to message"
                  bg="rgba(255, 165, 0, 0.3)"
                  color="green.700"
                  _hover={{
                    transform: "scale(1.05)",
                    bg: "rgba(255, 165, 0, 0.5)",
                    color: "green.800"
                  }}
                />
              </Box>
            </div>
            );
          })}
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
