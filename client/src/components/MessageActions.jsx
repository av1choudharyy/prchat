import { useState } from "react";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
  Text,
  VStack,
} from "@chakra-ui/react";
import { 
  CopyIcon, 
  ArrowBackIcon,
  ChevronDownIcon 
} from "@chakra-ui/icons";

const MessageActions = ({ 
  message, 
  user, 
  onReply 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toast = useToast();

  // Copy action
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast({
        title: "Message copied!",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
    }
  };

  // Reply action
  const handleReply = () => {
    onReply(message);
    setIsOpen(false);
  };

  return (
    <Menu isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <MenuButton
        as={IconButton}
        icon={<ChevronDownIcon />}
        size="xs"
        variant="ghost"
        opacity={0.7}
        _hover={{ opacity: 1 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Message actions"
      />
      <MenuList>
        {/* Copy Action */}
        <MenuItem icon={<CopyIcon />} onClick={handleCopy}>
          <VStack align="start" spacing={0}>
            <Text fontSize="sm" fontWeight="medium">Copy</Text>
            <Text fontSize="xs" color="gray.500">Copy message text</Text>
          </VStack>
        </MenuItem>

        {/* Reply Action */}
        <MenuItem icon={<ArrowBackIcon />} onClick={handleReply}>
          <VStack align="start" spacing={0}>
            <Text fontSize="sm" fontWeight="medium">Reply</Text>
            <Text fontSize="xs" color="gray.500">Reply to this message</Text>
          </VStack>
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default MessageActions;
