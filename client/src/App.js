import { Routes, Route, Navigate } from "react-router-dom";
import { Home, Chat } from "./pages";
import { Box, useColorModeValue } from "@chakra-ui/react";

import "./App.css";

const App = () => {
  const appBg = useColorModeValue("gray.50", "gray.900");
  const appColor = useColorModeValue("gray.800", "gray.100");

  return (
    <Box minH="100vh" bg={appBg} color={appColor}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chats" element={<Chat />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
};

export default App;
