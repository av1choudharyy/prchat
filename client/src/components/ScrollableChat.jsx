// client/src/components/ScrollableChat.jsx
import React, { useEffect, useRef } from "react";
import {
  Avatar,
  Tooltip,
  Box,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  HStack,
  Text,
  useColorModeValue,
  IconButton,
} from "@chakra-ui/react";
import Lottie from "lottie-react";

import "../App.css";
import { isLastMessage, isSameSender } from "../config/ChatLogics";
import { ChatState } from "../context/ChatProvider";
import typingAnimation from "../animations/typing.json";
import { FaThumbtack } from "react-icons/fa";
import { MdDone, MdDoneAll } from "react-icons/md";

/**
 * ScrollableChat - full component
 *
 * Props:
 *  - messages (array)
 *  - pinnedMessages (array)
 *  - isTyping (bool)
 *  - selectedMessages (array)
 *  - onToggleSelect(message)
 *  - onUnpin(message)
 */
const ScrollableChat = ({
  messages = [],
  pinnedMessages = [],
  isTyping = false,
  selectedMessages = [],
  onToggleSelect = () => {},
  onUnpin = () => {},
}) => {
  const { user } = ChatState();
  const outerRef = useRef(null);

  // Top-level color tokens (hooks used only here)
  const containerBg = useColorModeValue("#ffffff", "#0f1724");
  const myBubbleBg = useColorModeValue("#dcf8c6", "#22543D");
  const myText = useColorModeValue("black", "white");
  const otherBubbleBg = useColorModeValue("#ffffff", "#1f2937");
  const otherText = useColorModeValue("black", "white");
  const replyBg = useColorModeValue("#f3f4f6", "#111827");
  const replyBorder = useColorModeValue("#e5e7eb", "#374151");
  const pinnedBg = useColorModeValue("#fff9db", "#201a0e");
  const pinnedChipBg = useColorModeValue("#fff1b8", "#3b2f18");
  const pinnedChipHover = useColorModeValue("#fff1b8", "#3b2f18");
  const timeColor = useColorModeValue("gray.600", "gray.300");
  const selectedRowBg = useColorModeValue("#F7FAFC", "#0b1220");
  const deletedTextColor = useColorModeValue("gray.600", "gray.400");

  // Selected-bubble variations
  const myBubbleBgSelected = useColorModeValue("#baf2c2", "#97ac4aff");
  const otherBubbleBgSelected = useColorModeValue("#e6f7ff", "#97ac4aff");
  const selectedTextColor = useColorModeValue("black", "white");

  useEffect(() => {
    // Smooth scroll to bottom when messages or typing/pinned change
    const el = outerRef.current;
    if (!el) return;
    // small delay to let DOM render
    const t = setTimeout(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, 40);
    return () => clearTimeout(t);
  }, [messages, pinnedMessages, isTyping]);

  const formatTime = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const messageStatusIcon = (message) => {
    if (!message || !message.sender || !user) return null;
    if (message.sender._id !== user._id) return null; // only show status for own messages

    // seen => blue double check
    if (Array.isArray(message.seenBy) && message.seenBy.length > 0) {
      return <MdDoneAll style={{ color: "#2D9CDB", marginLeft: 6 }} />;
    }
    // delivered => gray double check
    if (message.delivered) {
      return <MdDoneAll style={{ color: "#4A5568", marginLeft: 6 }} />;
    }
    // sent => gray single check
    return <MdDone style={{ color: "#4A5568", marginLeft: 6 }} />;
  };

  const renderMessage = (message, index) => {
    const isMine = message.sender && message.sender._id === user._id;
    const isSelected = selectedMessages.some((m) => m._id === message._id);

    // bubble background chosen from selection + ownership
    const bubbleBg = isMine
      ? isSelected
        ? myBubbleBgSelected
        : myBubbleBg
      : isSelected
      ? otherBubbleBgSelected
      : otherBubbleBg;

    const bubbleText = isSelected ? selectedTextColor : isMine ? myText : otherText;

    // wrapper row background for additional contrast
    const rowBg = isSelected ? selectedRowBg : "transparent";

    return (
      <div
        key={message._id}
        onClick={() => onToggleSelect(message)}
        style={{
          display: "flex",
          justifyContent: isMine ? "flex-end" : "flex-start",
          padding: "6px 8px",
          cursor: "pointer",
          backgroundColor: rowBg,
          borderRadius: 8,
        }}
      >
        {/* Avatar for other user (only when appropriate) */}
        {!isMine &&
          (isSameSender(messages, message, index, user._id) ||
            isLastMessage(messages, index, user._id)) && (
            <Tooltip
              label={message.sender?.name || "Unknown"}
              placement="bottom-start"
              hasArrow
            >
              <Avatar
                mt="7px"
                mr="8px"
                size="sm"
                cursor="pointer"
                name={message.sender?.name}
                src={message.sender?.pic}
              />
            </Tooltip>
          )}

        <Box maxWidth="75%" position="relative">
          {/* pin icon indicator */}
          {message.pinned && (
            <Box
              position="absolute"
              top="-8px"
              right={isMine ? "-6px" : undefined}
              left={!isMine ? "-6px" : undefined}
              title="Pinned"
            >
              <FaThumbtack style={{ fontSize: 14, color: "#D69E2E" }} />
            </Box>
          )}

          <Box
            backgroundColor={bubbleBg}
            color={bubbleText}
            borderRadius="12px"
            padding="10px 14px"
            lineHeight="1.4"
            boxShadow={isSelected ? "md" : "sm"}
            transition="background-color 160ms ease, box-shadow 160ms ease"
          >
            {/* Reply snippet (compact) */}
            {message.replyTo && (
              <Box
                bg={replyBg}
                borderRadius="6px"
                p={2}
                mb={2}
                fontSize="12px"
                borderLeft="3px solid"
                borderColor={replyBorder}
              >
                <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
                  {message.replyTo.sender?.name || "Unknown"}
                </Text>
                <Text fontSize="xs" noOfLines={1}>
                  {message.replyTo.content}
                </Text>
              </Box>
            )}

            {/* Deleted placeholder */}
            {message.deletedForEveryone ? (
              <Text fontStyle="italic" color={deletedTextColor}>
                This message was deleted
              </Text>
            ) : (
              <Text whiteSpace="pre-wrap">{message.content}</Text>
            )}

            {/* footer: time + status */}
            <HStack justifyContent="flex-end" mt={2} spacing={2}>
              <Text fontSize="10px" color={timeColor}>
                {formatTime(message.createdAt)}
              </Text>
              {messageStatusIcon(message)}
            </HStack>
          </Box>
        </Box>
      </div>
    );
  };

  return (
    <Box
      bg={containerBg}
      p={0}
      height="100%"
      display="flex"
      flexDirection="column"
      minHeight={0} /* allow children to flex */
    >
      {/* compact pinned strip (small chips) */}
      {pinnedMessages && pinnedMessages.length > 0 && (
        <Box
          bg={pinnedBg}
          p={1}
          borderRadius="md"
          mb={1}
          display="flex"
          alignItems="center"
          gap={1}
        >
          <Text fontSize="sm" fontWeight="semibold" flexShrink={0}>
            Pinned
          </Text>

          <HStack spacing={2} wrap="nowrap" overflowX="auto" minW={0}>
            {pinnedMessages.map((msg) => (
              <Menu key={msg._id}>
                <MenuButton
                  as={Box}
                  cursor="pointer"
                  p={1}
                  px={3}
                  borderRadius="200px"
                  bg={pinnedChipBg}
                  _hover={{ bg: pinnedChipHover }}
                  display="inline-flex"
                  alignItems="center"
                  maxW="100px"
                  whiteSpace="nowrap"
                  textOverflow="ellipsis"
                  overflow="hidden"
                >
                  <Text fontSize="sm" noOfLines={1} mr={2} flex="1" overflow="hidden">
                    {msg.content || "—"}
                  </Text>
                  <FaThumbtack style={{ fontSize: 2, color: "#D69E2E", marginLeft: 1 }} />
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => onUnpin(msg)}>Unpin</MenuItem>
                </MenuList>
              </Menu>
            ))}
          </HStack>
        </Box>
      )}

      {/* messages list (scrollable) */}
      <Box
        ref={outerRef}
        style={{ overflowY: "auto" }}
        flex="1"
        px={1}
        className="messages-scroll"
      >
        {messages.map((m, i) => (
          <React.Fragment key={m._id}>{renderMessage(m, i)}</React.Fragment>
        ))}
      </Box>

      {/* typing indicator - sits above input in parent SingleChat */}
      {isTyping && (
        <Box mt={2} mb={2} display="flex" alignItems="center">
          <Box mr={2} style={{ width: 36 }}>
            <Lottie animationData={typingAnimation} loop />
          </Box>
          <Text fontSize="sm" color="gray.500">
            Typing...
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default ScrollableChat;
