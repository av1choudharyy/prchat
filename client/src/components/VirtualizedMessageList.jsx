import { FixedSizeList as List } from 'react-window';
import { Box } from '@chakra-ui/react';
import { forwardRef } from 'react';

const MessageItem = ({ index, style, data }) => {
  const { messages, darkMode, onReply, onForward } = data;
  const message = messages[index];

  return (
    <div style={style}>
      <Box p={2} data-message-id={message._id}>
        {/* Render message component here */}
      </Box>
    </div>
  );
};

const VirtualizedMessageList = forwardRef(({ messages, height, darkMode, onReply, onForward }, ref) => {
  const itemData = { messages, darkMode, onReply, onForward };

  return (
    <List
      ref={ref}
      height={height}
      itemCount={messages.length}
      itemSize={80} // Estimated message height
      itemData={itemData}
      overscanCount={5}
    >
      {MessageItem}
    </List>
  );
});

export default VirtualizedMessageList;