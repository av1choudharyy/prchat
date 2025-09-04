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
          messages.map((message, index) => (
            <div
              ref={scrollRef}
              key={message._id}
              style={{ display: "flex", alignItems: "center" }}
            >
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

              <div style={{ display: "flex", alignItems: "center" }}>
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

                <HStack spacing="1" ml="2">
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
