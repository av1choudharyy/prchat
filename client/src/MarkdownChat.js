// src/MarkdownChat.js
import { useRef, useEffect, useState } from "react";
import { Box, Button, Flex, Textarea, useColorModeValue } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import "./markdown.css";

const MarkdownChat = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef();

  const bg = useColorModeValue("white", "gray.700");
  const previewBg = useColorModeValue("gray.50", "gray.800");

  // Auto-expand textarea
  const handleInput = (e) => {
    const value = e.target.value;
    setMessage(value);

    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto"; // reset
    textareaRef.current.style.height =
      Math.min(textareaRef.current.scrollHeight, 300) + "px"; // expand up to 300px
  };

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // reset
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSend();
    }
  };

  useEffect(() => {
    if (!isPreview && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 300) + "px";
      const el = textareaRef.current;
      el.focus();
      const length = el.value.length;
      el.setSelectionRange(length, length);
    }
  }, [isPreview]);

  return (
    <Box w="100%" mt={2}>
      {/* Toggle Write / Preview */}
      <Flex justify="space-between" mb={2}>
        <Button size="sm" colorScheme={!isPreview ? "blue" : "gray"} onClick={() => setIsPreview(false)}
          // if (textareaRef.current) {
          //   textareaRef.current.style.height = "auto";
          //   textareaRef.current.style.height =
          //     Math.min(textareaRef.current.scrollHeight, 300) + "px";
          // }
        >
          Write
        </Button>
        <Button size="sm" colorScheme={isPreview ? "blue" : "gray"} onClick={() => setIsPreview(true)}>
          Preview
        </Button>
      </Flex>

      {/* ✅ Write Mode */}
      {!isPreview ? (
        <Textarea
          ref={textareaRef}             // keeps ref for auto-resize
          value={message}               // controlled input
          onChange={handleInput}        // updates state
          onKeyDown={handleKeyDown}     // Ctrl/Cmd + Enter
          placeholder="Write a message..."
          resize="none"                 // user can’t resize manually
          width="100%"
          minH="40px"
          maxH="300px"
          overflowY="auto"
          borderRadius="md"
          bg={bg}
          _focus={{
            borderColor: "blue.400",
            boxShadow: "0 0 0 1px #3182CE",
          }}
        />
      ) : (
        // ✅ Preview Mode
        <Box
          p={3}
          minH="40px"
          maxH="300px"
          overflowY="auto"
          border="1px solid"
          borderColor="gray.300"
          borderRadius="md"
          bg={previewBg}
          className="markdown-body"  // styles headings, lists, code
        >
          {message ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {message}
            </ReactMarkdown>
          ) : (
            <Box color="gray.400">Nothing to preview...</Box>
          )}
        </Box>
      )}

      {/* Send button */}
      <Flex justify="flex-end" mt={2}>
        <Button colorScheme="blue" size="sm" onClick={handleSend} isDisabled={!message.trim()}>
          Send
        </Button>
      </Flex>
    </Box>
  );
};

export default MarkdownChat;
