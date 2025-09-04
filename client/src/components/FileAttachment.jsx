import React, { useRef, useState } from 'react';
import {
    Box,
    IconButton,
    useToast,
    VStack,
    Text,
    Progress,
    useColorMode
} from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons';

const FileAttachment = ({ onFileSelect, isUploading }) => {
    const fileInputRef = useRef();
    const [dragActive, setDragActive] = useState(false);
    const toast = useToast();
    const { colorMode } = useColorMode();

    const handleFileSelect = (files) => {
        const file = files[0];
        if (!file) return;

        // Check file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Please select a file smaller than 50MB",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        // Check file type
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
            'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a',
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain', 'text/csv',
            'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
        ];

        if (!allowedTypes.includes(file.type)) {
            toast({
                title: "Invalid file type",
                description: "Please select a valid file type (images, videos, audio, documents, or archives)",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        onFileSelect(file);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <Box position="relative">
            <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files)}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
            />

            <IconButton
                aria-label="Attach file"
                icon={<AttachmentIcon />}
                size="sm"
                variant="ghost"
                onClick={handleClick}
                isLoading={isUploading}
                _hover={{ bg: colorMode === "light" ? "gray.100" : "gray.600" }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                bg={dragActive ? (colorMode === "light" ? "blue.100" : "blue.800") : "transparent"}
            />

            {dragActive && (
                <Box
                    position="absolute"
                    top="-20px"
                    left="-20px"
                    right="-20px"
                    bottom="-20px"
                    bg={colorMode === "light" ? "blue.50" : "blue.900"}
                    border="2px dashed"
                    borderColor="blue.300"
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    zIndex={10}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <Text fontSize="sm" color="blue.500" fontWeight="medium">
                        Drop file here
                    </Text>
                </Box>
            )}
        </Box>
    );
};

export default FileAttachment;
