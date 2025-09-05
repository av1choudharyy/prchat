import { FiCopy } from "react-icons/fi";        // Copy
import { IoReturnDownBack } from "react-icons/io5"; // Reply
import { MdClose } from "react-icons/md";
import { FiSend } from "react-icons/fi";  // Send
import { FiCornerUpRight } from "react-icons/fi";     // Cancel (X)
import { FiTrash2 } from "react-icons/fi"; // Delete
import { MdPushPin, MdOutlinePushPin } from "react-icons/md"; // Pin
import { useEffect, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { ArrowBackIcon } from "@chakra-ui/icons";
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import io from "socket.io-client";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, VStack } from "@chakra-ui/react";

const ENDPOINT = "http://localhost:5000"; // If you are deploying the app, replace the value with "https://YOUR_DEPLOYED_APPLICATION_URL" then run "npm run build" to create a production build
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const [chatsForForward, setChatsForForward] = useState([]);
  const [forwardTargetId, setForwardTargetId] = useState(null);
  const [forwardLoading, setForwardLoading] = useState(false);
  const [sendingQuick, setSendingQuick] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [suggestions] = useState(["Hello", "Hi", "Okay", "Thank you", "Got it!", "You'r welcome"]);
  const { user, selectedChat, setSelectedChat, notification, setNotification } =
    ChatState();
  const toast = useToast();

  const fetchMessages = async () => {
    // If no chat is selected, don't do anything
    if (!selectedChat) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/message/${selectedChat._id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      setMessages(data);
      setLoading(false);

      if (socket && selectedChat && selectedChat._id) {
        socket.emit("join chat", selectedChat._id);
      }

      // mark other users' messages in this chat as read (server should emit 'message read')
      try {
        await fetch(`/api/message/read/${selectedChat._id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        });
      } catch (err) {
        console.error("Failed to mark messages read:", err);
      }
    } catch (error) {
      setLoading(false);
      return toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "solid",
      });
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));

    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchMessages(); // Whenever users switches chat, call the function again
    selectedChatCompare = selectedChat;
    // eslint-disable-next-line
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
  // If message belongs to a different chat, keep notifications logic
  if (
    !selectedChatCompare ||
    selectedChatCompare._id !== newMessageRecieved.chat._id
  ) {
    // avoid duplicate notifications by id
    if (!notification.some((n) => n._id === newMessageRecieved._id)) {
      setNotification([newMessageRecieved, ...notification]);
      setFetchAgain((f) => !f); // safer toggle
    }
    return;
  }

  // If message belongs to the current chat, append only if not exists
  setMessages((prevMessages) => {
    if (prevMessages.some((m) => m._id === newMessageRecieved._id)) {
      return prevMessages; // already present — ignore duplicate
    }
    return [...prevMessages, newMessageRecieved];
  });
});

return () => {
    socket.off("message recieved");
  };
}, [notification, setNotification, setFetchAgain]);
useEffect(() => {
  if (!socket) return;

  const handleMessageRead = ({ chatId, messageIds }) => {
    // only update if we're viewing the affected chat
    if (!selectedChat || selectedChat._id !== chatId) return;

    setMessages((prev) =>
      prev.map((m) => (messageIds.includes(m._id) ? { ...m, isRead: true } : m))
    );
  };

  socket.on("message read", handleMessageRead);

  return () => {
    socket.off("message read", handleMessageRead);
  };
}, [socket, selectedChat]);

// ✅ Listen for pin/unpin events
useEffect(() => {
  const onPinUpdated = ({ message }) => {
    // message = pinned message object or null if unpinned
    setMessages((prev) =>
      prev.map((m) =>
        message
          ? { ...m, pinned: m._id === message._id } // mark only one as pinned
          : { ...m, pinned: false }                 // unpin all
      )
    );
  };

  socket.on("pin updated", onPinUpdated);
  return () => socket.off("pin updated", onPinUpdated);
}, [setMessages]);

  const sendMessage = async (e) => {
    // Check if 'Enter' key is pressed and we have something inside 'newMessage'
    if (e.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const messageData = {
  content: newMessage,
  chatId: selectedChat._id,
  replyTo: replyingTo ? replyingTo._id : null, // ✅ NEW LINE
};

        setNewMessage(""); // Clear message field before making API call (won't affect API call as the function is asynchronous)
        setSelectedMessage(null); // clear reply preview after sending
        setReplyingTo(null);

        const response = await fetch("/api/message", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messageData),
        });
        const data = await response.json();

        socket.emit("new message", data);
        setNewMessage("");
        setMessages((prev) => {
  // If socket will also deliver this message, don't duplicate
  if (prev.some((m) => m._id === data._id)) return prev;
  return [...prev, data];
});

      } catch (error) {
        return toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom-right",
          variant: "solid",
        });
      }
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    // Typing Indicator Logic
    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }

    let lastTypingTime = new Date().getTime();
    let timerLength = 3000;

    setTimeout(() => {
      let timeNow = new Date().getTime();
      let timeDiff = timeNow - lastTypingTime;

      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };
  const handleSendQuick = async (text) => {
  if (!text || !selectedChat) return;
  try {
    setSendingQuick(true);
    // stop typing for this room (just like normal send)
    socket.emit("stop typing", selectedChat._id);

    // clear composer/selection states
    setNewMessage("");
    setSelectedMessage(null);
    setReplyingTo(null);

    // send to API
    const res = await fetch("/api/message", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: text,
        chatId: selectedChat._id,
      }),
    });
    const data = await res.json();

    // broadcast via socket and update UI
    socket.emit("new message", data);
   setMessages((prev) => (prev.some(m => m._id === data._id) ? prev : [...prev, data]));
  } catch (e) {
    toast({
      title: "Failed to send",
      status: "error",
      duration: 3000,
      isClosable: true,
      position: "bottom-right",
      variant: "solid",
    });
  } finally {
    setSendingQuick(false);
  }
};

const openForwardModal = async () => {
  setIsForwardOpen(true);      // open immediately
  setForwardLoading(true);
  try {
    const res = await fetch("/api/chat", {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    const data = await res.json();
    setChatsForForward(Array.isArray(data) ? data : []);
  } catch (e) {
    toast({
      title: "Failed to load chats",
      status: "error",
      duration: 3000,
      isClosable: true,
      position: "bottom-right",
      variant: "solid",
    });
  } finally {
    setForwardLoading(false);
  }
};

const handleForward = async () => {
  if (!forwardTargetId || !selectedMessage) return;
  try {
    const res = await fetch("/api/message/forward", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messageId: selectedMessage._id,
        targetChatId: forwardTargetId,
      }),
    });
    const data = await res.json();

    // broadcast to recipients
    socket.emit("new message", data);

    // if you forwarded into the current chat, show instantly
    if (selectedChat && selectedChat._id === forwardTargetId) {
      setMessages((prev) => [...prev, data]);
    }

    // reset UI
    setIsForwardOpen(false);
    setForwardTargetId(null);
    setSelectedMessage(null);

    toast({
      title: "Message forwarded",
      status: "success",
      duration: 2000,
      isClosable: true,
      position: "bottom-right",
      variant: "solid",
    });
  } catch (e) {
    toast({
      title: "Failed to forward message",
      status: "error",
      duration: 3000,
      isClosable: true,
      position: "bottom-right",
      variant: "solid",
    });
  }
};

const handleSearch = async () => {
  if (!searchTerm.trim()) return;
  try {
    const res = await fetch(`/api/message/search/${selectedChat._id}?query=${searchTerm}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    const data = await res.json();
    setSearchResults(data);
  } catch {
    toast({
      title: "Search failed",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  }
};

  return (
    <>
      {selectedChat ? (
        <>
<Text
  fontSize={{ base: "28px", md: "30px" }}
  pb="3"
  px="2"
  w="100%"
  fontFamily="Work sans"
  display="flex"
  justifyContent="space-between"
  alignItems="center"
>
  {/* Left: back button on mobile */}
  <IconButton
    display={{ base: "flex", md: "none" }}
    icon={<ArrowBackIcon />}
    onClick={() => setSelectedChat("")}
  />

  {/* Middle: ONLY the title */}
  <span>
    {!selectedChat.isGroupChat
      ? getSender(user, selectedChat.users)
      : selectedChat.chatName.toUpperCase()}
  </span>

  {/* Right: Search + Eye/Modal (grouped, small gap) */}
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <IconButton
      aria-label="Search messages"
      variant="ghost"
      size="sm"
      icon={<FiSearch />}
      onClick={() => setShowSearch(s => !s)}
    />

    {!selectedChat.isGroupChat ? (
      <ProfileModal user={getSenderFull(user, selectedChat.users)} />
    ) : (
      <UpdateGroupChatModal
        fetchAgain={fetchAgain}
        setFetchAgain={setFetchAgain}
        fetchMessages={fetchMessages}
      />
    )}
  </div>
</Text>

          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
        
            {loading ? (
              <Spinner
                size="xl"
                w="20"
                h="20"
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  overflowY: "scroll",
                  scrollbarWidth: "none",
                }}
              >
                
{selectedMessage && (
  <div
    style={{
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      backgroundColor: "#f5f5f5",
      padding: "8px",
      borderBottom: "1px solid #ddd",
      gap: "15px"
    }}
  >
    {/* Copy */}
<button
  style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "20px" }}
  onClick={() => {
    navigator.clipboard.writeText(selectedMessage.content);
    setSelectedMessage(null);
  }}
  title="Copy"
>
  <FiCopy />
</button>

{/* Reply */}
<button
  style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "20px" }}
  onClick={() => {
    setReplyingTo(selectedMessage);
    setSelectedMessage(null);
  }}
  title="Reply"
>
  <IoReturnDownBack />
</button>

{/* Forward (placeholder) */}
<button
  style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "20px" }}
  onClick={openForwardModal}
>
  <FiCornerUpRight />
</button>

{/* Delete */}
<button
  style={{
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "red",
  }}
  onClick={async () => {
    await fetch(`/api/message/${selectedMessage._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user.token}` },
    });
    setMessages(messages.filter((m) => m._id !== selectedMessage._id)); // remove from UI
    setSelectedMessage(null);
  }}
  title="Delete"
>
  <FiTrash2 />
</button>

{/* Pin / Unpin (toggle) */}
<button
  style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "20px" }}
  title={selectedMessage?.pinned ? "Unpin message" : "Pin message"}
  onClick={async () => {
    try {
      const isPinned = !!selectedMessage.pinned;
      const endpoint = isPinned
        ? `/api/message/${selectedMessage._id}/unpin`
        : `/api/message/${selectedMessage._id}/pin`;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const updated = await res.json();

      // Update local UI: exactly one pinned per chat
      setMessages(prev =>
        prev.map(m =>
          updated.pinned
            ? { ...m, pinned: m._id === updated._id } // only this one true
            : { ...m, pinned: false }                  // unpin all
        )
      );

      // Notify others in the room
      socket.emit("pin updated", {
        chatId: selectedChat._id,
        message: updated.pinned ? updated : null,
      });

      setSelectedMessage(null);

      toast({
        title: updated.pinned ? "Message pinned" : "Message unpinned",
        status: "success",
        duration: 1500,
        isClosable: true,
        position: "bottom-right",
        variant: "solid",
      });
    } catch {
      toast({
        title: "Failed to toggle pin",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
        variant: "solid",
      });
    }
  }}
