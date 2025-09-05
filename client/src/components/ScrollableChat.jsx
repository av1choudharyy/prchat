import { Avatar } from "@chakra-ui/avatar";
import { Tooltip } from "@chakra-ui/tooltip";
import { useColorMode } from "@chakra-ui/react";
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
import ImagePreview from "./ImagePreview";
import FilePreview from "./FilePreview";

const ScrollableChat = ({ messages, isTyping }) => {
  const { user } = ChatState();
  const { colorMode } = useColorMode();

  const scrollRef = useRef();

  useEffect(() => {
    // Scroll to the bottom when messeges render or sender is typing
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  // Format timestamp like WhatsApp (e.g., "2:34 PM")
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderMessageContent = (message) => {
    if (message.attachment) {
      const isImage = message.attachment.type === 'image';
      return (
        <div>
          {isImage ? (
            <ImagePreview attachment={message.attachment} />
          ) : (
            <FilePreview attachment={message.attachment} />
          )}
          {message.content && (
            <div style={{ marginTop: "8px", paddingBottom: "20px", paddingRight: "50px" }}>
              {message.content}
            </div>
          )}
        </div>
      );
    }

    return (
      <div style={{ paddingBottom: "20px", paddingRight: "50px" }}>
        {message.content}
      </div>
    );
  };

  return (
    <>
      <div
        className="hide-scrollbar"
        style={{ overflowX: "hidden", overflowY: "auto" }}
      >
        {/* If something inside the messages, render the messages */}
        {messages &&
          messages
            .filter((message) => message && message.sender && message._id)
            .map((message, index) => (
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

                <div
                  style={{
                    backgroundColor: `${message.sender._id === user._id
                      ? colorMode === "light"
                        ? "#BEE3F8"
                        : "#8B9467"
                      : colorMode === "light"
                        ? "#B9F5D0"
                        : "#3E3E3E"
                      }`,
                    borderRadius: "20px",
                    padding: "8px 12px",
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
                >
                  {renderMessageContent(message)}
                  <div
                    style={{
                      fontSize: "11px",
                      color: colorMode === "light" ? "#333" : "#fff",
                      textAlign: "right",
                      position: "absolute",
                      bottom: "4px",
                      right: "8px",
                      backgroundColor: message.attachment ? (colorMode === "light" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.7)") : "transparent",
                      padding: message.attachment ? "2px 6px" : "0",
                      borderRadius: message.attachment ? "10px" : "0",
                      fontWeight: message.attachment ? "500" : "normal",
                      whiteSpace: "nowrap",
                      boxShadow: message.attachment ? "0 1px 3px rgba(0, 0, 0, 0.2)" : "none",
                    }}
                  >
                    {formatTimestamp(message.createdAt)}
                  </div>
                </div>
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
