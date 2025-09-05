import { Avatar, Tooltip, useToast } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";

import "../App.css";
import {
  isLastMessage,
  isSameSender,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../context/ChatProvider";
import typingAnimation from "../animations/typing.json";

const ScrollableChat = ({ messages, isTyping }) => {
  const { user } = ChatState();
  const toast = useToast();

  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [emojiMenuFor, setEmojiMenuFor] = useState(null);
  const [reactions, setReactions] = useState({});

  const scrollRef = useRef();

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  // Initialize reactions from backend messages
  useEffect(() => {
    const initialReactions = {};
    messages.forEach((msg) => {
      if (msg.reactions?.length) {
        initialReactions[msg._id] = {};
        msg.reactions.forEach((r) => {
          initialReactions[msg._id][r.user._id] = r.emoji;
        });
      }
    });
    setReactions(initialReactions);
  }, [messages]);

  // Function to save reaction using fetch (like sendMessage)
  const handleReaction = async (messageId, emoji) => {
    try {
      const response = await fetch(`/api/message/${messageId}/reaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        throw new Error("Failed to save reaction");
      }

      const data = await response.json();

      const backendReactions = {};
      data.reactions.forEach((r) => {
        backendReactions[r.user._id] = r.emoji;
      });

      setReactions((prev) => ({ ...prev, [messageId]: backendReactions }));
      setEmojiMenuFor(null);
      setHoveredMessageId(null);
    } catch (error) {
      console.error("Failed to save reaction", error);
      toast({
        title: "Error",
        description: "Failed to save reaction",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
    }
  };

  return (
    <>
      <div
        className="hide-scrollbar"
        style={{ overflowX: "hidden", overflowY: "auto", padding: "10px 0" }}
      >
        {messages &&
          messages?.map((message, index) => {
            const isSender = message.sender._id === user._id;

            return (
              <div
                ref={scrollRef}
                key={message._id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isSender ? "flex-end" : "flex-start",
                  position: "relative",
                  marginTop: isSameUser(messages, message, index, user._id)
                    ? 3
                    : 10,
                  overflow: "visible",
                }}
                onMouseEnter={() => setHoveredMessageId(message._id)}
                onMouseLeave={() => {
                  if (emojiMenuFor !== message._id) setHoveredMessageId(null);
                }}
              >
                {!isSender && (
                  <Tooltip
                    label={message.sender.name}
                    placement="top-start"
                    hasArrow
                  >
                    <Avatar
                      size="sm"
                      cursor="pointer"
                      name={message.sender.name}
                      src={message.sender.pic}
                      mb="2px"
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
                  <span
                    style={{
                      backgroundColor: isSender ? "#BEE3F8" : "#B9F5D0",
                      borderRadius: "20px",
                      padding: "5px 15px",
                      display: "inline-block",
                      minWidth: "30px",
                      wordBreak: "break-word",
                      position: "relative",
                    }}
                  >
                    {message.content}

                    {/* Reactions */}
                    {reactions[message._id] && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "-18px",
                          display: "flex",
                          gap: "4px",
                          left: isSender ? "0" : "auto",
                          right: isSender ? "auto" : "0",
                        }}
                      >
                        {Object.values(reactions[message._id]).map((emoji, idx) => (
                          <span key={idx}>{emoji}</span>
                        ))}
                      </div>
                    )}

                    {/* Emoji menu */}
                    {emojiMenuFor === message._id && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "100%",
                          left: isSender ? "-10px" : "0",
                          background: "#fff",
                          border: "1px solid #ccc",
                          borderRadius: "20px",
                          padding: "4px 8px",
                          display: "flex",
                          gap: "6px",
                          zIndex: 100,
                          marginBottom: "6px",
                        }}
                      >
                        {["👍", "❤️", "😂", "😮", "🙏"].map((emoji) => (
                          <span
                            key={emoji}
                            style={{ cursor: "pointer", fontSize: "18px" }}
                            onClick={() => handleReaction(message._id, emoji)}
                          >
                            {emoji}
                          </span>
                        ))}
                      </div>
                    )}
                  </span>

                  {/* Three dots */}
                  {hoveredMessageId === message._id && (
                    <button
                      style={{
                        position: "absolute",
                        top: "50%",
                        transform: "translateY(-50%)",
                        right: isSender ? "100%" : "-25px",
                        marginRight: isSender ? "5px" : "0",
                        fontSize: "22px",
                        cursor: "pointer",
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        zIndex: 10,
                      }}
                      onClick={() =>
                        setEmojiMenuFor(
                          emojiMenuFor === message._id ? null : message._id
                        )
                      }
                    >
                      ⋯
                    </button>
                  )}
                </div>
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
