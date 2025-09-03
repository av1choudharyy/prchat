import { useState } from "react";
import {
  Box,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  VStack,
  HStack,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useToast,
  Badge,
  IconButton,
} from "@chakra-ui/react";
import { SearchIcon, CloseIcon } from "@chakra-ui/icons";

const MessageSearch = ({ selectedChat, user, onSearchResults }) => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const handleSearch = async () => {
    if (!searchKeyword.trim() && !startDate && !endDate) {
      toast({
        title: "Please enter a search term or select date range",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
      return;
    }
   if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
  toast({
    title: "Invalid date range",
    description: "End date must be after start date",
    status: "warning",
    duration: 3000,
    isClosable: true,
    position: "bottom-right",
  });
  return;
}
    try {
      setIsSearching(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchKeyword.trim()) params.append("keyword", searchKeyword.trim());
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/message/search/${selectedChat._id}?${params}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results);
        setCurrentResultIndex(0);
        
        if (data.results.length === 0) {
          toast({
            title: "No messages found",
            description: "Try different search terms or date range",
            status: "info",
            duration: 3000,
            isClosable: true,
            position: "bottom-right",
          });
        } else {
          toast({
            title: `Found ${data.results.length} message(s)`,
            status: "success",
            duration: 2000,
            isClosable: true,
            position: "bottom-right",
          });
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
  let errorMessage = "Something went wrong. Please try again.";
  
  if (error.message.includes("Failed to fetch")) {
    errorMessage = "Cannot connect to server. Please check your internet connection.";
  } else if (error.message.includes("401")) {
    errorMessage = "Session expired. Please login again.";
  } else if (error.message.includes("404")) {
    errorMessage = "Search feature not available. Please try again later.";
  }
  
  toast({
    title: "Search failed",
    description: errorMessage,
    status: "error",
    duration: 5000,
    isClosable: true,
    position: "bottom-right",
  });
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchKeyword("");
    setStartDate("");
    setEndDate("");
    setSearchResults([]);
    setCurrentResultIndex(0);
    onSearchResults([]); // Clear results in parent component
  };

  const navigateResult = (direction) => {
    if (searchResults.length === 0) return;
    
    if (direction === "next") {
      setCurrentResultIndex((prev) => 
        prev < searchResults.length - 1 ? prev + 1 : 0
      );
    } else {
      setCurrentResultIndex((prev) => 
        prev > 0 ? prev - 1 : searchResults.length - 1
      );
    }
  };

  const highlightText = (text, keyword) => {
    if (!keyword.trim()) return text;
    
    const regex = new RegExp(`(${keyword})`, "gi");
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <Text as="span" key={index} bg="yellow.200" fontWeight="bold">
          {part}
        </Text>
      ) : (
        part
      )
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <IconButton
        icon={<SearchIcon />}
        onClick={onOpen}
        size="sm"
        variant="ghost"
        aria-label="Search messages"
      />

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Search Messages</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4}>
              {/* Search Input */}
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search messages..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                {searchKeyword && (
                  <InputRightElement>
                    <IconButton
                      icon={<CloseIcon />}
                      size="sm"
                      variant="ghost"
                      onClick={() => setSearchKeyword("")}
                    />
                  </InputRightElement>
                )}
              </InputGroup>

              {/* Date Range */}
              <HStack spacing={2} w="100%">
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Text>to</Text>
                <Input
                  type="date"
                  placeholder="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </HStack>

              {/* Search Button */}
              <Button
                colorScheme="blue"
                onClick={handleSearch}
                isLoading={isSearching}
                loadingText="Searching..."
                w="100%"
              >
                Search Messages
              </Button>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <Box w="100%">
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="sm" color="gray.600">
                      {searchResults.length} result(s) found
                    </Text>
                    <HStack>
                      <Button size="sm" onClick={() => navigateResult("prev")}>
                        Previous
                      </Button>
                      <Badge colorScheme="blue">
                        {currentResultIndex + 1} of {searchResults.length}
                      </Badge>
                      <Button size="sm" onClick={() => navigateResult("next")}>
                        Next
                      </Button>
                    </HStack>
                  </HStack>

                  <Box
                    maxH="300px"
                    overflowY="auto"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    p={3}
                  >
                    {searchResults.map((message, index) => (
                      <Box
                        key={message._id}
                        p={2}
                        bg={index === currentResultIndex ? "blue.50" : "white"}
                        borderLeft={index === currentResultIndex ? "4px solid" : "none"}
                        borderLeftColor="blue.500"
                        mb={2}
                        borderRadius="md"
                      >
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="sm" fontWeight="bold">
                            {message.sender.name}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {formatDate(message.createdAt)}
                          </Text>
                        </HStack>
                        <Text fontSize="sm">
                          {highlightText(message.content, searchKeyword)}
                        </Text>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={clearSearch}>
              Clear
            </Button>
            <Button colorScheme="blue" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default MessageSearch;

