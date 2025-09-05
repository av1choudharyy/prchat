import { createContext, useContext, useEffect, useState } from "react";

const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState();
  const [chats, setChats] = useState([]);
  const [notification, setNotification] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true); // hydrate flag

  useEffect(() => {
    try {
      const info = JSON.parse(localStorage.getItem("userInfo"));
      if (info) setUser(info);
    } catch {
      // ignore parse errors
    } finally {
      setLoadingUser(false);
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        user,
        setUser,
        selectedChat,
        setSelectedChat,
        chats,
        setChats,
        notification,
        setNotification,
        loadingUser,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => useContext(ChatContext);
export default ChatProvider;
