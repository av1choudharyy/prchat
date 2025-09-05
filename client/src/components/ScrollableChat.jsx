import { Avatar, Tooltip } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import Lottie from "lottie-react";

import "../App.css";
import { isLastMessage, isSameSender } from "../config/ChatLogics";
import { ChatState } from "../context/ChatProvider";
import typingAnimation from "../animations/typing.json";

const ScrollableChat = ({
  messages,
  isTyping,
  setReplyingTo,
  selectedMessage,
  setSelectedMessage,
}) => {
  const { user } = ChatState();

  const scrollRef = useRef();

  useEffect(() => {
    // Scroll to the bottom when messages render or sender is typing
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  // Utility function: format ISO timestamp to 12-hour time like "09:32 PM"
  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
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
            const isMine = message.sender._id === user._id;

            return (
              <div
                ref={scrollRef}
                key={message._id}
                style={{
                  display: "flex",
                  justifyContent: isMine ? "flex-end" : "flex-start",
                  padding: "5px",
                }}
              >
                {/* Avatar (only shown when appropriate according to helper) */}
                {(isSameSender(messages, message, index, user._id) ||
                  isLastMessage(messages, index, user._id)) && (
                  <Tooltip
                    label={message.sender.name}
                    placement="bottom-start"
                    hasArrow
                  >
                    <Avatar
                      mt="7px"
                      mr="8px"
                      size="sm"
                      cursor="pointer"
                      name={message.sender.name}
                      src={message.sender.pic}
                    />
                  </Tooltip>
                )}

                {/* Message container */}
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    maxWidth: "75%",
                  }}
                >
                  <div
                    style={{
                      cursor: "pointer",
                      backgroundColor:
                        selectedMessage && selectedMessage._id === message._id
                          ? "#d0e6ff"
                          : "transparent",
                      borderRadius: "10px",
                      padding: "3px",
                    }}
                    onClick={() =>
                      setSelectedMessage(
                        selectedMessage && selectedMessage._id === message._id
                          ? null
                          : message
                      )
                    }
                  >
                    {/* SINGLE message bubble */}
                    <div
                      id={message._id}
                      style={{
                        backgroundColor: isMine ? "#BEE3F8" : "#B9F5D0",
                        borderRadius: "20px",
                        padding: "8px 14px",
                        display: "inline-block",
                        wordBreak: "break-word",
                        position: "relative",
                      }}
                      onClick={() => {
                        // If this message is a reply, scroll to the original message
                        if (message.replyTo && message.replyTo._id) {
                          const el = document.getElementById(message.replyTo._id);
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "center" });
                            // temporary highlight
                            const prevBg = el.style.backgroundColor;
                            el.style.backgroundColor = "#ffeaa7";
                            setTimeout(() => (el.style.backgroundColor = prevBg), 1400);
                          }
                        }
                      }}
                    >
                      {/* Quoted / reply preview inside the bubble (if any) */}
                      {message.replyTo && (
                        <div
                          style={{
                            backgroundColor: "#f0f0f0",
                            borderLeft: "3px solid #34b7f1",
                            padding: "6px 8px",
                            marginBottom: "6px",
                            fontSize: "13px",
                            color: "#555",
                            borderRadius: "6px",
                            maxWidth: "100%",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "600",
                              fontSize: "12px",
                              color: "#34b7f1",
                              marginBottom: "3px",
                            }}
                          >
                            {message.replyTo.sender &&
                            message.replyTo.sender._id === user._id
                              ? "You"
                              : message.replyTo.sender?.name}
                          </div>
                          <div style={{ fontSize: "13px", color: "#333" }}>
                            {message.replyTo.content}
                          </div>
                        </div>
                      )}

                      {/* Actual message text */}
                      <div style={{ fontSize: "16px", color: "#111" }}>
                        {message.content}
                      </div>

                      {/* Timestamp */}
                      <div
                        style={{
                          fontSize: "11px",
                          color: "gray",
                          marginTop: "6px",
                          textAlign: "right",
                        }}
                      >
                        {formatTime(message.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
