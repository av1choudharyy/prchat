import React, { useEffect, useRef } from "react";
import { Avatar, Tooltip, useColorMode } from "@chakra-ui/react";
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
  searchValue,
  matchIndexes = [],
  currentMatch = 0,
  setCurrentMatch = () => {},
  onCopyMessage = () => {},
  onReplyMessage = () => {},
  onForwardMessage = () => {},
  onEmojiMessage = () => {},
}) => {
  const { user } = ChatState();
  const { colorMode } = useColorMode();
  const matchRefs = useRef([]);
  const scrollRef = useRef();
  const [emojiReactions, setEmojiReactions] = React.useState({}); // { messageId: [emoji, ...] }
  const [showEmojiPickerFor, setShowEmojiPickerFor] = React.useState(null);
  const emojiList = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🙏", "👏", "😎"];

  useEffect(() => {
    // Scroll to the bottom when messeges render or sender is typing
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (
      matchIndexes.length > 0 &&
      matchRefs.current[matchIndexes[currentMatch]]
    ) {
      matchRefs.current[matchIndexes[currentMatch]].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentMatch, matchIndexes]);

  const highlightText = (text, keyword) => {
    if (!keyword) return text;
    const regex = new RegExp(`(${keyword})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <span
          key={i}
          style={{
            background: "#ffe066",
            color: "#222",
            fontWeight: "bold",
            borderRadius: "3px",
            padding: "0 2px",
          }}
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const handleAddEmoji = (messageId, emoji) => {
    setEmojiReactions(prev => ({
      ...prev,
      [messageId]: prev[messageId] ? [...prev[messageId], emoji] : [emoji]
    }));
    setShowEmojiPickerFor(null);
  };

  // Teams-style message bubble with hover actions
  return (
    <>
      <div
        className="hide-scrollbar"
        style={{
          overflowX: "hidden",
          overflowY: "auto",
          position: "relative",
          padding: "30px 5px 10px 5px",
          background: colorMode === "dark" ? "gray.900" : "white",
        }}
      >
        {messages &&
          messages.map((message, index) => {
            const isMatch =
              searchValue &&
              message.content &&
              message.content.toLowerCase().includes(searchValue.toLowerCase());
            const isOwn = message.sender._id === user._id;
            return (
              <div
                ref={
                  isMatch
                    ? el => (matchRefs.current[index] = el)
                    : scrollRef
                }
                key={message._id}
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  position: "relative",
                  marginBottom: "12px",
                  marginLeft: isOwn ? "auto" : "0",
                  justifyContent: isOwn ? "flex-end" : "flex-start",
                  width: "fit-content",
                  maxWidth: "80%",
                }}
                className="teams-message-row"
              >
                {/* Avatar for other user, Teams style */}
                {!isOwn && (
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
                    backgroundColor: isOwn
                      ? colorMode === "dark"
                        ? "teal.700"
                        : "#BEE3F8"
                      : colorMode === "dark"
                      ? "gray.700"
                      : "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "18px",
                    padding: "8px 18px",
                    fontSize: "16px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    position: "relative",
                    transition: "box-shadow 0.2s",
                    minWidth: "60px",
                    display: "inline-block",
                    color: colorMode === "dark" ? "whiteAlpha.900" : "#222",
                  }}
                  className="teams-message-bubble"
                >
                  {highlightText(message.content, searchValue)}
                  {/* Emoji reactions below message */}
                  {emojiReactions[message._id] && (
                    <div style={{ display: "flex", gap: "4px", marginTop: "6px" ,position: "relative"}}>
                      {emojiReactions[message._id].map((emoji, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: "22px",
                            position: "absolute",
                            bottom: "-10px",
                            right: '-35px',
                            top:'-20px',
                            // background: "#f1f1f1",
                            // borderRadius: "12px",
                            padding: "2px 6px",
                            // border: "1px solid #e2e8f0",
                          }}
                        >
                          {emoji}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Hover actions: clipboard, reply, forward, emoji */}
                  <span
                    style={{
                      position: "absolute",
                      left: isOwn ? "-150px" : undefined,
                      right: !isOwn ? "-150px" : undefined,
                      top: "-5%",
                      transform: "translateY(-50%)",
                      display: "none",
                      gap: "8px",
                      background: "#fff",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                      padding: "4px 8px",
                      alignItems: "center",
                      border: "1px solid #e2e8f0",
                    }}
                    className="teams-message-actions"
                  >
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "20px",
                        color: "#3182ce",
                        padding: "2px",
                      }}
                      title="Copy"
                      aria-label="Copy"
                      onClick={() => onCopyMessage(message)}
                    >
                      <span role="img" aria-label="Copy">📋</span>
                    </button>
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "20px",
                        color: "#3182ce",
                        padding: "2px",
                      }}
                      title="Reply"
                      aria-label="Reply"
                      onClick={() => onReplyMessage(message)}
                    >
                      <span role="img" aria-label="Reply">↩️</span>
                    </button>
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "20px",
                        color: "#3182ce",
                        padding: "2px",
                      }}
                      title="Forward"
                      aria-label="Forward"
                      onClick={() => onForwardMessage(message)}
                    >
                      <span role="img" aria-label="Forward">➡️</span>
                    </button>
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "20px",
                        color: "#3182ce",
                        padding: "2px",
                        position: "relative"
                      }}
                      title="Emoji"
                      aria-label="Emoji"
                      onClick={() => setShowEmojiPickerFor(message._id)}
                    >
                      <span role="img" aria-label="Emoji">😃</span>
                      {/* Emoji picker dropdown for this message */}
                      {showEmojiPickerFor === message._id && (
                        <div
                          style={{
                            position: "absolute",
                            top: "28px",
                            left: 0,
                            background: "#fff",
                            border: "1px solid #ccc",
                            borderRadius: 6,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            zIndex: 10,
                            padding: "8px 12px",
                            display: "flex",
                            gap: "8px",
                          }}
                        >
                          {emojiList.map((emoji, idx) => (
                            <button
                              key={idx}
                              style={{
                                background: "none",
                                border: "none",
                                fontSize: "22px",
                                cursor: "pointer",
                              }}
                              onClick={() => handleAddEmoji(message._id, emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </button>
                  </span>
                </span>
                {/* Avatar for self, Teams style */}
                {isOwn && (
                  <Avatar
                    mt="7px"
                    ml="1"
                    size="sm"
                    cursor="pointer"
                    name={message.sender.name}
                    src={message.sender.pic}
                  />
                )}
                <style>
                  {`
                    .teams-message-row:hover .teams-message-actions {
                      display: flex !important;
                    }
                  `}
                </style>
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
      {searchValue && matchIndexes.length > 0 && (
        <div
          style={{
            position: "absolute",
            right: 0,
            display: "flex",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <button
            onClick={() =>
              setCurrentMatch((prev) =>
                prev === 0 ? matchIndexes.length - 1 : prev - 1
              )
            }
            style={{ marginRight: 8 }}
          >
            &#8592;
          </button>
          <span>
            {currentMatch + 1} / {matchIndexes.length}
          </span>
          <button
            onClick={() =>
              setCurrentMatch((prev) =>
                prev === matchIndexes.length - 1 ? 0 : prev + 1
              )
            }
            style={{ marginLeft: 8 }}
          >
            &#8594;
          </button>
        </div>
      )}
    </>
  );
};

export default ScrollableChat;
