import React, { useEffect, useState } from "react";
import { ViewIcon } from "@chakra-ui/icons";
import {
  Button,
  IconButton,
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
  Box,
} from "@chakra-ui/react";

/* initials helper */
function initialsFromName(name = "") {
  return name
    .split(" ")
    .map((n) => (n ? n[0] : ""))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const ProfileModal = ({ user, children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [attemptedSrc, setAttemptedSrc] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const src = (user && user.pic) || null;
    setAttemptedSrc(src);

    if (!src) {
      setImageLoaded(false);
      return;
    }

    let mounted = true;
    const img = new Image();
    img.onload = () => {
      if (mounted) setImageLoaded(true);
    };
    img.onerror = () => {
      if (mounted) setImageLoaded(false);
    };
    img.src = src;

    return () => {
      mounted = false;
    };
  }, [isOpen, user && user.pic]);

  const avatarSize = 140;
  const avatarStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: Math.floor(avatarSize / 3.5),
    fontWeight: 700,
    color: "#fff",
    backgroundColor: "#1e5bd8",
    backgroundSize: "cover",
    backgroundPosition: "center",
    boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
  };

  const backgroundImage = imageLoaded ? `url("${user.pic}")` : undefined;

  return (
    <>
      {/* always show a visible eye-button trigger */}
      {children ? (
        <Box as="span" onClick={onOpen} cursor="pointer">
          {children}
        </Box>
      ) : (
        <IconButton
          aria-label="View Profile"
          icon={<ViewIcon />}
          onClick={onOpen}
          variant="ghost"
          size="sm"
          colorScheme="blue"
        />
      )}

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent
          bg="#27353d"
          color="white"
          borderRadius="8px"
          boxShadow="lg"
          overflow="visible"
        >
          <ModalHeader
            textAlign="center"
            fontSize={{ base: "20px", md: "26px" }}
            fontWeight="700"
            pr="64px"
            whiteSpace="normal"
            wordBreak="break-word"
          >
            {user && user.name ? user.name : "User"}
          </ModalHeader>

          <ModalCloseButton zIndex={2} color="white" />

          <ModalBody>
            <VStack spacing={5} align="center" mt={2} mb={2}>
              <Box
                aria-hidden
                style={{
                  ...avatarStyle,
                  backgroundImage: backgroundImage,
                }}
              >
                {!backgroundImage && (
                  <Box style={{ pointerEvents: "none" }}>
                    {initialsFromName(user && user.name ? user.name : "U")}
                  </Box>
                )}
              </Box>

              <Text
                fontSize={{ base: "15px", md: "17px" }}
                color="white"
                textAlign="center"
                px={4}
                wordBreak="break-word"
              >
                <strong>Email:</strong> {user && user.email ? user.email : "Not provided"}
              </Text>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProfileModal;
