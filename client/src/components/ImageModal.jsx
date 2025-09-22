import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Text,
  IconButton,
  HStack,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { MdDownload, MdClose } from "react-icons/md";

/**
 * ImageModal Component
 * A modal for viewing images in full size with zoom and download functionality
 */
const ImageModal = ({ isOpen, onClose, file, imageSrc }) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");

  const handleDownload = () => {
    if (imageSrc) {
      const link = document.createElement("a");
      link.href = imageSrc;
      link.download = file?.filename || "image";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" isCentered>
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent
        bg={bgColor}
        maxW="90vw"
        maxH="90vh"
        borderRadius="lg"
        overflow="hidden"
      >
        <ModalHeader>
          <HStack justify="space-between" w="full">
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                {file?.filename || "Image"}
              </Text>
              {file?.size && (
                <Text fontSize="sm" color="gray.500">
                  {(file.size / 1024).toFixed(1)} KB
                </Text>
              )}
            </VStack>
            <HStack spacing={2}>
              <IconButton
                icon={<MdDownload />}
                onClick={handleDownload}
                aria-label="Download image"
                size="sm"
                variant="ghost"
                colorScheme="blue"
              />
              <IconButton
                icon={<MdClose />}
                onClick={onClose}
                aria-label="Close modal"
                size="sm"
                variant="ghost"
                colorScheme="red"
              />
            </HStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={0} display="flex" alignItems="center" justifyContent="center">
          <Box
            w="100%"
            h="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="gray.50"
            position="relative"
          >
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={file?.filename || "Image"}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  borderRadius: "8px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <VStack spacing={4} color="gray.500">
                <Text fontSize="lg">No image to display</Text>
                <Text fontSize="sm">The image could not be loaded</Text>
              </VStack>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ImageModal;
