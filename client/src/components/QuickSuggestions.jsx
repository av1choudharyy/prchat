import { Box, Button, HStack, Text } from "@chakra-ui/react";

const QuickSuggestions = ({ onSuggestionClick, isVisible }) => {
  const suggestions = [
    "Okay",
    "Thank you",
    "Yes",
    "No",
    "Sure",
    "Got it",
    "👍",
    "😊",
    "Let me check",
    "I'll get back to you",
  ];

  if (!isVisible) return null;

  return (
    <Box
      p={3}
      bg="#f8f9fa"
      borderRadius="lg"
      border="1px solid"
      borderColor="#e9edef"
      mb={3}
    >
      <Text fontSize="xs" color="#667781" mb={2} fontWeight="medium">
        Quick responses
      </Text>
      <HStack spacing={2} flexWrap="wrap">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            size="sm"
            variant="ghost"
            onClick={() => onSuggestionClick(suggestion)}
            _hover={{
              bg: "#e9edef",
              color: "#3b4a54",
              transform: "translateY(-1px)",
            }}
            _active={{ transform: "translateY(0)" }}
            fontSize="xs"
            px={3}
            py={2}
            h="auto"
            minH="32px"
            borderRadius="full"
            color="#667781"
            fontWeight="normal"
            transition="all 0.15s"
          >
            {suggestion}
          </Button>
        ))}
      </HStack>
    </Box>
  );
};

export default QuickSuggestions;
