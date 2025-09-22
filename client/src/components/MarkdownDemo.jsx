import React, { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Divider,
  useColorModeValue,
  Badge,
} from "@chakra-ui/react";
import MarkdownInput from "./MarkdownInput";

/**
 * MarkdownDemo Component
 * A demo component showcasing markdown features
 * Useful for testing and demonstrating capabilities
 */
const MarkdownDemo = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);

  const bgColor = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const handleSend = () => {
    if (message.trim() || file) {
      const newMessage = {
        id: Date.now(),
        content: message,
        timestamp: new Date().toLocaleTimeString(),
        file: file,
      };
      setMessages([...messages, newMessage]);
      setMessage("");
      setFile(null);
    }
  };

  const sampleMarkdown = `# Welcome to Markdown Chat!

This is a **bold** message with *italic* text and \`inline code\`.

## Features:
- Live preview
- Rich formatting
- File attachments
- Keyboard shortcuts

### Code Example:
\`\`\`javascript
const message = "Hello, World!";
console.log(message);
\`\`\`

> This is a blockquote with some important information.

[Visit our website](https://example.com) for more details.

---

**Try editing this message!**`;

  const loadSample = () => {
    setMessage(sampleMarkdown);
  };

  return (
    <Box maxW="800px" mx="auto" p={4}>
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            Markdown Chat Demo
          </Text>
          <Text color="gray.600" mb={4}>
            Experience the power of markdown in your chat messages
          </Text>
          <Button onClick={loadSample} colorScheme="blue" size="sm">
            Load Sample Markdown
          </Button>
        </Box>

        <Divider />

        {/* Messages Display */}
        <Box
          bg={bgColor}
          borderRadius="lg"
          p={4}
          minH="300px"
          maxH="400px"
          overflowY="auto"
          border="1px"
          borderColor={borderColor}
        >
          <VStack spacing={3} align="stretch">
            {messages.length === 0 ? (
              <Text color="gray.500" textAlign="center" fontStyle="italic">
                No messages yet. Start typing to see your markdown rendered!
              </Text>
            ) : (
              messages.map((msg) => (
                <Box
                  key={msg.id}
                  bg="white"
                  p={3}
                  borderRadius="md"
                  border="1px"
                  borderColor="gray.200"
                  shadow="sm"
                >
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight="bold" color="blue.600">
                      You
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {msg.timestamp}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" whiteSpace="pre-wrap">
                    {msg.content}
                  </Text>
                  {msg.file && (
                    <Box mt={2} p={2} bg="blue.50" borderRadius="md">
                      <Text fontSize="sm" color="blue.700">
                        📎 {msg.file.name}
                      </Text>
                    </Box>
                  )}
                </Box>
              ))
            )}
          </VStack>
        </Box>

        {/* Markdown Input */}
        <MarkdownInput
          value={message}
          onChange={setMessage}
          onSend={handleSend}
          placeholder="Type your markdown message here..."
          file={file}
          onFileChange={setFile}
        />

        {/* Feature List */}
        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={3}>
            Features Included:
          </Text>
          <HStack spacing={2} wrap="wrap">
            <Badge colorScheme="green">Live Preview</Badge>
            <Badge colorScheme="blue">Rich Formatting</Badge>
            <Badge colorScheme="purple">File Attachments</Badge>
            <Badge colorScheme="orange">Keyboard Shortcuts</Badge>
            <Badge colorScheme="teal">Syntax Help</Badge>
            <Badge colorScheme="pink">Auto-expand</Badge>
            <Badge colorScheme="cyan">Theme Support</Badge>
            <Badge colorScheme="red">Responsive Design</Badge>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default MarkdownDemo;

