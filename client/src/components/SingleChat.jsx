import { useEffect, useState, useRef } from "react";
import { ArrowBackIcon, ArrowForwardIcon } from "@chakra-ui/icons";
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
  Button,
  HStack,
} from "@chakra-ui/react";
import io from "socket.io-client";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";

const ENDPOINT = "http://localhost:5000";
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingMsg, setForwardingMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { user, selectedChat, setSelectedChat, notification, setNotification } =
    ChatState();
  const toast = useToast();

  const inputRef = useRef(); // track caret/selection

  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/message/${selectedChat._id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${user.token}` },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageRecieved.chat[0]._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages((prev) => [...prev, newMessageRecieved]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  const sendMessage = async () => {
    if (!newMessage && !forwardingMsg) return;
    socket.emit("stop typing", selectedChat._id);
    try {
      const messageToSend = forwardingMsg
        ? `(Forwarded) ${forwardingMsg}`
        : replyingTo
        ? `(Reply to: ${replyingTo}) ${newMessage}`
        : newMessage;

      setNewMessage("");
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
      socket.emit("new message", data);
      setMessages((prev) => [...prev, data]);
      setReplyingTo(null);
      setForwardingMsg(null);
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
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;
    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    const lastTypingTime = new Date().getTime();
    const timerLength = 3000;
    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  // ⭐ insert text (emoji/formatting) at current caret position
  const insertAtCursor = (text) => {
    const input = inputRef.current;
    if (!input) {
      setNewMessage((prev) => prev + text);
      return;
    }
    const start = input.selectionStart ?? newMessage.length;
    const end = input.selectionEnd ?? newMessage.length;
    const next =
      newMessage.slice(0, start) + text + newMessage.slice(end);
    setNewMessage(next);

    // restore caret after React state update
    requestAnimationFrame(() => {
      const pos = start + text.length;
      input.setSelectionRange(pos, pos);
      input.focus();
    });
  };

  // formatting helpers
  const applyFormatting = (symbol) => {
    const input = inputRef.current;
    const start = input?.selectionStart ?? newMessage.length;
    const end = input?.selectionEnd ?? newMessage.length;

    if (start !== end) {
      const selectedText = newMessage.slice(start, end);
      const formatted = symbol + selectedText + symbol;
      const next = newMessage.slice(0, start) + formatted + newMessage.slice(end);
      setNewMessage(next);
      requestAnimationFrame(() => {
        const pos = start + formatted.length;
        input?.setSelectionRange(pos, pos);
        input?.focus();
      });
    } else {
      insertAtCursor(`${symbol}text${symbol}`);
    }
  };

  // ⭐ simple emoji set
  const emojis = ["😂", "❤️", "🔥", "👍"];

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
              aria-label="Back"
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
              <Spinner size="xl" w="20" h="20" alignSelf="center" margin="auto" />
            ) : (
              <>
                <Input
                  placeholder="Search the message you are looking for..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  mb="2"
                  bg="white"
                  size="sm"
                  _placeholder={{ color: "gray.500", fontStyle: "italic" }}
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    overflowY: "scroll",
                    scrollbarWidth: "none",
                  }}
                >
                  <ScrollableChat
                    messages={messages.filter((msg) =>
                      msg.content.toLowerCase().includes(searchTerm.toLowerCase())
                    )}
                    isTyping={isTyping}
                    setReplyingTo={setReplyingTo}
                    setForwardingMsg={setForwardingMsg}
                  />
                </div>
              </>
            )}

            {replyingTo && (
              <Box
                bg="blue.50"
                p="2"
                mb="2"
                borderRadius="md"
                fontSize="sm"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text color="blue.800" fontWeight="medium">
                  Replying to: <b>{replyingTo}</b>
                </Text>
                <Button
                  size="xs"
                  colorScheme="purple"
                  variant="ghost"
                  onClick={() => setReplyingTo(null)}
                >
                  ✖
                </Button>
              </Box>
            )}

            {forwardingMsg && (
              <Box
                bg="blue.50"
                p="2"
                mb="2"
                borderRadius="md"
                fontSize="sm"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text color="blue.800" fontWeight="medium">
                  Forwarding: <b>{forwardingMsg}</b>
                </Text>
                <Button
                  size="xs"
                  colorScheme="purple"
                  variant="ghost"
                  onClick={() => setForwardingMsg(null)}
                >
                  ✖
                </Button>
              </Box>
            )}

            {/* Quick Reply Suggestions */}
            <HStack spacing={2} mb={2}>
              <Button size="sm" colorScheme="blue" onClick={() => setNewMessage("Okay")}>
                Okay
              </Button>
              <Button size="sm" colorScheme="green" onClick={() => setNewMessage("Thank you")}>
                Thank you
              </Button>
              <Button size="sm" colorScheme="purple" onClick={() => setNewMessage("Got it!")}>
                Got it!
              </Button>
            </HStack>

            {/* ⭐ Emoji Row (Option 2) */}
            <HStack spacing={2} mb={2}>
              {emojis.map((e) => (
                <Button
                  key={e}
                  size="sm"
                  variant="ghost"
                  onClick={() => insertAtCursor(e)}
                >
                  {e}
                </Button>
              ))}
            </HStack>

            {/* B I U Toolbar */}
            <HStack spacing={2} mb={2}>
              <Button
                size="sm"
                bg="black"
                color="white"
                _hover={{ bg: "gray.800" }}
                onClick={() => applyFormatting("**")}
              >
                B
              </Button>
              <Button
                size="sm"
                bg="black"
                color="white"
                fontStyle="italic"
                _hover={{ bg: "gray.800" }}
                onClick={() => applyFormatting("*")}
              >
                I
              </Button>
              <Button
                size="sm"
                bg="black"
                color="white"
                textDecoration="underline"
                _hover={{ bg: "gray.800" }}
                onClick={() => applyFormatting("__")}
              >
                U
              </Button>
            </HStack>

            <HStack>
             <FormControl
  isRequired
  onKeyDown={(e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // prevent newline
      sendMessage();
    }
  }}
>
  <Input
    ref={inputRef}
    variant="outline"
    bg="white"
    color="black"
    placeholder="Enter a message.."
    _placeholder={{ color: "gray.500" }}
    value={newMessage}
    onChange={(e) => typingHandler(e)}
  />
</FormControl>

              <IconButton
                colorScheme="blue"
                aria-label="Send Message"
                icon={<ArrowForwardIcon />}
                onClick={sendMessage}
              />
            </HStack>
          </Box>
        </>
      ) : (
        <Box display="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb="3" fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
