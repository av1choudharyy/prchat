import { Avatar, Tooltip, Box } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";
import { useColorModeValue } from "@chakra-ui/react";

import "../App.css";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../context/ChatProvider";
import typingAnimation from "../animations/typing.json";

const ScrollableChat = ({ messages, isTyping, scrollToIndex }) => {
  const { user } = ChatState();
  const [reactions, setReactions] = useState({});
  const containerRef = useRef();
  const messageRefs = useRef([]);

  const selfMsgBg = useColorModeValue("#BEE3F8", "#2D3748");
  const otherMsgBg = useColorModeValue("#B9F5D0", "#4A5568");
  const reactionBg = useColorModeValue("whiteAlpha.800", "whiteAlpha.200");
  const textColor = useColorModeValue("black", "white");

  useEffect(() => {
    if (scrollToIndex != null && messageRefs.current[scrollToIndex]) {
      const messageEl = messageRefs.current[scrollToIndex];
      const containerEl = containerRef.current;
      if (messageEl && containerEl) {
        containerEl.scrollTo({
          top: messageEl.offsetTop - containerEl.offsetTop - containerEl.clientHeight / 2,
          behavior: "smooth",
        });
      }
    } else {
      // scroll to bottom if no search
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, scrollToIndex, isTyping]);

  const handleReaction = (messageId, emoji) => {
    setReactions((prev) => {
      const current = prev[messageId] || [];
      if (current.includes(emoji)) {
        return { ...prev, [messageId]: current.filter((e) => e !== emoji) };
      }
      return { ...prev, [messageId]: [...current, emoji] };
    });
  };

  const countReactions = (reactionArray) => {
    const counts = {};
    reactionArray.forEach((emoji) => {
      counts[emoji] = (counts[emoji] || 0) + 1;
    });
    return counts;
  };

  return (
    <div
      ref={containerRef}
      className="hide-scrollbar"
      style={{ overflowX: "hidden", overflowY: "auto", height: "100%" }}
    >
      {messages &&
        messages.map((message, index) => (
          <div
            ref={(el) => (messageRefs.current[index] = el)}
            key={message._id}
            style={{ display: "flex", position: "relative" }}
          >
            {(isSameSender(messages, message, index, user._id) ||
              isLastMessage(messages, index, user._id)) && (
              <Tooltip label={message.sender.name} placement="bottom-start" hasArrow>
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
              _hover={{ ".reaction-menu": { display: "flex", opacity: 1, transform: "translateY(0)" } }}
              style={{
                backgroundColor: message.sender._id === user._id ? selfMsgBg : otherMsgBg,
                borderRadius: "20px",
                padding: "8px 15px",
                maxWidth: "75%",
                marginLeft: isSameSenderMargin(messages, message, index, user._id),
                marginTop: isSameUser(messages, message, index, user._id) ? 3 : 10,
                color: textColor,
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: message.highlightedContent || message.content }} />

              {/* Display Reactions */}
              {reactions[message._id] && reactions[message._id].length > 0 && (
                <Box mt="1" display="flex" gap="2" flexWrap="wrap" fontSize="14px">
                  {Object.entries(countReactions(reactions[message._id])).map(([emoji, count]) => (
                    <Box
                      key={emoji}
                      px="1"
                      py="0.5"
                      bg={reactionBg}
                      borderRadius="md"
                      fontSize="14px"
                      display="flex"
                      alignItems="center"
                      gap="2px"
                    >
                      {emoji} {count > 1 ? count : ""}
                    </Box>
                  ))}
                </Box>
              )}

              {/* Emoji Reaction Trigger */}
              <Box
                className="reaction-menu-trigger"
                position="absolute"
                top="-35px"
                right="-10px"
                cursor="pointer"
                fontSize="18px"
                color={textColor}
                _hover={{ transform: "scale(1.2)", transition: "0.2s" }}
                onClick={() => {
                  const menu = document.getElementById(`reaction-menu-${message._id}`);
                  if (menu) menu.style.display = menu.style.display === "flex" ? "none" : "flex";
                }}
              >
                😀
              </Box>

              {/* Hover Reaction Menu */}
              <Box
                id={`reaction-menu-${message._id}`}
                className="reaction-menu"
                display="none"
                opacity={0}
                position="absolute"
                top="-35px"
                right="0"
                bg={reactionBg}
                borderRadius="md"
                p="1"
                boxShadow="md"
                gap="1"
                transition="all 0.2s ease"
                transform="translateY(10px)"
                zIndex={10}
              >
                {["👍", "❤️", "😂", "🔥", "😢"].map((emoji) => (
                  <span
                    key={emoji}
                    style={{ cursor: "pointer", fontSize: "16px" }}
                    onClick={() => handleReaction(message._id, emoji)}
                  >
                    {emoji}
                  </span>
                ))}
              </Box>
            </Box>
          </div>
        ))}

      {isTyping && (
        <div style={{ width: "70px", marginTop: "5px" }}>
          <Lottie animationData={typingAnimation} loop={true} />
        </div>
      )}
    </div>
  );
};

export default ScrollableChat;