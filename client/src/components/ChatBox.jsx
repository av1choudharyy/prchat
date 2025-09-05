import { Box } from "@chakra-ui/react";
import { useState } from "react";

import { ChatState } from "../context/ChatProvider";
import SingleChat from "./SingleChat";

const ChatBox = ({ fetchAgain, setFetchAgain }) => {
  const { selectedChat } = ChatState();
  
    // Reply state to track which message is being replied to
  const [replyTo, setReplyTo] = useState(null);
  return (
    <Box
      display={{ base: selectedChat ? "flex" : "none", md: "flex" }}
      alignItems="center"
      flexDir="column"
      p={3}
      bg="white"
      w={{ base: "100%", md: "68%" }}
      borderRadius="lg"
      borderWidth="1px"
    >
      <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain}
        replyTo={replyTo}
        setReplyTo={setReplyTo} />
    </Box>
  );
};

export default ChatBox;
