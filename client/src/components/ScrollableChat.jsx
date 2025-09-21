import { Avatar, Tooltip, Box, Text, HStack } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ImageModal from "./ImageModal";

import "../App.css";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../context/ChatProvider";
import typingAnimation from "../animations/typing.json";
import { getFileIcon, formatFileSize } from "../utils/fileUtils";

// Component to handle image display with proper error handling
const ImageDisplay = ({ file, onImageClick }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [error, setError] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    try {
      if (file && file.data) {
        // Process file data for display
        
        // Handle different data formats
        let base64Data;
        
        if (typeof file.data === 'string') {
          // If data is already a string (base64)
          base64Data = file.data;
        } else if (file.data.buffer) {
          // If data is a Buffer object (convert to base64)
          const uint8Array = new Uint8Array(file.data.buffer);
          const binaryString = uint8Array.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
          base64Data = btoa(binaryString);
        } else if (file.data.data) {
          // If data is nested
          const uint8Array = new Uint8Array(file.data.data);
          const binaryString = uint8Array.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
          base64Data = btoa(binaryString);
        } else if (Array.isArray(file.data)) {
          // If data is an array of bytes
          const uint8Array = new Uint8Array(file.data);
          const binaryString = uint8Array.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
          base64Data = btoa(binaryString);
        } else {
          // Try to convert directly
          const uint8Array = new Uint8Array(file.data);
          const binaryString = uint8Array.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
          base64Data = btoa(binaryString);
        }
        
        const dataUrl = `data:${file.mimetype};base64,${base64Data}`;
        setImageSrc(dataUrl);
        
        // Also try creating a blob URL as fallback
        try {
          const uint8Array = new Uint8Array(file.data);
          const blob = new Blob([uint8Array], { type: file.mimetype });
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        } catch (blobErr) {
          // Blob creation failed, continue with data URL
        }
      }
    } catch (err) {
      console.error("Error processing image data:", err);
      setError(true);
    }
  }, [file]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  if (error) {
    return (
      <Box p={4} textAlign="center" color="gray.500">
        <Text fontSize="sm">Unable to display image</Text>
        <Text fontSize="xs">{file.filename}</Text>
      </Box>
    );
  }

  if (!imageSrc) {
    return (
      <Box p={4} textAlign="center" color="gray.500">
        <Text fontSize="sm">Loading image...</Text>
      </Box>
    );
  }

  return (
    <img
      src={imageSrc || blobUrl}
      alt={file.filename}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        cursor: 'pointer',
        transition: 'transform 0.2s ease-in-out',
      }}
      onClick={() => onImageClick && onImageClick(file, imageSrc || blobUrl)}
      onMouseEnter={(e) => {
        e.target.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'scale(1)';
      }}
      onError={() => {
        if (blobUrl && imageSrc !== blobUrl) {
          setImageSrc(blobUrl);
        } else {
          setError(true);
        }
      }}
    />
  );
};

