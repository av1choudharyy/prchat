import { HStack, Icon, Text } from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';

const MessageStatus = ({ message, darkMode }) => {
  const getStatusIcon = () => {
    if (message.status === 'read') {
      return <HStack spacing={0}><CheckIcon w={3} h={3} color="blue.500" /><CheckIcon w={3} h={3} color="blue.500" ml={-1} /></HStack>;
    }
    if (message.status === 'delivered') {
      return <HStack spacing={0}><CheckIcon w={3} h={3} /><CheckIcon w={3} h={3} ml={-1} /></HStack>;
    }
    if (message.status === 'sent') {
      return <CheckIcon w={3} h={3} />;
    }
    return <Text fontSize="xs">⏳</Text>;
  };

  return (
    <HStack spacing={1} justify="flex-end" mt={1}>
      <Text fontSize="9px" color={darkMode ? "gray.400" : "gray.500"}>
        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
      {getStatusIcon()}
    </HStack>
  );
};

export default MessageStatus;