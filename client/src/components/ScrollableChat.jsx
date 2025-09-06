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

const ScrollableChat = ({ messages, isTyping, onVote, onEdit, onDelete, onReply, theme }) => {
  const { user } = ChatState();

  const scrollRef = useRef();

  useEffect(() => {
    // Scroll to the bottom when messeges render or sender is typing
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  return (
    <>
      <div
        className="hide-scrollbar"
        style={{ overflowX: "hidden", overflowY: "auto" }}
      >
        {/* If something inside the messages, render the messages */}
        {messages &&
          messages.map((message, index) => (
            <div 
              ref={scrollRef} 
              key={message._id} 
              style={{ 
                display: "flex", 
                justifyContent: message.sender._id === user._id ? "flex-end" : "flex-start",
                marginBottom: "8px"
              }}
            >
              <div style={{ 
                display: "flex", 
                alignItems: "flex-end",
                maxWidth: "75%",
                flexDirection: message.sender._id === user._id ? "row-reverse" : "row"
              }}>
                {/* Avatar for other users */}
                {message.sender._id !== user._id && (
                <Tooltip
                  label={message.sender.name}
                  placement="bottom-start"
                  hasArrow
                >
                  <Avatar
                    size="sm"
                    cursor="pointer"
                    name={message.sender.name}
                    src={message.sender.pic}
                      style={{ marginRight: "8px" }}
                  />
                </Tooltip>
                )}

                <div style={{ display: "flex", flexDirection: "column", alignItems: message.sender._id === user._id ? "flex-end" : "flex-start" }}>
                  {/* Sender name for other users */}
                  {message.sender._id !== user._id && (
                    <div style={{ 
                      fontSize: "12px", 
                      color: theme === "cosmic" ? "#6B7280" : "#9CA3AF", 
                      marginBottom: "4px",
                      marginLeft: "8px"
                    }}>
                      {message.sender.name}
                    </div>
              )}

              <span
                style={{
                      background: theme === "cosmic"
                        ? (message.sender._id === user._id
                            ? "#4F46E5"
                            : "#F3F4F6")
                        : (message.sender._id === user._id ? "#2D3748" : "#FFFFFF"),
                      color: theme === "cosmic" ? (message.sender._id === user._id ? "#FFFFFF" : "#1F2937") : (message.sender._id === user._id ? "#E5E7EB" : "#1F2937"),
                      borderRadius: 20,
                      padding: "10px 16px",
                      boxShadow: theme === "cosmic" ? "0 0 10px rgba(147,197,253,0.35)" : "none",
                      border: theme === "cosmic" ? "1px solid rgba(165,180,252,0.6)" : "none",
                    }}
                  >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <small style={{ opacity: 0.8, marginRight: 10, color: theme === "cosmic" ? (message.sender._id === user._id ? "#FFFFFF" : "#1F2937") : (message.sender._id === user._id ? "#E5E7EB" : "#1F2937") }}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {message.editedAt ? " • edited" : ""}
                  </small>
                  <div>
                    <button onClick={(e) => {
                      navigator.clipboard.writeText(message.content);
                      // Show a brief visual feedback
                      const button = e.target;
                      const originalText = button.textContent;
                      button.textContent = "Copied!";
                      button.style.color = "#10B981";
                      setTimeout(() => {
                        button.textContent = originalText;
                        button.style.color = theme === "cosmic" ? (message.sender._id === user._id ? "#FFFFFF" : "#1F2937") : (message.sender._id === user._id ? "#E5E7EB" : "#1F2937");
                      }, 1000);
                    }} style={{ marginRight: 6, color: theme === "cosmic" ? (message.sender._id === user._id ? "#FFFFFF" : "#1F2937") : (message.sender._id === user._id ? "#E5E7EB" : "#1F2937"), background: "transparent", border: "none", cursor: "pointer" }}>Copy</button>
                    <button onClick={() => onReply && onReply(message)} style={{ marginRight: 6, color: theme === "cosmic" ? (message.sender._id === user._id ? "#FFFFFF" : "#1F2937") : (message.sender._id === user._id ? "#E5E7EB" : "#1F2937"), background: "transparent", border: "none", cursor: "pointer" }}>Reply</button>
                    {onEdit && message.sender._id === user._id && (
                      <button onClick={() => onEdit(message)} style={{ marginRight: 6, color: theme === "cosmic" ? (message.sender._id === user._id ? "#FFFFFF" : "#1F2937") : (message.sender._id === user._id ? "#E5E7EB" : "#1F2937"), background: "transparent", border: "none", cursor: "pointer" }}>Edit</button>
                    )}
                    {onDelete && message.sender._id === user._id && (
                      <button onClick={() => onDelete(message)} style={{ color: theme === "cosmic" ? (message.sender._id === user._id ? "#FFFFFF" : "#1F2937") : (message.sender._id === user._id ? "#E5E7EB" : "#1F2937"), background: "transparent", border: "none", cursor: "pointer" }}>Delete</button>
                    )}
                  </div>
                </div>
                {message.replyTo && (
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6, color: theme === "cosmic" ? (message.sender._id === user._id ? "#FFFFFF" : "#1F2937") : (message.sender._id === user._id ? "#E5E7EB" : "#1F2937") }}>
                    Replying to {message.replyTo?.sender?.name}: {message.replyTo?.content}
                  </div>
                )}
                {message.type === "poll" ? (
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6, color: theme === "cosmic" ? (message.sender._id === user._id ? "#FFFFFF" : "#1F2937") : (message.sender._id === user._id ? "#E5E7EB" : "#1F2937") }}>
                      {message.poll?.question}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(message.poll?.options || []).map((opt, idx) => {
                        const voteCount = (opt.votes || []).length;
                        const hasUserVoted = (opt.votes || []).some(voteId => String(voteId) === String(user._id));
                        const totalVotes = (message.poll?.options || []).reduce((sum, option) => sum + (option.votes || []).length, 0);
                        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                        
                        return (
                          <div key={opt._id || opt.text} style={{ 
                            display: "flex", 
                            flexDirection: "column", 
                            gap: 4,
                            padding: "8px 12px",
                            borderRadius: "8px",
                            backgroundColor: "#FFF7ED",
                            border: hasUserVoted ? "2px solid #F97316" : "1px solid #FED7AA",
                            boxShadow: "0 2px 4px rgba(251, 146, 60, 0.2)"
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ 
                                color: "#9A3412",
                                fontWeight: hasUserVoted ? "600" : "400"
                              }}>
                                {opt.text}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ 
                                  fontSize: "12px", 
                                  opacity: 0.7, 
                                  color: "#9A3412"
                                }}>
                                  {voteCount} votes ({percentage}%)
                                </span>
                                <button 
                                  onClick={() => onVote && onVote(message._id, idx)} 
                                  style={{ 
                                    padding: "4px 8px",
                                    fontSize: "12px",
                                    color: hasUserVoted ? "#FFFFFF" : "#9A3412",
                                    background: hasUserVoted ? "#F97316" : "transparent",
                                    border: `1px solid ${hasUserVoted ? "#F97316" : "#FED7AA"}`,
                                    borderRadius: "4px",
                                    cursor: "pointer"
                                  }}
                                >
                                  {hasUserVoted ? "Voted" : "Vote"}
                                </button>
                              </div>
                            </div>
                            {totalVotes > 0 && (
                              <div style={{
                                width: "100%",
                                height: "4px",
                                backgroundColor: "rgba(251, 146, 60, 0.2)",
                                borderRadius: "2px",
                                overflow: "hidden"
                              }}>
                                <div style={{
                                  width: `${percentage}%`,
                                  height: "100%",
                                  backgroundColor: "#F97316",
                                  transition: "width 0.3s ease"
                                }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                  </div>
                ) : (
                  <>
                    <div style={{ color: theme === "cosmic" ? (message.sender._id === user._id ? "#FFFFFF" : "#1F2937") : (message.sender._id === user._id ? "#E5E7EB" : "#1F2937") }}>{message.content}</div>
                    {Array.isArray(message.readBy) && (
                      <small style={{ opacity: 0.7, color: theme === "cosmic" ? (message.sender._id === user._id ? "#FFFFFF" : "#1F2937") : (message.sender._id === user._id ? "#E5E7EB" : "#1F2937") }}>
                        Read by {message.readBy.length}
                      </small>
                    )}
                  </>
                )}
              </span>
                </div>
              </div>
            </div>
          ))}
      </div>
      {isTyping ? (
        <div style={{ width: 60, marginTop: 6 }}>
          <Lottie animationData={typingAnimation} loop={true} />
        </div>
      ) : null}
    </>
  );
};

export default ScrollableChat;
