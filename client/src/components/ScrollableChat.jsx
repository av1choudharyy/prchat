import { Avatar, Box, HStack, IconButton, Tooltip } from "@chakra-ui/react";
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

const ScrollableChat = ({ messages, isTyping, onReply, onCopy }) => {
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
            <div ref={scrollRef} key={message._id} style={{ display: "flex", width: "100%" }}>
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
                    mb="1"
                    px="2.5"
                    py="1"
                    bg="rgba(0,0,0,0.08)"
                    borderLeft="3px solid rgba(0,0,0,0.2)"
                    borderRadius="md"
                  >
                    <div style={{ fontSize: "12px", fontWeight: 600 }}>
                      {message.replyTo.sender?.name || "Replied message"}
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.85 }}>
                      {message.replyTo.content}
                    </div>
                  </Box>
                ) : null}
                {message.attachment?.url ? (
                  message.attachment.type === "image" ? (
                    <a href={message.attachment.url} target="_blank" rel="noreferrer">
                      <img
                        src={message.attachment.url}
                        alt={message.attachment.name || "image"}
                        style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 6 }}
                      />
                    </a>
                  ) : (
                    <a href={message.attachment.url} target="_blank" rel="noreferrer">
                      {message.attachment.name || "Download file"}
                    </a>
                  )
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
