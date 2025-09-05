import { Box, Text, useToast, Button } from '@chakra-ui/react';

const ChatBubble = ({ message, isSelf, setReplyToMessage }) => {
    const toast = useToast();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            toast({
                title: 'Meassge copied!',
                status: 'success',
                duration: 2000,
                isClosable: true,
            });
        } catch (err) {
            console.error('Failed to copy message: ' , err);
            toast({
                title: 'Failed to copy message.',
                status: 'error',
                duration: 2000,
                isClosable: true,
            });
        }
    };

    const handleReply = () => {
        setReplyToMessage(message);
    }
  return (
    <Box
      style={{
        backgroundColor: isSelf ? "#B9F5D0" : "#fff",
        borderRadius: "20px",
        padding: "5px 15px",
        maxWidth: "75%",
      }}
      position="relative"
    >
      
      {message.repliedToMessage && (
        <Box p={2} mb={2} bg={message.repliedToMessage.sender._id === message.sender._id ? "rgba(185, 245, 208, 0.5)" : "rgba(190, 227, 248, 0.5)"}
         borderRadius="md" borderLeft="4px" borderColor={message.repliedToMessage.sender._id === message.sender._id ? "#38A169" : "#4299E1"}
          cursor="pointer">
          <Text fontSize="xs" fontWeight="bold" color="teal.800">
            Replying to {message.repliedToMessage.sender?.name || 'User'}
          </Text>
          <Text fontSize="sm" fontStyle="italic" noOfLines={1} color="gray.600">
            {message.repliedToMessage.content}
          </Text>
        </Box>
      )}
      
      <Text>{message.content}</Text>
      
     
      <Box 
        position="absolute"
        top="50%"
        transform="translateY(-50%)"
        display="flex"
        flexDirection="column"
        gap={1}
        bg="gray.100"
        borderRadius="md"
        p={1}
        boxShadow="md"
        right={isSelf ? "105%" : "auto"}
        left={isSelf ? "auto" : "105%"}
        opacity={0}
        transition="opacity 0.2s"
        _hover={{ opacity: 1 }}
      >
        <Button onClick={handleCopy} size="xs">Copy</Button>
        <Button onClick={handleReply} size="xs">Reply</Button>
      </Box>
    </Box>
  );
};

export default ChatBubble
