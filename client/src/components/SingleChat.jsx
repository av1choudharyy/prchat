import { FiCopy } from "react-icons/fi";        // Copy
import { IoReturnDownBack } from "react-icons/io5"; // Reply
import { MdClose } from "react-icons/md";       // Cancel (X)
import { useEffect, useState } from "react";
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
        },
      });
      const data = await response.json();

      setMessages(data);
      setLoading(false);

      socket.emit("join chat", selectedChat._id);
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
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain); // Fetch all the chats again
        }
      } else {
        setMessages((prevMessages) => [...prevMessages, newMessageRecieved]);
      }
    });
return () => {
    socket.off("message recieved");
  };
}, [notification, setNotification, setFetchAgain]);

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
        setMessages([...messages, data]); // Add new message with existing messages
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
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {!selectedChat.isGroupChat ? (
              <>
                {getSender(user, selectedChat.users)}
                <ProfileModal user={getSenderFull(user, selectedChat.users)} />
              </>
            ) : (
              <>
                {selectedChat.chatName.toUpperCase()}
                <UpdateGroupChatModal
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                  fetchMessages={fetchMessages}
                />
              </>
            )}
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
>
  <IoReturnDownBack />
</button>

{/* Forward (placeholder) */}
<button
  style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "20px" }}
  onClick={() => alert("Forward feature coming soon!")}
>
  📤
</button>

  </div>
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
            <FormControl mt="3" onKeyDown={(e) => sendMessage(e)} isRequired>
              <Input
                variant="filled"
                bg="#E0E0E0"
                placeholder="Enter a message.."
                value={newMessage}
                onChange={(e) => typingHandler(e)}
              />
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
