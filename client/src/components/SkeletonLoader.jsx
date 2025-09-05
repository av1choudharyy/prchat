import { Box, HStack, VStack } from "@chakra-ui/react";
import { ChatState } from "../context/ChatProvider";

const SkeletonLoader = ({ count = 5 }) => {
  const { darkMode } = ChatState();
  
  return (
    <VStack spacing={4} p={4}>
      {Array.from({ length: count }).map((_, index) => (
        <HStack key={index} w="100%" justify={index % 2 === 0 ? "flex-start" : "flex-end"}>
          {index % 2 === 0 && (
            <Box className="skeleton" w="40px" h="40px" borderRadius="full" />
          )}
          <VStack align={index % 2 === 0 ? "flex-start" : "flex-end"} spacing={2} maxW="70%">
            <Box className="skeleton" h="20px" w={`${Math.random() * 200 + 100}px`} />
            <Box className="skeleton" h="16px" w={`${Math.random() * 150 + 80}px`} />
            <Box className="skeleton" h="12px" w="60px" />
          </VStack>
          {index % 2 === 1 && (
            <Box className="skeleton" w="40px" h="40px" borderRadius="full" />
          )}
        </HStack>
      ))}
    </VStack>
  );
};

export default SkeletonLoader;