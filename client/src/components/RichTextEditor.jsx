import { Box, HStack, IconButton, Divider, Popover, PopoverTrigger, PopoverContent, ColorPicker } from '@chakra-ui/react';
import { useState, useRef } from 'react';

const RichTextEditor = ({ value, onChange, darkMode }) => {
  const editorRef = useRef();
  const [showToolbar, setShowToolbar] = useState(false);

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };

  const insertEmoji = (emoji) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(emoji));
    }
  };

  return (
    <Box
      border="1px solid"
      borderColor={darkMode ? "gray.600" : "gray.300"}
      borderRadius="12px"
      bg={darkMode ? "gray.700" : "white"}
    >
      {showToolbar && (
        <HStack p={2} borderBottom="1px solid" borderColor={darkMode ? "gray.600" : "gray.200"} spacing={1}>
          <IconButton size="sm" variant="ghost" onClick={() => formatText('bold')} title="Bold (Ctrl+B)">
            <strong>B</strong>
          </IconButton>
          <IconButton size="sm" variant="ghost" onClick={() => formatText('italic')} title="Italic (Ctrl+I)">
            <em>I</em>
          </IconButton>
          <IconButton size="sm" variant="ghost" onClick={() => formatText('underline')} title="Underline (Ctrl+U)">
            <u>U</u>
          </IconButton>
          <IconButton size="sm" variant="ghost" onClick={() => formatText('strikeThrough')} title="Strikethrough">
            <s>S</s>
          </IconButton>
          <Divider orientation="vertical" h="20px" />
          <IconButton size="sm" variant="ghost" onClick={() => formatText('insertUnorderedList')} title="Bullet List">
            •
          </IconButton>
          <IconButton size="sm" variant="ghost" onClick={() => formatText('insertOrderedList')} title="Numbered List">
            1.
          </IconButton>
          <Divider orientation="vertical" h="20px" />
          <Popover>
            <PopoverTrigger>
              <IconButton size="sm" variant="ghost" title="Insert Emoji">😀</IconButton>
            </PopoverTrigger>
            <PopoverContent w="200px">
              <HStack flexWrap="wrap" p={2}>
                {['😀','😂','❤️','👍','👎','😢','😮','😡','🎉','🔥'].map(emoji => (
                  <IconButton
                    key={emoji}
                    size="sm"
                    variant="ghost"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </IconButton>
                ))}
              </HStack>
            </PopoverContent>
          </Popover>
        </HStack>
      )}
      <Box
        ref={editorRef}
        contentEditable
        p={3}
        minH="40px"
        maxH="120px"
        overflowY="auto"
        outline="none"
        onFocus={() => setShowToolbar(true)}
        onBlur={() => setTimeout(() => setShowToolbar(false), 200)}
        onInput={(e) => onChange(e.target.innerHTML)}
        dangerouslySetInnerHTML={{ __html: value }}
        color={darkMode ? "white" : "black"}
        _empty={{
          _before: {
            content: '"Type a message..."',
            color: darkMode ? "gray.400" : "gray.500",
            fontStyle: "italic"
          }
        }}
      />
    </Box>
  );
};

export default RichTextEditor;