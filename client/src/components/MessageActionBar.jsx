// client/src/components/MessageActionBar.jsx
import React from "react";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from "@chakra-ui/react";
import {
  FiCornerUpLeft,
  FiTrash2,
  FiBookmark,
  FiCopy,
  FiRepeat,
  FiShare2,
  FiMoreVertical,
} from "react-icons/fi";

/**
 * Lightweight action menu for message bubbles.
 * All actions call callbacks passed by the parent; no network logic here.
 *
 * Props:
 *  - message
 *  - onReply(message)
 *  - onDelete(message)
 *  - onPinToggle(message)
 *  - onCopy(message)
 *  - onForward(message)
 *  - onShare(message)
 *  - pinned (boolean)
 */
export default function MessageActionBar({
  message,
  onReply,
  onDelete,
  onPinToggle,
  onCopy,
  onForward,
  onShare,
  pinned = false,
}) {
  return (
    <Menu>
      <MenuButton
        as={IconButton}
        aria-label="message actions"
        icon={<FiMoreVertical />}
        size="sm"
        variant="ghost"
      />
      <MenuList>
        <MenuItem icon={<FiCornerUpLeft />} onClick={() => onReply && onReply(message)}>
          Reply
        </MenuItem>
        <MenuItem icon={<FiTrash2 />} onClick={() => onDelete && onDelete(message)}>
          Delete
        </MenuItem>
        <MenuItem icon={<FiBookmark />} onClick={() => onPinToggle && onPinToggle(message)}>
          {pinned ? "Unpin" : "Pin"}
        </MenuItem>
        <MenuItem icon={<FiCopy />} onClick={() => onCopy && onCopy(message)}>
          Copy
        </MenuItem>
        <MenuItem icon={<FiRepeat />} onClick={() => onForward && onForward(message)}>
          Forward
        </MenuItem>
        <MenuItem icon={<FiShare2 />} onClick={() => onShare && onShare(message)}>
          Share
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
