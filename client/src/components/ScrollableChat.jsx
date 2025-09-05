import { Avatar, Tooltip } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { FiCopy, FiCornerUpRight } from "react-icons/fi"; // ✅ Copy + Reply icons
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

const ScrollableChat = ({ messages, isTyping, setReplyTo }) => {
  const { user } = ChatState();
  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  // ✅ Copy message function
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <div
        className="hide-scrollbar"
        style={{ overflowX: "hidden", overflowY: "auto" }}
      >
        {messages &&
          messages.map((message, index) => (
            <div ref={scrollRef} key={message._id} style={{ display: "flex" }}>
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

              <span
                style={{
                  backgroundColor: `${
                    message.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"
                  }`,
                  borderRadius: "10px",
                  padding: "5px 10px",
                  maxWidth: "75%",
                  marginLeft: isSameSenderMargin(messages, message, index, user._id),
                  marginTop: isSameUser(messages, message, index, user._id) ? 3 : 10,
                  position: "relative",
                }}
              >
                {/* ✅ Show reply preview if message is a reply */}
                {message.replyTo && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "gray",
                      borderLeft: "2px solid #999",
                      paddingLeft: "5px",
                      marginBottom: "3px",
                    }}
                  >
                    Replying to: <b>{message.replyTo.sender?.name}</b> -{" "}
                    {message.replyTo.content}
                  </div>
                )}

                {message.content}

                {/* ✅ Action buttons (Reply + Copy) */}
                <div style={{ textAlign: "right", marginTop: "2px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <FiCopy
                    size={14}
                    style={{ cursor: "pointer" }}
                    title="Copy"
                    onClick={() => handleCopy(message.content)}
                  />
                  <FiCornerUpRight
                    size={14}
                    style={{ cursor: "pointer" }}
                    title="Reply"
                    onClick={() => setReplyTo(message)}
                  />
                </div>
              </span>
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
