import React, { useState } from 'react';
import {
    Box,
    Image,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Text,
    useColorMode,
    Spinner,
    Center
} from '@chakra-ui/react';

const ImagePreview = ({ attachment, maxWidth = "200px", maxHeight = "200px" }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const { colorMode } = useColorMode();

    const imageUrl = `http://localhost:5000/uploads/${attachment.filename}`;

    const handleImageLoad = () => {
        setImageLoaded(true);
    };

    const handleImageError = () => {
        setImageError(true);
        setImageLoaded(true);
    };

    if (imageError) {
        return (
            <Box
                maxWidth={maxWidth}
                maxHeight={maxHeight}
                bg={colorMode === "light" ? "gray.100" : "gray.700"}
                borderRadius="md"
                p={4}
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Text fontSize="sm" color={colorMode === "light" ? "gray.600" : "gray.400"}>
                    Image not available
                </Text>
            </Box>
        );
    }

    return (
        <>
            <Box
                position="relative"
                maxWidth={maxWidth}
                maxHeight={maxHeight}
                cursor="pointer"
                onClick={onOpen}
                borderRadius="md"
                overflow="hidden"
                bg={colorMode === "light" ? "gray.100" : "gray.700"}
                _hover={{
                    transform: "scale(1.02)",
                    transition: "transform 0.2s"
                }}
            >
                {!imageLoaded && (
                    <Center position="absolute" top="0" left="0" right="0" bottom="0" zIndex={1}>
                        <Spinner size="md" color="blue.500" />
                    </Center>
                )}

                <Image
                    src={imageUrl}
                    alt={attachment.originalName}
                    maxWidth={maxWidth}
                    maxHeight={maxHeight}
                    objectFit="cover"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    opacity={imageLoaded ? 1 : 0}
                    transition="opacity 0.3s"
                />
            </Box>

            <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered>
                <ModalOverlay bg="blackAlpha.800" />
                <ModalContent bg="transparent" boxShadow="none" maxW="90vw" maxH="90vh">
                    <ModalCloseButton
                        color="white"
                        bg="blackAlpha.600"
                        _hover={{ bg: "blackAlpha.800" }}
                        size="lg"
                        zIndex={2}
                    />
                    <ModalBody p={0} display="flex" alignItems="center" justifyContent="center">
                        <Image
                            src={imageUrl}
                            alt={attachment.originalName}
                            maxW="100%"
                            maxH="90vh"
                            objectFit="contain"
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};

export default ImagePreview;
