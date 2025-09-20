import React from "react";
import { Box, Text, Link, useColorModeValue } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow, twilight } from "react-syntax-highlighter/dist/esm/styles/prism";

const MarkdownMessage = ({ content, timestamp }) => {
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
    <Box>
      {/* Render the markdown content */}
      <Box className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      </Box>

      {/* Display timestamp if provided */}
      {timestamp && (
        <Text fontSize="xs" color="gray.500" mt={1}>
          {new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      )}
    </Box>
  );
};

export default MarkdownMessage;