import React, { useState, useRef } from "react";
import {
  Box,
  Textarea,
  Button,
  ButtonGroup,
  HStack,
  VStack,
  Text,
  useColorModeValue,
  Link,
  useToast
} from "@chakra-ui/react";
import { ViewIcon, EditIcon } from "@chakra-ui/icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow, twilight } from "react-syntax-highlighter/dist/esm/styles/prism";
import MarkdownToolbar from "./MarkdownToolbar";
import { ChatState } from "../context/ChatProvider";

const MarkdownEditor = ({ value, onChange, onSend, placeholder, isLoading }) => {
  // State to track if we're in "Write" mode or "Preview" mode
  const [mode, setMode] = useState("write");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Reference to the textarea element for inserting markdown at cursor position
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get user context for authentication
  const { user } = ChatState();
  const toast = useToast();

  // Color values that adapt to light/dark mode
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const previewBg = useColorModeValue("gray.50", "gray.900");

  // Handle keyboard shortcuts (Ctrl/Cmd + Enter to send)
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && value.trim()) {
      e.preventDefault();
      onSend();
    }
  };

  // Handle image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check file size (10MB limit for images)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum image size is 10MB",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Upload image to server
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || "Upload failed");
      }

      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.fileData.url;

      // Insert markdown image syntax with the uploaded URL
      const imageMarkdown = `![${file.name}](${window.location.origin}${imageUrl})`;

      // Insert at cursor position
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText =
          value.substring(0, start) +
          imageMarkdown +
          value.substring(end);

        onChange({ target: { value: newText } });

        // Set cursor after the inserted markdown
        setTimeout(() => {
          textarea.focus();
          const newPosition = start + imageMarkdown.length;
          textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
      }

      toast({
        title: "Image uploaded",
        description: "Image has been inserted into your message",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Image upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Function to insert markdown syntax at cursor position
  const insertMarkdown = (before, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    // Insert the markdown syntax around selected text
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange({ target: { value: newText } });

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + selectedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Trigger file input when image button is clicked
  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };
   // Use different syntax highlighting themes for light/dark mode
   const syntaxTheme = useColorModeValue(tomorrow, twilight);
   const codeBlockBg = useColorModeValue("gray.100", "gray.900");
   const inlineCodeBg = useColorModeValue("gray.200", "gray.700");
   const inlineCodeColor = useColorModeValue("purple.600", "purple.200");
   const linkColor = useColorModeValue("blue.500", "blue.300");

   // Custom components for rendering different markdown elements
   const markdownComponents = {
     // Render code blocks with syntax highlighting
     code({ node, inline, className, children, ...props }) {
       const match = /language-(\w+)/.exec(className || "");
 
       // Code block (multi-line)
       if (!inline && match) {
         return (
           <Box borderRadius="md" overflow="hidden" my={2}>
             <SyntaxHighlighter
               style={syntaxTheme}
               language={match[1]}
               PreTag="div"
               customStyle={{
                 margin: 0,
                 padding: "12px",
                 fontSize: "14px",
                 backgroundColor: codeBlockBg,
               }}
               {...props}
             >
               {String(children).replace(/\n$/, "")}
             </SyntaxHighlighter>
           </Box>
         );
       }
 
       // Inline code
       return (
         <Box
           as="code"
           px={1}
           py={0.5}
           borderRadius="md"
           bg={inlineCodeBg}
           color={inlineCodeColor}
           fontSize="0.9em"
           fontFamily="monospace"
           {...props}
         >
           {children}
         </Box>
       );
     },
 
     // Custom link rendering
     a({ href, children }) {
       return (
         <Link
           href={href}
           isExternal
           color={linkColor}
           textDecoration="underline"
           _hover={{ opacity: 0.8 }}
         >
           {children}
         </Link>
       );
     },
 
     // Custom paragraph rendering with proper spacing
     p({ children }) {
       return (
         <Text mb={2} lineHeight="1.6">
           {children}
         </Text>
       );
     },
 
     // Custom list rendering
     ul({ children }) {
       return (
         <Box as="ul" pl={4} mb={2}>
           {children}
         </Box>
       );
     },
 
     ol({ children }) {
       return (
         <Box as="ol" pl={4} mb={2}>
           {children}
         </Box>
       );
     },
 
     // Custom blockquote rendering
     blockquote({ children }) {
       return (
         <Box
           borderLeft="4px solid"
           borderLeftColor="gray.300"
           pl={4}
           py={1}
           my={2}
           opacity={0.8}
           fontStyle="italic"
         >
           {children}
         </Box>
       );
     },
 
     // Headers with different sizes
     h1({ children }) {
       return (
         <Text fontSize="2xl" fontWeight="bold" mb={2}>
           {children}
         </Text>
       );
     },
 
     h2({ children }) {
       return (
         <Text fontSize="xl" fontWeight="bold" mb={2}>
           {children}
         </Text>
       );
     },
 
     h3({ children }) {
       return (
         <Text fontSize="lg" fontWeight="bold" mb={2}>
           {children}
         </Text>
       );
     },
 
     // Horizontal rule
     hr() {
       return (
         <Box
           my={4}
           borderBottom="1px solid"
           borderColor="gray.300"
         />
       );
     },
   };

  return (
    <VStack spacing={2} width="100%" align="stretch">
      {/* Mode Toggle Buttons */}
      <HStack justify="space-between">
        <ButtonGroup size="sm" isAttached variant="outline">
          <Button
            leftIcon={<EditIcon />}
            isActive={mode === "write"}
            onClick={() => setMode("write")}
          >
            Write
          </Button>
          <Button
            leftIcon={<ViewIcon />}
            isActive={mode === "preview"}
            onClick={() => setMode("preview")}
          >
            Preview
          </Button>
        </ButtonGroup>

        {/* Send button with loading state */}
        <Button
          size="sm"
          colorScheme="blue"
          onClick={onSend}
          isLoading={isLoading}
          isDisabled={!value.trim()}
        >
          Send (Ctrl+Enter)
        </Button>
      </HStack>

      {/* Hidden file input for image uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        style={{ display: "none" }}
        accept="image/*"
      />

      {/* Markdown Toolbar - only show in write mode */}
      {mode === "write" && (
        <MarkdownToolbar
          onInsert={insertMarkdown}
          onImageClick={handleImageButtonClick}
          isUploadingImage={uploadingImage}
        />
      )}

      {/* Editor/Preview Area */}
      <Box
        border="1px solid"
        borderColor={borderColor}
        borderRadius="md"
        overflow="hidden"
      >
        {mode === "write" ? (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Type your message in markdown..."}
            minHeight="100px"
            maxHeight="300px"
            resize="vertical"
            border="none"
            _focus={{ outline: "none", boxShadow: "none" }}
            bg={bgColor}
            p={3}
          />
        ) : (
          <Box
            minHeight="100px"
            maxHeight="300px"
            overflowY="auto"
            bg={previewBg}
            p={3}
          >
            {value ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {value}
              </ReactMarkdown>
            ) : (
              <Text color="gray.500" fontStyle="italic">
                Nothing to preview yet...
              </Text>
            )}
          </Box>
        )}
      </Box>

      {/* Helper text */}
      <Text fontSize="xs" color="gray.500">
        Supports **bold**, *italic*, `code`, [links](url), lists, and more
      </Text>
    </VStack>
  );
};

export default MarkdownEditor;