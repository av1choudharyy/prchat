import React, { useState } from "react";
import {
  Box,
  Button,
  Collapse,
  VStack,
  HStack,
  Text,
  Code,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react";
import { MdHelp, MdClose } from "react-icons/md";

/**
 * MarkdownHelp Component
 * A collapsible help panel showing markdown syntax examples
 */
const MarkdownHelp = () => {
  const [isOpen, setIsOpen] = useState(false);
  const bgColor = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const syntaxExamples = [
    {
      title: "Text Formatting",
      examples: [
        { syntax: "**bold text**", description: "Bold text" },
        { syntax: "*italic text*", description: "Italic text" },
        { syntax: "`inline code`", description: "Inline code" },
        { syntax: "~~strikethrough~~", description: "Strikethrough text" },
      ],
    },
    {
      title: "Headings",
      examples: [
        { syntax: "# Heading 1", description: "Main heading" },
        { syntax: "## Heading 2", description: "Sub heading" },
        { syntax: "### Heading 3", description: "Sub-sub heading" },
      ],
    },
    {
      title: "Lists",
      examples: [
        { syntax: "- Item 1\n- Item 2", description: "Bullet list" },
        { syntax: "1. First item\n2. Second item", description: "Numbered list" },
        { syntax: "- [x] Done\n- [ ] Todo", description: "Task list" },
      ],
    },
    {
      title: "Links & Images",
      examples: [
        { syntax: "[Link text](https://example.com)", description: "Link" },
        { syntax: "![Alt text](image.jpg)", description: "External image" },
        { syntax: "![Image name](image_placeholder_123)", description: "Uploaded image (auto-generated)" },
      ],
    },
    {
      title: "Code Blocks",
      examples: [
        { syntax: "```\ncode block\n```", description: "Code block" },
        { syntax: "```javascript\nconst x = 1;\n```", description: "Language-specific code" },
      ],
    },
    {
      title: "Other",
      examples: [
        { syntax: "> Quote text", description: "Blockquote" },
        { syntax: "---", description: "Horizontal rule" },
        { syntax: "| Col1 | Col2 |\n|------|------|\n| A    | B    |", description: "Table" },
      ],
    },
  ];

  return (
    <Box position="relative">
      <Button
        size="sm"
        variant="ghost"
        leftIcon={<MdHelp />}
        onClick={() => setIsOpen(!isOpen)}
        colorScheme="gray"
      >
        Markdown Help
      </Button>

      <Collapse in={isOpen} animateOpacity>
        <Box
          position="absolute"
          bottom="100%"
          left="0"
          right="0"
          bg={bgColor}
          border="1px"
          borderColor={borderColor}
          borderRadius="md"
          p={4}
          mb={2}
          maxH="400px"
          overflowY="auto"
          boxShadow="lg"
          zIndex={1000}
        >
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="bold">
              Markdown Syntax Reference
            </Text>
            <Button
              size="xs"
              variant="ghost"
              icon={<MdClose />}
              onClick={() => setIsOpen(false)}
            >
              <MdClose />
            </Button>
          </HStack>

          <VStack spacing={4} align="stretch">
            {syntaxExamples.map((section, index) => (
              <Box key={index}>
                <Text fontSize="sm" fontWeight="semibold" mb={2} color="blue.600">
                  {section.title}
                </Text>
                <VStack spacing={2} align="stretch">
                  {section.examples.map((example, exIndex) => (
                    <Box key={exIndex}>
                      <Code fontSize="xs" p={1} borderRadius="sm" display="block" whiteSpace="pre-wrap">
                        {example.syntax}
                      </Code>
                      <Text fontSize="xs" color="gray.600" ml={2}>
                        {example.description}
                      </Text>
                    </Box>
                  ))}
                </VStack>
                {index < syntaxExamples.length - 1 && <Divider mt={2} />}
              </Box>
            ))}
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default MarkdownHelp;

