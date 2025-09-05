import { Box, Text, useColorMode } from "@chakra-ui/react";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";

const ThemeToggle = () => {
    const { colorMode, toggleColorMode } = useColorMode();
    const isDark = colorMode === "dark";

    return (
        <Box
            display="flex"
            alignItems="center"
            bg={isDark ? "#4A5568" : "#FED7AA"}
            borderRadius="full"
            p={1}
            cursor="pointer"
            onClick={toggleColorMode}
            transition="all 0.3s ease"
            minWidth="120px"
            height="40px"
            position="relative"
            _hover={{ transform: "scale(1.02)" }}
        >
            {/* Light Mode Side */}
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                flex={1}
                height="32px"
                borderRadius="full"
                bg={!isDark ? "#F6AD55" : "transparent"}
                color={!isDark ? "#2D3748" : "#E2E8F0"}
                transition="all 0.3s ease"
                fontSize="sm"
                fontWeight="bold"
                gap={1}
                boxShadow={!isDark ? "0 2px 4px rgba(0,0,0,0.1)" : "none"}
            >
                <SunIcon boxSize={3} />
                <Text fontSize="xs">Light</Text>
            </Box>

            {/* Dark Mode Side */}
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                flex={1}
                height="32px"
                borderRadius="full"
                bg={isDark ? "#2D3748" : "transparent"}
                color={isDark ? "#E2E8F0" : "#2D3748"}
                transition="all 0.3s ease"
                fontSize="sm"
                fontWeight="medium"
                gap={1}
            >
                <MoonIcon boxSize={3} />
                <Text fontSize="xs">Dark</Text>
            </Box>
        </Box>
    );
};

export default ThemeToggle;
