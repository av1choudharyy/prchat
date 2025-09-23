// src/context/ChatProvider.jsx
import { createContext, useContext, useEffect, useState } from "react";

const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState();
  const [chats, setChats] = useState([]);
  const [notification, setNotification] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true); // hydrate flag

  // NEW: unread counts map { [chatId]: number }
  const [unreadCounts, setUnreadCounts] = useState({});

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

  // Increment unread for a chatId by 1
  const incrementUnread = (chatId) => {
    if (!chatId) return;
    setUnreadCounts((prev) => {
      const next = { ...prev };
      next[chatId] = (next[chatId] || 0) + 1;
      return next;
    });
  };

  // Clear unread for a chatId (when user opens that chat)
  const clearUnread = (chatId) => {
    if (!chatId) return;
    setUnreadCounts((prev) => {
      if (!prev[chatId]) return prev;
      const next = { ...prev };
      delete next[chatId];
      return next;
    });
  };

  // Optional: set unread for chat (e.g., reset or set specific number)
  const setUnreadForChat = (chatId, count) => {
    if (!chatId) return;
    setUnreadCounts((prev) => {
      const next = { ...prev };
      if (count > 0) next[chatId] = count;
      else delete next[chatId];
      return next;
    });
  };

  // Total unread count
  const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + n, 0);

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

        // unread API
        unreadCounts,
        incrementUnread,
        clearUnread,
        setUnreadForChat,
        totalUnread,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => useContext(ChatContext);
export default ChatProvider;
