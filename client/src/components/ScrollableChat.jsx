import { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";
import {
  Avatar,
  Tooltip,
  Box,
  Text,
} from "@chakra-ui/react";
import "../App.css";
import {
  isLastMessage,
  isSameSender,
} from "../config/ChatLogics";
import { ChatState } from "../context/ChatProvider";
import typingAnimation from "../animations/typing.json";

const ScrollableChat = ({ messages, isTyping, highlightedMessageId, onReact, }) => {
  const { user } = ChatState();
  const highlightRef = useRef();
  const emojiOptions = ["❤️", "😂", "👍", "🔥", "😢"];
  const [hoveredMessageId, setHoveredMessageId] = useState(null);

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedMessageId]);

  return (
    <>
      <div
        className="hide-scrollbar"
        style={{
          overflowX: "hidden",
          overflowY: "auto",
          paddingTop: "40px",
        }}
      >
        {messages &&
          messages.map((message, index) => {
            const isHighlighted = message._id === highlightedMessageId;
            const senderId =
  typeof message.sender === "string" ? message.sender : message.sender._id;
const isOwnMessage = senderId === user._id;



            return (
              <Box
                key={message._id}
                display="flex"
                flexDirection={isOwnMessage ? "row-reverse" : "row"}
                alignItems="flex-start"
                padding="4px 8px"
                ref={isHighlighted ? highlightRef : null}
                onMouseEnter={() => setHoveredMessageId(message._id)}
                onMouseLeave={() => setHoveredMessageId(null)}
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
                      mr={isOwnMessage ? "0" : "1"}
                      ml={isOwnMessage ? "1" : "0"}
                      size="sm"
                      cursor="pointer"
                      name={message.sender.name}
                      src={message.sender.pic}
                    />
                  </Tooltip>
                )}

                <Box
                  bg={
                    isHighlighted
                      ? "#F6E05E"
                      : isOwnMessage
                      ? "#BEE3F8"
                      : "#B9F5D0"
                  }
                  borderRadius="20px"
                  padding="5px 15px"
                  maxWidth="75%"
                  boxShadow={isHighlighted ? "0 0 0 2px #ECC94B" : "none"}
                  transition="background-color 0.3s ease"
                  position="relative"
                >
                  <Text>{message.content}</Text>

                  {/* Emoji hover bar */}
                  {hoveredMessageId === message._id && (
                    <Box
                      position="absolute"
                      top="-35px"
                      left={isOwnMessage ? "auto" : "0"}
                      right={isOwnMessage ? "0" : "auto"}
                      zIndex={10}
                      display="flex"
                      gap="6px"
                      background="white"
                      padding="4px 8px"
                      borderRadius="md"
                      boxShadow="md"
                      maxWidth="100vw"
                      minWidth="fit-content"
                      overflowX="auto"
                    >
                      {emojiOptions.map((emoji) => (
                        <Text
                          key={emoji}
                          fontSize="lg"
                          cursor="pointer"
                          onClick={() => onReact(message._id, emoji)}
                          _hover={{ transform: "scale(1.2)" }}
                        >
                          {emoji}
                        </Text>
                      ))}
                    </Box>
                  )}

                  {/* Reactions */}
                  {message.reactions?.length > 0 && (
                    <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                      {message.reactions.map((r, idx) => (
                        <Text
                          key={idx}
                          fontSize="sm"
                          px={2}
                          py={1}
                          bg="gray.200"
                          borderRadius="md"
                        >
                          {r.emoji}
                        </Text>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
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