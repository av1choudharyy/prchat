import { Box, useColorMode } from "@chakra-ui/react";
import { useState } from "react";

import { ChatState } from "../context/ChatProvider";
import { ChatBox, MyChats, SideDrawer } from "../components";

const Chat = () => {
  const { user } = ChatState();
  const [fetchAgain, setFetchAgain] = useState(false);
  const { colorMode } = useColorMode();

  return (
    <div style={{
      width: "100%",
      backgroundColor: colorMode === "dark" ? "#1A202C" : "#F7FAFC",
      minHeight: "100vh"
    }}>
      {user && <SideDrawer />}
      <Box
        display="flex"
        justifyContent="space-between"
        w="100%"
        h="91.5vh"
        p="10px"
        bg={colorMode === "dark" ? "gray.800" : "white"}
      >
        {user && <MyChats fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />}
        {user && <ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />}
      </Box>
    </div>
  );
};

export default Chat;
