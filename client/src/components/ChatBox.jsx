// src/components/ChatBox.jsx
import { Box } from "@chakra-ui/react";
import { ChatState } from "../context/ChatProvider";
import SingleChat from "./SingleChat";

const ChatBox = ({ fetchAgain, setFetchAgain }) => {
  const { selectedChat } = ChatState();
  return (
    <Box
      display={{ base: selectedChat ? "flex" : "none", md: "flex" }}
      alignItems="stretch"
      flexDir="column"
      p={3}
      bg="white"
      w="100%"
      h="100%"
      borderRadius="lg"
      borderWidth="1px"
      minHeight={0}   /* allow child to shrink/scroll */
    >
      {selectedChat ? (
        <Box className="chat-card" w="100%" h="100%">
          <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
        </Box>
      ) : (
        <Box className="empty-chat-message" w="100%" h="100%">
          Click on a user to start chatting
        </Box>
      )}
    </Box>
  );
};

export default ChatBox;
