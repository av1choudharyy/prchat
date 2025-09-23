import {
  Avatar,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Input,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Spinner,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { BellIcon, ChevronDownIcon, SearchIcon } from "@chakra-ui/icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ChatState } from "../../context/ChatProvider";
import ProfileModal from "./ProfileModal";
import ChatLoading from "../ChatLoading";
import UserListItem from "../UserAvatar/UserListItem";
import { getSender } from "../../config/ChatLogics";
import "../../App.css";

const SideDrawer = () => {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const {
    user,
    setSelectedChat,
    chats,
    setChats,
    notification,
    setNotification,
  } = ChatState();

  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    navigate("/");
  };

  const handleSearch = async () => {
    if (!search) {
      return toast({
        title: "Please enter something in search",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
        variant: "solid",
      });
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/user?search=${search}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await response.json();

      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      setLoading(false);
      return toast({
        title: "Error Occured!",
        description: "Failed to load search results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
        variant: "solid",
      });
    }
  };

  const accessChat = async (userId) => {
    try {
      setLoadingChat(true);

      const response = await fetch(`/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();

      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);

      setSelectedChat(data);
      setLoadingChat(false);
      onClose();
    } catch (error) {
      setLoadingChat(false);
      return toast({
        title: "Error fetching the chat",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
        variant: "solid",
      });
    }
  };

  return (
    <>
      {/* Top Navbar */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        w="100%"
        p="5px 10px"
        borderWidth="5px"
        zIndex="1"
      >
        {/* Search User Button */}
        <Tooltip label="Search users to chat" hasArrow placement="bottom-end">
          <Button
            variant="ghost"
            onClick={onOpen}
            flexDir="column"
            alignItems="center"
            justifyContent="center"
          >
            <SearchIcon boxSize={6} mb={1} color="black" />
            <Text fontSize="sm">Search</Text>
          </Button>
        </Tooltip>

        {/* App Name */}
        <Text
          fontSize="3xl"
          fontWeight="bold"
          fontFamily="Work Sans"
          color="darkblue"
          textShadow="2px 2px 4px rgba(0,0,0,0.3)"
        >
          PR CHAT
        </Text>

        {/* Notification + Profile */}
        <Box display="flex" alignItems="center" gap="15px">
          {/* Notification Bell */}
          <Menu>
            <MenuButton p={1} position="relative">
              <BellIcon fontSize="2xl" m={1} color="black" />
              {notification.length > 0 && (
                <Box
                  as="span"
                  position="absolute"
                  top="0"
                  right="0"
                  bg="red.500"
                  color="white"
                  borderRadius="full"
                  px="2"
                  fontSize="xs"
                >
                  {notification.length > 9 ? "9+" : notification.length}
                </Box>
              )}
            </MenuButton>

            <MenuList>
              {!notification.length && <MenuItem>No new notifications</MenuItem>}
              {notification.map((notif) => (
                <MenuItem
                  key={notif._id}
                  onClick={() => {
                    setSelectedChat(notif.chat);
                    setNotification(notification.filter((n) => n !== notif));
                    onClose();
                  }}
                >
                  {notif.chat.isGroupChat
                    ? `New message in ${notif.chat.chatName}`
                    : `New message from ${getSender(user, notif.chat.users)}`}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* Profile Menu */}
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
              <Avatar
                name={user.name}
                size="sm"
                cursor="pointer"
                src={user.pic}
              />
            </MenuButton>

            <MenuList>
              <ProfileModal user={user}>
                <MenuItem>My Profile</MenuItem>
              </ProfileModal>
              <MenuDivider />
              <MenuItem onClick={logoutHandler}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Box>
      </Box>

      {/* Drawer (Search Users) */}
      <Drawer
        placement="left"
        isOpen={isOpen}
        onClose={onClose}
        closeOnOverlayClick
        size="sm"
      >
        {/* Overlay below */}
        <DrawerOverlay zIndex={1300} />

        {/* Content above */}
        <DrawerContent zIndex={1500} bg="white" color="black">
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" fontWeight="bold">
            Search Users
          </DrawerHeader>

          <DrawerBody>
            <Box display="flex" pb="2">
              <Input
                placeholder="Search users to chat"
                _placeholder={{ color: "gray.500", fontStyle: "italic" }}
                mr="2"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button onClick={handleSearch}>Go</Button>
            </Box>

            {loading ? (
              <ChatLoading />
            ) : (
              searchResult?.map((u) => (
                <UserListItem
                  key={u._id}
                  user={u}
                  handleFunction={() => accessChat(u._id)}
                />
              ))
            )}

            {loadingChat && <Spinner ml="auto" display="flex" />}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default SideDrawer;
