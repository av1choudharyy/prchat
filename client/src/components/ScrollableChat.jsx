import { Avatar, Tooltip } from "@chakra-ui/react";
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

const ScrollableChat = ({ messages, isTyping, highlightedMessageId }) => {
  const { user } = ChatState();
  const highlightRef = useRef();

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedMessageId]);

  return (
    <>
      <div
        className="hide-scrollbar"
        style={{ overflowX: "hidden", overflowY: "auto" }}
      >
        {messages &&
          messages.map((message, index) => {
            const isHighlighted = message._id === highlightedMessageId;
            return (
              <div
                key={message._id}
                style={{ display: "flex" }}
                ref={isHighlighted ? highlightRef : null}
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
                    backgroundColor: isHighlighted
                      ? "#F6E05E"
                      : message.sender._id === user._id
                      ? "#BEE3F8"
                      : "#B9F5D0",
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
                    boxShadow: isHighlighted ? "0 0 0 2px #ECC94B" : "none",
                    transition: "background-color 0.3s ease",
                  }}
                >
                  {message.content}
                </span>
              </div>
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