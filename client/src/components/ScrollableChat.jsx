import { Avatar, Box, HStack, IconButton, Tooltip } from "@chakra-ui/react";
import { CopyIcon, RepeatIcon, ArrowForwardIcon } from "@chakra-ui/icons";
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

const ScrollableChat = ({ messages, isTyping, onReply, onCopy, onForward }) => {
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
            <div ref={scrollRef} key={message._id} style={{ display: "flex", width: "100%" }} data-message-id={message._id}>
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

              <Box
                bg={message.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"}
                borderRadius="20px"
                px="3.5"
                py="1.5"
                maxW="75%"
                ml={isSameSenderMargin(messages, message, index, user._id)}
                mt={isSameUser(messages, message, index, user._id) ? 3 : 10}
              >
                {message.replyTo ? (
                  <Box
                    mb="2"
                    px="3"
                    py="2"
                    bg="rgba(56, 178, 172, 0.1)"
                    borderLeft="3px solid #38B2AC"
                    borderRadius="md"
                    cursor="pointer"
                    _hover={{ bg: "rgba(56, 178, 172, 0.15)" }}
                    onClick={() => {
                      // Scroll to the replied message if it exists in current chat
                      const repliedMessage = messages.find(m => m._id === message.replyTo._id);
                      if (repliedMessage) {
                        const element = document.querySelector(`[data-message-id="${repliedMessage._id}"]`);
                        element?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" mb="1">
                      <Box
                        w="2"
                        h="2"
                        bg="#38B2AC"
                        borderRadius="full"
                        mr="2"
                      />
                      <div style={{ fontSize: "11px", fontWeight: "600", color: "#38B2AC", textTransform: "uppercase" }}>
                        Replying to {message.replyTo.sender?.name || "Unknown"}
                      </div>
                    </Box>
                    <div style={{ fontSize: "12px", color: "gray.700", fontStyle: "italic" }}>
                      {message.replyTo.attachment?.url ? (
                        message.replyTo.attachment.type === "image" ? (
                          "🖼️ Image"
                        ) : (
                          `📎 ${message.replyTo.attachment.name || "File"}`
                        )
                      ) : (
                        message.replyTo.content || "Message"
                      )}
                    </div>
                  </Box>
                ) : null}
                {message.attachment?.url ? (
                  (() => {
                    console.log("Attachment data:", message.attachment);
                    return message.attachment.type === "image" ? (
                      <Box mb="2">
                        <img
                          src={message.attachment.url}
                          alt={message.attachment.name || "image"}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "300px",
                            borderRadius: 8,
                            cursor: "pointer",
                          }}
                          onClick={() => window.open(message.attachment.url, "_blank")}
                        />
                      </Box>
                    ) : (
                      <Box mb="2">
                        <a
                          href={message.attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "inherit", textDecoration: "underline" }}
                        >
                          📎 {message.attachment.name || "Download file"}
                        </a>
                      </Box>
                    );
                  })()
                ) : null}
                {message.content ? <div>{message.content}</div> : null}
                <HStack spacing="1" mt="1" justify="flex-end">
                  <IconButton
                    aria-label="Reply"
                    size="xs"
                    variant="ghost"
                    icon={<RepeatIcon boxSize={3.5} />}
                    onClick={() => onReply?.(message)}
                  />
                  <Tooltip label="Forward" placement="top" hasArrow>
                    <IconButton
                      aria-label="Forward"
                      size="xs"
                      variant="ghost"
                      icon={<ArrowForwardIcon boxSize={3.5} />}
                      onClick={() => onForward?.(message)}
                    />
                  </Tooltip>
                  <IconButton
                    aria-label="Copy"
                    size="xs"
                    variant="ghost"
                    icon={<CopyIcon boxSize={3.5} />}
                    onClick={() =>
                      onCopy?.(
                        message.attachment?.url || message.content || ""
                      )
                    }
                  />
                </HStack>
              </Box>
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
