import React, { useEffect, useRef } from "react";
import { Avatar, Tooltip, useColorMode } from "@chakra-ui/react";
import Lottie from "lottie-react";

import "../App.css";
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
}) => {
  const { user } = ChatState();
  const { colorMode } = useColorMode();
  const matchRefs = useRef([]);
  const scrollRef = useRef();
  const [emojiReactions, setEmojiReactions] = React.useState({});
  const [showEmojiPickerFor, setShowEmojiPickerFor] = React.useState(null);
  const emojiList = [
    "👍",
    "❤️",
    "😂",
    "😮",
    "😢",
    "😡",
    "🎉",
    "🙏",
    "👏",
    "😎",
  ];

  useEffect(() => {
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
    setEmojiReactions((prev) => ({
      ...prev,
      [messageId]: prev[messageId] ? [...prev[messageId], emoji] : [emoji],
    }));
    setShowEmojiPickerFor(null);
  };

  return (
    <>
      <div
        key={colorMode}
        className="hide-scrollbar"
        style={{
          overflowX: "hidden",
          overflowY: "auto",
          position: "relative",
          height: "100%",
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
                  isMatch ? (el) => (matchRefs.current[index] = el) : scrollRef
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
                {!isOwn && (
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
                  <div
                    style={{
                      fontSize: "12px",
                      color: colorMode === "dark" ? "gray.400" : "gray.600",
                      marginTop: "4px",
                      marginLeft: "auto", // shift for alignment with avatar
                      textAlign: isOwn ? "right" : "left",
                    }}
                  >
                    {new Date(message.createdAt).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                  {/* ✅ Reply Preview */}
                  {message.replyTo && (
                    <div
                      style={{
                        borderLeft: "3px solid #3182ce",
                        paddingLeft: "8px",
                        marginBottom: "6px",
                        fontSize: "14px",
                        color: colorMode === "dark" ? "gray.300" : "gray.700",
                        background:
                          colorMode === "dark"
                            ? "rgba(255,255,255,0.06)"
                            : "#f1f5f9",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        // ✅ scroll to original message if exists
                        const originalIndex = messages.findIndex(
                          (m) => m._id === message.replyTo._id
                        );
                        if (
                          originalIndex !== -1 &&
                          matchRefs.current[originalIndex]
                        ) {
                          matchRefs.current[originalIndex].scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }
                      }}
                    >
                      <strong>
                        {message.replyTo.sender?.name || "Unknown"}
                      </strong>
                      <div
                        style={{
                          fontStyle: "italic",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {message.replyTo.content
                          ? message.replyTo.content.length > 50
                            ? message.replyTo.content.substring(0, 50) + "…"
                            : message.replyTo.content
                          : message.replyTo.file
                          ? "📎 File/Media"
                          : ""}
                      </div>
                    </div>
                  )}

                  {/* ✅ Text */}
                  {message.content &&
                    highlightText(message.content, searchValue)}

                  {/* ✅ Image file */}
                  {message.file &&
                    (message.fileType === "image" ||
                      /\.(png|jpg|jpeg|gif)$/i.test(message.file)) && (
                      <div style={{ marginTop: "8px" }}>
                        <img
                          src={message.file}
                          alt="uploaded"
                          style={{
                            maxWidth: "250px",
                            maxHeight: "200px",
                            borderRadius: "12px",
                            cursor: "pointer",
                          }}
                          onClick={() => window.open(message.file, "_blank")}
                        />
                      </div>
                    )}

                  {/* ✅ Other files */}
                  {message.file &&
                    message.fileType !== "image" &&
                    !/\.(png|jpg|jpeg|gif)$/i.test(message.file) && (
                      <div style={{ marginTop: "8px" }}>
                        <a
                          href={message.file}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#3182ce",
                            fontWeight: "bold",
                            textDecoration: "underline",
                          }}
                        >
                          File
                        </a>
                      </div>
                    )}

                  {/* ✅ Emoji reactions */}
                  {emojiReactions[message._id] && (
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        marginTop: "6px",
                        position: "relative",
                      }}
                    >
                      {emojiReactions[message._id].map((emoji, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: "22px",
                            position: "absolute",
                            bottom: "-10px",
                            right: "-35px",
                            top: "-20px",
                            padding: "2px 6px",
                          }}
                        >
                          {emoji}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* ✅ Hover actions */}
                  <span
                    style={{
                      position: "absolute",
                      left: isOwn ? "-110px" : undefined,
                      right: !isOwn ? "-110px" : undefined,
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
                      <span role="img" aria-label="Copy">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 26 26"
                          fill="currentColor"
                        >
                          <path d="M17 2H7a2 2 0 0 0-2 2v15h2V4h10V2zm4 4H11a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm0 18H11V8h10v16z" />
                        </svg>
                      </span>
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
                      <span role="img" aria-label="Reply">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <polyline points="9 17 4 12 9 7"></polyline>
                          <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
                        </svg>
                      </span>
                    </button>

                    <button
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "20px",
                        color: "#3182ce",
                        padding: "2px",
                        position: "relative",
                      }}
                      title="Emoji"
                      aria-label="Emoji"
                      onClick={() => setShowEmojiPickerFor(message._id)}
                    >
                      <span role="img" aria-label="Emoji">
                        😃
                      </span>
                      {showEmojiPickerFor === message._id && (
                        <div
                          style={{
                            position: "absolute",
                            top: "40px",
                            left: isOwn?"-250px":undefined,

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
      ) : null}

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
