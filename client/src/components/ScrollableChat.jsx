import { useEffect, useRef } from "react";
import Lottie from "lottie-react";

import "../App.css";
import { ChatState } from "../context/ChatProvider";
import typingAnimation from "../animations/typing.json";
import MessageBubble from "./MessageBubble";

const ScrollableChat = ({ 
  messages, 
  isTyping, 
  onReply, 
  filteredMessages = null,
  highlightedMessageId = null 
}) => {
  const scrollRef = useRef();

  // Use filtered messages if search is active, otherwise use all messages
  const displayMessages = filteredMessages || messages;

  useEffect(() => {
    // Scroll to the bottom when messages render or sender is typing
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  useEffect(() => {
    // Scroll to highlighted message when search navigation occurs
    if (highlightedMessageId) {
      const highlightedElement = document.getElementById(`message-${highlightedMessageId}`);
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ 
          behavior: "smooth", 
          block: "center" 
        });
      }
    }
  }, [highlightedMessageId]);

  return (
    <>
      <div
        className="hide-scrollbar"
        style={{ overflowX: "hidden", overflowY: "auto" }}
      >
        {/* If something inside the messages, render the messages */}
        {displayMessages &&
          displayMessages.map((message, index) => (
            <div 
              ref={scrollRef} 
              key={message._id} 
              id={`message-${message._id}`}
            >
              <MessageBubble
                message={message}
                messages={displayMessages}
                index={index}
                onReply={onReply}
                isHighlighted={message._id === highlightedMessageId}
              />
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
