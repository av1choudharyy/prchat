// client/src/components/miscellaneous/ProfileModal.jsx
import React from "react";
import {
  Avatar,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  VStack,
  Text,
  HStack,
  Box,
  IconButton,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import { InfoIcon } from "@chakra-ui/icons";

/**
 * ProfileModal
 *
 * Props:
 *  - user: object | null
 *
 * Defensive: if `user` is null/undefined, renders nothing.
 */
const ProfileModal = ({ user }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Hooks MUST be unconditional (top-level always)
  const bg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("black", "white");
  const subTextColor = useColorModeValue("gray.600", "gray.300");

  // Defensive check AFTER hooks
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Trigger: avatar + name */}
      <HStack spacing={2} cursor="pointer" onClick={onOpen} alignItems="center">
        <Tooltip label="View profile" hasArrow>
          <Avatar name={user.name} size="sm" src={user.pic} />
        </Tooltip>
        <Text fontSize="sm" fontWeight="medium">
          {user.name}
        </Text>
        <IconButton
          aria-label="Profile info"
          size="sm"
          icon={<InfoIcon />}
          variant="ghost"
          onClick={onOpen}
        />
      </HStack>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={bg} color={textColor}>
          <ModalHeader>Profile</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="start">
              <HStack spacing={4} align="center" w="100%">
                <Avatar name={user.name} size="2xl" src={user.pic} />
                <Box>
                  <Text fontWeight="semibold" fontSize="lg">
                    {user.name}
                  </Text>
                  <Text fontSize="sm" color={subTextColor}>
                    {user.email}
                  </Text>
                </Box>
              </HStack>

              {user.about && (
                <Box>
                  <Text fontSize="sm" fontWeight="semibold">
                    About
                  </Text>
                  <Text fontSize="sm" color={subTextColor}>
                    {user.about}
                  </Text>
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProfileModal;
