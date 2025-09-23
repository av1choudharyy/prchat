// src/components/MyChats.jsx
import { useEffect, useState } from "react";
import { Box, Button, Stack, Text, Heading } from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";

import { ChatState } from "../context/ChatProvider";
import ChatLoading from "./ChatLoading";
import { getSender } from "../config/ChatLogics";
import GroupChatModal from "./miscellaneous/GroupChatModal";

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();

  const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState();

  const fetchChats = async () => {
    try {
      const response = await fetch(`/api/chat`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error("Failed to load chats", error);
    }
  };

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    if (user) fetchChats();
    // eslint-disable-next-line
  }, [fetchAgain, user]);

  return (
    <Box className="left-column" w="100%" maxW="320px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Heading as="h3" className="my-chats-header">
          My Chats
        </Heading>

        <GroupChatModal>
          <Button size="sm" rightIcon={<AddIcon />} colorScheme="blue" variant="solid">
            New Group Chat
          </Button>
        </GroupChatModal>
      </Box>

      {/* Scrollable list */}
      <Box className="my-chats-list">
        {chats ? (
          <Stack spacing={2}>
            {chats.map((chat) => (
              <Box
                key={chat._id}
                onClick={() => setSelectedChat(chat)}
                cursor="pointer"
                className={`my-chat-item ${selectedChat === chat ? "active" : ""}`}
              >
                <Text fontWeight="600" noOfLines={1}>
                  {!chat.isGroupChat ? getSender(loggedUser, chat.users) : chat.chatName}
                </Text>
              </Box>
            ))}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
};

export default MyChats;
