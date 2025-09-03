import { createContext, useContext, useEffect, useState } from "react";
import { useColorMode } from "@chakra-ui/react";

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const { colorMode, toggleColorMode } = useColorMode();
    const [isDark, setIsDark] = useState(colorMode === "dark");

    useEffect(() => {
        setIsDark(colorMode === "dark");
    }, [colorMode]);

    // Theme-specific colors
    const theme = {
        bg: {
            primary: isDark ? "gray.800" : "white",
            secondary: isDark ? "gray.700" : "gray.50",
            chat: isDark ? "gray.900" : "#E8E8E8",
            input: isDark ? "gray.600" : "#E0E0E0",
            message: {
                sent: isDark ? "blue.600" : "#BEE3F8",
                received: isDark ? "green.600" : "#B9F5D0"
            }
        },
        text: {
            primary: isDark ? "white" : "gray.800",
            secondary: isDark ? "gray.300" : "gray.600",
            muted: isDark ? "gray.400" : "gray.500"
        },
        border: isDark ? "gray.600" : "gray.200"
    };

    const value = {
        isDark,
        colorMode,
        toggleColorMode,
        theme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
