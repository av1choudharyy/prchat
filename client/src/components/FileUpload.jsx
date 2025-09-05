import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Input,
  VStack,
  HStack,
  Text,
  Progress,
  IconButton,
  useToast,
  Alert,
  AlertIcon,
  Flex,
  Badge,
  Divider
} from '@chakra-ui/react';
import {
  AttachmentIcon,
  CloseIcon
} from '@chakra-ui/icons';
import axios from 'axios';

const FileUpload = ({ chatId, onFilesUploaded, replyTo = null, isVisible = false, onClose }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef();
  const toast = useToast();

  const maxFileSize = 50 * 1024 * 1024; // 50MB
  const maxFiles = 5;

  const allowedTypes = {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
               'text/plain', 'application/rtf', 'application/vnd.ms-excel', 
               'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
               'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 
              'application/x-tar', 'application/gzip'],
    video: ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/webm'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg']
  };

  const isFileTypeAllowed = (file) => {
    return Object.values(allowedTypes).flat().includes(file.type);
  };

  const getFileCategory = (file) => {
    for (const [category, types] of Object.entries(allowedTypes)) {
      if (types.includes(file.type)) {
        return category;
      }
    }
    return 'file';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;

    // Validate number of files
    if (selectedFiles.length + files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can only upload up to ${maxFiles} files at once.`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate each file
    const validFiles = [];
    const errors = [];

    files.forEach((file) => {
      if (file.size > maxFileSize) {
        errors.push(`${file.name} is too large (max 50MB)`);
        return;
      }

      if (!isFileTypeAllowed(file)) {
        errors.push(`${file.name} file type is not allowed`);
        return;
      }

      // Check for duplicates
      if (selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
        errors.push(`${file.name} is already selected`);
        return;
      }

      validFiles.push({
        file,
        id: Date.now() + Math.random(),
        category: getFileCategory(file),
        formattedSize: formatFileSize(file.size)
      });
    });

    if (errors.length > 0) {
      toast({
        title: "File validation errors",
        description: errors.join(', '),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }

    if (validFiles.length > 0) {
      setSelectedFiles([...selectedFiles, ...validFiles]);
    }

    // Clear input
    event.target.value = '';
  };

  const removeFile = (fileId) => {
    setSelectedFiles(selectedFiles.filter(f => f.id !== fileId));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('chatId', chatId);
      
      if (replyTo) {
        formData.append('replyTo', replyTo);
      }

      selectedFiles.forEach((fileData) => {
        formData.append('files', fileData.file);
      });

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("userInfo")).token}`,
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      };

      const { data } = await axios.post('/api/files/upload', formData, config);

      toast({
        title: "Files uploaded successfully",
        description: `${data.data.length} file(s) uploaded.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Call callback with uploaded file messages
      if (onFilesUploaded) {
        onFilesUploaded(data.data);
      }

      // Reset state
      setSelectedFiles([]);
      setUploadProgress(0);
      
      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload failed",
        description: error.response?.data?.message || "Failed to upload files. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };

  const getBadgeColor = (category) => {
    switch (category) {
      case 'image': return 'green';
      case 'document': return 'blue';
      case 'video': return 'purple';
      case 'audio': return 'orange';
      case 'archive': return 'gray';
      default: return 'gray';
    }
  };

  if (!isVisible) return null;

  return (
    <Box
      position="absolute"
      bottom="100%"
      left={0}
      right={0}
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      boxShadow="lg"
      p={4}
      mb={2}
      zIndex={1000}
    >
      <Flex justify="space-between" align="center" mb={3}>
        <Text fontWeight="bold" fontSize="sm">
          Upload Files ({selectedFiles.length}/{maxFiles})
        </Text>
        <IconButton
          icon={<CloseIcon />}
          size="sm"
          variant="ghost"
          onClick={onClose}
        />
      </Flex>

      {/* File Selection */}
      <VStack spacing={3} align="stretch">
        <HStack>
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            hidden
          />
          <Button
            leftIcon={<AttachmentIcon />}
            onClick={() => fileInputRef.current.click()}
            size="sm"
            isDisabled={uploading || selectedFiles.length >= maxFiles}
          >
            Select Files
          </Button>
          {selectedFiles.length > 0 && (
            <Button
              colorScheme="blue"
              onClick={uploadFiles}
              isLoading={uploading}
              loadingText="Uploading"
              size="sm"
            >
              Upload ({selectedFiles.length})
            </Button>
          )}
        </HStack>

        {/* Upload Progress */}
        {uploading && (
          <Box>
            <Text fontSize="sm" mb={1}>
              Uploading... {uploadProgress}%
            </Text>
            <Progress value={uploadProgress} colorScheme="blue" size="sm" />
          </Box>
        )}

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <Box>
            <Divider mb={2} />
            <VStack spacing={2} align="stretch" maxH="200px" overflowY="auto">
              {selectedFiles.map((fileData) => (
                <Flex
                  key={fileData.id}
                  align="center"
                  justify="space-between"
                  p={2}
                  bg="gray.50"
                  borderRadius="md"
                  fontSize="sm"
                >
                  <HStack spacing={2} flex={1} minW={0}>
                    <Badge colorScheme={getBadgeColor(fileData.category)} size="sm">
                      {fileData.category}
                    </Badge>
                    <Text isTruncated>{fileData.file.name}</Text>
                    <Text color="gray.500" fontSize="xs">
                      {fileData.formattedSize}
                    </Text>
                  </HStack>
                  <IconButton
                    icon={<CloseIcon />}
                    size="xs"
                    variant="ghost"
                    onClick={() => removeFile(fileData.id)}
                    isDisabled={uploading}
                  />
                </Flex>
              ))}
            </VStack>
          </Box>
        )}

        {/* File Type Info */}
        <Alert status="info" size="sm">
          <AlertIcon />
          <Text fontSize="xs">
            Supported: Images, Documents (PDF, Word, Excel, PowerPoint), Archives (ZIP, RAR), 
            Videos (MP4, AVI), Audio (MP3, WAV). Max: 50MB per file, 5 files total.
          </Text>
        </Alert>
      </VStack>
    </Box>
  );
};

export default FileUpload;
