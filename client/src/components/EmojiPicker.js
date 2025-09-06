import { Button, Flex } from "@chakra-ui/react";

const EmojiPicker = ({ onSelect }) => {
  const emojis = ["😀", "😂", "😍", "👍", "🔥", "❤️"];

  return (
    <Flex gap={2}>
      {emojis.map((emoji) => (
        <Button
          key={emoji}
          bg="transparent"
          fontSize="20px"
          _hover={{ bg: "gray.100" }}
          onClick={() => onSelect(emoji)}
        >
          {emoji}
        </Button>
      ))}
    </Flex>
  );
};

export default EmojiPicker;
