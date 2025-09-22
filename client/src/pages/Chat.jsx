// client/src/pages/Chat.jsx
import React, { useState } from "react";
import { Box, Flex, useColorModeValue } from "@chakra-ui/react";

import { ChatState } from "../context/ChatProvider";
import MyChats from "../components/MyChats";
import ChatBox from "../components/ChatBox";
import SideDrawer from "../components/miscellaneous/SideDrawer";

/**
 * Desktop layout:
 * - Left column: ~30% (min 280px)
 * - Right column: ~70%
 *
 * Header/drawer sits at top (SideDrawer), ChatBox owns the right column.
 */
const Chat = () => {
  const { user } = ChatState();
  const [fetchAgain, setFetchAgain] = useState(false);

  const containerBg = useColorModeValue("gray.50", "gray.900");
  const columnBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");

  return (
    <Box as="main" minH="100vh" bg={containerBg}>
      {user && <SideDrawer />}

      <Flex
        height="calc(100vh - 72px)"
        p={4}
        gap={4}
        align="stretch"
        justify="center"
      >
        {/* Left column */}
        <Box
          width="30%"
          minWidth="280px"
          bg={columnBg}
          borderRadius="md"
          border="1px solid"
          borderColor={borderColor}
          overflow="hidden"
          display={{ base: "none", md: "block" }}
        >
          {user && <MyChats fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />}
        </Box>

        {/* Right column */}
        <Box
          flex="1"
          width="70%"
          minWidth="420px"
          bg={columnBg}
          borderRadius="md"
          border="1px solid"
          borderColor={borderColor}
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          {user && <ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />}
        </Box>
      </Flex>
    </Box>
  );
};

export default Chat;
