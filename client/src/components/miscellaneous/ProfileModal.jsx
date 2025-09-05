import { ViewIcon } from "@chakra-ui/icons";
import {
  Avatar,
  Button,
  IconButton,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";

const ProfileModal = ({ user, children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <IconButton display={{ base: "flex" }} icon={<ViewIcon />} onClick={onOpen} />
      )}

      <Modal size="lg" isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            display="flex"
            justifyContent="center"
            fontSize="35px"
            fontFamily="Work sans"
            fontWeight="bold"
          >
            {user.name}
          </ModalHeader>

          <ModalCloseButton />

          <ModalBody>
            <VStack spacing={6} align="center" justify="center">
              {/* Profile Picture with guaranteed fallback */}
              <Image
                borderRadius="full"
                boxSize="150px"
                src={user.pic}
                alt={user.name}
                objectFit="cover"
                fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.name
                )}&background=random`}
              />

              {/* Email */}
              <Text fontSize="20px" fontFamily="Work sans">
                Email: {user.email}
              </Text>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProfileModal;
