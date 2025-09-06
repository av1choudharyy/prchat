import { Avatar, Tooltip, IconButton, Box, Text, Flex } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";
import { CopyIcon, ArrowForwardIcon } from "@chakra-ui/icons";

import "../App.css";
import {
  isLastMessage,
  isSameSender,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../context/ChatProvider";
import typingAnimation from "../animations/typing.json";
import EmojiPicker from "./EmojiPicker";

const ScrollableChat = ({ messages, isTyping, handleReply }) => {
  const { user } = ChatState();
  const scrollRef = useRef();
  const [showPickerFor, setShowPickerFor] = useState(null);

  useEffect(() => {
    // Scroll to the bottom when messeges render or sender is typing
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  const handleEmojiSelect = async (emoji, messageId) => {
    try {
      const response = await fetch("/api/message/react", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ messageId, emoji }),
      });
      if (!response.ok) throw new Error("Failed to add/remove reaction");
      setShowPickerFor(null);
    } catch (error) {
      console.error("Emoji reaction error:", error);
    }
  };

  return (
    <>
      <div
        className="hide-scrollbar"
        style={{ overflowX: "hidden", overflowY: "auto" }}
      >
        {messages &&
          messages.map((message, index) => {
            if (!message || !message._id) return null;
            const isSender = message.sender._id === user._id;

            return (
              <Box
                ref={scrollRef}
                key={message._id}
                display="flex"
                flexDirection="column"
                alignItems={isSender ? "flex-end" : "flex-start"}
                mb={1}
                mt={isSameUser(messages, message, index, user._id) ? 3 : 10}
              >
                <Flex alignItems="flex-start" gap={2}>
                  {!isSender &&
                    (isSameSender(messages, message, index, user._id) ||
                      isLastMessage(messages, index, user._id)) && (
                      <Tooltip label={message.sender.name} placement="bottom-start" hasArrow>
                        <Avatar
                          mt="7px"
                          size="sm"
                          cursor="pointer"
                          name={message.sender.name}
                          src={message.sender.pic}
                        />
                      </Tooltip>
                    )}

                  <Box position="relative" width="fit-content" maxWidth="80%">
                    {message.replyTo && (
                      <Box
                        bg="gray.200"
                        p={2}
                        borderRadius="md"
                        mb={1}
                        fontSize="sm"
                      >
                        <Text fontWeight="bold" isTruncated>
                          Replying to: {message.replyTo.sender?.name || "User"}
                        </Text>
                        <Text isTruncated>{message.replyTo.content}</Text>
                      </Box>
                    )}

                    <Box
                      bg={isSender ? "#BEE3F8" : "#B9F5D0"}
                      borderRadius="20px"
                      px={4}
                      py={2}
                      position="relative"
                    >
                      <Text>{message.content}</Text>

                      {/* Reactions */}
                      {message.reactions?.length > 0 && (
                        <Flex mt={2} wrap="wrap" gap={2}>
                          {message.reactions.map((reaction, idx) => (
                            <Box
                              key={idx}
                              bg="gray.300"
                              px={2}
                              py={1}
                              borderRadius="md"
                              fontSize="sm"
                              cursor="pointer"
                              _hover={{ bg: "gray.400" }}
                              onClick={() =>
                                handleEmojiSelect(reaction.emoji, message._id)
                              }
                              title={`Reacted by ${reaction.user.name}`}
                            >
                              {reaction.emoji}
                              {reaction.user._id === user._id ? " (You)" : ""}
                            </Box>
                          ))}
                        </Flex>
                      )}

                      {/* Action Icons */}
                      <Flex
                        mt={2}
                        gap={2}
                        justifyContent={isSender ? "flex-end" : "flex-start"}
                        alignItems="center"
                        wrap="wrap"
                      >
                        <Tooltip label="Copy message" fontSize="md">
                          <IconButton
                            icon={<CopyIcon />}
                            size="sm"
                            variant="ghost"
                            aria-label="Copy message"
                            onClick={() =>
                              navigator.clipboard.writeText(message.content)
                            }
                          />
                        </Tooltip>
                        <Tooltip label="Reply to message" fontSize="md">
                          <IconButton
                            icon={<ArrowForwardIcon />}
                            size="sm"
                            variant="ghost"
                            aria-label="Reply to message"
                            onClick={() => handleReply(message)}
                          />
                        </Tooltip>
                        <Tooltip label="Add Reaction" fontSize="md">
                          <IconButton
                            size="sm"
                            variant="ghost"
                            aria-label="Add Reaction"
                            icon={<Text fontSize="lg">🙂</Text>}
                            onClick={() =>
                              setShowPickerFor(
                                showPickerFor === message._id ? null : message._id
                              )
                            }
                          />
                        </Tooltip>
                      </Flex>

                      {/* Emoji Picker */}
                      {showPickerFor === message._id && (
                        <Box
                          position="absolute"
                          bottom="100%"
                          right="0"
                          zIndex={10}
                          bg="white"
                          boxShadow="md"
                          borderRadius="md"
                          mt={2}
                        >
                          <EmojiPicker
                            onSelect={(emoji) =>
                              handleEmojiSelect(emoji, message._id)
                            }
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Flex>
              </Box>
            );
          })}
      </div>

      {isTyping && (
        <Box width="70px" mt={2}>
          <Lottie animationData={typingAnimation} loop={true} />
        </Box>
      )}
    </>
  );
};

export default ScrollableChat;
