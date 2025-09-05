import { Box } from "@chakra-ui/react";
import { ChatState } from "../context/ChatProvider";
import SingleChat from "./SingleChat";
import MessageComposer from "./MessageComposer(santosh)"; 

const ChatBox = ({ fetchAgain, setFetchAgain }) => {
  const { selectedChat } = ChatState();

  // handleSend accepts { content, styles } from MessageComposer
  const handleSend = ({ content, styles }) => {
    if (!content) return;

    console.log("Message to send:", { content, styles });

    // Later: axios.post("/api/message", { content, chatId: selectedChat._id, styles })
  };

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
      <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />

      {selectedChat && <MessageComposer onSend={handleSend} />}
    </Box>
  );
};

export default ChatBox;

