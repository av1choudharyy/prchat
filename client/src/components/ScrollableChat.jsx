// client/src/components/ScrollableChat.jsx
import { useEffect, useRef } from "react";
import { Tooltip, Avatar } from "@chakra-ui/react";
import Lottie from "lottie-react";

import "../App.css";
import {
  isLastMessage,
  isSameSender,
} from "../config/ChatLogics";
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
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

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
                justifyContent:
                  message.sender._id === user._id ? "flex-end" : "flex-start",
                padding: "5px",
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
                  <span
                    style={{
                      backgroundColor:
                        message.sender._id === user._id ? "#BEE3F8" : "#B9F5D0",
                      borderRadius: "20px",
                      padding: "5px 15px",
                      display: "inline-block",
                    }}
                    id={message._id}
                    onClick={() => {
                      if (message.replyTo) {
                        const el = document.getElementById(
                          message.replyTo._id
                        );
                        if (el) {
                          el.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                          el.style.backgroundColor = "#ffeaa7";
                          setTimeout(
                            () => (el.style.backgroundColor = ""),
                            1500
                          );
                        }
                      }
                    }}
                  >
                    {message.replyTo && (
                      <div
                        style={{
                          backgroundColor: "#f0f0f0",
                          borderLeft: "3px solid #34b7f1",
                          padding: "4px 8px",
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
                            fontWeight: "bold",
                            fontSize: "12px",
                            color: "#34b7f1",
                          }}
                        >
                          {message.replyTo.sender &&
                          message.replyTo.sender._id === user._id
                            ? "You"
                            : message.replyTo.sender?.name}
                        </div>
                        <div>{message.replyTo.content}</div>
                      </div>
                    )}
                    {message.content}
                  </span>
                </div>
              </div>
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
