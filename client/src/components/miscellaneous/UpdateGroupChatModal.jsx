import { useState } from "react";
import { ViewIcon, Search2Icon, CloseIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  useDisclosure,
  useToast,
  Tooltip,
  useColorMode,
} from "@chakra-ui/react";

import { ChatState } from "../../context/ChatProvider";
import UserBadgeItem from "../UserAvatar/UserBadgeItem";
import UserListItem from "../UserAvatar/UserListItem";

const UpdateGroupChatModal = ({
  fetchAgain,
  setFetchAgain,
  fetchMessages,
  searchValue,
  setSearchValue,
  matchIndexes = [],
  currentMatch = 0,
  setCurrentMatch = () => {},
}) => {
  const [groupChatName, setGroupChatName] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);

  const { user, selectedChat, setSelectedChat } = ChatState();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { colorMode } = useColorMode();

  const handleRemove = async (removeUser) => {
    // Check if group admin id !== logged in user id and user id who is trying to remove !== logged in user id
    if (
      selectedChat.groupAdmin._id !== user._id &&
      removeUser._id !== user._id
    ) {
      return toast({
        title: "Only admins can remove someone!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "solid",
      });
    }

    try {
      setLoading(true);

      const response = await fetch("/api/chat/groupremove", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: selectedChat._id,
          userId: removeUser._id,
        }),
      });
      const data = await response.json();

      // If logged in user removed himself or left the group
      removeUser._id === user._id ? setSelectedChat() : setSelectedChat(data);
      setFetchAgain(!fetchAgain); // Fetching all the chat again
      fetchMessages(); // All the messages will be refreshed
      setLoading(false);
    } catch (error) {
      setLoading(false);
      return toast({
        title: "Error Occured!",
        description: "Failed to remove the user!",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "solid",
      });
    }
  };

  const handleAddUser = async (addUser) => {
    // If the user already in the group
    if (selectedChat.users.find((u) => u._id === addUser._id)) {
      return toast({
        title: "User Already in group!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "solid",
      });
    }

    // Check if the user admin or not
    if (selectedChat.groupAdmin._id !== user._id) {
      return toast({
        title: "Only admins can add someone!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "solid",
      });
    }

    try {
      setLoading(true);

      const response = await fetch("/api/chat/groupadd", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: selectedChat._id,
          userId: addUser._id,
        }),
      });
      const data = await response.json();

      setSelectedChat(data);
      setFetchAgain(!fetchAgain); // Fetching all the chat again
      setLoading(false);
    } catch (error) {
      setLoading(false);
      return toast({
        title: "Error Occured!",
        description: "Failed to add the user!",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "solid",
      });
    }
  };

  const handleRename = async () => {
    if (!groupChatName) {
      return;
    }

    try {
      setRenameLoading(true);

      const response = await fetch("/api/chat/rename", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: selectedChat._id,
          chatName: groupChatName,
        }),
      });
      const data = await response.json();

      setSelectedChat(data);
      setFetchAgain(!fetchAgain); // Fetching all the chat again
      setRenameLoading(false);
    } catch (error) {
      setRenameLoading(false);
      return toast({
        title: "Error Occured!",
        description: "Failed to rename group chat!",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "solid",
      });
    }

    setGroupChatName("");
  };

  const handleSearch = async (query) => {
    setSearch(query);

    if (!query || query === "") {
      setSearchResults([]);
      return;
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
      setSearchResults(data);
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

  return (
    <>
      {/* Search icon only when search bar is not active */}

      {showSearchBar && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 8,
            width: "50%",
            position: "relative",
          }}
        >
          <Input
            placeholder="Search messages..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            flex="1"
            borderRadius="4px"
            border="1px solid"
            borderColor={colorMode == "dark" ? "whiteAlpha.300" : "gray.300"}
            fontSize="1rem"
            color={colorMode == "dark" ? "white" : "gray.700"}
            bg="transparent"
            px="4px"
            _placeholder={{
              color: colorMode == "dark" ? "whiteAlpha.800" : "gray.500",
            }} // 👈 works
          />
          <IconButton
            icon={<CloseIcon />}
            size="sm"
            // variant="ghost"
            onClick={() => {
              setShowSearchBar(false);
              setSearchValue("");
            }}
            style={{
              position: "absolute",
              right: 4,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
            }}
            aria-label="Close search"
          />
        </div>
      )}
      {/* Arrow navigation and match count outside input, only when search bar is active and matches exist */}
      {showSearchBar && searchValue && matchIndexes.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 8,
            justifyContent: "center",
            gap: 8,
          }}
        >
          <button
            onClick={() =>
              setCurrentMatch((prev) =>
                prev === 0 ? matchIndexes.length - 1 : prev - 1
              )
            }
            style={{
              background: "none",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
            }}
            title="Up"
            tabIndex={-1}
          >
            &#8593;
          </button>
          <span
            style={{
              fontSize: "13px",
              background: "#eee",
              borderRadius: "3px",
              color: colorMode === "dark" ? "#222" : "#555",
              padding: "0 8px",
            }}
          >
            {currentMatch + 1} / {matchIndexes.length}
          </span>
          <button
            onClick={() =>
              setCurrentMatch((prev) =>
                prev === matchIndexes.length - 1 ? 0 : prev + 1
              )
            }
            style={{
              background: "none",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
            }}
            title="Down"
            tabIndex={-1}
          >
            &#8595;
          </button>
        </div>
      )}
      <div style={{ display: "flex" }}>
        {!showSearchBar && (
          <Tooltip label="Search messages" hasArrow>
            <IconButton
              display={{ base: "flex" }}
              icon={
                <Search2Icon
                  color={colorMode === "dark" ? "yellow.300" : "gray.700"}
                />
              }
              onClick={() => setShowSearchBar(true)}
              mr={2}
              aria-label="Search"
              bg={colorMode === "dark" ? "gray.700" : "white"}
              // color={colorMode === "dark" ? "yellow.300" : "gray.700"}
              _hover={{ bg: colorMode === "dark" ? "gray.600" : "gray.100" }}
            />
          </Tooltip>
        )}
        <Tooltip label="View/Edit group" hasArrow>
          <IconButton
            display={{ base: "flex" }}
            icon={
              <ViewIcon
                color={colorMode === "dark" ? "yellow.300" : "gray.700"}
              />
            }
            onClick={onOpen}
            aria-label="Edit"
            bg={colorMode === "dark" ? "gray.700" : "white"}
            color={colorMode === "dark" ? "yellow.300" : "gray.700"}
            _hover={{ bg: colorMode === "dark" ? "gray.600" : "gray.100" }}
          />
        </Tooltip>
        <Tooltip label="Close" hasArrow>
          <IconButton
            icon={
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: colorMode === "dark" ? "#FFD700" : "#222",
                }}
              >
                x
              </span>
            }
            variant="ghost"
            aria-label="Close"
            onClick={() => {
              setSelectedChat(null);
              localStorage.removeItem("selectedChat");
            }}
            background={colorMode === "dark" ? "red.600" : "red"}
            ml={2}
            _hover={{
              background: colorMode === "dark" ? "red.700" : "red.400",
            }}
          />
        </Tooltip>
      </div>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent
          bg={colorMode === "dark" ? "gray.800" : "white"}
          color={colorMode === "dark" ? "whiteAlpha.900" : "black"}
        >
          <ModalHeader
            display="flex"
            justifyContent="center"
            fontSize="35px"
            fontFamily="Work sans"
            color={colorMode === "dark" ? "whiteAlpha.900" : "black"}
          >
            {selectedChat.chatName}
          </ModalHeader>
          <ModalCloseButton
            color={colorMode === "dark" ? "yellow.300" : "gray.700"}
          />
          <ModalBody>
            <Box
              w="100%"
              display="flex"
              flexWrap="wrap"
              pb="3"
              color={colorMode === "dark" ? "whiteAlpha.900" : "black"}
            >
              {selectedChat.users.map((user) => (
                <UserBadgeItem
                  key={user._id}
                  user={user}
                  handleFunction={() => handleRemove(user)}
                />
              ))}
            </Box>

            <FormControl display="flex">
              <Input
                placeholder="Chat Name"
                mb="3"
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
              />
              <Button
                variant="solid"
                colorScheme="teal"
                ml={1}
                isLoading={renameLoading}
                onClick={handleRename}
              >
                Update
              </Button>
            </FormControl>

            <FormControl>
              <Input
                placeholder="Add User to group"
                mb="1"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </FormControl>

            {loading ? (
              <Spinner size="lg" />
            ) : (
              searchResults?.map((user) => (
                <UserListItem
                  key={user._id}
                  user={user}
                  handleFunction={() => handleAddUser(user)}
                />
              ))
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              onClick={() => handleRemove(user)}
              colorScheme="red"
              bg={colorMode === "dark" ? "red.600" : undefined}
              _hover={{ bg: colorMode === "dark" ? "red.700" : "red.400" }}
            >
              Leave Group
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UpdateGroupChatModal;
