import { Box, Text } from "@chakra-ui/react";

const StylishHeading = () => {
  return (
    <Box w="100%" textAlign="center" p={3} mb={3} borderBottom="1px solid #ccc">
      <Text
        fontSize="3xl"
        fontWeight="bold"
        color="black"
        fontFamily="italic"
      >
        My Chat
      </Text>
    </Box>
  );
};

export default StylishHeading;
