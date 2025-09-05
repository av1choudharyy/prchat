import { useEffect, useRef, useState } from "react";
import { Avatar, Tooltip, Text, Box, Tag } from "@chakra-ui/react";
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

const formatTime = (d) =>
  new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const isSameDay = (a, b) => {
  if (!a || !b) return false;
  const da = new Date(a), db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

const prettyDate = (d) =>
  new Date(d).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const ScrollableChat = ({ messages, isTyping, setReplyingTo, setForwardingMsg }) => {
  const { user } = ChatState();
  const scrollRef = useRef();

  // local reactions (if you add later): { [messageId]: "❤️" }
  const [reactions, setReactions] = useState({});

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  // B I U formatting
  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")   // Bold
      .replace(/\*(.*?)\*/g, "<i>$1</i>")       // Italic
      .replace(/__(.*?)__/g, "<u>$1</u>");      // Underline
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert("Message copied!");
  };

  const handleReply = (text) => setReplyingTo(text);
  const handleForward = (text) => {
    setForwardingMsg(text);
    alert("Now switch to another chat to forward this message!");
  };

  const toggleHeart = (id) => {
    setReactions((r) => {
      const next = { ...r };
      if (next[id]) delete next[id];
      else next[id] = "❤️";
      return next;
    });
  };

  return (
    <>
      <div className="hide-scrollbar" style={{ overflowX: "hidden", overflowY: "auto" }}>
        {messages &&
          messages.map((message, index) => {
            const prev = messages[index - 1];
            const showDateChip = !prev || !isSameDay(prev?.createdAt, message?.createdAt);
            const mine = message.sender._id === user._id;

            return (
              <div key={message._id}>
                {/* ── Optional date chip between days ── */}
                {showDateChip && message.createdAt && (
                  <Box display="flex" justifyContent="center" my={2}>
                    <Tag size="sm" variant="subtle" colorScheme="gray">
                      {prettyDate(message.createdAt)}
                    </Tag>
                  </Box>
                )}

                <div ref={scrollRef} style={{ display: "flex" }}>
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

                  <div
                    onDoubleClick={() => toggleHeart(message._id)} // optional reaction
                    title="Double-click to react ❤️"
                    style={{
                      backgroundColor: mine ? "#BEE3F8" : "#B9F5D0",
                      borderRadius: "20px",
                      padding: "6px 14px",
                      maxWidth: "75%",
                      marginLeft: isSameSenderMargin(messages, message, index, user._id),
                      marginTop: isSameUser(messages, message, index, user._id) ? 3 : 10,
                      color: "black",
                    }}
                  >
                    {/* content */}
                    <span
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                    />

                    {/* action row */}
                    <div
                      style={{
                        marginTop: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <button
                        style={{ fontSize: 10, cursor: "pointer" }}
                        onClick={() => handleCopy(message.content)}
                      >
                        Copy
                      </button>
                      <button
                        style={{ fontSize: 10, cursor: "pointer" }}
                        onClick={() => handleReply(message.content)}
                      >
                        Reply
                      </button>
                      <button
                        style={{ fontSize: 10, cursor: "pointer" }}
                        onClick={() => handleForward(message.content)}
                      >
                        Forward
                      </button>

                      {/* reaction shown on right if present */}
                      {reactions[message._id] && (
                        <span style={{ marginLeft: "auto", fontSize: 12, color: "#D53F8C" }}>
                          {reactions[message._id]}
                        </span>
                      )}
                    </div>

                    {/* ✅ timestamp */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: mine ? "flex-end" : "flex-start",
                        marginTop: 2,
                      }}
                    >
                      <Text fontSize="xs" color="gray.600">
                        {message.createdAt ? formatTime(message.createdAt) : ""}
                      </Text>
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
