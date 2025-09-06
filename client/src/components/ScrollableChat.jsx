import { Avatar, Tooltip, useToast } from "@chakra-ui/react";
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

const ScrollableChat = ({ messages, isTyping, setReplyingTo, searchQuery }) => {
  const { user } = ChatState();
  const scrollRef = useRef();
  const toast = useToast();

  useEffect(() => {
    // Scroll to the bottom when messages render or sender is typing
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      status: "success",
      duration: 1500,
      isClosable: true,
    });
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} style={{ backgroundColor: "yellow", padding: 0 }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const truncateText = (text, maxLength = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <>
      <div
        className="hide-scrollbar"
        style={{ overflowX: "hidden", overflowY: "auto" }}
      >
        {/* If something inside the messages, render the messages */}
        {messages &&
          messages.map((message, index) => {
            const replied = message.replyTo && 
            (typeof message.replyTo === "object"
              ? message.replyTo 
              : messages.find(m => m._id === message.replyTo));
            
              if (message.replyTo) {
                console.log("Message with reply:", message);
                console.log("Reply data:", replied);
              }
            const isSentByCurrentUser = message.sender._id === user._id;
            
            return (
              <div 
                ref={scrollRef} 
                key={message._id} 
                style={{ display: "flex", position: "relative" }}
                className="message-container"
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
                
                <span
                  style={{
                    backgroundColor: isSentByCurrentUser ? "#DCF8C6" : "#FFFFFF",
                    borderRadius: "12px",
                    padding: "8px 12px",
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
                    display: "flex",
                    flexDirection: "column",
                    fontSize: "14px",
                    position: "relative",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                    border: isSentByCurrentUser ? "none" : "1px solid #E2E8F0",
                  }}
                >
                  {/* Reply block - shows the original message being replied to */}
                  {replied && (
                    <div
                      className="reply-block"
                      style={{
                        background: isSentByCurrentUser 
                          ? "rgba(255, 255, 255, 0.3)" 
                          : "rgba(255, 255, 255, 0.6)",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        marginBottom: "6px",
                        borderLeft: `4px solid ${isSentByCurrentUser ? "#075E54" : "#25D366"}`,
                        fontSize: "12px",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          color: isSentByCurrentUser ? "#075E54" : "#25D366",
                          fontWeight: "600",
                          marginBottom: "2px",
                          fontSize: "11px",
                        }}
                      >
                        {replied.sender?.name || "Unknown"}
                      </div>
                      <div
                        style={{
                          color: isSentByCurrentUser ? "#4A5568" : "#2D3748",
                          lineHeight: "1.3",
                          fontSize: "12px",
                          opacity: 0.9,
                        }}
                      >
                        {/* {truncateText(replied.content)} */}
                      </div>
                    </div>
                  )}
                  
                  {/* Main message content */}
                  <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
                    {highlightText(message.content, searchQuery)}
                  </div>
                </span>

                {/* Message actions */}
                <div className="message-actions">
                  <button
                    onClick={() => handleCopy(message.content)}
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      background: "#E2E8F0",
                      borderRadius: "5px",
                      marginLeft: "6px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Copy
                  </button>
                  <button 
                    onClick={() => setReplyingTo && setReplyingTo(message)}
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      background: "#90CDF4",
                      borderRadius: "5px",
                      marginLeft: "6px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Reply
                  </button> 
                </div>
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