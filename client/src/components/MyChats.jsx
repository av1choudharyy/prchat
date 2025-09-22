// client/src/components/MyChats.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Avatar,
  Text,
  VStack,
  HStack,
  Divider,
  useToast,
  Spinner,
} from "@chakra-ui/react";

import { ChatState } from "../context/ChatProvider";
import { getSender } from "../config/ChatLogics";

/**
 * Clean MyChats list:
 * - fixed width column
 * - header with "My Chats" and New Group button
 * - scrollable list of chat items
 *
 * Replace your existing MyChats with this if you want a simple, clean layout.
 */
const MyChats = ({ fetchAgain, setFetchAgain }) => {
  const { user, selectedChat, setSelectedChat, chats, setChats } = ChatState();
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // If chats are empty, fetch them
    const fetchChats = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const res = await fetch("/api/chat", {
          method: "GET",
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        setChats(data);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        toast({
          title: "Failed to load chats",
          status: "error",
          description: err.message,
        });
      }
    };
    fetchChats();
    // eslint-disable-next-line
  }, [fetchAgain, user]);

  return (
    <Box className="my-chats">
      <Box className="header">
        <Text fontSize="2xl" fontWeight="semibold">My Chats</Text>
        <Button size="sm" colorScheme="blue" onClick={() => toast({ title: "New Group Chat", description: "Not implemented", status: "info" })}>
          New Group Chat +
        </Button>
      </Box>

      <Box className="chats-list">
        {loading ? (
          <VStack spacing={3} align="stretch" py={6}>
            <Spinner alignSelf="center" />
          </VStack>
        ) : !chats || chats.length === 0 ? (
          <Box className="center" p={6}>
            <Text className="small-muted">No chats yet</Text>
          </Box>
        ) : (
          chats.map((chat) => {
            const isSelected = selectedChat && selectedChat._id === chat._id;
            const chatName = chat.isGroupChat ? chat.chatName : getSender(user, chat.users);
            const lastMsg = chat.latestMessage ? chat.latestMessage.content : "";

            return (
              <Box
                key={chat._id}
                className={`chat-item ${isSelected ? "selected" : ""}`}
                onClick={() => setSelectedChat(chat)}
              >
                <Avatar name={chatName} src={chat.pic} />
                <Box className="meta">
                  <Text className="name">{chatName}</Text>
                  <Text className="sub" noOfLines={1}>{lastMsg}</Text>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
};

export default MyChats;
