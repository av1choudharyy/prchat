import { Routes, Route, Navigate } from "react-router-dom";
import { Home, Chat } from "./pages";
import { ChatState } from "./context/ChatProvider";

import "./App.css";

const App = () => {
  const { darkMode } = ChatState() || {};
  
  return (
    <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chats" element={<Chat />} />

        {/* If the user enters an invalid path in the URL it automatically redirects them to the homepage */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
