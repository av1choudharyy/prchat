import {
  Box,
  Flex,
  Text,
  IconButton,
  FormControl,
  Input,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

const ReplyInput = ({ 
  replyToMessage, 
  onCancelReply, 
  newMessage, 
  setNewMessage, 
  onSendMessage, 
  onTyping 
}) => {
  if (!replyToMessage) return null;

  return (
    <Box>
      {/* Reply Preview */}
      <Box
        bg="gray.50"
        p={3}
        mx={3}
        borderRadius="md"
        borderLeft="3px solid #4299E1"
        position="relative"
      >
        <Flex justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Text fontSize="sm" fontWeight="bold" color="blue.600">
              Replying to {replyToMessage.sender.name}
            </Text>
            <Text fontSize="sm" color="gray.700" noOfLines={2} mt={1}>
              {replyToMessage.content}
            </Text>
          </Box>
          <IconButton
            size="sm"
            icon={<CloseIcon />}
            onClick={onCancelReply}
            variant="ghost"
            aria-label="Cancel reply"
            ml={2}
          />
        </Flex>
      </Box>

      {/* Message Input */}
      <FormControl mt={3} mx={3} onKeyDown={onSendMessage} isRequired>
        <Input
          variant="filled"
          bg="#E0E0E0"
          placeholder="Type your reply..."
          value={newMessage}
          onChange={onTyping}
          _focus={{
            bg: "white",
            borderColor: "blue.400",
          }}
        />
      </FormControl>
    </Box>
  );
};

export default ReplyInput;
