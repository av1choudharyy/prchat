import { useEffect, useState } from "react";
import {
  Button,
  Stack,
  Text,
  useDisclosure,
  useToast,
  useColorMode,
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
  const { colorMode } = useColorMode();

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
      onClose();
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

  const handleChatSelect = (e, chat) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      console.log("Selecting chat:", chat);
      setSelectedChat(chat);
    } catch (error) {
      console.error("Error selecting chat:", error);
    }
  };

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    setLoggedUser(userInfo);
    if (user && user.token) {
      fetchChats();
    }
  }, [fetchAgain, user]);

  return (
    <div
      style={{
        display: window.innerWidth >= 768 ? "flex" : (selectedChat ? "none" : "flex"),
        flexDirection: "column",
        alignItems: "center",
        padding: "12px",
        backgroundColor: colorMode === "light" ? "white" : "#1A202C",
        width: window.innerWidth >= 768 ? "31%" : "100%",
        borderRadius: "8px",
        border: "1px solid #E2E8F0",
        height: "91.5vh"
      }}
      className="mychats-container"
    >
      <div
        style={{
          paddingBottom: "12px",
          paddingLeft: "12px",
          paddingRight: "12px",
          fontSize: "28px",
          fontFamily: "Work sans",
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
        }}
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
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "12px",
          backgroundColor: colorMode === "light" ? "#F8F8F8" : "#2D3748",
          width: "100%",
          height: "100%",
          borderRadius: "8px",
          overflowY: "hidden",
        }}
      >
        {chats && chats.length > 0 ? (
          <div style={{ overflowY: "scroll", height: "100%" }}>
            {chats.map((chat) => (
              <div
                onClick={(e) => handleChatSelect(e, chat)}
                style={{
                  cursor: "pointer",
                  backgroundColor: selectedChat === chat ? "#38B2AC" : colorMode === "light" ? "#E8E8E8" : "#4A5568",
                  color: selectedChat === chat ? "white" : colorMode === "light" ? "black" : "white",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  userSelect: "none"
                }}
                key={chat._id}
              >
                <Text>
                  {!chat.isGroupChat
                    ? getSender(loggedUser, chat.users)
                    : chat.chatName}
                </Text>
              </div>
            ))}
          </div>
        ) : (
          <ChatLoading />
        )}
      </div>
    </div>
  );
};

export default MyChats;
