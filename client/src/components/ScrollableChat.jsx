import { Box } from "@chakra-ui/react";
import { useState, useRef, useEffect } from "react";

const ScrollableChat = ({ messages, isTyping, searchTerm }) => {
  const scrollRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    if (isAtBottom) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping, isAtBottom]);

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 10);
  };

  return (
    <Box
      ref={scrollRef}
      display="flex"
      flexDir="column"
      overflowY="auto"
      h="100%"
      onScroll={handleScroll}
      p={3}
      bg="#E5DDD5"
    >
      {/* Render messages here */}
    </Box>
  );
};

export default ScrollableChat;
