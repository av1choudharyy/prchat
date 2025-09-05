import { ViewIcon } from "@chakra-ui/icons";
import {
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
} from "@chakra-ui/react";
import { ChatState } from "../../context/ChatProvider";

const ProfileModal = ({ user, children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { darkMode } = ChatState();

  return (
    <>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <IconButton
          display={{ base: "flex" }}
          icon={<ViewIcon />}
          onClick={onOpen}
          bg={darkMode ? "gray.600" : "white"}
          color={darkMode ? "white" : "black"}
          _hover={{ bg: darkMode ? "gray.500" : "gray.100" }}
          borderColor={darkMode ? "gray.500" : "gray.200"}
        />
      )}

      {/* Profile Modal */}
      <Modal size="lg" isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />

        <ModalContent h="410px" bg={darkMode ? "gray.800" : "white"} color={darkMode ? "white" : "black"}>
          <ModalHeader
            display="flex"
            justifyContent="center"
            fontSize="32px"
            fontFamily="Work sans"
          >
            {user.name}
          </ModalHeader>

          <ModalCloseButton />

          <ModalBody
            display="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="space-between"
          >
            {/* Profile Picture */}
            <Image
              borderRadius="full"
              boxSize="150px"
              src={user.pic}
              alt={user.name}
              border="4px solid"
              borderColor={darkMode ? "gray.600" : "gray.200"}
            />

            {/* Email Address */}
            <Text
              fontSize={{ base: "20px", md: "22px" }}
              fontFamily="Work sans"
            >
              Email: {user.email}
            </Text>
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
