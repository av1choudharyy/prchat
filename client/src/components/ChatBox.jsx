// client/src/components/ChatBox.jsx
import React from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { ChatState } from "../context/ChatProvider";
import SingleChat from "./SingleChat";

/**
 * ChatBox wrapper — places SingleChat into the right column
 */
const ChatBox = ({ fetchAgain, setFetchAgain }) => {
  const { selectedChat } = ChatState();

  return (
    <Flex direction="column" height="100%">
      {!selectedChat ? (
        <Flex align="center" justify="center" height="100%">
          <Text fontSize="xl" color="gray.500">
            Select a chat to start messaging
          </Text>
        </Flex>
      ) : (
        <Box height="100%" width="100%">
          <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
        </Box>
      )}
    </Flex>
  );
};

export default ChatBox;
