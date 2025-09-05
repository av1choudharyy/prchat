import { Avatar, Tooltip, IconButton, Box } from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";
import { useEffect, useRef, useState } from "react";
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

const ScrollableChat = ({
  messages,
  isTyping,
  setReplyingTo,
  searchTerm,
  onReactMessage, // NEW: callback to trigger reaction API
}) => {
  const { user } = ChatState();
  const scrollRef = useRef();
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  // 🔍 Highlight matched search term
  const highlightText = (text, term) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, idx) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <span key={idx} style={{ backgroundColor: "yellow" }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Some commonly used emojis for reactions
  const emojiOptions = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

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
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "6px",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
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

                <div
                  style={{
                    backgroundColor: `${
                      message.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"
                    }`,
                    borderRadius: "20px",
                    padding: "5px 15px",
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
                  }}
                >
                  {/* Reply Snippet */}
                  {message.replyTo && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#444",
                        borderLeft: "2px solid #999",
                        paddingLeft: "6px",
                        marginBottom: "3px",
                      }}
                    >
                      Replying to: {message.replyTo.sender?.name} — "
                      {message.replyTo.content}"
                    </div>
                  )}

                  {/* Highlighted text */}
                  {highlightText(message.content, searchTerm)}

                  {/* Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <Box mt={1} display="flex" flexWrap="wrap" gap="4px">
                      {message.reactions.map((r, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: "14px",
                            padding: "2px 6px",
                            borderRadius: "12px",
                            background: "#fff",
                            border: "1px solid #ccc",
                          }}
                        >
                          {r.emoji} {r.user?.name === user.name ? "(You)" : ""}
                        </span>
                      ))}
                    </Box>
                  )}
                </div>

                {/* Copy Button */}
                <Tooltip label="Copy message" hasArrow>
                  <IconButton
                    aria-label="Copy Message"
                    icon={<CopyIcon />}
                    size="xs"
                    ml={2}
                    onClick={() => handleCopy(message.content)}
                  />
                </Tooltip>

                {/* Reply Button */}
                <Tooltip label="Reply" hasArrow>
                  <IconButton
                    aria-label="Reply Message"
                    icon={<span style={{ fontSize: "14px" }}>↩️</span>}
                    size="xs"
                    ml={2}
                    onClick={() => setReplyingTo(message)}
                  />
                </Tooltip>

                {/* Emoji Reaction Button */}
                <Tooltip label="React" hasArrow>
                  <IconButton
                    aria-label="React to message"
                    icon={<span style={{ fontSize: "16px" }}>😊</span>}
                    size="xs"
                    ml={2}
                    onClick={() =>
                      setShowEmojiPickerFor(
                        showEmojiPickerFor === message._id ? null : message._id
                      )
                    }
                  />
                </Tooltip>
              </div>

              {/* Emoji Picker */}
              {showEmojiPickerFor === message._id && (
                <Box
                  display="flex"
                  gap="8px"
                  mt={1}
                  ml="40px"
                  bg="white"
                  p={2}
                  borderRadius="md"
                  boxShadow="md"
                >
                  {emojiOptions.map((emoji) => (
                    <span
                      key={emoji}
                      style={{ fontSize: "18px", cursor: "pointer" }}
                      onClick={() => {
                        onReactMessage(message._id, emoji);
                        setShowEmojiPickerFor(null);
                      }}
                    >
                      {emoji}
                    </span>
                  ))}
                </Box>
              )}
            </div>
          ))}
      </div>
      {isTyping ? (
        <div style={{ width: "70px", marginTop: "5px" }}>
          <Lottie animationData={typingAnimation} loop={true} />
        </div>
      ) : null}
    </>
  );
};

export default ScrollableChat;
