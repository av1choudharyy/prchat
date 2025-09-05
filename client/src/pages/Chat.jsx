import { Box, Center, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatState } from "../context/ChatProvider";
import { ChatBox, MyChats, SideDrawer } from "../components";

const Chat = () => {
  const { user, loadingUser } = ChatState();
  const [fetchAgain, setFetchAgain] = useState(false);
  const navigate = useNavigate();

  // After hydration, if no user -> go back to login
  useEffect(() => {
    if (!loadingUser && !user) navigate("/");
  }, [loadingUser, user, navigate]);

  // Show spinner while hydrating (prevents blank/white)
  if (loadingUser) {
    return (
      <Center w="100%" h="100vh">
        <Spinner size="xl" thickness="4px" />
      </Center>
    );
  }

  if (!user) return null; // brief guard while navigate runs

  return (
    <div style={{ width: "100%" }}>
      <SideDrawer />
      <Box
        display="flex"
        justifyContent="space-between"
        w="100%"
        h="91.5vh"
        p="10px"
      >
        <MyChats fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
        <ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
      </Box>
    </div>
  );
};

export default Chat;
