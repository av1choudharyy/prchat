import { useEffect, useState, useRef } from "react";
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
import ChatSearch from "./ChatSearch";
import QuickReplyBar from "./QuickReplyBar";

const ENDPOINT = "http://localhost:5000"; // If you are deploying the app, replace the value with "https://YOUR_DEPLOYED_APPLICATION_URL" then run "npm run build" to create a production build
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);
  const messageRefs = useRef([]);

  const { user, selectedChat, setSelectedChat, notification, setNotification, chats } =
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

  const sendMessage = async (e, quickText = null) => {
    // Check if 'Enter' key is pressed and we have something inside 'newMessage'
    if ((e.key === "Enter" && newMessage) || quickText) {
      socket.emit("stop typing", selectedChat._id);
      const messageToSend = quickText || newMessage;
      const isAiInteraction = /@prai\b/i.test(messageToSend) ? true : false;
      let respMes;
      try {
        setNewMessage(""); // Clear message field before making API call (won't affect API call as the function is asynchronous)

        const response = await fetch("/api/message", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: messageToSend,
            chatId: selectedChat._id,
          }),
        });
        const data = await response.json();

        respMes = data;
        socket.emit("new message", data);
        setNewMessage("");
        setMessages([...messages, data]); // Add new message with existing messages

        if (isAiInteraction) {
          const response = await fetch("/api/message", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${user.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: messageToSend,
              chatId: selectedChat._id,
              isAiInteraction: true,
            }),
          });

          const data = await response.json();

          socket.emit("new message", data);
          setNewMessage("");
          setMessages([...messages,respMes, data]); // Add new message with existing messages
        }
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

  console.log("message", messages);


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

  const scrollToMessage = (index) => {
    if (messageRefs.current[index]) {
      messageRefs.current[index].scrollIntoView({
        behavior: "smooth",
        block: "center",
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
        selectedChatCompare._id !== newMessageRecieved.chat[0]._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain); // Fetch all the chats again
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    });

    // eslint-disable-next-line
  });

  return (
    <>
      {selectedChat ? (
        <>
          <Box
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
            {!selectedChat?.isGroupChat ? (
              <Box display="flex" justifyContent="space-between" width='100%'>
                {getSender(user, selectedChat?.users)}
                <Box display='flex'>
                  <ChatSearch
                    messages={messages}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onScrollToMessage={scrollToMessage}
                    setSelectedMessageIndex={setSelectedMessageIndex}
                  />
                  <ProfileModal user={getSenderFull(user, selectedChat.users)} />
                </Box>
              </Box>
            ) : (
              <>
                {selectedChat?.chatName.toUpperCase()}
                <Box style={{ display: "flex" }}>
                  <ChatSearch
                    messages={messages}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onScrollToMessage={scrollToMessage}
                    setSelectedMessageIndex={setSelectedMessageIndex}
                  />
                  <UpdateGroupChatModal
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                    fetchMessages={fetchMessages}
                  />
                </Box>
              </>
            )}
          </Box>

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
                <ScrollableChat
                  messages={messages}
                  isTyping={isTyping}
                  searchQuery={searchQuery}
                  messageRefs={messageRefs}
                  electedMessageIndex={selectedMessageIndex}
                  selectedChat={selectedChat}
                  chats={chats}
                />
              </div>
            )}

            <QuickReplyBar
              onSelect={(text) => {
                setNewMessage(text);
                sendMessage({}, text);
              }}
            />
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
