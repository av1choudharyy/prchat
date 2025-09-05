import { ViewIcon, Search2Icon, CloseIcon } from "@chakra-ui/icons";
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
  useColorMode,
  useDisclosure,
  Input,
  Tooltip,
} from "@chakra-ui/react";
import { useState } from "react";
import { ChatState } from "../../context/ChatProvider";

const ProfileModal = ({
  user,
  children,
  searchValue,
  setSearchValue,
  matchIndexes = [],
  currentMatch = 0,
  setCurrentMatch = () => {},
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { setSelectedChat } = ChatState();

  const [showSearchBar, setShowSearchBar] = useState(false);

  const { colorMode } = useColorMode();

  return (
    <>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <>
          {showSearchBar && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 8,
                width: "50%",
                position: "relative",
              }}
            >
              <Input
                placeholder="Search messages..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                flex="1"
                borderRadius="4px"
                border="1px solid"
                borderColor={
                  colorMode == "dark" ? "whiteAlpha.300" : "gray.300"
                }
                fontSize="1rem"
                color={colorMode == "dark" ? "white" : "gray.700"}
                bg="transparent"
                px="4px"
                _placeholder={{
                  color: colorMode == "dark" ? "whiteAlpha.800" : "gray.500",
                }} // 👈 works
              />
              <IconButton
                icon={<CloseIcon />}
                size="sm"
                // variant="ghost"
                onClick={() => {
                  setShowSearchBar(false);
                  setSearchValue("");
                }}
                style={{
                  position: "absolute",
                  right: 4,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 2,
                }}
                aria-label="Close search"
              />
            </div>
          )}
          {/* Arrow navigation and match count outside input, only when search bar is active and matches exist */}
          {showSearchBar && searchValue && matchIndexes.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 8,
                justifyContent: "center",
                gap: 8,
              }}
            >
              <button
                onClick={() =>
                  setCurrentMatch((prev) =>
                    prev === 0 ? matchIndexes.length - 1 : prev - 1
                  )
                }
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
                title="Up"
                tabIndex={-1}
              >
                &#8593;
              </button>
              <span
                style={{
                  fontSize: "13px",
                  background: "#eee",
                  borderRadius: "3px",
                  color: colorMode === "dark" ? "#222" : "#555",
                  padding: "0 8px",
                }}
              >
                {currentMatch + 1} / {matchIndexes.length}
              </span>
              <button
                onClick={() =>
                  setCurrentMatch((prev) =>
                    prev === matchIndexes.length - 1 ? 0 : prev + 1
                  )
                }
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
                title="Down"
                tabIndex={-1}
              >
                &#8595;
              </button>
            </div>
          )}
          <div style={{ display: "flex" }}>
            {!showSearchBar && (
              <Tooltip label="Search messages" hasArrow>
                <IconButton
                  display={{ base: "flex" }}
                  icon={
                    <Search2Icon
                      color={colorMode === "dark" ? "yellow.300" : "gray.700"}
                    />
                  }
                  onClick={() => setShowSearchBar(true)}
                  mr={2}
                  aria-label="Search"
                  bg={colorMode === "dark" ? "gray.700" : "white"}
                  _hover={{
                    bg: colorMode === "dark" ? "gray.600" : "gray.100",
                  }}
                />
              </Tooltip>
            )}
            <Tooltip label="View User" hasArrow>
              <IconButton
                display={{ base: "flex" }}
                icon={<ViewIcon />}
                onClick={onOpen}
              />
            </Tooltip>
            <Tooltip label="Close" hasArrow>
              <IconButton
                icon={
                  <span
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: colorMode === "dark" ? "#FFD700" : "#222",
                    }}
                  >
                    x
                  </span>
                }
                variant="ghost"
                aria-label="Close"
                onClick={() => {
                  setSelectedChat(null);
                  localStorage.removeItem("selectedChat");
                }}
                background={colorMode === "dark" ? "red.600" : "red"}
                ml={2}
                _hover={{
                  background: colorMode === "dark" ? "red.700" : "red.400",
                }}
              />
            </Tooltip>
          </div>
        </>
      )}

      {/* Profile Modal */}
      <Modal size="lg" isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />

        <ModalContent h="410px">
          <ModalHeader
            display="flex"
            justifyContent="center"
            fontSize="40px"
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
            />

            {/* Email Address */}
            <Text
              fontSize={{ base: "28px", md: "30px" }}
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
