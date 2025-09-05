import React, { useState } from 'react';
import {
  Box,
  Image,
  Text,
  HStack,
  VStack,
  IconButton,
  Button,
  Badge,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Spinner,
  Center
} from '@chakra-ui/react';
import {
  DownloadIcon,
  ViewIcon,
  DeleteIcon
} from '@chakra-ui/icons';
import {
  FaFile,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileArchive,
  FaFileVideo,
  FaFileAudio,
  FaFileImage,
  FaFileCode,
  FaFileAlt
} from 'react-icons/fa';

const FileMessage = ({ 
  message, 
  isOwnMessage, 
  onDeleteMessage, 
  showDeleteOption = false 
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const bgColor = useColorModeValue(
    isOwnMessage ? 'blue.500' : 'gray.200',
    isOwnMessage ? 'blue.600' : 'gray.600'
  );
  
  const textColor = useColorModeValue(
    isOwnMessage ? 'white' : 'black',
    isOwnMessage ? 'white' : 'white'
  );

  const borderColor = useColorModeValue('gray.300', 'gray.600');

  if (!message.fileData) return null;

  const { fileData } = message;
  const isImage = message.messageType === 'image' || fileData.mimeType?.startsWith('image/');

  // Get file icon based on mime type or extension
  const getFileIcon = () => {
    const mimeType = fileData.mimeType?.toLowerCase() || '';
    const fileName = fileData.originalName?.toLowerCase() || '';

    if (mimeType.startsWith('image/')) return FaFileImage;
    if (mimeType.startsWith('video/')) return FaFileVideo;
    if (mimeType.startsWith('audio/')) return FaFileAudio;
    if (mimeType === 'application/pdf') return FaFilePdf;
    if (mimeType.includes('word') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) return FaFileWord;
    if (mimeType.includes('excel') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return FaFileExcel;
    if (mimeType.includes('powerpoint') || fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return FaFilePowerpoint;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return FaFileArchive;
    if (mimeType.startsWith('text/') || fileName.endsWith('.txt')) return FaFileAlt;
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx') || fileName.endsWith('.ts') || fileName.endsWith('.tsx') || 
        fileName.endsWith('.html') || fileName.endsWith('.css') || fileName.endsWith('.json')) return FaFileCode;
    
    return FaFile;
  };

  const FileIcon = getFileIcon();

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileData.fileUrl;
    link.download = fileData.originalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = () => {
    if (isImage) {
      setIsPreviewOpen(true);
    } else {
      // For non-images, open in new tab
      window.open(fileData.fileUrl, '_blank');
    }
  };

  const handleDelete = () => {
    if (onDeleteMessage && window.confirm('Are you sure you want to delete this file?')) {
      onDeleteMessage(message._id);
    }
  };

  const getBadgeColor = () => {
    const mimeType = fileData.mimeType?.toLowerCase() || '';
    
    if (mimeType.startsWith('image/')) return 'green';
    if (mimeType.startsWith('video/')) return 'purple';
    if (mimeType.startsWith('audio/')) return 'orange';
    if (mimeType === 'application/pdf') return 'red';
    if (mimeType.includes('word')) return 'blue';
    if (mimeType.includes('excel')) return 'teal';
    if (mimeType.includes('powerpoint')) return 'pink';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'gray';
    
    return 'gray';
  };

  return (
    <>
      <Box
        bg={bgColor}
        color={textColor}
        borderRadius="lg"
        p={3}
        maxW="300px"
        border="1px solid"
        borderColor={borderColor}
      >
        <VStack spacing={2} align="stretch">
          {/* File Header */}
          <HStack spacing={2}>
            <Box as={FileIcon} size="20px" />
            <VStack spacing={0} align="start" flex={1} minW={0}>
              <Text fontSize="sm" fontWeight="medium" isTruncated>
                {fileData.originalName}
              </Text>
              <HStack spacing={2}>
                <Badge size="sm" colorScheme={getBadgeColor()}>
                  {message.messageType || 'file'}
                </Badge>
                <Text fontSize="xs" opacity={0.8}>
                  {formatFileSize(fileData.fileSize)}
                </Text>
              </HStack>
            </VStack>
          </HStack>

          {/* Image Preview */}
          {isImage && (
            <Box
              position="relative"
              borderRadius="md"
              overflow="hidden"
              cursor="pointer"
              onClick={handlePreview}
              _hover={{ opacity: 0.8 }}
              transition="opacity 0.2s"
            >
              {imageLoading && (
                <Center h="150px" bg="gray.100">
                  <Spinner size="md" />
                </Center>
              )}
              <Image
                src={fileData.fileUrl}
                alt={fileData.originalName}
                maxH="150px"
                w="100%"
                objectFit="cover"
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
                display={imageLoading ? 'none' : 'block'}
              />
            </Box>
          )}

          {/* Message Content */}
          {message.content && (
            <Text fontSize="sm" opacity={0.9}>
              {message.content}
            </Text>
          )}

          {/* Actions */}
          <HStack spacing={1} justify="flex-end">
            <IconButton
              icon={<DownloadIcon />}
              size="sm"
              variant="ghost"
              colorScheme={isOwnMessage ? 'whiteAlpha' : 'gray'}
              onClick={handleDownload}
              title="Download file"
            />
            
            {isImage && (
              <IconButton
                icon={<ViewIcon />}
                size="sm"
                variant="ghost"
                colorScheme={isOwnMessage ? 'whiteAlpha' : 'gray'}
                onClick={handlePreview}
                title="View image"
              />
            )}
            
            {showDeleteOption && (
              <IconButton
                icon={<DeleteIcon />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={handleDelete}
                title="Delete file"
              />
            )}
          </HStack>
        </VStack>
      </Box>

      {/* Image Preview Modal */}
      {isImage && (
        <Modal 
          isOpen={isPreviewOpen} 
          onClose={() => setIsPreviewOpen(false)} 
          size="xl"
          isCentered
        >
          <ModalOverlay />
          <ModalContent maxW="90vw" maxH="90vh">
            <ModalHeader>{fileData.originalName}</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Center>
                <Image
                  src={fileData.fileUrl}
                  alt={fileData.originalName}
                  maxW="100%"
                  maxH="70vh"
                  objectFit="contain"
                />
              </Center>
              <HStack spacing={2} mt={4} justify="center">
                <Button leftIcon={<DownloadIcon />} onClick={handleDownload}>
                  Download
                </Button>
                {showDeleteOption && (
                  <Button leftIcon={<DeleteIcon />} colorScheme="red" onClick={handleDelete}>
                    Delete
                  </Button>
                )}
              </HStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default FileMessage;
