import React from 'react';
import {
    Box,
    Text,
    Icon,
    HStack,
    useColorMode,
    Link
} from '@chakra-ui/react';
import { DownloadIcon, AttachmentIcon } from '@chakra-ui/icons';

const FilePreview = ({ attachment }) => {
    const { colorMode } = useColorMode();

    const fileUrl = `http://localhost:5000/uploads/${attachment.filename}`;

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (mimetype) => {
        if (!mimetype || typeof mimetype !== 'string') return '';

        const type = mimetype.toLowerCase();
        if (type.includes('pdf')) return '';
        if (type.includes('word') || type.includes('document')) return '';
        if (type.includes('sheet') || type.includes('excel')) return '';
        if (type.includes('presentation') || type.includes('powerpoint')) return '';
        if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return '';
        if (type.includes('text')) return '';
        if (type.includes('video')) return '';
        if (type.includes('audio')) return '';
        return '';
    };

    // Safety check for attachment object
    if (!attachment || !attachment.filename) {
        return (
            <Box
                bg={colorMode === "light" ? "gray.50" : "gray.700"}
                border="1px solid"
                borderColor={colorMode === "light" ? "gray.200" : "gray.600"}
                borderRadius="md"
                p={3}
                maxWidth="300px"
            >
                <Text fontSize="sm" color={colorMode === "light" ? "gray.600" : "gray.400"}>
                    File not available
                </Text>
            </Box>
        );
    }

    return (
        <Box
            bg={colorMode === "light" ? "gray.50" : "gray.700"}
            border="1px solid"
            borderColor={colorMode === "light" ? "gray.200" : "gray.600"}
            borderRadius="md"
            p={3}
            maxWidth="300px"
            _hover={{
                bg: colorMode === "light" ? "gray.100" : "gray.600",
                borderColor: colorMode === "light" ? "gray.300" : "gray.500"
            }}
            transition="all 0.2s"
        >
            <HStack spacing={3}>
                <Box fontSize="24px">
                    {getFileIcon(attachment.mimetype)}
                </Box>

                <Box flex={1} minWidth={0}>
                    <Text
                        fontSize="sm"
                        fontWeight="medium"
                        color={colorMode === "light" ? "gray.800" : "gray.200"}
                        isTruncated
                        title={attachment.originalName || attachment.filename}
                    >
                        {attachment.originalName || attachment.filename}
                    </Text>
                    <Text
                        fontSize="xs"
                        color={colorMode === "light" ? "gray.600" : "gray.400"}
                    >
                        {attachment.size ? formatFileSize(attachment.size) : 'Unknown size'}
                    </Text>
                </Box>

                <Link
                    href={fileUrl}
                    download={attachment.originalName || attachment.filename}
                    _hover={{ textDecoration: 'none' }}
                >
                    <Icon
                        as={DownloadIcon}
                        color={colorMode === "light" ? "blue.500" : "blue.300"}
                        _hover={{
                            color: colorMode === "light" ? "blue.600" : "blue.200",
                            transform: "scale(1.1)"
                        }}
                        transition="all 0.2s"
                        cursor="pointer"
                    />
                </Link>
            </HStack>
        </Box>
    );
};

export default FilePreview;
