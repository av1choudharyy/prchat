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
  Button,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@chakra-ui/react";
import io from "socket.io-client";

import { ChatState } from "../context/ChatProvider";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";

const ENDPOINT = process.env.REACT_APP_SOCKET_ENDPOINT || "http://localhost:5000"; // If you are deploying the app, replace the value with "https://YOUR_DEPLOYED_APPLICATION_URL" then run "npm run build" to create a production build
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [replyTarget, setReplyTarget] = useState(null);

  const { user, selectedChat, setSelectedChat, notification, setNotification } =
    ChatState();
  const toast = useToast();

  const fetchMessages = async () => {
    // If no chat is selected, don't do anything
    if (!selectedChat) {
      return;
    }

    // Special: Gemini assistant chat uses local state only
    if (selectedChat._id === "gemini-bot") {
      setMessages([]);
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
      // mark as read on open
      try {
        const readRes = await fetch(`/api/message/${selectedChat._id}/read`, {
          method: "POST",
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const updated = await readRes.json();
        setMessages(updated);
        socket.emit("messages read", { chatId: selectedChat._id, readerId: user._id });
      } catch (e) {
        // no-op
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
    socket.on("poll updated", (updatedMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
      );
    });
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchMessages(); // Whenever users switches chat, call the function again
    selectedChatCompare = selectedChat;
    // eslint-disable-next-line
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      console.log("Message received:", newMessageRecieved);
      console.log("Current selected chat:", selectedChatCompare);
      console.log("Current notifications:", notification);
      
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageRecieved.chat[0]._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          console.log("Adding notification for message from different chat");
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain); // Fetch all the chats again
          toast({
            title: "New message",
            description: `You have a new message${newMessageRecieved.chat?.[0]?.isGroupChat ? ` in ${newMessageRecieved.chat?.[0]?.chatName}` : ""}.`,
            status: "info",
            duration: 3000,
            isClosable: true,
            position: "bottom-right",
            variant: "subtle",
          });
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
        // mark as read for newly received message in active chat
        (async () => {
          try {
            const readRes = await fetch(`/api/message/${selectedChat._id}/read`, {
              method: "POST",
              headers: { Authorization: `Bearer ${user.token}` },
            });
            const updated = await readRes.json();
            setMessages(updated);
            socket.emit("messages read", { chatId: selectedChat._id, readerId: user._id });
          } catch (_) {}
        })();
      }
    });

    socket.on("message updated", (updated) => {
      setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
    });

    socket.on("message removed", ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    });

    // eslint-disable-next-line
  });

  const sendMessage = async (e) => {
    // Check if 'Enter' key is pressed and we have something inside 'newMessage'
    if (e.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        setNewMessage(""); // Clear message field before making API call (won't affect API call as the function is asynchronous)

        // If chatting with Gemini bot, call gemini endpoint and simulate a reply
        if (selectedChat._id === "gemini-bot") {
          const youMsg = {
            _id: Math.random().toString(36).slice(2),
            sender: { _id: user._id, name: user.name, pic: user.pic },
            content: newMessage,
            chat: [{ _id: "gemini-bot", users: [{ _id: user._id }, { _id: "gemini" }] }],
            createdAt: new Date().toISOString(),
            readBy: [user._id],
          };
          setMessages([...messages, youMsg]);
          try {
            const resp = await fetch("/api/gemini/chat", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${user.token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ prompt: newMessage }),
            });
            const data = await resp.json();
            const botMsg = {
              _id: Math.random().toString(36).slice(2),
              sender: { _id: "gemini", name: "Talk with chat", pic: "" },
              content: data.reply || "",
              chat: [{ _id: "gemini-bot", users: [{ _id: user._id }, { _id: "gemini" }] }],
              createdAt: new Date().toISOString(),
              readBy: [user._id],
            };
            setMessages((prev) => [...prev, botMsg]);
          } catch (_) {}
          return;
        }

        const response = await fetch("/api/message", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: newMessage,
            chatId: selectedChat._id,
            replyTo: replyTarget ? replyTarget._id : undefined,
          }),
        });
        const data = await response.json();

        socket.emit("new message", data);
        setNewMessage("");
        setMessages([...messages, data]); // Add new message with existing messages
        setReplyTarget(null);
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

  const sendPoll = async () => {
    if (!pollQuestion || pollOptions.some((opt) => !opt.trim())) {
      return;
    }
    try {
      const response = await fetch("/api/message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "poll",
          content: "",
          chatId: selectedChat._id,
          poll: {
            question: pollQuestion,
            options: pollOptions.map((text) => ({ text })),
          },
        }),
      });
      const data = await response.json();
      socket.emit("new message", data);
      setMessages([...messages, data]);
      setPollQuestion("");
      setPollOptions(["", ""]);
      onClose();
    } catch (error) {
      // no-op
    }
  };

  const handleVote = async (messageId, optionIndex) => {
    try {
      console.log("Voting on poll:", messageId, optionIndex);
      const response = await fetch(`/api/message/${messageId}/vote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ optionIndex }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Vote failed:", errorData);
        toast({
          title: "Vote Failed",
          description: errorData.message || "Failed to vote on poll",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      const updated = await response.json();
      console.log("Vote successful:", updated);
      setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      socket.emit("poll voted", updated);
      
      toast({
        title: "Vote Cast",
        description: "Your vote has been recorded",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (e) {
      console.error("Vote error:", e);
      toast({
        title: "Vote Error",
        description: "Failed to vote on poll",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const EMOJIS = [
    "😀",
    "😁",
    "😂",
    "🤣",
    "😊",
    "😍",
    "😘",
    "😎",
    "😇",
    "🙂",
    "🤔",
    "😴",
    "🙌",
    "👍",
    "👏",
    "🙏",
    "🔥",
    "🎉",
    "❤️",
  ];

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
            {selectedChat._id === "gemini-bot" ? (
              <>Gemini Assistant</>
            ) : !selectedChat.isGroupChat ? (
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
            bg={selectedChat._id === "gemini-bot" ? "#eef2ff" : { base: "#E8E8E8", _dark: "gray.700" }}
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {selectedChat._id === "gemini-bot" && (
              <div className="gemini-ambient">
                <div className="blob b1" />
                <div className="blob b2" />
                <div className="blob b3" />
              </div>
            )}
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
                  onVote={handleVote}
                  onEdit={async (message) => {
                    const content = prompt("Edit message", message.content);
                    if (content == null) return;
                    const response = await fetch(`/api/message/${message._id}`, {
                      method: "PUT",
                      headers: {
                        Authorization: `Bearer ${user.token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ content }),
                    });
                    const updated = await response.json();
                    socket.emit("message edited", updated);
                    setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
                  }}
                  onDelete={async (message) => {
                    await fetch(`/api/message/${message._id}`, {
                      method: "DELETE",
                      headers: {
                        Authorization: `Bearer ${user.token}`,
                      },
                    });
                    socket.emit("message deleted", { chat: message.chat, messageId: message._id });
                    setMessages((prev) => prev.filter((m) => m._id !== message._id));
                  }}
                  onReply={(message) => {
                    setNewMessage((prev) => prev); // Keep current text
                    // store reply target locally
                    setReplyTarget(message);
                  }}
                  theme={selectedChat._id === "gemini-bot" ? "cosmic" : undefined}
                />
              </div>
            )}

            <HStack spacing={2} mt="3">
              <Button 
                size="sm" 
                onClick={() => setShowEmojiPicker((s) => !s)} 
                colorScheme={selectedChat._id === "gemini-bot" ? "purple" : "blue"} 
                variant="outline"
                bg={selectedChat._id === "gemini-bot" ? "#FFFFFF" : undefined}
                color={selectedChat._id === "gemini-bot" ? "#4F46E5" : undefined}
                borderColor={selectedChat._id === "gemini-bot" ? "#4F46E5" : undefined}
              >
                😀
              </Button>
              <Button 
                size="sm" 
                onClick={onOpen} 
                colorScheme={selectedChat._id === "gemini-bot" ? "purple" : "blue"} 
                variant="outline"
                bg={selectedChat._id === "gemini-bot" ? "#FFFFFF" : undefined}
                color={selectedChat._id === "gemini-bot" ? "#4F46E5" : undefined}
                borderColor={selectedChat._id === "gemini-bot" ? "#4F46E5" : undefined}
              >
                Create Poll
              </Button>
            </HStack>
            {replyTarget && (
              <Box
                p={2}
                bg="gray.100"
                borderRadius="md"
                mb={2}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text fontSize="sm" color="gray.600">
                  Replying to {replyTarget.sender?.name}: {replyTarget.content?.substring(0, 50)}...
                </Text>
                <Button
                  size="xs"
                  onClick={() => setReplyTarget(null)}
                  colorScheme="red"
                  variant="ghost"
                >
                  ✕
                </Button>
              </Box>
            )}
            {showEmojiPicker && (
              <Box
                mt={2}
                p={2}
                borderWidth="1px"
                borderRadius="md"
                bg="white"
              >
                <HStack wrap="wrap" spacing={1}>
                  {EMOJIS.map((e) => (
                    <Button
                      key={e}
                      size="sm"
                      variant="ghost"
                      onClick={() => setNewMessage((prev) => prev + e)}
                    >
                      {e}
                    </Button>
                  ))}
                </HStack>
              </Box>
            )}
            <FormControl mt="3" onKeyDown={(e) => sendMessage(e)} isRequired>
              <Input
                variant="filled"
                bg={selectedChat._id === "gemini-bot" ? "#FFFFFF" : { base: "#E0E0E0", _dark: "gray.600" }}
                color={selectedChat._id === "gemini-bot" ? "#1F2937" : { base: "black", _dark: "white" }}
                border={selectedChat._id === "gemini-bot" ? "2px solid #4F46E5" : "none"}
                placeholder="Enter a message.."
                value={newMessage}
                onChange={(e) => typingHandler(e)}
              />
            </FormControl>
          </Box>
          <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Create Poll</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Input
                  placeholder="Question"
                  mb={3}
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                />
                {pollOptions.map((opt, idx) => (
                  <Input
                    key={idx}
                    placeholder={`Option ${idx + 1}`}
                    mb={2}
                    value={opt}
                    onChange={(e) => {
                      const copy = [...pollOptions];
                      copy[idx] = e.target.value;
                      setPollOptions(copy);
                    }}
                  />
                ))}
                <Button mt={2} size="sm" onClick={() => setPollOptions((p) => [...p, ""]) }>
                  Add option
                </Button>
              </ModalBody>
              <ModalFooter>
                <Button mr={3} onClick={onClose} variant="ghost">
                  Cancel
                </Button>
                <Button colorScheme="blue" onClick={sendPoll}>
                  Create
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
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
