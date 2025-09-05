import { HStack, Button } from "@chakra-ui/react";

const QuickReplyBar = ({ onSelect }) => {
  const suggestions = ["Okay", "Thank you", "Sounds good", "Yes", "No"];

  return (
    <HStack spacing={2} paddingTop={4}>
      {suggestions.map((text, i) => (
        <Button
          key={i}
          size="sm"
          variant="outline"
          borderRadius="full"
          onClick={() => onSelect(text)}
          border="1px solid"
          borderColor="lightgrey"
        >
          {text}
        </Button>
      ))}
    </HStack>
  );
};

export default QuickReplyBar;
