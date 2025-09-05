import { Box, Text } from "@chakra-ui/react";
import { ChatState } from "../context/ChatProvider";
import SingleChat from "./SingleChat";

const ChatBox = ({ fetchAgain, setFetchAgain }) => {
  const { selectedChat } = ChatState();

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
      {selectedChat ? (
        <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
      ) : (
        <Text
          fontSize="2xl"
          color="black"
          fontWeight="bold"
          fontFamily="italic"
          textAlign="center"
          mt="30%"
        >
          Select a user to start chatting 💬
        </Text>
      )}
    </Box>
  );
};

export default ChatBox;
