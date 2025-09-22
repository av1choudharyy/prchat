import { HStack, IconButton, Text, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import {
  FiCornerUpLeft,
  FiCopy,
  FiRepeat,
  FiBookmark,
  FiTrash2,
  FiX,
} from "react-icons/fi";

/**
 * WhatsApp-style top action bar for selected messages
 */
const ChatActionBar = ({
  selectedMessages,
  onClearSelection,
  onReply,
  onCopy,
  onForward,
  onPinToggle,
  onDeleteForMe,
  onDeleteForEveryone,
}) => {
  return (
    <HStack
      w="100%"
      p={2}
      bg="blue.600"
      color="white"
      justify="space-between"
      align="center"
    >
      <HStack>
        <IconButton
          size="sm"
          variant="ghost"
          icon={<FiX />}
          onClick={onClearSelection}
          aria-label="Cancel selection"
        />
        <Text>{selectedMessages.length} selected</Text>
      </HStack>

      <HStack>
        {selectedMessages.length === 1 && (
          <IconButton
            size="sm"
            variant="ghost"
            icon={<FiCornerUpLeft />}
            onClick={() => onReply(selectedMessages[0])}
            aria-label="Reply"
          />
        )}

        <IconButton
          size="sm"
          variant="ghost"
          icon={<FiCopy />}
          onClick={() => onCopy(selectedMessages)}
          aria-label="Copy"
        />

        <IconButton
          size="sm"
          variant="ghost"
          icon={<FiRepeat />}
          onClick={() => onForward(selectedMessages)}
          aria-label="Forward"
        />

        <IconButton
          size="sm"
          variant="ghost"
          icon={<FiBookmark />}
          onClick={() => onPinToggle(selectedMessages)}
          aria-label="Pin"
        />

        {/* Delete menu */}
        <Menu>
          <MenuButton
            as={IconButton}
            size="sm"
            variant="ghost"
            icon={<FiTrash2 />}
            aria-label="Delete"
          />
          <MenuList color="black">
            <MenuItem onClick={() => onDeleteForMe(selectedMessages)}>
              Delete for me
            </MenuItem>
            <MenuItem onClick={() => onDeleteForEveryone(selectedMessages)}>
              Delete for everyone
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </HStack>
  );
};

export default ChatActionBar;
