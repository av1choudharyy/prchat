import { Routes, Route, Navigate } from "react-router-dom";
import { Box, useColorModeValue } from "@chakra-ui/react";
import { Home, Chat } from "./pages";

import "./App.css";

const App = () => {
  // Global background + text colors that respond to dark/light mode
  const bg = useColorModeValue("gray.50", "gray.900");
  const textColor = useColorModeValue("black", "white");

  return (
    <Box
      className="App"
      bg={bg}
      color={textColor}
      minH="100vh" // full viewport height
      display="flex"
      flexDirection="column"
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chats" element={<Chat />} />

        {/* Invalid path -> redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
};

export default App;
