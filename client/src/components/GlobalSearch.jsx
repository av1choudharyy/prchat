import { 
  Modal, ModalOverlay, ModalContent, ModalBody, Input, VStack, 
  HStack, Text, Avatar, Badge, Box, Tabs, TabList, Tab, TabPanels, TabPanel
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';

const GlobalSearch = ({ isOpen, onClose, darkMode }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ messages: [], chats: [], files: [] });
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (query.length > 2) {
      performGlobalSearch(query);
    }
  }, [query]);

  const performGlobalSearch = async (searchQuery) => {
    try {
      const response = await fetch(`/api/search/global?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Global search failed:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={darkMode ? "gray.800" : "white"} maxH="80vh">
        <ModalBody p={0}>
          <Box p={4} borderBottom="1px solid" borderColor={darkMode ? "gray.600" : "gray.200"}>
            <Input
              placeholder="Search messages, chats, and files..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              size="lg"
              bg={darkMode ? "gray.700" : "gray.50"}
              border="none"
              _focus={{ bg: darkMode ? "gray.600" : "white", boxShadow: "outline" }}
            />
          </Box>

          <Tabs index={activeTab} onChange={setActiveTab}>
            <TabList px={4}>
              <Tab>Messages ({results.messages?.length || 0})</Tab>
              <Tab>Chats ({results.chats?.length || 0})</Tab>
              <Tab>Files ({results.files?.length || 0})</Tab>
            </TabList>

            <TabPanels maxH="400px" overflowY="auto">
              <TabPanel>
                <VStack spacing={3} align="stretch">
                  {results.messages?.map(msg => (
                    <HStack key={msg._id} p={3} _hover={{ bg: darkMode ? "gray.700" : "gray.50" }} borderRadius="8px">
                      <Avatar size="sm" src={msg.sender.pic} />
                      <Box flex={1}>
                        <HStack justify="space-between">
                          <Text fontWeight="semibold" fontSize="sm">{msg.sender.name}</Text>
                          <Text fontSize="xs" color={darkMode ? "gray.400" : "gray.500"}>
                            {new Date(msg.createdAt).toLocaleDateString()}
                          </Text>
                        </HStack>
                        <Text fontSize="sm" noOfLines={2}>{msg.content}</Text>
                        <Badge size="sm" colorScheme="blue">{msg.chat.chatName}</Badge>
                      </Box>
                    </HStack>
                  ))}
                </VStack>
              </TabPanel>

              <TabPanel>
                <VStack spacing={3} align="stretch">
                  {results.chats?.map(chat => (
                    <HStack key={chat._id} p={3} _hover={{ bg: darkMode ? "gray.700" : "gray.50" }} borderRadius="8px">
                      <Avatar size="sm" src={chat.pic} />
                      <Box flex={1}>
                        <Text fontWeight="semibold">{chat.chatName}</Text>
                        <Text fontSize="sm" color={darkMode ? "gray.400" : "gray.500"}>
                          {chat.users.length} members
                        </Text>
                      </Box>
                    </HStack>
                  ))}
                </VStack>
              </TabPanel>

              <TabPanel>
                <VStack spacing={3} align="stretch">
                  {results.files?.map(file => (
                    <HStack key={file._id} p={3} _hover={{ bg: darkMode ? "gray.700" : "gray.50" }} borderRadius="8px">
                      <Text fontSize="24px">{file.type.includes('image') ? '🖼️' : '📄'}</Text>
                      <Box flex={1}>
                        <Text fontWeight="semibold" fontSize="sm">{file.fileName}</Text>
                        <Text fontSize="xs" color={darkMode ? "gray.400" : "gray.500"}>
                          Shared by {file.sender.name} • {new Date(file.createdAt).toLocaleDateString()}
                        </Text>
                      </Box>
                    </HStack>
                  ))}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default GlobalSearch;