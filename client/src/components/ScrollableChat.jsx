import {
  Avatar,
  Tooltip,
  Box,
  Text,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from "@chakra-ui/react";
import { CopyIcon, RepeatIcon, ChevronDownIcon } from "@chakra-ui/icons";
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

  // Copy to clipboard
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
      status: "success",
      duration: 2000,
      isClosable: true,
      position: "bottom-right",
    });
  };

  return (
    <>
      <div
        className="hide-scrollbar"
        style={{ overflowX: "hidden", overflowY: "auto" }}
      >
        {/* If something inside the messages, render the messages */}
        {messages &&
          messages.map((message, index) => {
            const isUserMsg = message.sender._id === user._id;

            return (
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
                  backgroundColor={isUserMsg ? "#BEE3F8" : "#B9F5D0"}
                  borderRadius="20px"
                  padding="5px 15px"
                  maxWidth="75%"
                  marginLeft={isSameSenderMargin(
                    messages,
                    message,
                    index,
                    user._id
                  )}
                  marginTop={isSameUser(messages, message, index, user._id) ? 3 : 10}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={2}
                >
                  {/* Message content */}
                  <Text>{message.content}</Text>

                  {/* Dropdown menu (position depends on sender) */}
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      size="xs"
                      icon={<ChevronDownIcon />}
                      variant="ghost"
                      aria-label="Options"
                      ml={isUserMsg ? "0" : "auto"}
                      mr={isUserMsg ? "auto" : "0"}
                    />
                    <MenuList>
                      <MenuItem
                        icon={<CopyIcon />}
                        onClick={() => handleCopy(message.content)}
                      >
                        Copy
                      </MenuItem>
                      <MenuItem
                        icon={<RepeatIcon />}
                        onClick={() => onReply && onReply(message)}
                      >
                        Reply
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Box>
              </div>
            );
          })}
      </div>
      {isTyping ? (
        <div style={{ width: "70px", marginTop: "5px" }}>
          <Lottie animationData={typingAnimation} loop={true} />
        </div>
      ) : null}
    </>
  );
};

export default ScrollableChat;
