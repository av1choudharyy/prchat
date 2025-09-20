import { Routes, Route, Navigate } from "react-router-dom";
import { Box, useColorModeValue } from "@chakra-ui/react";
import { Home, Chat } from "./pages";

import "./App.css";

const App = () => {
  const bgColor = useColorModeValue("white", "gray.900");
  
  return (
    <Box minH="100vh" bg={bgColor}>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chats" element={<Chat />} />

          {/* If the user enters an invalid path in the URL it automatically redirects them to the homepage */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Box>
  );
};

export default App;
