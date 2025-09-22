import { useEffect, useState, useCallback,useRef } from "react";
import { ArrowBackIcon, ArrowForwardIcon } from "@chakra-ui/icons";
import {ButtonGroup, useColorModeValue } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import { BsEmojiSmile } from "react-icons/bs"; // Emoji icon
import { Icon } from "@chakra-ui/react";
import { FiFileText } from "react-icons/fi";
import { exportChatAsMarkdown } from "../exportMarkdown";
import { FaPaperPlane } from "react-icons/fa";

import rehypeRaw from "rehype-raw";
import axios from "axios";
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  SimpleGrid,
  Textarea,
  Code,
  Heading,
  Link
} from "@chakra-ui/react";
import io from "socket.io-client";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";

const ENDPOINT = "http://localhost:5000";
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const quickReplies = [
  { label: "Hi 👋", value: "Hi 👋" },
  { label: "Gm ☀️", value: "Gm ☀️" },
  { label: "Gn 🌙", value: "Gn 🌙" },
  { label: "Okay 👍", value: "Okay 👍" },
  { label: "Thank you 🙏", value: "Thank you 🙏" },
  { label: "Bye 👋", value: "Bye 👋" },
  { label: "😂", value: "😂" },
  { label: "❤️", value: "❤️" },
  { label: "🔥", value: "🔥" },
  { label: "😎", value: "😎" },
  { label: "🤔", value: "🤔" },
];
const markdownSnippets = [
  { label: "Bold", value: "**bold text**" },
  { label: "Italic", value: "*italic text*" },
  { label: "Code", value: "`inline code`" },
  { label: "Code Block", value: "```\ncode block\n```" },
  { label: "H1", value: "# Heading 1" },
  { label: "H2", value: "## Heading 2" },
  { label: "H3", value: "### Heading 3" },
  { label: "List", value: "- List item" },
  { label: "Ordered", value: "1. Ordered item" },
  { label: "Link", value: "[Link text](https://example.com)" },
  { label: "Image", value: "![Alt text](https://example.com/image.jpg)" },
  { label: "Audio", value: "<audio controls><source src='your-audio.mp3' /></audio>" },
  { label: "Video", value: "<video controls><source src='your-video.mp4' /></video>" },
  { label: "File", value: "[File.pdf](https://example.com/file.pdf)" },
  { label: "Emoji", value: ":smile: :tada: :rocket: :heart: :+1: :joy:" },
];

  const [messages, setMessages] = useState([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [fontStyle, setFontStyle] = useState("normal"); // "bold", "italic", "underline"
  const textareaRef = useRef(null);
const [inputHeight, setInputHeight] = useState("40px");

  const bgColor = useColorModeValue("#E0E0E0", "gray.700");
  const focusBg = useColorModeValue("#F5F5F5", "gray.600");

  const timerRef = useRef(null);
  const lastTypingRef = useRef(0);
  const TYPING_TIMER_LENGTH = 3000; // ms

  const emojiOptions = [
  "😀", "😂", "😍", "👍", "🔥",
  "😢", "🎉", "🤔", "🙌", "😎",
  "🥳", "😇", "😡", "😭", "👏",
  "😅", "😴", "😬", "😜", "🤯",
  "🤗", "😱", "😈", "👀", "💯",
  "💔", "❤️", "😋", "😷", "🤒",
  "🤓", "🧐", "😶", "😪", "😤",
  "🤤", "🤝", "🙏", "👋", "🫶",
  "🌟", "🌈", "☀️", "🌙", "⚡",
  "🎶", "🎂", "🎁", "📣", "🧠"
];

  const { user, selectedChat, setSelectedChat, notification, setNotification } =
    ChatState();
  const toast = useToast();

 const stopTyping = useCallback(() => {
  if (typing) {
    if (selectedChat?._id) {
      socket.emit("stop typing", selectedChat._id); // ✅ corrected event
    }
    setTyping(false);
  }
  if (timerRef.current) {
    clearTimeout(timerRef.current);
  }
}, [typing, socket, selectedChat]); // ✅ fixed dependency

  const fetchMessages = useCallback(async () => {
    if (!selectedChat) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/message/${selectedChat._id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await response.json();
      setMessages(data);
      setLoading(false);
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      setLoading(false);
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "solid",
      });
    }
  }, [selectedChat, user.token, toast]);

  useEffect(() => {
  if (!isPreviewMode && textareaRef.current) {
    textareaRef.current.style.height = inputHeight;
  }
}, [isPreviewMode, inputHeight]);

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
  }, [user]);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
  }, [selectedChat, fetchMessages]);

  useEffect(() => {
    const messageListener = (newMessageRecieved) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageRecieved.chat[0]._id
      ) {
        if (!notification.some((n) => n._id === newMessageRecieved._id)) {
          setNotification((prev) => [newMessageRecieved, ...prev]);
          setFetchAgain((prev) => !prev);
        }
      } else {
        setMessages((prev) => [...prev, newMessageRecieved]);
      }
    };

    socket.on("message recieved", messageListener);

    return () => {
      socket.off("message recieved", messageListener);
    };
  }, [notification, fetchAgain, setNotification, setFetchAgain]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    socket.emit("stop typing", selectedChat._id);
    try {
      const response = await fetch("/api/message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage,
          chatId: selectedChat._id,
        }),
      });
      const data = await response.json();
      socket.emit("new message", data);
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }

    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to send the Message",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "solid",
      });
    }
  };

 const sendMessage = (e) => {
  if (e.key === "Enter" && e.ctrlKey) {
    e.preventDefault();
    handleSendMessage();
  }
};
const insertMarkdown = (snippet) => {
  const textarea = textareaRef.current;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = newMessage.slice(0, start);
  const after = newMessage.slice(end);
  const updated = `${before}${snippet}${after}`;

  setNewMessage(updated);

  // Move cursor after inserted snippet
  setTimeout(() => {
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
  }, 0);
};

