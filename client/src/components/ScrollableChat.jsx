<<<<<<< HEAD
import { Box } from "@chakra-ui/react";
import { useState, useRef, useEffect } from "react";

const ScrollableChat = ({ messages, isTyping, searchTerm }) => {
  const scrollRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    if (isAtBottom) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping, isAtBottom]);

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 10);
  };

  return (
    <Box
      ref={scrollRef}
      display="flex"
      flexDir="column"
      overflowY="auto"
      h="100%"
      onScroll={handleScroll}
      p={3}
      bg="#E5DDD5"
    >
      {/* Render messages here */}
=======
import { Box, Text, HStack, IconButton } from "@chakra-ui/react";
import { CopyIcon, RepeatIcon } from "@chakra-ui/icons";

const ScrollableChat = ({ messages, user, setReplyMessage }) => {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {messages.map((message) => {
        const isOwn = message.sender._id === user._id;
        return (
          <Box
            key={message._id}
            bg={isOwn ? "#DCF8C6" : "#FFFFFF"}
            alignSelf={isOwn ? "flex-end" : "flex-start"}
            px={3}
            py={2}
            borderRadius="lg"
            maxW="70%"
          >
            <Text fontSize="sm" color="gray.700">{message.sender.name}</Text>

            {message.replyToMessage && (
              <Box bg="gray.100" p={1} borderRadius="md" mb={1}>
                <Text fontSize="xs" color="gray.600">
                  Replying to {message.replyToMessage.sender.name}: {message.replyToMessage.content}
                </Text>
              </Box>
            )}

            <Text>{message.content}</Text>

            <HStack mt={1} spacing={1}>
              <IconButton
                size="xs"
                icon={<CopyIcon />}
                onClick={() => {
                  navigator.clipboard.writeText(message.content);
                  alert("Message copied!");
                }}
                aria-label="Copy message"
              />
              {!isOwn && (
                <IconButton
                  size="xs"
                  icon={<RepeatIcon />}
                  onClick={() => setReplyMessage(message)}
                  aria-label="Reply message"
                />
              )}
              <Text fontSize="xs" color="gray.500">{new Date(message.createdAt).toLocaleTimeString()}</Text>
            </HStack>
          </Box>
        );
      })}
>>>>>>> 2818aa101d1ec36cc2a78b16e93fce92f1488420
    </Box>
  );
};

export default ScrollableChat;
