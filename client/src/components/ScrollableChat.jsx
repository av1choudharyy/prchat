import { Avatar, Tooltip, Box, IconButton } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { CopyIcon, RepeatIcon } from "@chakra-ui/icons";
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

  useEffect(() => {
    // Scroll to the bottom when messages render or sender is typing
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  // Reply handler
  const handleReply = (message) => {
    if (onReply) onReply(message); // send selected message back to SingleChat
  };

  return (
    <>
      <div
        className="hide-scrollbar"
        style={{ overflowX: "hidden", overflowY: "auto" }}
      >
        {messages &&
          messages.map((message, index) => (
            <div ref={scrollRef} key={message._id} style={{ display: "flex" }}>
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
                position="relative"
                _hover={{ ".actions": { display: "flex" } }}
                style={{
                  backgroundColor: `${
                    message.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"
                  }`,
                  borderRadius: "20px",
                  padding: "5px 15px",
                  maxWidth: "75%",
                  marginLeft: isSameSenderMargin(
                    messages,
                    message,
                    index,
                    user._id
                  ),
                  marginTop: isSameUser(messages, message, index, user._id)
                    ? 3
                    : 10,
                }}
              >
                {message.content}

                {/* Actions: Copy & Reply */}
                <Box
                  className="actions"
                  display="none"
                  position="absolute"
                  top="-25px"
                  right="5px"
                  gap="5px"
                >
                  <IconButton
                    size="xs"
                    aria-label="Copy message"
                    icon={<CopyIcon />}
                    onClick={() => navigator.clipboard.writeText(message.content)}
                  />
                  <IconButton
                    size="xs"
                    aria-label="Reply"
                    icon={<RepeatIcon />}
                    onClick={() => handleReply(message)}
                  />
                </Box>
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