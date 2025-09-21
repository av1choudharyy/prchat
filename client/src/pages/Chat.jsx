import { Box, IconButton, useColorMode } from "@chakra-ui/react";
import { useState } from "react";

import { ChatState } from "../context/ChatProvider";
import { ChatBox, MyChats, SideDrawer } from "../components";

const Chat = () => {
  const { user } = ChatState();
  const [fetchAgain, setFetchAgain] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box w="100%" minH="100vh" bg={colorMode === "dark" ? "gray.900" : "white"}>
    
      {user && <SideDrawer colorMode={colorMode} toggleColorMode={toggleColorMode}/>}
      <Box
        display="flex"
        justifyContent="space-between"
        w="100%"
        h="91.5vh"
        p="10px"
      >
        {user && <MyChats fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} colorMode={colorMode} />} 
         {user && <ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} colorMode={colorMode} />} 
      </Box>
    </Box>
  );
};

export default Chat;
