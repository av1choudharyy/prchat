import { Box } from "@chakra-ui/react";
import { useState } from "react";

import { ChatState } from "../context/ChatProvider";
import { ChatBox, MyChats, SideDrawer } from "../components";

const Chat = () => {
  const { user, darkMode } = ChatState();
  const [fetchAgain, setFetchAgain] = useState(false);

  return (
    <Box 
      w="100%" 
      bg={darkMode ? "gray.900" : "white"}
      minH="100vh"
    >
      {user && <SideDrawer />}
      <Box
        display="flex"
        justifyContent="space-between"
        w="100%"
        h="91.5vh"
        p="10px"
        bg={darkMode ? "gray.900" : "transparent"}
      >
        {user && <MyChats fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />}
        {user && <ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />}
      </Box>
    </Box>
  );
};

export default Chat;
