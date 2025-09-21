import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Textarea,
  HStack,
  VStack,
  Text,
  IconButton,
  Tooltip,
  Divider,
  useColorModeValue,
  Badge,
} from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  MdFormatBold,
  MdFormatItalic,
  MdCode,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdLink,
  MdTitle,
  MdVisibility,
  MdEdit,
  MdSend,
  MdAttachFile,
} from "react-icons/md";
import MarkdownHelp from "./MarkdownHelp";
import { getFileIcon, generateFileMarkdown } from "../utils/fileUtils";

/**
 * MarkdownInput Component
 * A comprehensive markdown input component with live preview functionality
 * Features: Write/Preview modes, markdown toolbar, keyboard shortcuts, and enhanced UX
 */
const MarkdownInput = ({ 
  value, 
  onChange, 
  onSend, 
  placeholder = "Type your message in Markdown...",
  isDisabled = false,
  maxHeight = "300px",
  file = null,
  onFileChange = null
}) => {
  const [mode, setMode] = useState("write"); // "write" or "preview"
  const [isTyping, setIsTyping] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const textareaRef = useRef(null);
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);


  // Color mode values for dark/light theme support
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.300", "gray.600");
  const previewBg = useColorModeValue("gray.50", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current && mode === "write") {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeightPx = parseInt(maxHeight);
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeightPx)}px`;
    }
  }, [value, mode, maxHeight]);

  // Handle typing indicator
  useEffect(() => {
    if (value.trim()) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [value]);

  // Handle file changes and image preview
  useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  }, [file]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (value.trim() && !isDisabled) {
        onSend();
      }
    }
    // Escape to switch modes
    if (e.key === "Escape") {
      setMode(mode === "write" ? "preview" : "write");
    }
  };

  // Markdown formatting functions
  const insertMarkdown = (before, after = "", placeholder = "text") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const replacement = selectedText || placeholder;
    const newText = value.substring(0, start) + before + replacement + after + value.substring(end);
    
    onChange(newText);
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      const newCursorPos = start + before.length + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  // Handle file selection and markdown insertion
  const handleFileChange = (selectedFile) => {
    if (selectedFile) {
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const fileMarkdown = generateFileMarkdown(selectedFile);
        
        const newText = value.substring(0, start) + fileMarkdown + value.substring(end);
        onChange(newText);
        
        // Set cursor position after the inserted file
        setTimeout(() => {
          const newCursorPos = start + fileMarkdown.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.focus();
        }, 0);
      }
      // Call the parent's file change handler
      if (onFileChange) {
        onFileChange(selectedFile);
      }
    } else {
      if (onFileChange) {
        onFileChange(null);
      }
    }
  };

  const formatButtons = [
    {
      icon: <MdFormatBold />,
      label: "Bold",
      action: () => insertMarkdown("**", "**", "bold text"),
    },
    {
      icon: <MdFormatItalic />,
      label: "Italic",
      action: () => insertMarkdown("*", "*", "italic text"),
    },
    {
      icon: <MdCode />,
      label: "Code",
      action: () => insertMarkdown("`", "`", "code"),
    },
    {
      icon: <MdTitle />,
      label: "Heading",
      action: () => insertMarkdown("## ", "", "Heading"),
    },
    {
      icon: <MdLink />,
      label: "Link",
      action: () => insertMarkdown("[", "](url)", "link text"),
    },
    {
      icon: <MdFormatListBulleted />,
      label: "Bullet List",
      action: () => insertMarkdown("- ", "", "list item"),
    },
    {
      icon: <MdFormatListNumbered />,
      label: "Numbered List",
      action: () => insertMarkdown("1. ", "", "list item"),
    },
    {
      icon: <MdAttachFile />,
      label: "Attach File",
      action: () => fileInputRef.current?.click(),
    },
  ];

  return (
    <VStack spacing={2} align="stretch" w="100%">
      {/* Toolbar */}
      <HStack spacing={1} wrap="wrap" p={2} bg={bgColor} borderRadius="md" border="1px" borderColor={borderColor}>
        {/* Mode Toggle */}
        <Button
          size="sm"
          variant={mode === "write" ? "solid" : "outline"}
          colorScheme="blue"
          leftIcon={mode === "write" ? <MdEdit /> : <MdVisibility />}
          onClick={() => setMode(mode === "write" ? "preview" : "write")}
        >
          {mode === "write" ? "Write" : "Preview"}
        </Button>

        <Divider orientation="vertical" height="20px" />

        {/* Formatting Buttons - Only show in write mode */}
        {mode === "write" && formatButtons.map((button, index) => (
          <Tooltip key={index} label={button.label} placement="top">
            <IconButton
              size="sm"
              icon={button.icon}
              onClick={button.action}
              variant="ghost"
              aria-label={button.label}
            />
          </Tooltip>
        ))}

        <Box flex="1" />

        {/* Help Button */}
        <MarkdownHelp />

        {/* Send Button */}
        <Button
          size="sm"
          colorScheme="blue"
          leftIcon={<MdSend />}
          onClick={onSend}
          isDisabled={(!value.trim() && !file) || isDisabled}
          minW="80px"
        >
          Send
        </Button>
      </HStack>

      {/* Input Area */}
      <Box position="relative">
        {mode === "write" ? (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            isDisabled={isDisabled}
            resize="none"
            minH="60px"
            maxH={maxHeight}
            overflowY="auto"
            fontFamily="mono"
            fontSize="sm"
            border="1px"
            borderColor={borderColor}
            _focus={{
              borderColor: "blue.500",
              boxShadow: "0 0 0 1px #3182ce",
            }}
          />
        ) : (
          <Box
            ref={previewRef}
            minH="60px"
            maxH={maxHeight}
            overflowY="auto"
            p={3}
            bg={previewBg}
            border="1px"
            borderColor={borderColor}
            borderRadius="md"
            color={textColor}
            fontSize="sm"
            lineHeight="1.6"
          >
            {value.trim() ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom styling for markdown elements
                  h1: ({ children }) => <Text fontSize="xl" fontWeight="bold" mb={2}>{children}</Text>,
                  h2: ({ children }) => <Text fontSize="lg" fontWeight="bold" mb={2}>{children}</Text>,
                  h3: ({ children }) => <Text fontSize="md" fontWeight="bold" mb={1}>{children}</Text>,
                  p: ({ children }) => <Text mb={2}>{children}</Text>,
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <Text as="code" bg="gray.200" px={1} py={0.5} borderRadius="sm" fontSize="xs">
                        {children}
                      </Text>
                    ) : (
                      <Box as="pre" bg="gray.100" p={2} borderRadius="md" overflowX="auto" my={2}>
                        <Text as="code" fontSize="xs">{children}</Text>
                      </Box>
                    );
                  },
                  ul: ({ children }) => <Box as="ul" pl={4} mb={2}>{children}</Box>,
                  ol: ({ children }) => <Box as="ol" pl={4} mb={2}>{children}</Box>,
                  li: ({ children }) => <Text as="li" mb={1}>{children}</Text>,
                  a: ({ children, href }) => (
                    <Text as="a" href={href} color="blue.500" textDecoration="underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </Text>
                  ),
                  blockquote: ({ children }) => (
                    <Box as="blockquote" borderLeft="4px" borderColor="gray.300" pl={4} my={2} fontStyle="italic">
                      {children}
                    </Box>
                  ),
                }}
              >
                {value}
              </ReactMarkdown>
            ) : (
              <Text color="gray.500" fontStyle="italic">
                Nothing to preview. Start typing to see your markdown rendered here.
              </Text>
            )}
          </Box>
        )}

        {/* File Input (Hidden) - Images only */}
        {onFileChange && (
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*,.png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.doc,.docx"
            onChange={(e) => handleFileChange(e.target.files[0])}
          />
        )}

        {/* File Display with Image Preview */}
        {file && (
          <Box mt={2} p={2} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200">
            <VStack spacing={2} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="sm" color="blue.700">
                  {getFileIcon(file.type)} {file.name}
                </Text>
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => onFileChange && onFileChange(null)}
                >
                  Remove
                </Button>
              </HStack>
              
              {/* Image Preview */}
              {imagePreview && (
                <Box>
                  <Text fontSize="xs" color="gray.600" mb={1}>
                    Preview:
                  </Text>
                  <Box
                    maxW="200px"
                    maxH="150px"
                    borderRadius="md"
                    overflow="hidden"
                    border="1px"
                    borderColor="gray.300"
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </Box>
                </Box>
              )}
            </VStack>
          </Box>
        )}

        {/* Typing Indicator */}
        {isTyping && mode === "write" && (
          <Box position="absolute" bottom={2} right={2}>
            <Badge colorScheme="blue" variant="subtle" fontSize="xs">
              Typing...
            </Badge>
          </Box>
        )}
      </Box>

      {/* Keyboard Shortcuts Help */}
      <HStack spacing={4} fontSize="xs" color="gray.500" justify="center">
        <Text>Ctrl/Cmd + Enter to send</Text>
        <Text>Esc to toggle mode</Text>
      </HStack>
    </VStack>
  );
};

export default MarkdownInput;