const ScrollableChat = ({ messages, isTyping, typingUsers = [] }) => {
  const { user } = ChatState();
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageSrc, setSelectedImageSrc] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const scrollRef = useRef();


  useEffect(() => {
    // Scroll to the bottom when messeges render or sender is typing
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  // Handle image click to open modal
  const handleImageClick = (file, imageSrc) => {
    setSelectedImage(file);
    setSelectedImageSrc(imageSrc);
    setIsImageModalOpen(true);
  };

  // Close image modal
  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
    setSelectedImageSrc(null);
  };

  return (
    <>
      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={closeImageModal}
        file={selectedImage}
        imageSrc={selectedImageSrc}
      />
      
      <div
        className="hide-scrollbar"
        style={{ overflowX: "hidden", overflowY: "auto" }}
      >
        {/* If something inside the messages, render the messages */}
        {messages &&
          messages.map((message, index) => (
            <div ref={scrollRef} key={message._id} style={{ display: "flex" }}>
              {(isSameSender(messages, message, index, user._id) ||
                isLastMessage(messages, index, user._id)) && (
                <Tooltip
                  label={message.sender.name}
                  placement="bottom-start"
                  hasArrow
                >
                  <Avatar
                    mt="7px"
                    mr="1"
                    size="sm"
                    cursor="pointer"
                    name={message.sender.name}
                    src={message.sender.pic}
                    border={message.sender._id === user._id ? "2px solid #3182ce" : "none"}
                  />
                </Tooltip>
              )}

              <Box
                backgroundColor={`${
                    message.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"
                }`}
                borderRadius="20px"
                padding="5px 15px"
                maxWidth="75%"
                marginLeft={isSameSenderMargin(
                    messages,
                    message,
                    index,
                    user._id
                )}
                marginTop={isSameUser(messages, message, index, user._id)
                  ? 3
                  : 10}
                wordBreak="break-word"
                overflow="hidden"
              >
                {/* Content Display */}
                {message.content && (
                  message.content.includes('**') || 
                  message.content.includes('*') || 
                  message.content.includes('`') || 
                  message.content.includes('#') || 
                  message.content.includes('[') ||
                  message.content.includes('- ') ||
                  message.content.includes('1. ') ||
                  message.content.includes('![')
                ) ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Custom styling for markdown elements in chat bubbles
                      h1: ({ children }) => <Text as="h1" fontSize="sm" fontWeight="bold" mb={1} display="block">{children}</Text>,
                      h2: ({ children }) => <Text as="h2" fontSize="sm" fontWeight="bold" mb={1} display="block">{children}</Text>,
                      h3: ({ children }) => <Text as="h3" fontSize="sm" fontWeight="bold" mb={1} display="block">{children}</Text>,
                      p: ({ children }) => <Text as="p" fontSize="sm" mb={1} display="block">{children}</Text>,
                      code: ({ children, className }) => {
                        const isInline = !className;
                        return isInline ? (
                          <Text as="code" bg="rgba(0,0,0,0.1)" px={1} py={0.5} borderRadius="sm" fontSize="xs" display="inline">
                            {children}
                          </Text>
                        ) : (
                          <Text as="pre" bg="rgba(0,0,0,0.1)" p={1} borderRadius="md" overflowX="auto" my={1} display="block" whiteSpace="pre-wrap">
                            <Text as="code" fontSize="xs">{children}</Text>
                          </Text>
                        );
                      },
                      ul: ({ children }) => <Text as="ul" pl={3} mb={1} display="block">{children}</Text>,
                      ol: ({ children }) => <Text as="ol" pl={3} mb={1} display="block">{children}</Text>,
                      li: ({ children }) => <Text as="li" fontSize="sm" mb={0.5} display="list-item">{children}</Text>,
                      a: ({ children, href }) => (
                        <Text as="a" href={href} color="blue.600" textDecoration="underline" fontSize="sm" target="_blank" rel="noopener noreferrer" display="inline">
                          {children}
                        </Text>
                      ),
                      img: ({ src, alt }) => {
                        // Handle uploaded images - check if it's a placeholder or actual image
                        if (src && src.includes('image_placeholder_')) {
                          return (
                            <Text as="span" my={2} textAlign="center" display="block">
                              <Text fontSize="xs" color="gray.500" fontStyle="italic">
                                📷 {alt || 'Image'} (Uploaded)
                              </Text>
                            </Text>
                          );
                        }
                        // Handle external images
                        return (
                          <Text as="span" my={2} textAlign="center" display="block">
                            <img
                              src={src}
                              alt={alt}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '200px',
                                borderRadius: '8px',
                                objectFit: 'cover'
                              }}
                            />
                          </Text>
                        );
                      },
                      blockquote: ({ children }) => (
                        <Text as="blockquote" borderLeft="3px" borderColor="rgba(0,0,0,0.3)" pl={2} my={1} fontStyle="italic" fontSize="sm" display="block">
                          {children}
                        </Text>
                      ),
                      strong: ({ children }) => <Text as="strong" fontWeight="bold" fontSize="sm" display="inline">{children}</Text>,
                      em: ({ children }) => <Text as="em" fontStyle="italic" fontSize="sm" display="inline">{children}</Text>,
                }}
              >
                {message.content}
                  </ReactMarkdown>
                ) : (
                  <Text fontSize="sm">{message.content}</Text>
                )}
                
                {/* File Attachment Display - Outside of markdown to avoid nesting issues */}
                {message.file && (
                  <Box mt={2} p={2} bg="gray.100" borderRadius="md" border="1px" borderColor="gray.300">
                    <HStack spacing={2}>
                      <Text fontSize="sm" color="blue.600">
                        {getFileIcon(message.file.mimetype)} {message.file.filename}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        ({formatFileSize(message.file.size)})
                      </Text>
                    </HStack>
                    {message.file.mimetype.startsWith('image/') && (
                      <Box mt={2}>
                        <Text fontSize="xs" color="gray.600" mb={1}>
                          Image Preview:
                        </Text>
                        <Box
                          maxW="200px"
                          maxH="150px"
                          borderRadius="md"
                          overflow="hidden"
                          border="1px"
                          borderColor="gray.300"
                          cursor="pointer"
                          transition="all 0.2s ease-in-out"
                          _hover={{
                            borderColor: "blue.400",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            transform: "translateY(-2px)"
                          }}
                          title="Click to view full size"
                        >
                          <ImageDisplay 
                            file={message.file} 
                            onImageClick={handleImageClick}
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </div>
          ))}
      </div>
      {/* Typing indicators */}
      {typingUsers.length > 0 && (
        <div style={{ marginTop: "5px", padding: "5px 10px" }}>
          <Text fontSize="sm" color="gray.500" fontStyle="italic">
            {typingUsers.map(u => u.userName).join(", ")} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </Text>
        </div>
      )}
      {isTyping ? (
        <div style={{ width: "70px", marginTop: "5px" }}>
          <Lottie animationData={typingAnimation} loop={true} />
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default ScrollableChat;
