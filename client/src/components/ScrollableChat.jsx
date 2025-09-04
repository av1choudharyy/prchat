import { useState, useEffect, useRef } from "react";
import {
  Avatar,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  Checkbox,
} from "@chakra-ui/react";
import { CopyIcon, DragHandleIcon, ArrowForwardIcon } from "@chakra-ui/icons";
import Lottie from "lottie-react";
import "../App.css";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../context/ChatProvider";
import typingAnimation from "../animations/typing.json";
import HighlightedMessage from "./HighlightedMessage";

const ScrollableChat = ({
  messages,
  isTyping,
  searchQuery,
  messageRefs,
  selectedMessageIndex,
}) => {
  const { user, chats, selectedChat } = ChatState();

  const scrollRef = useRef();
  const timerRef = useRef(null);

  const toast = useToast();

  const [hoveredMessageIndex, setHoveredMessageIndex] = useState(null);

  // forward modal state
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [selectedForwardOptions, setSelectedForwardOptions] = useState([]);
  const [messageToForward, setMessageToForward] = useState(null);
  const [indulgedUsers, setIndulgedUsers] = useState();

  const handleCopy = (message) => {
    navigator.clipboard.writeText(message.content);
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
      status: "success",
      duration: 1500,
      isClosable: true,
    });
  };

  const handleForwardClick = (message) => {
    setMessageToForward(message);
    setIsForwardModalOpen(true);
  };

  const handleMouseEnter = (index) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHoveredMessageIndex(index);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setHoveredMessageIndex(null);
    }, 3000);
  };

  // ✅ Handle checkbox select/deselect
  const handleCheckboxChange = (chatId) => {
    setSelectedForwardOptions((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId) // deselect
        : [...prev, chatId] // select
    );
  };

  const forwardMessage = async (messageToForward) => {
    const response = await fetch("/api/message/forwardMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: messageToForward?.content,
        selectedForwardOptionsIds: selectedForwardOptions,
        isAiInteraction: /@prai\b/i.test(messageToForward?.content) ? true : false,
      }),
    });
  }

  useEffect(() => {
    // Scroll to the bottom when messages render or sender is typing
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  useEffect(() => {
    const allUsers = chats?.map(chat => {
      if (chat?._id !== selectedChat?._id) {
        if (chat.isGroupChat) {
          // ✅ Group chat → use chatName
          return { chatName: chat.chatName, _id: chat._id };
        } else {
          // ✅ One-to-one chat → find the user who is not the logged-in user
          const otherUser = chat.users.find(u => u._id !== user._id);
          return { chatName: otherUser?.name, _id: chat._id } || "Unknown User";
        }
      }
    });
    setIndulgedUsers(allUsers);
  }, [chats, user, selectedChat])

  return (
    <>
      <div
        className="hide-scrollbar"
        style={{ overflowX: "hidden", overflowY: "auto" }}
      >
        {messages &&
          messages.map((message, index) => (
            <div
              key={message._id}
              style={{
                display: "flex",
                flexDirection:
                  message.sender._id === user._id ? "row-reverse" : "row",
                margin: "0.3rem 0rem",
                alignItems: "center",
              }}
              ref={(el) => {
                scrollRef.current = el;
                messageRefs.current[index] = el;
              }}
            >
              {(isSameSender(messages, message, index, user._id) ||
                isLastMessage(messages, index, user._id)) && (
                  <Tooltip
                    label={message.sender.name}
                    placement="bottom-start"
                    hasArrow
                  >
                    <Avatar
                      mt="7px"
                      mr="1"
                      size="sm"
                      cursor="pointer"
                      name={message.sender.name}
                      src={message.sender.pic}
                    />
                  </Tooltip>
                )}

              <span
                style={{
                  backgroundColor: `${message.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"
                    }`,
                  borderRadius: "20px",
                  padding: "5px 15px",
                  maxWidth: "75%",
                  marginLeft: isSameSenderMargin(
                    messages,
                    message,
                    index,
                    user._id
                  ),
                  marginTop: isSameUser(messages, message, index, user._id)
                    ? 3
                    : 10,
                }}
              >
                <Box
                  key={message._id}
                  ref={(el) => (messageRefs.current[index] = el)}
                  className={`p-2 rounded shadow transition-colors duration-200 ${selectedMessageIndex === index ? "bg-yellow-100" : "bg-white"
                    }`}
                  style={{ display: "flex" }}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                >
                  <HighlightedMessage
                    text={message.content}
                    query={searchQuery}
                  />
                </Box>
              </span>

              {hoveredMessageIndex === index && (
                <Box>
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      size="sm"
                      aria-label="Options"
                      icon={<DragHandleIcon />}
                      variant="ghost"
                      data-testid="menu-option"
                    />
                    <MenuList>
                      <MenuItem
                        icon={<CopyIcon />}
                        data-testid="copy-menu"
                        onClick={() => handleCopy(message)}
                      >
                        Copy
                      </MenuItem>
                      <MenuItem
                        icon={<ArrowForwardIcon />}
                        onClick={() => handleForwardClick(message)}
                      >
                        Forward
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Box>
              )}
            </div>
          ))}
      </div>

      {isTyping ? (
        <div style={{ width: "70px", marginTop: "5px" }}>
          <Lottie animationData={typingAnimation} loop={true} />
        </div>
      ) : null}

      {/* Forward Modal */}
      <Modal
        isOpen={isForwardModalOpen}
        onClose={() => {
          setIsForwardModalOpen(false);
          setSelectedForwardOptions([]);
          setMessageToForward(null);
        }}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select chats to forward</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="start" spacing={3}>
              {indulgedUsers?.map((chat) => (chat &&
                < Checkbox
                  key={chat._id}
                  isChecked={selectedForwardOptions.includes(chat._id)}
                  onChange={() => handleCheckboxChange(chat._id)}
                >
                  {chat.chatName}
                </Checkbox>
              ))}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              leftIcon={<ArrowForwardIcon />}
              colorScheme="blue"
              isDisabled={selectedForwardOptions.length === 0}
              onClick={() => {
                toast({
                  title: "Forwarded",
                  description: `Message "${messageToForward?.content}" forwarded}`,
                  status: "success",
                  duration: 2000,
                  isClosable: true,
                });
                setIsForwardModalOpen(false);
                setSelectedForwardOptions([]);
                setMessageToForward(null);
                forwardMessage(messageToForward);
              }}
            >
              Forward
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal >
    </>
  );
};

export default ScrollableChat;
