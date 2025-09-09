import { useState, useRef } from "react";
import { Box, HStack, Input, IconButton, Text } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

const MessageInput = ({
  newMessage,
  setNewMessage,
  sendMessage,
  typingHandler,
  replyMessage,
  setReplyMessage,
  lastReceivedMessage,
}) => {
  const inputRef = useRef();

  // ✅ Dynamic Quick Replies
  const getQuickReplies = () => {
    if (!lastReceivedMessage) return [];

    const content = lastReceivedMessage.toLowerCase();

    // Greetings
    if (/(hi|hello|hey|good morning|good evening)/.test(content)) {
      return ["Hello 👋", "Hey! How are you?", "Good to see you 🙂"];
    }

    // Questions
    if (content.endsWith("?")) {
      if (content.includes("how are you")) {
        return ["I’m good 🙂", "Doing well, thanks!", "All good, you?"];
      } else if (content.includes("time")) {
        return ["Now ⏰", "Later ⌛", "Not sure 🤔"];
      } else if (content.includes("ready")) {
        return ["Yes ✅", "Not yet ⏳", "Almost ready!"];
      }
      return ["Yes ✅", "No ❌", "Maybe 🤔"];
    }

    // Thanks
    if (/(thanks|thank you|thx|ty)/.test(content)) {
      return ["You're welcome 🙌", "No problem 🙂", "Anytime!"];
    }

    // Goodbyes
    if (/(bye|good night|see you|take care)/.test(content)) {
      return ["Bye 👋", "Good night 🌙", "Take care ❤️"];
    }

    // Agreement / Confirmation
    if (/(ok|okay|fine|sure|done)/.test(content)) {
      return ["Okay 👍", "Got it ✅", "Cool 😎"];
    }

    // Default fallback
    return ["Okay 👍", "Got it ✅", "Thank you 🙏"];
  };

  return (
    <>
      {/* Quick Replies */}
      <HStack spacing={2} mb={2}>
        {getQuickReplies().map((s, i) => (
          <Box
            key={i}
            px={3}
            py={1}
            borderRadius="lg"
            bg="gray.100"
            cursor="pointer"
            _hover={{ bg: "gray.200" }}
            onClick={() => setNewMessage(s)}
          >
            <Text fontSize="sm">{s}</Text>
          </Box>
        ))}
      </HStack>

      {/* Reply Box */}
      {replyMessage && (
        <Box p={2} mb={2} bg="gray.200" borderRadius="md" position="relative">
          <Text fontSize="sm" color="gray.600">
            Replying to {replyMessage.sender.name}:
          </Text>
          <Text fontSize="md" fontStyle="italic" noOfLines={1}>
            {replyMessage.content}
          </Text>
          <IconButton
            icon={<CloseIcon />}
            size="xs"
            position="absolute"
            top="2px"
            right="2px"
            onClick={() => setReplyMessage(null)}
          />
        </Box>
      )}

      {/* Input Field */}
      <HStack position="relative" w="100%">
        <Input
          ref={inputRef}
          variant="filled"
          bg="#E0E0E0"
          placeholder="Enter a message..."
          value={newMessage}
          onChange={typingHandler}
          onKeyDown={sendMessage}
        />
      </HStack>
    </>
  );
};

export default MessageInput;
