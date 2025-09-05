import { Avatar, Tooltip, Box, useToast, Button, Text } from "@chakra-ui/react";
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

const ScrollableChat = ({ messages, isTyping, handleReply  }) => {
  const { user } = ChatState();
  const toast = useToast();
  const scrollRef = useRef();

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Message Copied!",
      status: "success",
      duration: 1500,
      isClosable: true,
    });
  };


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
              bg={message.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"}
              borderRadius="20px"
              padding="5px 15px"
              maxWidth="75%"
              marginLeft={isSameSenderMargin(messages, message, index, user._id)}
              marginTop={isSameUser(messages, message, index, user._id) ? 3 : 10}
              position="relative" // For the actions overlay
              _hover={{ ".actions": { display: "flex" } }} // Show actions on hover
            >
              <Text>{message.content}</Text>
              
              {/* Actions Overlay */}
              <Box
                className="actions"
                display="none" // Initially hidden
                position="absolute"
                top="-25px"
                right="0"
                bg="gray.100"
                borderRadius="md"
                p="1"
                boxShadow="md"
                zIndex="1"
              >
                <Tooltip label="Copy" hasArrow>
                  <Button
                    size="xs"
                    onClick={() => handleCopy(message.content)}
                  >
                    Copy
                  </Button>
                </Tooltip>
                <Tooltip label="Reply" hasArrow ml="1">
                  <Button
                    size="xs"
                    onClick={() => handleReply(message._id, message.sender.name, message.content)}
                  >
                    Reply
                  </Button>
                </Tooltip>
              </Box>
            </Box>

              <span
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
              </span>
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