const onReact = async (messageId, emoji) => {
  try {
    const { data: updatedMessage } = await axios.put(
      `/api/message/${messageId}/react`,
      { emoji },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg._id === updatedMessage._id ? updatedMessage : msg
      )
    );
  } catch (err) {
    console.error("Failed to react:", err);
  }
};


   const typingHandler = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }

    lastTypingRef.current = Date.now();

    // reset any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // schedule stopTyping after inactivity
    timerRef.current = setTimeout(() => {
      if (Date.now() - lastTypingRef.current >= TYPING_TIMER_LENGTH) {
        stopTyping();
      }
    }, TYPING_TIMER_LENGTH);
  };
useEffect(() => {
    if (typing && newMessage.trim() === "") {
      stopTyping();
    }
  }, [newMessage, typing, stopTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;

    const match = messages.find((msg) =>
      msg.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (match) {
      setHighlightedMessageId(match._id);
      setTimeout(() => setHighlightedMessageId(null), 3000);
    } else {
      setHighlightedMessageId(null);
    }
    if (!match) {
  toast({
    title: "No match found",
    status: "info",
    duration: 3000,
    isClosable: true,
    position: "bottom-right",
  });
}

  };

  return (
    <>
      {selectedChat ? (
        <>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            px="2"
            pb="3"
            w="100%"
            gap="12px"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />

            <Box
              display="flex"
              alignItems="center"
              gap="8px"
              flex="1"
              justifyContent="flex-start"
            >
              {!selectedChat.isGroupChat ? (
                <>
                  <ProfileModal user={getSenderFull(user, selectedChat.users)} />
                  <Text fontSize={{ base: "20px", md: "24px" }} fontFamily="Work sans">
                    {getSender(user, selectedChat.users)}
                  </Text>
                </>
              ) : (
                <>
                  <UpdateGroupChatModal
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                    fetchMessages={fetchMessages}
                  />
                  <Text fontSize={{ base: "20px", md: "24px" }} fontFamily="Work sans">
                    {selectedChat.chatName.toUpperCase()}
                  </Text>
                </>
              )}
            </Box>
            <Button
  size="sm"
  colorScheme="blue"
  onClick={() => exportChatAsMarkdown(messages)}
>
  Export Chat
</Button>
<Box display="flex" alignItems="center" justifyContent="flex-end" mb={2} gap={2}>
  <Text fontWeight="semibold">Font Style:</Text>
  <select
    value={fontStyle}
    onChange={(e) => setFontStyle(e.target.value)}
    style={{
      padding: "6px",
      borderRadius: "6px",
      fontWeight: fontStyle === "bold" ? "bold" : "normal",
      fontStyle: fontStyle === "italic" ? "italic" : "normal",
      textDecoration: fontStyle === "underline" ? "underline" : "none",
    }}
  >
    <option value="normal">Normal</option>
    <option value="bold">Bold</option>
    <option value="italic">Italic</option>
    <option value="underline">Underline</option>
  </select>
</Box>
<FormControl maxW="300px" display="flex" gap="6px">
  {/* Emoji Picker */}
                <Popover placement="top-start">
                  <PopoverTrigger>
                    <IconButton
                      icon={<BsEmojiSmile />}
                      variant="ghost"
                      aria-label="Choose emoji"
                      fontSize="xl"
                    />
                  </PopoverTrigger>
                  <PopoverContent width="220px">
                    <PopoverBody>
                      <SimpleGrid columns={5} spacing={2}>
                        {emojiOptions.map((emoji) => (
                          <Text
                            key={emoji}
                            fontSize="xl"
                            cursor="pointer"
                            onClick={() => setSearchTerm((prev) => prev + emoji)}
                            _hover={{ transform: "scale(1.2)" }}
                            transition="transform 0.2s"
                          >
                            {emoji}
                          </Text>
                        ))}
                      </SimpleGrid>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
  <Input
    placeholder="Search message..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") handleSearch();
    }}
    bg="#E0E0E0"
    variant="filled"
    size="sm"
  />
  <IconButton
    icon={<ArrowForwardIcon />}
    colorScheme="teal"
    size="sm"
    onClick={handleSearch}
    aria-label="Search message"
  />
</FormControl>

          </Box>

          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w="20"
                h="20"
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  overflowY: "scroll",
                  scrollbarWidth: "none",
                }}
              >
                <ScrollableChat
                  messages={messages}
                  typing={typing}
                  isPreviewMode={isPreviewMode}
                  highlightedMessageId={highlightedMessageId}
                  onReact={onReact}
                  fontStyle={fontStyle}

                />
              </div>
            )}
            <Box display="flex" gap="8px" mb="2" flexWrap="wrap">
  {quickReplies.map((reply) => (
    <Button
  key={reply.value}
  size="sm"
  colorScheme="blue"
  variant="solid"
  bg="blue.200"
  color="black"
  _hover={{ bg: "blue.300" }}
  onClick={() =>
    setNewMessage((prev) => prev + (prev ? " " : "") + reply.value)
  }
>
  {reply.label}
</Button>

  ))}
