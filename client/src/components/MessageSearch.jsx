// client/src/components/MessageSearch.jsx
import React, { useState } from "react";
import {
  IconButton,
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  VStack,
  Text,
  useDisclosure,
  List,
  ListItem,
  HStack,
  Badge,
  useColorModeValue,
  Tooltip
} from "@chakra-ui/react";
import { FiSearch } from "react-icons/fi";

/**
 * MessageSearch
 * Props:
 *  - messages: array
 *  - onJumpToMessage(messageId) => should perform scroll
 *
 * Provides an icon button (for header) that opens a modal.
 */
const MessageSearch = ({ messages = [], onJumpToMessage }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [query, setQuery] = useState("");
  const bg = useColorModeValue("white", "gray.800");

  const results = query.trim()
    ? messages
        .filter((m) => (m.content || "").toLowerCase().includes(query.toLowerCase()))
        .slice(0, 200)
    : [];

  return (
    <>
      <Tooltip label="Search messages">
        <IconButton aria-label="Search messages" icon={<FiSearch />} onClick={onOpen} size="sm" variant="ghost" />
      </Tooltip>

      <Modal isOpen={isOpen} onClose={() => { setQuery(""); onClose(); }} isCentered size="lg">
        <ModalOverlay />
        <ModalContent bg={bg}>
          <ModalHeader>Search messages</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <Input placeholder="Search messages..." value={query} onChange={(e) => setQuery(e.target.value)} />
              <Box maxH="50vh" overflowY="auto">
                {!query ? (
                  <Text color="gray.500">Enter text to search messages</Text>
                ) : results.length === 0 ? (
                  <Text color="gray.500">No matches</Text>
                ) : (
                  <List spacing={2}>
                    {results.map((m) => (
                      <ListItem
                        key={m._id}
                        p={2}
                        borderRadius="md"
                        _hover={{ bg: useColorModeValue("gray.50", "gray.700"), cursor: "pointer" }}
                        onClick={() => {
                          onJumpToMessage(m._id);
                          setQuery("");
                          onClose();
                        }}
                      >
                        <HStack justify="space-between">
                          <Box>
                            <Text noOfLines={2} fontSize="sm">{m.content || "—"}</Text>
                            <Text fontSize="xs" color="gray.500">{new Date(m.createdAt).toLocaleString()}</Text>
                          </Box>
                          <Badge>{m.sender?.name ? m.sender.name.split(" ")[0] : "—"}</Badge>
                        </HStack>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default MessageSearch;
