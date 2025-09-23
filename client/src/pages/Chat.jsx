// src/pages/Chat.jsx
import React from "react";
import Topbar from "../components/Topbar";
import { Box, Flex, Center } from "@chakra-ui/react";
import { useState } from "react";

import { ChatState } from "../context/ChatProvider";
import MyChats from "../components/MyChats";
import ChatBox from "../components/ChatBox";

const Chat = () => {
  const { user } = ChatState();
  const [fetchAgain, setFetchAgain] = useState(false);

  return (
    <Flex direction="column" minH="100vh" bg="transparent">
      {/* Topbar (search / profile / notifications) */}
      {user && <Topbar />}

      {/* MAIN CHAT AREA - sits below the Topbar */}
      <Box
        as="main"
        className="chat-page-root"
        w="100%"
        flex="1"
        display="flex"
        gap={6}
        p={6}
        boxSizing="border-box"
      >
        {/* Left column fixed width */}
        <Box flex="0 0 320px" minW="260px" maxW="360px" minH="0">
          {user ? (
            <Box h="100%" minH="0">
              <MyChats fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
            </Box>
          ) : null}
        </Box>

        {/* Right column expands */}
        <Box flex="1" minH="0" display="flex">
          {user ? (
            <Box h="100%" w="100%" minH="0">
              <ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
            </Box>
          ) : (
            <Center h="100%" w="100%">
              <Box p={6} bg="white" borderRadius="md">
                Please login to view chats
              </Box>
            </Center>
          )}
        </Box>
      </Box>
    </Flex>
  );
};

export default Chat;
