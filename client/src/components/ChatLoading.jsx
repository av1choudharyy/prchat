// src/components/ChatLoading.jsx
import { Skeleton, Stack, Box } from "@chakra-ui/react";

const ChatLoading = () => {
  return (
    <Box>
      <Stack spacing={3}>
        <Skeleton height="40px" borderRadius="6px" />
        <Skeleton height="40px" borderRadius="6px" />
        <Skeleton height="40px" borderRadius="6px" />
        <Skeleton height="40px" borderRadius="6px" />
        <Skeleton height="40px" borderRadius="6px" />
        <Skeleton height="40px" borderRadius="6px" />
      </Stack>
    </Box>
  );
};

export default ChatLoading;
