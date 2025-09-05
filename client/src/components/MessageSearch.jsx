import { useState } from "react";
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Text,
  Flex,
  Badge,
} from "@chakra-ui/react";
import { SearchIcon, CloseIcon } from "@chakra-ui/icons";

const MessageSearch = ({ 
  messages, 
  onSearchResults, 
  onHighlightMessage,
  currentResultIndex,
  setCurrentResultIndex 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    
    if (!value.trim()) {
      setSearchResults([]);
      onSearchResults([]);
      setCurrentResultIndex(-1);
      return;
    }

    // Filter messages that contain the search term
    const results = messages.filter(message =>
      message.content.toLowerCase().includes(value.toLowerCase())
    ).map(message => ({
      ...message,
      highlightedContent: highlightText(message.content, value)
    }));

    setSearchResults(results);
    onSearchResults(results);
    setCurrentResultIndex(results.length > 0 ? 0 : -1);
    
    // Highlight first result
    if (results.length > 0) {
      onHighlightMessage(results[0]._id);
    }
  };

  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  const navigateResults = (direction) => {
    if (searchResults.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentResultIndex + 1) % searchResults.length;
    } else {
      newIndex = currentResultIndex === 0 ? searchResults.length - 1 : currentResultIndex - 1;
    }
    
    setCurrentResultIndex(newIndex);
    onHighlightMessage(searchResults[newIndex]._id);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    onSearchResults([]);
    setCurrentResultIndex(-1);
    onHighlightMessage(null);
  };

  return (
    <Box bg="white" p={3} borderBottom="1px solid #E2E8F0">
      <InputGroup size="sm">
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.400" />
        </InputLeftElement>
        
        <Input
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          bg="gray.50"
          border="1px solid #E2E8F0"
          _focus={{
            bg: "white",
            borderColor: "blue.400",
            boxShadow: "0 0 0 1px #4299E1"
          }}
        />
        
        {searchTerm && (
          <InputRightElement>
            <IconButton
              size="xs"
              icon={<CloseIcon />}
              onClick={clearSearch}
              variant="ghost"
              aria-label="Clear search"
            />
          </InputRightElement>
        )}
      </InputGroup>

      {/* Search Results Summary */}
      {searchTerm && (
        <Flex justifyContent="space-between" alignItems="center" mt={2}>
          <Text fontSize="xs" color="gray.600">
            {searchResults.length > 0 
              ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} found`
              : 'No results found'
            }
          </Text>
          
          {searchResults.length > 1 && (
            <Flex alignItems="center" gap={2}>
              <Badge colorScheme="blue" fontSize="xs">
                {currentResultIndex + 1} of {searchResults.length}
              </Badge>
              <Flex gap={1}>
                <IconButton
                  size="xs"
                  icon={<>↑</>}
                  onClick={() => navigateResults('prev')}
                  variant="ghost"
                  aria-label="Previous result"
                />
                <IconButton
                  size="xs"
                  icon={<>↓</>}
                  onClick={() => navigateResults('next')}
                  variant="ghost"
                  aria-label="Next result"
                />
              </Flex>
            </Flex>
          )}
        </Flex>
      )}
    </Box>
  );
};

export default MessageSearch;
