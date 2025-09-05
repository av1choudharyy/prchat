import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Stack,
  Text,
  useDisclosure,
  useToast,
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
  const { isOpen, onToggle } = useDisclosure();

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
      onClose(); // Close the side drawer
    } catch (error) {
      return toast({
        title: "Error Occured!",
        description: "Failed to Load the Search Results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
        variant: "solid",
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
      maxW="calc(100% - 6px)"
      borderRadius="lg"
      borderWidth="1px"
    >
      <Box
        pb={3}
        px={3}
        fontSize={{ base: "20px", md: "24px" }}
        fontWeight="800"
        fontFamily="Work sans"
        display="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
      >
        My Chats
        <GroupChatModal>
          <Box
            position="relative"
            display="inline-block"
            onMouseEnter={onToggle}
            onMouseLeave={onToggle}
          >
            <Button
              display="flex"
              alignItems="center"
              px={isOpen ? 4 : 2} // expand padding on hover
              transition="all 0.3s ease"
              bg="white"
              _hover={{ bg: "white" }}
            >
              <AddIcon />
              <Box
                ml={2}
                maxW={isOpen ? "200px" : "0px"}
                overflow="hidden"
                whiteSpace="nowrap"
                transition="all 0.3s ease"
              >
                New Group Chat
              </Box>
            </Button>
          </Box>
        </GroupChatModal>
      </Box>

      <Box
        display="flex"
        flexDir="column"
        p={3}
        bg="#F8F8F8"
        w="100%"
        h="100%"
        borderRadius="lg"
        overflowY="hidden"
      >
        {chats ? (
          <Stack overflowY="scroll">
            {chats.map((chat) => (
              <Box
                onClick={() => setSelectedChat(chat)}
                cursor="pointer"
                bg={selectedChat === chat ? "#9cbcf8ff" : "white"}
                color={selectedChat === chat ? "white" : "black"}
                px={3}
                py={2}
                borderRadius="lg"
                key={chat._id}
                fontWeight="600"
                boxShadow={selectedChat !== chat ? "" : "lg"}
                transition="all 0.2s ease-in-out"
                transform="translateY(0px)"
                _hover={{
                  boxShadow: "xl",
                  transform: "translateY(-2px)",
                  bg: selectedChat !== chat ? "#f0f4ff" : "#9cbcf8ff",
                }}
              >
                <Text>
                  {!chat.isGroupChat
                    ? getSender(loggedUser, chat.users)
                    : chat.chatName}
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
