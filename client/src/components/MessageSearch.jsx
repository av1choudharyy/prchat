import { useState } from "react";
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  Text,
  Button,
  useToast,
  HStack,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { SearchIcon, CloseIcon } from "@chakra-ui/icons";
import { ChatState } from "../context/ChatProvider";
import { getSender } from "../config/ChatLogics";

const MessageSearch = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user, selectedChat } = ChatState();
  const toast = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim() || !selectedChat) {
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/message/search/${selectedChat._id}?q=${encodeURIComponent(searchTerm)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results);
        if (data.count === 0) {
          toast({
            title: "No results found",
            description: `No messages found containing "${searchTerm}"`,
            status: "info",
            duration: 3000,
            isClosable: true,
            position: "top-right",
          });
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Failed to search messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Search Messages</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </InputGroup>

            <HStack spacing={2}>
              <Button
                colorScheme="blue"
                onClick={handleSearch}
                isLoading={isSearching}
                loadingText="Searching..."
                size="sm"
                flex={1}
              >
                Search
              </Button>
              <IconButton
                icon={<CloseIcon />}
                onClick={clearSearch}
                size="sm"
                variant="outline"
                aria-label="Clear search"
              />
            </HStack>

            {searchResults.length > 0 && (
              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Found {searchResults.length} result(s) for "{searchTerm}"
                </Text>
                <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto">
                  {searchResults.map((message) => (
                    <Box
                      key={message._id}
                      p={3}
                      borderWidth="1px"
                      borderRadius="md"
                      bg={message.sender._id === user._id ? "blue.50" : "green.50"}
                    >
                      <HStack justify="space-between" mb={1}>
                        <Text fontSize="sm" fontWeight="bold">
                          {message.sender._id === user._id
                            ? "You"
                            : getSender(user, [message.sender])}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {formatDate(message.createdAt)}
                        </Text>
                      </HStack>
                      <Text fontSize="sm">{message.content}</Text>
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default MessageSearch;