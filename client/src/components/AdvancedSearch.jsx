import { useState, useEffect, useCallback } from 'react';
import {
  Box, Input, InputGroup, InputRightElement, IconButton, Text, HStack, VStack,
  Badge, Button, Kbd, useColorModeValue
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon, ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { ChatState } from '../context/ChatProvider';

const AdvancedSearch = ({ onSearchResults, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const { selectedChat, user, darkMode } = ChatState();

  const debounce = useCallback((func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }, []);

  const parseSearchQuery = (searchQuery) => {
    const filters = {
      text: '',
      sender: null,
      hasFile: false,
      before: null,
      after: null
    };

    const parts = searchQuery.split(' ');
    const textParts = [];

    parts.forEach(part => {
      if (part.startsWith('sender:@')) {
        filters.sender = part.substring(8);
      } else if (part === 'has:file') {
        filters.hasFile = true;
      } else if (part.startsWith('before:')) {
        filters.before = new Date(part.substring(7));
      } else if (part.startsWith('after:')) {
        filters.after = new Date(part.substring(6));
      } else {
        textParts.push(part);
      }
    });

    filters.text = textParts.join(' ');
    return filters;
  };

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      onSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const filters = parseSearchQuery(searchQuery);
      const response = await fetch(`/api/message/advanced-search/${selectedChat._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filters)
      });
      
      const data = await response.json();
      // Sort by newest first
      const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setResults(sortedData);
      onSearchResults(sortedData);
      
      if (sortedData.length > 0) {
        setCurrentIndex(0);
        // Highlight all search results first
        setTimeout(() => {
          sortedData.forEach(msg => {
            const element = document.querySelector(`[data-message-id="${msg._id}"]`);
            if (element) {
              element.classList.add('search-result-highlight');
            }
          });
          // Then focus on first result
          scrollToMessage(sortedData[0]);
        }, 100);
      } else {
        setCurrentIndex(-1);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = useCallback(debounce(performSearch, 300), [selectedChat, user]);

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const navigateResults = (direction) => {
    if (results.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = currentIndex < results.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : results.length - 1;
    }
    
    setCurrentIndex(newIndex);
    scrollToMessage(results[newIndex]);
  };

  const scrollToMessage = (message) => {
    // Clear previous highlights
    document.querySelectorAll('.highlight-search-result').forEach(el => {
      el.classList.remove('highlight-search-result');
    });
    
    const messageElement = document.querySelector(`[data-message-id="${message._id}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add highlight with stronger effect
      messageElement.classList.add('highlight-search-result');
      messageElement.classList.add('search-current-result');
      
      // Remove highlight after 5 seconds
      setTimeout(() => {
        messageElement.classList.remove('highlight-search-result');
        messageElement.classList.remove('search-current-result');
      }, 5000);
    }
  };

  const clearSearch = () => {
    // Clear all search highlights
    document.querySelectorAll('.search-result-highlight, .highlight-search-result, .search-current-result').forEach(el => {
      el.classList.remove('search-result-highlight', 'highlight-search-result', 'search-current-result');
    });
    
    setQuery('');
    setResults([]);
    setCurrentIndex(-1);
    onSearchResults([]);
    onClose();
  };

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={10}
      bg={darkMode ? 'gray.800' : 'white'}
      borderBottom="1px solid"
      borderColor={darkMode ? 'gray.600' : 'gray.200'}
      p={3}
    >
      <VStack spacing={3}>
        <HStack w="100%" spacing={2}>
          <InputGroup flex={1}>
            <Input
              placeholder="Search messages... (sender:@name, has:file, before:2024-01-01)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              bg={darkMode ? 'gray.700' : 'white'}
              border="1px solid"
              borderColor={darkMode ? 'gray.600' : 'gray.300'}
              _focus={{ borderColor: 'blue.500' }}
            />
            <InputRightElement>
              {query ? (
                <IconButton
                  icon={<CloseIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={clearSearch}
                />
              ) : (
                <SearchIcon color={darkMode ? 'gray.400' : 'gray.500'} />
              )}
            </InputRightElement>
          </InputGroup>
          
          {results.length > 0 && (
            <HStack spacing={2}>
              <Text fontSize="sm" color={darkMode ? 'gray.300' : 'gray.600'} fontWeight="medium">
                {currentIndex + 1} of {results.length}
              </Text>
              <IconButton
                icon={<ChevronUpIcon />}
                size="sm"
                variant="ghost"
                onClick={() => navigateResults('prev')}
                isDisabled={results.length === 0}
                title="Previous result (newer)"
                _hover={{ bg: darkMode ? 'gray.600' : 'gray.100' }}
              />
              <IconButton
                icon={<ChevronDownIcon />}
                size="sm"
                variant="ghost"
                onClick={() => navigateResults('next')}
                isDisabled={results.length === 0}
                title="Next result (older)"
                _hover={{ bg: darkMode ? 'gray.600' : 'gray.100' }}
              />
              <Text fontSize="xs" color={darkMode ? 'gray.400' : 'gray.500'}>
                {results[currentIndex] && new Date(results[currentIndex].createdAt).toLocaleString()}
              </Text>
            </HStack>
          )}
        </HStack>

        {query && (
          <HStack w="100%" justify="space-between" align="center">
            <HStack spacing={2}>
              <Badge colorScheme="blue" variant="subtle">
                Search active
              </Badge>
              {results.length > 0 && (
                <Badge colorScheme="green" variant="outline">
                  {results.length} found
                </Badge>
              )}
            </HStack>
            <HStack spacing={2}>
              <Button size="sm" variant="ghost" onClick={() => {
                // Clear current highlights but keep search results highlighted
                document.querySelectorAll('.highlight-search-result, .search-current-result').forEach(el => {
                  el.classList.remove('highlight-search-result', 'search-current-result');
                });
                
                const timeline = document.querySelector('.chat-timeline');
                if (timeline) {
                  timeline.scrollTop = timeline.scrollHeight;
                }
              }}>
                Jump to latest
              </Button>
              {results.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => {
                  if (results[currentIndex]) {
                    scrollToMessage(results[currentIndex]);
                  }
                }}>
                  Show current
                </Button>
              )}
            </HStack>
          </HStack>
        )}

        <HStack spacing={2} fontSize="xs" color={darkMode ? 'gray.400' : 'gray.500'}>
          <Text>Tips:</Text>
          <Kbd>sender:@john</Kbd>
          <Kbd>has:file</Kbd>
          <Kbd>before:2024-01-01</Kbd>
          <Kbd>after:2023-12-01</Kbd>
        </HStack>
      </VStack>
    </Box>
  );
};

export default AdvancedSearch;