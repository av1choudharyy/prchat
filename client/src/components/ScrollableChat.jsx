import { Avatar, Tooltip, IconButton } from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";
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

const ScrollableChat = ({ messages, isTyping, setReplyingTo, searchTerm }) => {
  const { user } = ChatState();
  const scrollRef = useRef();

  useEffect(() => {
    // Scroll to the bottom when messages render or sender is typing
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

  return (
    <>
      <div
        className="hide-scrollbar"
        style={{ overflowX: "hidden", overflowY: "auto" }}
      >
        {/* Render messages */}
        {messages &&
          messages.map((message, index) => (
            <div
              ref={scrollRef}
              key={message._id}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "6px",
              }}
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
                {/* If this message is a reply, show reply snippet */}
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

                {/* 🔍 Highlight search matches */}
                {highlightText(message.content, searchTerm)}
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
