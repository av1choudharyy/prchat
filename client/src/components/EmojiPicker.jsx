import React from 'react';
import { 
  Box, 
  Popover, 
  PopoverTrigger, 
  PopoverContent, 
  PopoverArrow, 
  PopoverBody,
  IconButton,
  Grid,
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import { MdEmojiEmotions } from 'react-icons/md';

const EmojiPicker = ({ onEmojiSelect, isDisabled }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  // Common emojis organized by category
  const emojis = [
    // Smileys & People
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    
    // Hearts & Emotions
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌',
    
    // Gestures & Actions
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '👏',
    
    // Objects & Symbols
    '🎉', '🎊', '🎈', '🎁', '🎀', '🏆', '🥇', '🥈', '🥉', '🏅',
    '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨',
    
    // Food & Nature
    '🍕', '🍔', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳',
    '🥞', '🧇', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍖', '🍗',
    
    // Weather & Nature
    '☀️', '🌙', '⭐', '🌟', '💫', '✨', '🌠', '☁️', '⛅', '⛈️',
    '🌦️', '🌧️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌪️', '🌈', '🌊'
  ];

  const handleEmojiClick = (emoji) => {
    onEmojiSelect(emoji);
  };

  return (
    <Popover placement="top-start">
      <PopoverTrigger>
        <IconButton
          aria-label="Add emoji"
          icon={<MdEmojiEmotions />}
          size="sm"
          variant="ghost"
          isDisabled={isDisabled}
          _hover={{
            bg: useColorModeValue('gray.100', 'gray.700'),
          }}
        />
      </PopoverTrigger>
      <PopoverContent 
        bg={bgColor} 
        borderColor={borderColor}
        maxW="300px"
        maxH="400px"
      >
        <PopoverArrow bg={bgColor} />
        <PopoverBody p={3}>
          <Box maxH="350px" overflowY="auto">
            <Text fontSize="sm" fontWeight="bold" mb={2} color="gray.600">
              Choose an emoji:
            </Text>
            <Grid templateColumns="repeat(10, 1fr)" gap={1}>
              {emojis.map((emoji, index) => (
                <Box
                  key={index}
                  p={2}
                  borderRadius="md"
                  cursor="pointer"
                  textAlign="center"
                  fontSize="lg"
                  _hover={{
                    bg: hoverBg,
                  }}
                  onClick={() => handleEmojiClick(emoji)}
                  transition="background-color 0.2s"
                >
                  {emoji}
                </Box>
              ))}
            </Grid>
          </Box>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;
