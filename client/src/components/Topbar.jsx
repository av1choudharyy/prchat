// src/components/Topbar.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Flex,
  IconButton,
  Input,
  Avatar,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  VStack,
  HStack,
  Spinner,
  Badge,
  AvatarBadge,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { BellIcon, SearchIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { ChatState } from "../context/ChatProvider";

/**
 * Topbar (search + notifications + profile + logout)
 *
 * Notes:
 * - Assumes backend endpoints:
 *    GET  /api/user?search=...
 *    POST /api/chat  { userId }   -> returns chat object
 * - Expects ChatState to provide:
 *    user, setUser, setSelectedChat, chats, setChats,
 *    notification, setNotification, totalUnread, clearUnread
 */

const Topbar = () => {
  const {
    user,
    setUser,
    setSelectedChat,
    chats,
    setChats,
    notification,
    setNotification,
    totalUnread,
    clearUnread,
  } = ChatState();

  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const toast = useToast();
  const navigate = useNavigate();

  // click outside to close dropdown
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest(".topbar-search")) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const searchUsers = async (text) => {
    if (!text) {
      setResults([]);
      setLoadingSearch(false);
      return;
    }
    setLoadingSearch(true);
    try {
      const res = await fetch(`/api/user?search=${encodeURIComponent(text)}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Search error:", err);
      toast({
        title: "Search failed",
        description: "Could not search users",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      setResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  // debounced input handler
  const onChange = (e) => {
    const text = e.target.value;
    setQ(text);
    setOpen(!!text);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchUsers(text);
    }, 350);
  };

  // Access or create chat with userId
  const accessChat = async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ userId }),
      });
      const chat = await res.json();

      // Add to chats if missing
      if (!chats?.some((c) => c._id === chat._id)) {
        setChats && setChats([chat, ...(chats || [])]);
      }

      setSelectedChat && setSelectedChat(chat);

      // close dropdown
      setQ("");
      setResults([]);
      setOpen(false);
    } catch (err) {
      console.error("Access chat error:", err);
      toast({
        title: "Could not open chat",
        description: "Server error while creating/opening chat",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // logout: clear localStorage + context + navigate to login/home
  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    setUser && setUser(null);
    navigate("/");
  };

  // helpers to derive chat object/id from a notification/message payload
  const deriveChatFromNotification = (n = {}) => {
    // n may be a message object where n.chat could be:
    // - object { _id:..., chatName..., ... }
    // - array [chatObj,...] (older code shapes)
    // - string chatId
    // We'll gracefully check those cases.
    const chatField = n.chat;
    let chatObj = null;
    let chatId = null;

    if (!chatField && n.chatId) {
      chatId = n.chatId;
    } else if (typeof chatField === "string") {
      chatId = chatField;
    } else if (Array.isArray(chatField) && chatField.length > 0) {
      chatObj = chatField[0];
      chatId = chatObj?._id || null;
    } else if (typeof chatField === "object" && chatField !== null) {
      chatObj = chatField;
      chatId = chatField._id || null;
    } else if (n?.chat?._id) {
      chatObj = n.chat;
      chatId = n.chat._id;
    }

    // fallback: maybe the notification itself is a chat-like object
    if (!chatId && n?._id && n?.isChat) chatId = n._id;

    return { chatObj, chatId };
  };

  // remove notifications belonging to a chatId
  const removeNotificationsForChat = (chatId) => {
    if (!chatId) return;
    setNotification((prev = []) =>
      prev.filter((not) => {
        const { chatId: cid } = deriveChatFromNotification(not);
        return cid !== chatId;
      })
    );
  };

  return (
    <Box
      w="100%"
      bg="white"
      px={{ base: 4, md: 6 }}
      py={3}
      boxShadow="sm"
      position="sticky"
      top={0}
      zIndex={20}
    >
      <Flex align="center" justify="space-between" gap={4}>
        {/* Left: brand + search */}
        <HStack spacing={6}>
          <Text fontSize="lg" fontWeight="700" color="gray.800">
            PRChat
          </Text>

          <Box
            position="relative"
            className="topbar-search"
            width={{ base: "180px", md: "360px" }}
          >
            <Input
              placeholder="Search users by name or email..."
              size="sm"
              value={q}
              onChange={onChange}
              onFocus={() => setOpen(!!q)}
              bg="gray.50"
              borderRadius="md"
              pl="36px"
            />
            <SearchIcon
              position="absolute"
              left="10px"
              top="8px"
              color="gray.400"
            />

            {open && (
              <Box
                position="absolute"
                left={0}
                right={0}
                mt={2}
                bg="white"
                borderRadius="md"
                boxShadow="md"
                border="1px solid rgba(0,0,0,0.06)"
                zIndex={30}
                maxH="320px"
                overflowY="auto"
              >
                {loadingSearch ? (
                  <Flex align="center" justify="center" p={4}>
                    <Spinner size="sm" />
                  </Flex>
                ) : results.length === 0 ? (
                  <Box p={3}>
                    <Text color="gray.500" fontSize="sm">
                      No users found
                    </Text>
                  </Box>
                ) : (
                  results.map((u) => (
                    <Flex
                      key={u._id}
                      p={3}
                      align="center"
                      gap={3}
                      _hover={{ bg: "gray.50", cursor: "pointer" }}
                      onClick={() => accessChat(u._id)}
                    >
                      <Avatar size="sm" name={u.name} src={u.pic} />
                      <Box>
                        <Text fontWeight="600">{u.name}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {u.email}
                        </Text>
                      </Box>
                    </Flex>
                  ))
                )}
              </Box>
            )}
          </Box>
        </HStack>

        {/* Right: notifications + profile */}
        <Flex align="center" gap={4}>
          {/* Notifications block */}
          <Box position="relative">
            <Menu>
              <MenuButton>
                <IconButton
                  aria-label="Notifications"
                  icon={<BellIcon />}
                  variant="ghost"
                  fontSize="20px"
                />
              </MenuButton>

              <MenuList maxH="360px" overflowY="auto">
                {(!notification || notification.length === 0) ? (
                  <MenuItem>No new messages</MenuItem>
                ) : (
                  notification.map((n) => {
                    const { chatObj, chatId } = deriveChatFromNotification(n);
                    const title =
                      (chatObj && chatObj.chatName) ||
                      (n && n.sender && n.sender.name) ||
                      "Message";
                    const preview = (n && n.content && n.content.slice(0, 80)) || "New message";

                    return (
                      <MenuItem
                        key={n._id || `${chatId}-${Math.random()}`}
                        onClick={() => {
                          if (chatId) {
                            clearUnread && clearUnread(chatId);
                            removeNotificationsForChat(chatId);
                          }
                          // open chat (if chatObj present use it; otherwise setSelectedChat with id)
                          if (chatObj) {
                            setSelectedChat && setSelectedChat(chatObj);
                          } else if (chatId) {
                            // try to find chat in list
                            const found = (chats || []).find((c) => c._id === chatId);
                            if (found) setSelectedChat && setSelectedChat(found);
                            else {
                              // fallback: request the chat from backend (optional)
                              (async () => {
                                try {
                                  const r = await fetch(`/api/chat/${chatId}`, {
                                    headers: { Authorization: `Bearer ${user?.token}` },
                                  });
                                  const chatRes = await r.json();
                                  if (chatRes) {
                                    setChats && setChats([chatRes, ...(chats || [])]);
                                    setSelectedChat && setSelectedChat(chatRes);
                                  }
                                } catch (e) {
                                  console.error("Failed to fetch chat by id", e);
                                }
                              })();
                            }
                          }
                        }}
                        whiteSpace="normal"
                        px={3}
                      >
                        <VStack align="start" spacing={0}>
                          <Box fontWeight="600">{title}</Box>
                          <Box fontSize="sm" color="gray.600">
                            {preview}
                          </Box>
                        </VStack>
                      </MenuItem>
                    );
                  })
                )}
              </MenuList>
            </Menu>

            {/* unread badge */}
            {totalUnread > 0 && (
              <Badge
                colorScheme="red"
                borderRadius="full"
                position="absolute"
                top="-1px"
                right="-1px"
                fontSize="10px"
                px="2"
              >
                {totalUnread}
              </Badge>
            )}
          </Box>

          {/* Profile menu */}
          <Menu>
            <MenuButton>
              <IconButton
                aria-label="Profile"
                icon={
                  <Avatar size="sm" name={user?.name} src={user?.pic}>
                    <AvatarBadge boxSize="1.25em" bg="green.400" />
                  </Avatar>
                }
                variant="ghost"
              />
            </MenuButton>
            <MenuList>
              <MenuItem>
                <VStack align="start" spacing={0}>
                  <Text fontWeight="700">{user?.name}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {user?.email}
                  </Text>
                </VStack>
              </MenuItem>

              <MenuItem onClick={handleLogout} color="red.500">
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Topbar;
