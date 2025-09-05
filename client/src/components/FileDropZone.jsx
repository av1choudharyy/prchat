import { Box, Text, VStack, Progress, HStack, IconButton, Image } from '@chakra-ui/react';
import { useState, useCallback } from 'react';
import { CloseIcon, AttachmentIcon } from '@chakra-ui/icons';

const FileDropZone = ({ onFileSelect, darkMode }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [previews, setPreviews] = useState([]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  const processFiles = (files) => {
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews(prev => [...prev, { 
            id: Date.now() + Math.random(), 
            file, 
            preview: e.target.result,
            type: 'image'
          }]);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviews(prev => [...prev, { 
          id: Date.now() + Math.random(), 
          file, 
          type: 'document',
          icon: getFileIcon(file.type)
        }]);
      }
    });
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel')) return '📊';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    return '📎';
  };

  return (
    <Box
      position="relative"
      w="100%"
      minH="120px"
      border="2px dashed"
      borderColor={isDragOver ? "blue.400" : (darkMode ? "gray.600" : "gray.300")}
      borderRadius="12px"
      bg={isDragOver ? (darkMode ? "blue.900" : "blue.50") : "transparent"}
      transition="all 0.2s"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {previews.length === 0 ? (
        <VStack justify="center" h="120px" spacing={2}>
          <AttachmentIcon w={8} h={8} color={darkMode ? "gray.400" : "gray.500"} />
          <Text color={darkMode ? "gray.400" : "gray.500"} fontSize="sm">
            Drop files here or click to browse
          </Text>
        </VStack>
      ) : (
        <Box p={3}>
          <HStack spacing={3} flexWrap="wrap">
            {previews.map(item => (
              <Box key={item.id} position="relative">
                {item.type === 'image' ? (
                  <Image src={item.preview} w="60px" h="60px" objectFit="cover" borderRadius="8px" />
                ) : (
                  <VStack w="60px" h="60px" justify="center" bg={darkMode ? "gray.700" : "gray.100"} borderRadius="8px">
                    <Text fontSize="24px">{item.icon}</Text>
                    <Text fontSize="8px" textAlign="center">{item.file.name.split('.').pop()}</Text>
                  </VStack>
                )}
                <IconButton
                  icon={<CloseIcon />}
                  size="xs"
                  position="absolute"
                  top="-5px"
                  right="-5px"
                  borderRadius="full"
                  bg="red.500"
                  color="white"
                  onClick={() => setPreviews(prev => prev.filter(p => p.id !== item.id))}
                />
              </Box>
            ))}
          </HStack>
        </Box>
      )}
    </Box>
  );
};

export default FileDropZone;