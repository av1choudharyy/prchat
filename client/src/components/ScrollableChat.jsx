// src/components/ScrollableChat.jsx
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
  const da = new Date(a),
    db = new Date(b);
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

// escape HTML to avoid injection
const escapeHtml = (unsafe) =>
  String(unsafe || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const ScrollableChat = ({ messages, isTyping, setReplyingTo, setForwardingMsg }) => {
  const { user } = ChatState();
  const bottomRef = useRef();

  // local reactions (if you add later): { [messageId]: "❤️" }
  const [reactions, setReactions] = useState({});

  useEffect(() => {
    // scroll to bottom when messages change
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  // Format message: escape -> apply B/I/U -> convert newlines -> return HTML
  const formatMessage = (text) => {
    if (!text && text !== "") return "";
    const escaped = escapeHtml(text);
    // ordering: bold first, then italic, then underline
    const html = escaped
      .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") // Bold
      .replace(/\*(.*?)\*/g, "<i>$1</i>") // Italic
      .replace(/__(.*?)__/g, "<u>$1</u>") // Underline
      .replace(/\n/g, "<br/>"); // preserve newlines
    return html;
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // small non-blocking feedback - you can replace with Chakra toast
        // using alert here keeps it simple
        alert("Message copied!");
      },
      () => {
        /* ignore */
      }
    );
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
      <div style={{ overflowX: "hidden", overflowY: "auto", paddingRight: 6 }}>
        {messages &&
          messages.map((message, index) => {
            const prev = messages[index - 1];
            const showDateChip = !prev || !isSameDay(prev?.createdAt, message?.createdAt);
            const mine = message.sender._id === user._id;

            const marginLeft = isSameSenderMargin(messages, message, index, user._id);

            return (
              <div key={message._id} style={{ marginBottom: 8 }}>
                {/* Optional date chip between days */}
                {showDateChip && message.createdAt && (
                  <Box display="flex" justifyContent="center" my={2}>
                    <Tag size="sm" variant="subtle" colorScheme="gray">
                      {prettyDate(message.createdAt)}
                    </Tag>
                  </Box>
                )}

                <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
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
                    ref={index === messages.length - 1 ? bottomRef : null}
                    onDoubleClick={() => toggleHeart(message._id)} // optional reaction
                    title="Double-click to react ❤️"
                    className={`msg ${mine ? "outgoing" : "incoming"}`}
                    style={{
                      marginLeft,
                      marginTop: isSameUser(messages, message, index, user._id) ? 3 : 10,
                    }}
                  >
                    {/* content */}
                    <span
                      // formatted HTML (B/I/U and <br/>)
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
                        style={{ fontSize: 12, cursor: "pointer", background: "transparent", border: "none" }}
                        onClick={() => handleCopy(message.content)}
                      >
                        Copy
                      </button>
                      <button
                        style={{ fontSize: 12, cursor: "pointer", background: "transparent", border: "none" }}
                        onClick={() => handleReply(message.content)}
                      >
                        Reply
                      </button>
                      <button
                        style={{ fontSize: 12, cursor: "pointer", background: "transparent", border: "none" }}
                        onClick={() => handleForward(message.content)}
                      >
                        Forward
                      </button>

                      {/* reaction shown on right if present */}
                      {reactions[message._id] && (
                        <span style={{ marginLeft: "auto", fontSize: 14, color: "#D53F8C" }}>
                          {reactions[message._id]}
                        </span>
                      )}
                    </div>

                    {/* timestamp */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: mine ? "flex-end" : "flex-start",
                        marginTop: 6,
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

        {/* spacer to ensure bottomRef has space */}
        <div ref={bottomRef} />
      </div>

      {isTyping ? (
        <div style={{ width: "70px", marginTop: "8px" }}>
          <Lottie animationData={typingAnimation} loop={true} />
        </div>
      ) : null}
    </>
  );
};

export default ScrollableChat;
