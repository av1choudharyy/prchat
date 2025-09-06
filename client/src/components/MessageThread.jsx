import { Box, HStack, Text, Avatar, Badge, Collapse, IconButton } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useState } from 'react';

const MessageThread = ({ message, replies, darkMode, onReply }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Box>
      {/* Main Message */}
      <Box position="relative">
        {/* Message content here */}
        
        {/* Thread indicator */}
        {replies.length > 0 && (
          <HStack
            mt={2}
            p={2}
            bg={darkMode ? "gray.700" : "gray.50"}
            borderRadius="8px"
            cursor="pointer"
            onClick={() => setIsExpanded(!isExpanded)}
            _hover={{ bg: darkMode ? "gray.600" : "gray.100" }}
          >
            <IconButton
              size="xs"
              variant="ghost"
              icon={isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
            />
            <HStack spacing={-2}>
              {replies.slice(0, 3).map((reply, idx) => (
                <Avatar key={idx} size="xs" src={reply.sender.pic} />
              ))}
            </HStack>
            <Text fontSize="sm" color={darkMode ? "blue.300" : "blue.600"}>
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </Text>
            <Text fontSize="xs" color={darkMode ? "gray.400" : "gray.500"}>
              Last reply {new Date(replies[replies.length - 1].createdAt).toLocaleTimeString()}
            </Text>
          </HStack>
        )}
      </Box>

      {/* Thread Replies */}
      <Collapse in={isExpanded}>
        <Box ml={8} mt={2} borderLeft="2px solid" borderColor={darkMode ? "gray.600" : "gray.200"} pl={4}>
          {replies.map(reply => (
            <Box key={reply._id} mb={3}>
              <HStack spacing={2} mb={1}>
                <Avatar size="xs" src={reply.sender.pic} />
                <Text fontSize="sm" fontWeight="semibold">{reply.sender.name}</Text>
                <Text fontSize="xs" color={darkMode ? "gray.400" : "gray.500"}>
                  {new Date(reply.createdAt).toLocaleTimeString()}
                </Text>
              </HStack>
              <Text fontSize="sm" ml={6}>{reply.content}</Text>
            </Box>
          ))}
          <IconButton
            size="sm"
            variant="ghost"
            onClick={() => onReply(message)}
            ml={6}
            mt={2}
          >
            Reply to thread
          </IconButton>
        </Box>
      </Collapse>
    </Box>
  );
};

export default MessageThread;