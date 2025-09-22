import { Box, Image, Text, Icon, Spinner, IconButton } from "@chakra-ui/react";
import { FaFile, FaDownload, FaFilePdf, FaFileWord, FaFileArchive } from "react-icons/fa";
import { useState } from "react";

const MediaPreview = ({ mediaUrl, mediaType, fileName, fileSize }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  // Get file icon based on file extension
  const getFileIcon = () => {
    if (!fileName) return FaFile;
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return FaFilePdf;
    if (['doc', 'docx'].includes(ext)) return FaFileWord;
    if (['zip', 'rar', '7z'].includes(ext)) return FaFileArchive;
    return FaFile;
  };

  // Handle download
  const handleDownload = () => {
    // For local files, we need to use the full URL
    const fullUrl = mediaUrl.startsWith('http') ? mediaUrl : `${window.location.origin}${mediaUrl}`;
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = fileName || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render image media
  if (mediaType === 'image') {
    return (
      <Box position="relative" maxW="300px" my={2}>
        {imageLoading && !imageError && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            h="200px"
            bg="gray.100"
            borderRadius="md"
          >
            <Spinner />
          </Box>
        )}
        {imageError ? (
          <Box
            p={4}
            bg="gray.100"
            borderRadius="md"
            textAlign="center"
          >
            <Icon as={FaFile} boxSize={8} color="gray.500" mb={2} />
            <Text fontSize="sm" color="gray.600">Failed to load image</Text>
            <IconButton
              icon={<FaDownload />}
              size="sm"
              mt={2}
              onClick={handleDownload}
              aria-label="Download"
            />
          </Box>
        ) : (
          <Image
            src={mediaUrl.startsWith('http') ? mediaUrl : `${window.location.origin}${mediaUrl}`}
            alt={fileName || "Shared image"}
            borderRadius="md"
            maxW="100%"
            maxH="400px"
            objectFit="contain"
            cursor="pointer"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            onClick={() => window.open(mediaUrl.startsWith('http') ? mediaUrl : `${window.location.origin}${mediaUrl}`, '_blank')}
            display={imageLoading ? 'none' : 'block'}
          />
        )}
      </Box>
    );
  }

  // Render video media
  if (mediaType === 'video') {
    return (
      <Box position="relative" maxW="400px" my={2}>
        <video
          controls
          style={{
            maxWidth: '100%',
            maxHeight: '400px',
            borderRadius: '8px'
          }}
        >
          <source src={mediaUrl.startsWith('http') ? mediaUrl : `${window.location.origin}${mediaUrl}`} type="video/mp4" />
          <source src={mediaUrl.startsWith('http') ? mediaUrl : `${window.location.origin}${mediaUrl}`} type="video/webm" />
          Your browser does not support the video tag.
        </video>
      </Box>
    );
  }

  // Render file attachment
  return (
    <Box
      p={3}
      bg="gray.50"
      borderRadius="md"
      border="1px solid"
      borderColor="gray.200"
      display="flex"
      alignItems="center"
      gap={3}
      my={2}
      maxW="300px"
      cursor="pointer"
      onClick={handleDownload}
      _hover={{ bg: "gray.100" }}
    >
      <Icon as={getFileIcon()} boxSize={8} color="gray.600" />
      <Box flex={1}>
        <Text fontSize="sm" fontWeight="medium" isTruncated>
          {fileName || "Attachment"}
        </Text>
        <Text fontSize="xs" color="gray.600">
          {formatFileSize(fileSize)}
        </Text>
      </Box>
      <IconButton
        icon={<FaDownload />}
        size="sm"
        variant="ghost"
        aria-label="Download file"
        onClick={(e) => {
          e.stopPropagation();
          handleDownload();
        }}
      />
    </Box>
  );
};

export default MediaPreview;