</Box>
  
    <Box display="flex" gap="8px" mb="2" flexWrap="wrap">
  {markdownSnippets.map((snippet) => (
    <Button
      key={snippet.label}
      size="sm"
      colorScheme="blue"
      variant="solid"
      bg="blue.200"
      color="black"
      _hover={{ bg: "blue.300" }}
      onClick={() => insertMarkdown(snippet.value)}
    >
      {snippet.label}
    </Button>
  ))}
</Box>

            <FormControl mt="3" isRequired>
              <Box display="flex" gap="8px" alignItems="center">
                
                {/* Emoji Picker */}
                <Popover placement="top-start">
                  <PopoverTrigger>
                    <IconButton
                      icon={<BsEmojiSmile />}
                      variant="ghost"
                      aria-label="Choose emoji"
                      fontSize="xl"
                    />
                  </PopoverTrigger>
                  <PopoverContent width="220px">
                    <PopoverBody>
                      <SimpleGrid columns={5} spacing={2}>
                        {emojiOptions.map((emoji) => (
                          <Text
                            key={emoji}
                            fontSize="xl"
                            cursor="pointer"
                            onClick={() => setNewMessage((prev) => prev + emoji)}
                            _hover={{ transform: "scale(1.2)" }}
                            transition="transform 0.2s"
                          >
                            {emoji}
                          </Text>
                        ))}
                      </SimpleGrid>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
                {/* Message Input */}
                {/*<Input
                  variant="filled"
                  bg="#E0E0E0"
                  placeholder="Enter a message..."
                  value={newMessage}
                  onChange={typingHandler}
                  onKeyDown={sendMessage}
                />*/}
                <ButtonGroup size="sm" mb={2}>
  <Button
    onClick={() => setIsPreviewMode(false)}
    variant={isPreviewMode ? "outline" : "solid"}
  >
    Write
  </Button>
  <Button
    onClick={() => setIsPreviewMode(true)}
    variant={isPreviewMode ? "solid" : "outline"}
  >
    Preview
  </Button>
