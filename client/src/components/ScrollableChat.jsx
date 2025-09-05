import { Avatar, Tooltip, IconButton, HStack, useToast } from "@chakra-ui/react";
import { CopyIcon, RepeatIcon } from "@chakra-ui/icons";
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

const ScrollableChat = ({ messages, isTyping, onReply }) => {
  const { user } = ChatState();

  const scrollRef = useRef();
  const toast = useToast();

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
          messages.map((message, index) => {
            const isOwnMessage = message.sender._id === user._id;
            
            return (
              <div
                ref={scrollRef}
                key={message._id}
                style={{ 
                  display: "flex", 
                  alignItems: "flex-end",
                  justifyContent: isOwnMessage ? "flex-end" : "flex-start",
                  marginBottom: "8px"
                }}
              >
                {/* Avatar for received messages (left side) */}
                {!isOwnMessage && (isSameSender(messages, message, index, user._id) ||
                  isLastMessage(messages, index, user._id)) && (
                  <Tooltip
                    label={message.sender.name}
                    placement="bottom-start"
                    hasArrow
                  >
                    <Avatar
                      mt="7px"
                      mr="8px"
                      size="sm"
                      cursor="pointer"
                      name={message.sender.name}
                      src={message.sender.pic}
                    />
                  </Tooltip>
                )}

                {/* Message bubble */}
                <div
                  style={{
                    backgroundColor: isOwnMessage ? "#DCF8C6" : "#FFFFFF",
                    borderRadius: "18px",
                    padding: "8px 12px",
                    maxWidth: "70%",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                    border: isOwnMessage ? "none" : "1px solid #E5E5EA",
                    position: "relative",
                  }}
                >
                  {message.replyTo && (
                    <div
                      style={{
                        backgroundColor: "rgba(0,0,0,0.05)",
                        borderRadius: "8px",
                        padding: "6px 8px",
                        marginBottom: "6px",
                        borderLeft: "3px solid #007bff",
                        fontSize: "0.8em",
                      }}
                    >
                      <div style={{ fontWeight: "bold", color: "#666", marginBottom: "2px" }}>
                        {message.replyTo.sender?.name || "Unknown"}
                      </div>
                      <div style={{ color: "#555" }}>
                        {message.replyTo.content?.length > 50 
                          ? `${message.replyTo.content.substring(0, 50)}...` 
                          : message.replyTo.content}
                      </div>
                    </div>
                  )}
                  <div style={{ color: isOwnMessage ? "#000" : "#000" }}>
                    {message.content}
                  </div>
                </div>

                {/* Action buttons - positioned based on message side */}
                <div style={{ 
                  display: "flex", 
                  alignItems: "center",
                  marginLeft: isOwnMessage ? "8px" : "4px",
                  marginRight: isOwnMessage ? "4px" : "8px",
                  opacity: "0",
                  transition: "opacity 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.opacity = "1"}
                onMouseLeave={(e) => e.target.style.opacity = "0"}
                >
                  <HStack spacing="1">
                    <Tooltip label="Copy" hasArrow>
                      <IconButton
                        aria-label="Copy message"
                        icon={<CopyIcon />}
                        size="xs"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(message.content || "");
                            toast({
                              title: "Copied",
                              status: "success",
                              duration: 1500,
                              isClosable: true,
                              position: "bottom-right",
                              variant: "subtle",
                            });
                          } catch (e) {
                            toast({
                              title: "Failed to copy",
                              status: "error",
                              duration: 1500,
                              isClosable: true,
                              position: "bottom-right",
                              variant: "subtle",
                            });
                          }
                        }}
                      />
                    </Tooltip>
                    <Tooltip label="Reply" hasArrow>
                      <IconButton
                        aria-label="Reply to message"
                        icon={<RepeatIcon />}
                        size="xs"
                        variant="ghost"
                        onClick={() => onReply && onReply(message)}
                      />
                    </Tooltip>
                  </HStack>
                </div>

                {/* Avatar for sent messages (right side) */}
                {isOwnMessage && (isSameSender(messages, message, index, user._id) ||
                  isLastMessage(messages, index, user._id)) && (
                  <Tooltip
                    label={message.sender.name}
                    placement="bottom-end"
                    hasArrow
                  >
                    <Avatar
                      mt="7px"
                      ml="8px"
                      size="sm"
                      cursor="pointer"
                      name={message.sender.name}
                      src={message.sender.pic}
                    />
                  </Tooltip>
                )}
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
    </>
  );
};

export default ScrollableChat;