>
  {selectedMessage?.pinned ? <MdPushPin /> : <MdOutlinePushPin />}
</button>

{/* Pinned banner (single, like WhatsApp) */}
{(() => {
  const pinned = messages.find((m) => m.pinned);
  if (!pinned) return null;
  return (
    <div
      style={{
        background: "#fff3cd",
        padding: "8px 10px",
        borderRadius: "8px",
        marginBottom: "8px",
        border: "1px solid #ffeeba",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <MdPushPin />
        <div>
          <div style={{ fontWeight: 600 }}>Pinned message</div>
          <div style={{ color: "#555" }}>{pinned.content}</div>
        </div>
      </div>

      {/* Unpin button on the banner */}
      <button
        title="Unpin"
        onClick={async () => {
          const res = await fetch(`/api/message/${pinned._id}/unpin`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${user.token}` },
          });
          await res.json();
          setMessages(prev => prev.map(m => ({ ...m, pinned: false })));
          socket.emit("pin updated", { chatId: selectedChat._id, message: null });
        }}
        style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "18px" }}
      >
        <MdOutlinePushPin />
      </button>
    </div>
  );
})()}
</div>
            )}
            {showSearch && (
  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
    <Input
      placeholder="Search messages..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSearch();
        if (e.key === "Escape") setShowSearch(false);
      }}
      bg="white"
    />
    <Button colorScheme="blue" onClick={handleSearch}>Search</Button>
    <Button
      variant="ghost"
      onClick={() => {
        setSearchResults([]);
        setSearchTerm("");
        setShowSearch(false);
      }}
      title="Close"
    >
      <MdClose />
    </Button>
  </div>
)}
{showSearch && searchResults.length > 0 && (
  <Box bg="white" p={3} borderRadius="md" mb={3} boxShadow="sm">
    <Text fontWeight="bold" mb={2}>
      Search Results ({searchResults.length})
    </Text>

    <div style={{ maxHeight: 200, overflowY: "auto" }}>
      {searchResults.map((msg) => (
        <Box
          key={msg._id}
          p={2}
          borderBottom="1px solid #eee"
          _hover={{ bg: "#f7f7f7", cursor: "pointer" }}
          onClick={() => {
  const el = document.getElementById(msg._id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.style.backgroundColor = "#ffeaa7"; // temporary highlight
    setTimeout(() => (el.style.backgroundColor = ""), 1600);
  }
  setShowSearch(false);
  setSearchResults([]);
  setSearchTerm("");
}}

        >
          <Text fontSize="xs" color="gray.600">
            {msg.sender?.name}
          </Text>
          <Text>{msg.content}</Text>
        </Box>
      ))}
    </div>
  </Box>
)}

<ScrollableChat 
                messages={messages} 
                isTyping={isTyping} 
                setReplyingTo={setReplyingTo} // ✅ NEW PROP
                selectedMessage={selectedMessage}
                setSelectedMessage={setSelectedMessage}
                />  
              </div>
            )}
{replyingTo && (
  <div style={{ background: "#f0f0f0", padding: "6px", borderRadius: "5px", marginBottom: "5px" }}>
    <strong>Replying to:</strong> {replyingTo.content}
    <button 
      style={{ marginLeft: "10px", color: "red", border: "none", background: "transparent", cursor: "pointer" }}
      onClick={() => setReplyingTo(null)}
    >
      <MdClose />
    </button>
  </div>
)}
{/* Suggestions Bar */}
<div style={{ display: "flex", gap: "8px", marginBottom: "5px" }}>
  {suggestions.map((s, idx) => (
    <button
      key={idx}
      style={{
        padding: "5px 10px",
        borderRadius: "15px",
        border: "1px solid #ccc",
        background: "#f5f5f5",
        cursor: "pointer",
        fontSize: "14px",
        opacity: sendingQuick ? 0.6 : 1,
      }}
      disabled={sendingQuick}
      onClick={() => handleSendQuick(s)}   
    >
      {s}
    </button>
  ))}
</div>

<Modal isOpen={isForwardOpen} onClose={() => setIsForwardOpen(false)} isCentered>
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>Forward to…</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        {forwardLoading ? (
          <Text>Loading chats…</Text>
        ) : (
          <VStack align="stretch" spacing={2} maxH="300px" overflowY="auto">
            {chatsForForward.length === 0 && <Text>No chats found</Text>}
            {chatsForForward.map((c) => (
              <Button
                key={c._id}
                variant={forwardTargetId === c._id ? "solid" : "ghost"}
                colorScheme={forwardTargetId === c._id ? "blue" : "gray"}
                justifyContent="flex-start"
                onClick={() => setForwardTargetId(c._id)}
              >
                {c.isGroupChat ? c.chatName : getSender(user, c.users)}
              </Button>
            ))}
          </VStack>
        )}
      </ModalBody>
      <ModalFooter>
        <Button mr={3} onClick={() => setIsForwardOpen(false)}>
          Cancel
        </Button>
        <Button colorScheme="blue" isDisabled={!forwardTargetId} onClick={handleForward}>
          Forward
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
  
<FormControl mt="3" isRequired>
  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
    <Input
      variant="filled"
      bg="#E0E0E0"
      placeholder="Enter a message.."
      value={newMessage}
      onChange={(e) => typingHandler(e)}
      onKeyDown={(e) => sendMessage(e)} // still support Enter
    />
    <button
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontSize: "22px",
        color: "#007bff",
      }}
      onClick={() => sendMessage({ key: "Enter" })} // fake Enter key
    >
      <FiSend />
    </button>
  </div>
</FormControl>

          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="3xl" pb="3" fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
          
        </Box>
      )}
    </>
  );
};

export default SingleChat;
