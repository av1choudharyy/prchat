import { Box } from "@chakra-ui/react";

import { ChatState } from "../context/ChatProvider";
import SingleChat from "./SingleChat";
import { useColorMode } from "@chakra-ui/react";

const ChatBox = ({ fetchAgain, setFetchAgain }) => {
  const { selectedChat } = ChatState();
  const { colorMode } = useColorMode();
  return (
    <Box
      display={{ base: selectedChat ? "flex" : "none", md: "flex" }}
      alignItems="center"
      flexDir="column"
      p={3}
      bg={colorMode === "dark" ? "gray.700" : "white"}
      w={{ base: "100%", md: "68%" }}
      borderRadius="lg"
      borderWidth="1px"
    >
      <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
    </Box>
  );
};

export default ChatBox;
