import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  VStack, HStack, Avatar, Text, Checkbox, Input, InputGroup, InputLeftElement,
  Button, Box, Badge, Divider
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { ChatState } from '../context/ChatProvider';

const ForwardModal = ({ isOpen, onClose, message, onForward }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allChats, setAllChats] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const { user, chats, darkMode } = ChatState();

  useEffect(() => {
    if (isOpen) {
      fetchAllUsers();
      setAllChats(chats);
    }
  }, [isOpen, chats]);

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/user/all', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const users = await response.json();
      setAllUsers(users.filter(u => u._id !== user._id));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const filteredChats = allChats.filter(chat =>
    chat.chatName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.users?.some(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRecipient = (recipient, type) => {
    const id = `${type}-${recipient._id}`;
    setSelectedRecipients(prev => {
      const exists = prev.find(r => r.id === id);
      if (exists) {
        return prev.filter(r => r.id !== id);
      } else {
        return [...prev, { id, recipient, type }];
      }
    });
  };

  const handleForward = async () => {
    for (const { recipient, type } of selectedRecipients) {
      try {
        if (type === 'chat') {
          await onForward(recipient._id);
        } else {
          // Create individual chat and forward
          const chatResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: recipient._id })
          });
          const chat = await chatResponse.json();
          await onForward(chat._id);
        }
      } catch (error) {
        console.error('Forward failed:', error);
      }
    }
    setSelectedRecipients([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent bg={darkMode ? "gray.800" : "white"} color={darkMode ? "white" : "black"}>
        <ModalHeader>Forward Message</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <InputGroup>
              <InputLeftElement>
                <SearchIcon color={darkMode ? "gray.400" : "gray.500"} />
              </InputLeftElement>
              <Input
                placeholder="Search chats and contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg={darkMode ? "gray.700" : "gray.50"}
                border="none"
              />
            </InputGroup>

            {selectedRecipients.length > 0 && (
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={2}>
                  Selected ({selectedRecipients.length})
                </Text>
                <HStack spacing={2} flexWrap="wrap">
                  {selectedRecipients.map(({ id, recipient, type }) => (
                    <Badge
                      key={id}
                      colorScheme="blue"
                      variant="solid"
                      px={2}
                      py={1}
                      borderRadius="full"
                      cursor="pointer"
                      onClick={() => toggleRecipient(recipient, type)}
                    >
                      {type === 'chat' ? recipient.chatName : recipient.name} ×
                    </Badge>
                  ))}
                </HStack>
                <Divider my={3} />
              </Box>
            )}

            <Box maxH="300px" overflowY="auto">
              <VStack spacing={1} align="stretch">
                <Text fontSize="sm" fontWeight="semibold" color={darkMode ? "gray.300" : "gray.600"}>
                  Recent Chats
                </Text>
                {filteredChats.map(chat => (
                  <HStack
                    key={`chat-${chat._id}`}
                    p={2}
                    borderRadius="8px"
                    cursor="pointer"
                    _hover={{ bg: darkMode ? "gray.700" : "gray.50" }}
                    onClick={() => toggleRecipient(chat, 'chat')}
                  >
                    <Checkbox
                      isChecked={selectedRecipients.some(r => r.id === `chat-${chat._id}`)}
                      colorScheme="blue"
                    />
                    <Avatar size="sm" name={chat.chatName} />
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="medium">
                        {chat.isGroupChat ? chat.chatName : 
                          chat.users.find(u => u._id !== user._id)?.name || 'Unknown'
                        }
                      </Text>
                      <Text fontSize="xs" color={darkMode ? "gray.400" : "gray.500"}>
                        {chat.isGroupChat ? `${chat.users.length} members` : 'Direct message'}
                      </Text>
                    </Box>
                  </HStack>
                ))}

                <Text fontSize="sm" fontWeight="semibold" color={darkMode ? "gray.300" : "gray.600"} mt={4}>
                  All Contacts
                </Text>
                {filteredUsers.map(contact => (
                  <HStack
                    key={`user-${contact._id}`}
                    p={2}
                    borderRadius="8px"
                    cursor="pointer"
                    _hover={{ bg: darkMode ? "gray.700" : "gray.50" }}
                    onClick={() => toggleRecipient(contact, 'user')}
                  >
                    <Checkbox
                      isChecked={selectedRecipients.some(r => r.id === `user-${contact._id}`)}
                      colorScheme="blue"
                    />
                    <Avatar size="sm" src={contact.pic} name={contact.name} />
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="medium">{contact.name}</Text>
                      <Text fontSize="xs" color={darkMode ? "gray.400" : "gray.500"}>
                        {contact.email}
                      </Text>
                    </Box>
                  </HStack>
                ))}
              </VStack>
            </Box>

            <HStack spacing={3} pt={4}>
              <Button variant="ghost" onClick={onClose} flex={1}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleForward}
                isDisabled={selectedRecipients.length === 0}
                flex={1}
              >
                Forward to {selectedRecipients.length} recipient{selectedRecipients.length !== 1 ? 's' : ''}
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ForwardModal;