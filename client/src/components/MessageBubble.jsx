import { useState } from "react";
import {
  Avatar,
  Tooltip,
  Box,
  IconButton,
  useToast,
  Text,
  Flex,
} from "@chakra-ui/react";
import { CopyIcon, ChatIcon } from "@chakra-ui/icons";

import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../context/ChatProvider";
import FileMessage from "./FileMessage";

const MessageBubble = ({ 
  message, 
  messages, 
  index, 
  onReply, 
  isHighlighted = false 
}) => {
  const { user } = ChatState();
  const [isHovered, setIsHovered] = useState(false);
  const toast = useToast();

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Message copied!",
        description: "Message has been copied to clipboard",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy message to clipboard",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
    }
  };

  const handleReply = () => {
    onReply(message);
  };

  const isMyMessage = message.sender._id === user._id;

  return (
    <div style={{ display: "flex", marginBottom: "2px" }}>
      {/* Avatar */}
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

      {/* Message Container */}
      <Box
        position="relative"
        maxWidth="75%"
        marginLeft={isSameSenderMargin(messages, message, index, user._id)}
        marginTop={isSameUser(messages, message, index, user._id) ? 3 : 10}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Reply Reference */}
        {message.replyTo && (
          <Box
            bg="gray.100"
            p={2}
            mb={1}
            borderRadius="md"
            borderLeft="3px solid"
            borderLeftColor={isMyMessage ? "blue.400" : "green.400"}
            fontSize="sm"
          >
            <Text fontSize="xs" color="gray.600" fontWeight="bold">
              Replying to {message.replyTo.sender.name}
            </Text>
            <Text fontSize="xs" color="gray.700" noOfLines={2}>
              {message.replyTo.content}
            </Text>
          </Box>
        )}

        {/* Message Bubble */}
        <Flex alignItems="center">
          <Box
            bg={isMyMessage ? "#BEE3F8" : "#B9F5D0"}
            color="black"
            borderRadius="20px"
            padding="8px 15px"
            position="relative"
            boxShadow={isHighlighted ? "0 0 0 2px #4299E1" : "none"}
            transition="box-shadow 0.2s"
          >
            {/* Render File Message or Text Message */}
            {message.messageType === 'image' || message.messageType === 'file' ? (
              <FileMessage 
                message={message} 
                isOwnMessage={isMyMessage}
                showDeleteOption={isMyMessage}
              />
            ) : (
              <>
                <Text fontSize="sm">{message.content}</Text>
                
                {/* Timestamp */}
                <Text fontSize="xs" color="gray.600" mt={1}>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </>
            )}

            {/* Action Buttons */}
            {isHovered && (
              <Flex
                position="absolute"
                top="-15px"
                right={isMyMessage ? "-60px" : "10px"}
                bg="white"
                borderRadius="md"
                boxShadow="md"
                p={1}
                gap={1}
              >
                <Tooltip label="Copy message" hasArrow>
                  <IconButton
                    size="xs"
                    icon={<CopyIcon />}
                    onClick={() => copyToClipboard(message.content)}
                    aria-label="Copy message"
                    variant="ghost"
                  />
                </Tooltip>
                <Tooltip label="Reply to message" hasArrow>
                  <IconButton
                    size="xs"
                    icon={<ChatIcon />}
                    onClick={handleReply}
                    aria-label="Reply to message"
                    variant="ghost"
                  />
                </Tooltip>
              </Flex>
            )}
          </Box>
        </Flex>
      </Box>
    </div>
  );
};

export default MessageBubble;