</ButtonGroup>
              {isPreviewMode ? (
  <Box
  p={3}
  bg="#F5F5F5"
  borderRadius="md"
  maxHeight="300px"
  overflowY="auto"
  width={textareaRef.current?.offsetWidth || "100%"}
  whiteSpace="normal" // ✅ Required for block elements like <img>
>
  <ReactMarkdown
  remarkPlugins={[remarkGfm, remarkEmoji]}
  rehypePlugins={[rehypeRaw]} 
  components={{
    ul: ({ children }) => <Box as="ul" pl={4} mb={2}>{children}</Box>,
    ol: ({ children }) => <Box as="ol" pl={4} mb={2}>{children}</Box>,
    li: ({ children }) => <Box as="li" mb={1}>{children}</Box>,

    // ✅ File link detection
    a: ({ href, children }) => {
  const fileMatch = href.match(/\/([^\/?#]+)$/); // Extract filename from URL
  const filename = fileMatch ? fileMatch[1] : children;
  const isFile = /\.(pdf|docx?|xlsx?|zip|rar|pptx?)$/i.test(filename);

  if (!isFile) {
    return (
      <Link href={href} color="blue.500" isExternal>
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
      bg="gray.50"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      p={3}
      mt={2}
      _hover={{ bg: "gray.100" }}
    >
      <Box boxSize="6">
        <Icon as={FiFileText} color="purple.500" boxSize="6" />
      </Box>
      <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
        {filename}
      </Text>
    </Box>
  );
},

    strong: ({ children }) => <Text as="strong">{children}</Text>,
    em: ({ children }) => <Text as="em">{children}</Text>,

    code: ({ inline, children }) =>
      inline ? (
        <Code fontSize="sm" colorScheme="gray">
          {children}
        </Code>
      ) : (
        <Box as="pre" bg="gray.100" p={3} borderRadius="md" overflowX="auto">
          <Code whiteSpace="pre">{children}</Code>
        </Box>
      ),

    h1: ({ children }) => <Heading as="h1" size="lg" mb={2}>{children}</Heading>,
    h2: ({ children }) => <Heading as="h2" size="md" mb={2}>{children}</Heading>,
    h3: ({ children }) => <Heading as="h3" size="sm" mb={2}>{children}</Heading>,

    // ✅ Image renderer
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

    // ✅ Video renderer
    video: ({ src }) => (
      <Box as="video" controls width="100%" maxHeight="300px" borderRadius="md" mt={2}>
        <source src={src} />
        Your browser does not support the video tag.
      </Box>
    ),

    // ✅ Audio renderer
    audio: ({ src }) => (
  <Box width="100%" mt={2}>
    <audio
      controls
      style={{
        width: "100%",
        display: "block", // ensures it respects container width
      }}
    >
      <source src={src} />
      Your browser does not support the audio tag.
    </audio>
  </Box>
)
,
  }}
>
  {newMessage || "*Nothing to preview...*"}
</ReactMarkdown>
</Box>
) : (
  <Textarea
    ref={textareaRef}
    value={newMessage}
    onChange={typingHandler}
    onKeyDown={sendMessage}
    placeholder="Enter a message..."
    variant="filled"
    bg="#E0E0E0"
    resize="none"
    overflow="auto"
    minHeight="40px"
    maxHeight="300px"
    onInput={(e) => {
     e.target.style.height = "auto";
  const newHeight = `${Math.min(e.target.scrollHeight, 300)}px`;
  e.target.style.height = newHeight;
  setInputHeight(newHeight);

    }}
    _focus={{
      borderColor: "blue.500",
      boxShadow: "0 0 0 2px rgba(66, 153, 225, 0.6)",
      bg: "#F5F5F5",
    }}
  />
)}

                
                {/* Send Button */}
                <IconButton
                  colorScheme="blue"
                  icon={<FaPaperPlane />}
                  onClick={handleSendMessage}
                  isDisabled={!newMessage.trim()}
                />
              </Box>
            </FormControl>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="3xl" pb="3" fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;