import  { useRef, useState, Fragment } from "react";
import Lottie from "lottie-react";
import {
  Avatar,
  Tooltip,
  Box,
  Text,
  Spinner,
  Code,
  Link,
  Heading,
  Icon,
  IconButton,
} from "@chakra-ui/react";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";
import { FiFileText } from "react-icons/fi";
import { format, isToday, isYesterday } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import rehypeRaw from "rehype-raw";
import { isLastMessage, isSameSender } from "../config/ChatLogics";
import { ChatState } from "../context/ChatProvider";
import typingAnimation from "../animations/typing.json";
import "../App.css";

const getFontStyle = (style) => {
  switch (style) {
    case "bold":
      return { fontWeight: "bold" };
    case "italic":
      return { fontStyle: "italic" };
    case "underline":
      return { textDecoration: "underline" };
    default:
      return {};
  }
};

const ScrollableChat = ({
  messages,
  highlightedMessageId,
  onReact,
  fontStyle,
  isPreviewMode,
  typing,
}) => {
  const { user } = ChatState();
  const highlightRef = useRef();
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  let lastMessageDate = null;

  // Local “chat-only” theme
  const [localTheme, setLocalTheme] = useState("light");
  const isDark = localTheme === "dark";
  const toggleLocalTheme = () =>
    setLocalTheme((prev) => (prev === "light" ? "dark" : "light"));

  // Theme tokens
  const wrapperBg       = isDark ? "gray.900" : "gray.50";
  const textColor       = isDark ? "white"    : "black";
  const dateColor       = isDark ? "gray.300" : "gray.600";
  const codeBg          = isDark ? "gray.700" : "gray.100";
  const fileBg          = isDark ? "gray.700" : "gray.50";
  const fileHoverBg     = isDark ? "gray.600" : "gray.100";
  const fileBorder      = isDark ? "gray.500" : "gray.200";
  const highlightBg     = isDark ? "yellow.500" : "yellow.300";
  const emojiOptions = ["❤️", "😂", "👍", "🔥", "😢"];
  const highlightShadow = isDark
    ? "0 0 0 2px #D69E2E"
    : "0 0 0 2px #ECC94B";
  const emojiBarBg      = isDark ? "gray.800" : "white";
  const reactionBg      = isDark ? "gray.600" : "gray.200";

  return (
    <Box height="100vh" display="flex" flexDirection="column">

    <Box
      bg={wrapperBg}
      color={textColor}
      position="relative"
      width="100%"
      height="100%"
    >
      {/* ─── Theme Toggle (Top-Center) ──────────────────────── */}
      <Box
        position="fixed"
        top="85px"
        left="56%"
        transform="translateX(-50%)"
        zIndex="10"
      >
        <Tooltip
          label={`Switch to ${isDark ? "light" : "dark"} mode`}
          hasArrow
        >
          <IconButton
            aria-label="Toggle chat theme"
            icon={isDark ? <SunIcon /> : <MoonIcon />}
            onClick={toggleLocalTheme}
            size="sm"
            borderRadius="full"
            bg={emojiBarBg}
            color={textColor}
            boxShadow="md"
            _hover={{
              transform: "scale(1.1)",
              bg: isDark ? "gray.700" : "gray.100",
            }}
          />
        </Tooltip>
      </Box>

      {/* ─── Scrollable Message List ───────────────────────── */}
      <Box
        className="hide-scrollbar"
        overflowX="hidden"
        overflowY="auto"
        pt="48px"  /* space for toggle */
        pb="80px"  /* space for typing indicator */
        h="100%"
      >
        {messages?.map((message, index) => {
          const isHighlighted = message._id === highlightedMessageId;
          const senderId =
            typeof message.sender === "string"
              ? message.sender
              : message.sender._id;
          const isOwnMessage = senderId === user._id;

          const messageDate = format(
            new Date(message.createdAt),
            "yyyy-MM-dd"
          );
          const displayDate = isToday(new Date(message.createdAt))
            ? "Today"
            : isYesterday(new Date(message.createdAt))
            ? "Yesterday"
            : format(new Date(message.createdAt), "MMM d, yyyy");

          const showDateSeparator = messageDate !== lastMessageDate;
          lastMessageDate = messageDate;

          return (
            <Fragment key={message._id}>
              {showDateSeparator && (
                <Box textAlign="center" my={4}>
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color={dateColor}
                    bg={codeBg}
                    px={3}
                    py={1}
                    borderRadius="md"
                    display="inline-block"
                  >
                    {displayDate}
                  </Text>
                </Box>
              )}

              <Box
                display="flex"
                flexDirection={isOwnMessage ? "row-reverse" : "row"}
                alignItems="flex-start"
                p="4px 8px"
                ref={isHighlighted ? highlightRef : null}
                onMouseEnter={() => setHoveredMessageId(message._id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                {(isSameSender(messages, message, index, user._id) ||
                  isLastMessage(messages, index, user._id)) && (
                  <Tooltip
                    label={message.sender.name}
                    placement="bottom-start"
                    hasArrow
                  >
                    <Avatar
                      mt="7px"
                      mr={isOwnMessage ? "0" : "1"}
                      ml={isOwnMessage ? "1" : "0"}
                      size="sm"
                      cursor="pointer"
                      name={message.sender.name}
                      src={message.sender.pic}
                    />
                  </Tooltip>
                )}

                <Box
                  bg={
                    isHighlighted
                      ? highlightBg
                      : isOwnMessage
                      ? "blue.100"
                      : "green.100"
                  }
                  borderRadius="20px"
                  p="5px 15px"
                  maxW="75%"
                  boxShadow={isHighlighted ? highlightShadow : "none"}
                  transition="background-color 0.3s ease"
                  position="relative"
                >
                  <Box display="flex" flexDir="column">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkEmoji]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        p: ({ children }) => (
                          <Text
                            as="p"
                            {...getFontStyle(fontStyle)}
                            color={textColor}
                            mb={2}
                          >
                            {children}
                          </Text>
                        ),
                        strong: ({ children }) => (
                          <Text
                            as="strong"
                            {...getFontStyle(fontStyle)}
                            color={textColor}
                          >
                            {children}
                          </Text>
                        ),
                        em: ({ children }) => (
                          <Text
                            as="em"
                            {...getFontStyle(fontStyle)}
                            color={textColor}
                          >
                            {children}
                          </Text>
                        ),
                        code: ({ inline, children }) =>
                          inline ? (
                            <Code
                              fontSize="sm"
                              colorScheme="gray"
                              {...getFontStyle(fontStyle)}
                            >
                              {children}
                            </Code>
                          ) : (
                            <Box
                              as="pre"
                              bg={codeBg}
                              p={3}
                              borderRadius="md"
                              overflowX="auto"
                            >
                              <Code
                                whiteSpace="pre"
                                {...getFontStyle(fontStyle)}
                              >
                                {children}
                              </Code>
                            </Box>
                          ),
                        a: ({ href, children }) => {
                          const fileMatch = href.match(/\/([^\/?#]+)$/);
                          const filename = fileMatch
                            ? fileMatch[1]
                            : children;
                          const isFile = /\.(pdf|docx?|xlsx?|zip|rar|pptx?)$/i.test(
                            filename
                          );

                          if (!isFile) {
                            return (
                              <Link
                                href={href}
                                color="blue.400"
                                isExternal
                                {...getFontStyle(fontStyle)}
                              >
                                {children}
                              </Link>
                            );
                          }

                          return (
                            <Box
                              as="a"
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              display="flex"
                              alignItems="center"
                              gap={3}
                              bg={fileBg}
                              border="1px solid"
                              borderColor={fileBorder}
                              borderRadius="md"
                              p={3}
                              mt={2}
                              _hover={{ bg: fileHoverBg }}
                            >
                              <Box boxSize="6">
                                <Icon
                                  as={FiFileText}
                                  color="purple.500"
                                  boxSize="6"
                                />
                              </Box>
                              <Text
                                fontWeight="medium"
                                fontSize="sm"
                                noOfLines={1}
                                color={textColor}
                              >
                                {filename}
                              </Text>
                            </Box>
                          );
                        },
                        ul: ({ children }) => (
                          <Box
                            as="ul"
                            pl={4}
                            mb={2}
                            {...getFontStyle(fontStyle)}
                            color={textColor}
                          >
                            {children}
                          </Box>
                        ),
                        ol: ({ children }) => (
                          <Box
                            as="ol"
                            pl={4}
                            mb={2}
                            {...getFontStyle(fontStyle)}
                            color={textColor}
                          >
                            {children}
                          </Box>
                        ),
                        li: ({ children }) => (
                          <Box
                            as="li"
                            mb={1}
                            {...getFontStyle(fontStyle)}
                            color={textColor}
                          >
                            {children}
                          </Box>
                        ),
                        h1: ({ children }) => (
                          <Heading
                            as="h1"
                            size="lg"
                            mb={2}
                            {...getFontStyle(fontStyle)}
                            color={textColor}
                          >
                            {children}
                          </Heading>
                        ),
                        h2: ({ children }) => (
                          <Heading
                            as="h2"
                            size="md"
                            mb={2}
                            {...getFontStyle(fontStyle)}
                            color={textColor}
                          >
                            {children}
                          </Heading>
                        ),
                        h3: ({ children }) => (
                          <Heading
                            as="h3"
                            size="sm"
                            mb={2}
                            {...getFontStyle(fontStyle)}
                            color={textColor}
                          >
                            {children}
                          </Heading>
                        ),
                        img: ({ src, alt }) => (
                          <img
                            src={src}
                            alt={alt}
                            loading="lazy"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "300px",
                              objectFit: "contain",
                              borderRadius: "8px",
                              margin: "8px 0",
                              display: "block",
                            }}
                          />
                        ),
                        video: ({ src }) => (
                          <Box
                            as="video"
                            controls
                            width="100%"
                            maxHeight="300px"
                            borderRadius="md"
                            mt={2}
                          >
                            <source src={src} />
                            Your browser does not support the video tag.
                          </Box>
                        ),
                        audio: ({ src }) => (
                          <Box width="100%" mt={2}>
                            <audio
                              controls
                              style={{
                                width: "100%",
                                display: "block",
                              }}
                            >
                              <source src={src} />
                              Your browser does not support the audio tag.
                            </audio>
                          </Box>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>

                    <Box display="flex" justifyContent="flex-end">
                      <Text fontSize="xs" color={textColor} mt={1}>
                        {format(new Date(message.createdAt), "p")}
                      </Text>
                    </Box>
                  </Box>

                  {/* … Emoji bar & reactions unchanged … */}
                  
                  {/* Emoji hover bar */}
                  {hoveredMessageId === message._id && (
                    <Box
                      position="absolute"
                      top="-35px"
                      left={isOwnMessage ? "auto" : "0"}
                      right={isOwnMessage ? "0" : "auto"}
                      zIndex={10}
                      display="flex"
                      gap="6px"
                      background="white"
                      padding="4px 8px"
                      borderRadius="md"
                      boxShadow="md"
                      maxWidth="100vw"
                      minWidth="fit-content"
                      overflowX="auto"
                    >
                      {emojiOptions.map((emoji) => (
                        <Text
                          key={emoji}
                          fontSize="lg"
                          cursor="pointer"
                          onClick={() => onReact(message._id, emoji)}
                          _hover={{ transform: "scale(1.2)" }}
                        >
                          {emoji}
                        </Text>
                      ))}
                    </Box>
                  )}

                  {/* Reactions */}
                  {message.reactions?.length > 0 && (
                    <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                      {message.reactions.map((r, idx) => (
                        <Text
                          key={idx}
                          fontSize="sm"
                          px={2}
                          py={1}
                          bg="gray.200"
                          borderRadius="md"
                        >
                          {r.emoji}
                        </Text>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            </Fragment>
          );
        })}
      </Box>

      {/* ─── Typing Spinner (Bottom-Left) ───────────────────────── */}
      {isPreviewMode && (
        <Box
          position="fixed"
          top="85px"
        left="47%"
          display="flex"
          alignItems="center"
          bg={wrapperBg}
          p={2}
          borderRadius="md"
          boxShadow="md"
        >
          <Spinner size="sm" mr={2} />
          <Text color={textColor} fontSize="sm">
            Typing...
          </Text>
        </Box>
      )}

      {/* ─── Lottie Animation (Above Spinner) ──────────────────── */}
      {typing && (
        <Box
          position="fixed"
          top="85px"
        left="47%"
          width="48px"
          height="48px"
        >
          <Lottie
            animationData={typingAnimation}
            loop
            style={{ width: "100%", height: "100%" }}
          />
        </Box>
      )}
    </Box>
    </Box>
  );
};

export default ScrollableChat;