import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Stack,
  Text,
  VStack,
  HStack,
  useToast,
  useDisclosure,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";

import { ChatState } from "../context/ChatProvider";
import ChatLoading from "./ChatLoading";
import { getSender } from "../config/ChatLogics";
import GroupChatModal from "./miscellaneous/GroupChatModal";

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();
  const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState();
  const toast = useToast();
  const { onClose } = useDisclosure();

  const fetchChats = async () => {
    try {
      const response = await fetch(`/api/chat`, {
        method: "GET",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await response.json();
      setChats(data);
      onClose();
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: "Failed to load chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    fetchChats();
    // eslint-disable-next-line
  }, [fetchAgain]);

  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p={3}
      bg="white"
      w={{ base: "100%", md: "31%" }}
      borderRadius="lg"
      borderWidth="1px"
    >
      {/* Header */}
      <Box
        pb={3}
        px={3}
        fontSize={{ base: "28px", md: "30px" }}
        fontFamily="Work sans"
        display="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
      >
        My Chats
        <GroupChatModal>
          <Button
            display="flex"
            fontSize={{ base: "17px", md: "10px", lg: "17px" }}
            rightIcon={<AddIcon />}
          >
            New Group Chat
          </Button>
        </GroupChatModal>
      </Box>

      {/* Chat List */}
      <Box
        display="flex"
        flexDir="column"
        p={3}
        bg="#F8F8F8"
        w="100%"
        h="100%"
        borderRadius="lg"
        overflowY="auto"
      >
        {chats ? (
          <Stack spacing={2}>
            {chats.map((chat) => {
              const isSelected = selectedChat === chat;
              const otherUser = !chat.isGroupChat
                ? chat.users.find((u) => u._id !== loggedUser._id)
                : null;

              return (
                <Box
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  cursor="pointer"
                  bg={isSelected ? "#38B2AC" : "#E8E8E8"}
                  color={isSelected ? "white" : "black"}
                  px={4}
                  py={3}
                  borderRadius="lg"
                  _hover={{ bg: isSelected ? "#38B2AC" : "#E2E8F0" }}
                  transition="0.2s"
                >
                  <HStack justifyContent="space-between" alignItems="center">
                    <VStack align="start" spacing={0}>
                      {/* Chat Name only */}
                      <Text fontWeight={isSelected ? "bold" : "medium"}>
                        {!chat.isGroupChat ? getSender(loggedUser, chat.users) : chat.chatName}
                      </Text>

                      {/* Online / last seen */}
                      {!chat.isGroupChat && otherUser?.isOnline && (
                        <Text fontSize="xs" color="green.400">Online</Text>
                      )}
                    </VStack>

                    {/* Unread count badge */}
                    {chat.unreadCount > 0 && (
                      <Box
                        bg="red.400"
                        color="white"
                        px={2}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                      >
                        {chat.unreadCount}
                      </Box>
                    )}
                  </HStack>
                </Box>
              );
            })}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
};

export default MyChats;
