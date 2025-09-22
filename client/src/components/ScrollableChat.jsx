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
} from "@chakra-ui/react";
import Lottie from "lottie-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import py from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import { atomOneLight, atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

import "../App.css";
import { isLastMessage, isSameSender } from "../config/ChatLogics";
import { ChatState } from "../context/ChatProvider";
import typingAnimation from "../animations/typing.json";
import { FaThumbtack } from "react-icons/fa";
import { MdDone, MdDoneAll } from "react-icons/md";
import { useColorMode } from "@chakra-ui/react";

// register languages you'd like to support
SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("python", py);

/**
 * ScrollableChat component
 *
 * Props:
 *  - messages (array)
 *  - pinnedMessages (array)
 *  - isTyping (bool)
 *  - selectedMessages (array)
 *  - onToggleSelect(message)
 *  - onUnpin(message)
 *  - previewMode (optional) -> render simplified UI for preview
 */
const ScrollableChat = ({
  messages = [],
  pinnedMessages = [],
  isTyping = false,
  selectedMessages = [],
  onToggleSelect = () => {},
  onUnpin = () => {},
  previewMode = false,
}) => {
  const { user } = ChatState();
  const outerRef = useRef();
  const { colorMode } = useColorMode();

  // color tokens (top-level hooks only)
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
  const selectedBg = useColorModeValue("#F7FAFC", "#0b1220");
  const deletedTextColor = useColorModeValue("gray.600", "gray.400");

  useEffect(() => {
    // scroll to bottom when messages or pinned change
    if (outerRef.current && !previewMode) {
      outerRef.current.scrollTo({ top: outerRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, pinnedMessages, isTyping, previewMode]);

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
    return <MdDone style={{ color: "#111215ff", marginLeft: 6 }} />;
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const lang = match ? match[1] : "";
            return !inline ? (
              <SyntaxHighlighter
                style={colorMode === "light" ? atomOneLight : atomOneDark}
                language={lang}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code style={{ background: colorMode === "light" ? "#f3f4f6" : "#111827", padding: "0.2em 0.4em", borderRadius: 4 }} {...props}>
                {children}
              </code>
            );
          },
          a({ href, children, ...props }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  const renderMessage = (message, index) => {
    const isMine = message.sender && user && message.sender._id === user._id;
    const isSelected = selectedMessages.some((m) => m._id === message._id);

    return (
      <div
        key={message._id}
        onClick={() => onToggleSelect(message)}
        style={{
          display: "flex",
          justifyContent: isMine ? "flex-end" : "flex-start",
          padding: "6px 8px",
          cursor: "pointer",
          backgroundColor: isSelected ? selectedBg : "transparent",
          borderRadius: 8,
        }}
      >
        {/* Avatar for other user (only when appropriate) */}
        {!isMine &&
          (isSameSender(messages, message, index, user?._id) ||
            isLastMessage(messages, index, user?._id)) && (
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
            >
              <FaThumbtack style={{ fontSize: 12, color: "#D69E2E" }} />
            </Box>
          )}

          <Box
            backgroundColor={isMine ? myBubbleBg : otherBubbleBg}
            color={isMine ? myText : otherText}
            borderRadius="12px"
            padding="8px 12px"
            lineHeight="1.3"
            boxShadow="sm"
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
              <Box whiteSpace="pre-wrap">
                {renderMarkdown(message.content)}
              </Box>
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

  // compact pinned strip used only to display preview or pinned chips
  const renderPinnedStrip = () => {
    if (!pinnedMessages || pinnedMessages.length === 0) return null;
    return (
      <Box bg={pinnedBg} p={1} borderRadius="md" mb={2}>
        <HStack spacing={2} wrap="nowrap" overflowX="auto" px={1}>
          {pinnedMessages.map((msg) => (
            <Menu key={msg._id}>
              <MenuButton
                as={Box}
                cursor="pointer"
                p={1}
                px={3}
                borderRadius="full"
                bg={pinnedChipBg}
                _hover={{ bg: pinnedChipHover }}
                display="flex"
                alignItems="center"
                minW="64px"
                maxW="220px"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                overflow="hidden"
              >
                <Text fontSize="sm" noOfLines={1} maxW="150px" mr={2}>
                  {msg.content || "—"}
                </Text>
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => onUnpin(msg)}>Unpin</MenuItem>
              </MenuList>
            </Menu>
          ))}
        </HStack>
      </Box>
    );
  };

  // If called in previewMode we only render the messages area, smaller whitespace
  if (previewMode) {
    return (
      <Box bg={containerBg} p={0} display="flex" flexDirection="column">
        <Box ref={outerRef} style={{ overflowY: "auto" }} px={1}>
          {messages.map((m, i) => (
            <React.Fragment key={m._id}>{renderMessage(m, i)}</React.Fragment>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box bg={containerBg} p={0} height="100%" display="flex" flexDirection="column">
      {/* pinned messages area */}
      {renderPinnedStrip()}

      {/* messages list (scrollable) */}
      <Box ref={outerRef} style={{ overflowY: "auto", paddingBottom: 8 }} flex="1" px={1} className="messages-scroll">
        {messages.map((m, i) => (
          <React.Fragment key={m._id}>{renderMessage(m, i)}</React.Fragment>
        ))}
      </Box>

      {/* typing indicator */}
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
